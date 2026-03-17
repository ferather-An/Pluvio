"""
Ajuste da distribuição GEV (Generalized Extreme Value) por L-momentos (PWM).
Equações de referência: Hosking & Wallis (1997).
"""

from typing import List, Optional

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from scipy.optimize import brentq
from scipy.special import gamma

router = APIRouter()


# ─── Modelos Pydantic ──────────────────────────────────────────────────────────

class GEVFitRequest(BaseModel):
    serie: List[float] = Field(..., min_length=5, description="Série de máximos anuais (mm)")
    return_periods: List[float] = Field(
        default=[2, 5, 10, 25, 50, 100],
        description="Períodos de retorno (anos)",
    )
    method: str = Field(default="lmoments", description="Método: 'lmoments'")


class GEVParams(BaseModel):
    mu: float
    sigma: float
    xi: float
    distribution_type: str  # Gumbel | Fréchet | Weibull
    r2: float
    n: int


class GEVFitResponse(BaseModel):
    params: GEVParams
    quantiles: dict  # {str(T): float}


class GEVQuantilesRequest(BaseModel):
    mu: float
    sigma: float
    xi: float
    return_periods: List[float] = Field(default=[2, 5, 10, 25, 50, 100])


# ─── Funções de cálculo ────────────────────────────────────────────────────────

def lmoments(data: np.ndarray):
    """
    Calcula L-momentos via PWM (Probability Weighted Moments).
    Ref: Hosking (1990) J. Royal Stat. Soc. B, 52(1):105-124.
    """
    n = len(data)
    x = np.sort(data)

    # PWMs b0, b1, b2
    b0 = np.mean(x)
    b1 = np.sum([(i - 1) / (n * (n - 1)) * x[i] for i in range(n)])
    b2 = np.sum([(i - 1) * (i - 2) / (n * (n - 1) * (n - 2)) * x[i] for i in range(n)])

    l1 = b0
    l2 = 2 * b1 - b0
    l3 = 6 * b2 - 6 * b1 + b0

    return l1, l2, l3


def _xi_equation(xi: float, t3: float) -> float:
    """Equação implícita para xi dado o coeficiente de L-assimetria t3."""
    if abs(xi) < 1e-6:
        return 0.1699 - t3  # caso limite Gumbel
    g1 = gamma(1 + xi)
    g2 = gamma(1 + 2 * xi)
    g3 = gamma(1 + 3 * xi)
    return (3 * (3**xi - 1) * g1 - g3 / g1) / (2 * (2**xi - 1) * g1 - g2 / g1) - t3


def fit_gev_lmoments(data: np.ndarray):
    """Estima parâmetros GEV(mu, sigma, xi) por L-momentos."""
    l1, l2, l3 = lmoments(data)
    t3 = l3 / l2  # L-skewness

    # Resolve xi numericamente (equação implícita)
    try:
        xi = brentq(_xi_equation, -0.5, 0.5, args=(t3,), xtol=1e-7)
    except ValueError:
        xi = 0.0  # fallback Gumbel

    # sigma e mu
    if abs(xi) < 1e-6:
        sigma = l2 / np.log(2)
        mu = l1 - 0.5772 * sigma
    else:
        gxi = gamma(1 + xi)
        sigma = xi * l2 / ((1 - 2**(-xi)) * gxi)
        mu = l1 - sigma * (gxi - 1) / xi

    return mu, sigma, xi


def gev_quantile(mu: float, sigma: float, xi: float, T: float) -> float:
    """Quantil GEV para período de retorno T anos."""
    p = 1 - 1 / T
    if abs(xi) < 1e-6:
        return mu - sigma * np.log(-np.log(p))
    return mu + sigma * ((-np.log(p)) ** (-xi) - 1) / xi


def compute_r2(data: np.ndarray, mu: float, sigma: float, xi: float) -> float:
    """R² empírico: correlação entre quantis observados e ajustados."""
    n = len(data)
    x_sorted = np.sort(data)
    plotting_pos = (np.arange(1, n + 1) - 0.44) / (n + 0.12)
    T_emp = 1 / (1 - plotting_pos)
    x_fitted = np.array([gev_quantile(mu, sigma, xi, t) for t in T_emp])

    ss_res = np.sum((x_sorted - x_fitted) ** 2)
    ss_tot = np.sum((x_sorted - np.mean(x_sorted)) ** 2)
    return float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0


def distribution_type(xi: float) -> str:
    if abs(xi) < 0.05:
        return "Gumbel (xi ≈ 0)"
    return "Fréchet (xi > 0, cauda pesada)" if xi > 0 else "Weibull (xi < 0, cauda limitada)"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/fit", response_model=GEVFitResponse, summary="Ajustar GEV por L-momentos")
def fit_gev(req: GEVFitRequest):
    """
    Ajusta a distribuição GEV a uma série de máximos anuais usando L-momentos (PWM).
    Retorna os parâmetros mu, sigma, xi e os quantis para os períodos de retorno solicitados.
    """
    if req.method != "lmoments":
        raise HTTPException(400, "Somente method='lmoments' suportado nesta versão")

    data = np.array(req.serie, dtype=float)
    if len(data) < 5:
        raise HTTPException(400, "Série deve ter ao menos 5 observações")

    mu, sigma, xi = fit_gev_lmoments(data)
    r2 = compute_r2(data, mu, sigma, xi)

    quantiles = {
        str(int(T)): round(gev_quantile(mu, sigma, xi, T), 2)
        for T in req.return_periods
    }

    return GEVFitResponse(
        params=GEVParams(
            mu=round(mu, 4),
            sigma=round(sigma, 4),
            xi=round(xi, 6),
            distribution_type=distribution_type(xi),
            r2=round(r2, 4),
            n=len(data),
        ),
        quantiles=quantiles,
    )


@router.post("/quantiles", summary="Calcular quantis de GEV já ajustado")
def gev_quantiles(req: GEVQuantilesRequest):
    """Calcula quantis GEV a partir de parâmetros previamente ajustados."""
    return {
        str(int(T)): round(gev_quantile(req.mu, req.sigma, req.xi, T), 2)
        for T in req.return_periods
    }
