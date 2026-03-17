"""
Desagregação de chuva de 24h em sub-diárias.
Métodos: CETESB/DAEE, Regional-Sudeste, Kimball, Knoessen.
"""

from typing import List, Optional

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()

# ─── Tabelas de coeficientes ──────────────────────────────────────────────────

CETESB_DAEE = [
    (5, 0.12), (10, 0.19), (15, 0.24), (30, 0.38), (60, 0.54),
    (120, 0.72), (180, 0.79), (360, 0.88), (720, 0.95), (1440, 1.0),
]

REGIONAL_SUDESTE = [
    (5, 0.14), (10, 0.21), (15, 0.27), (30, 0.41), (60, 0.57),
    (120, 0.74), (180, 0.81), (360, 0.89), (720, 0.96), (1440, 1.0),
]

METODOS = {
    "CETESB_DAEE": CETESB_DAEE,
    "REGIONAL_SUDESTE": REGIONAL_SUDESTE,
}

METODO_FONTE = {
    "CETESB_DAEE": "Relações clássicas CETESB/DAEE",
    "REGIONAL_SUDESTE": "Relações regionais Sudeste",
    "KIMBALL": "Método de Kimball — (t/1440)^0,305",
    "KNOESSEN": "Método de Knoessen — (t/1440)^0,3054",
}


# ─── Modelos ──────────────────────────────────────────────────────────────────

class DisaggRequest(BaseModel):
    chuva24h_mm: float = Field(..., gt=0, le=1000, example=80.0)
    duracoes_min: List[int] = Field(..., min_length=1, max_length=20, example=[15, 30, 60, 120, 360])
    metodo: str = Field(default="CETESB_DAEE", example="CETESB_DAEE")
    fator_correcao: float = Field(default=1.0, ge=0.1, le=3.0)


class DisaggResult(BaseModel):
    duracao_min: int
    coeficiente: float
    lamina_mm: float
    intensidade_mm_h: float


class DisaggResponse(BaseModel):
    input: dict
    output: List[DisaggResult]
    metadata: dict


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _interp_coef(table: list, t: float) -> float:
    """Interpolação linear entre pontos da tabela."""
    if t <= table[0][0]:
        return table[0][1]
    if t >= table[-1][0]:
        return table[-1][1]
    for i in range(len(table) - 1):
        t0, c0 = table[i]
        t1, c1 = table[i + 1]
        if t0 <= t <= t1:
            ratio = (t - t0) / (t1 - t0)
            return c0 + ratio * (c1 - c0)
    return table[-1][1]


def _calc_coef(metodo: str, t: float) -> float:
    if metodo == "KIMBALL":
        return (t / 1440) ** 0.305
    if metodo == "KNOESSEN":
        return (t / 1440) ** 0.3054
    table = METODOS.get(metodo, CETESB_DAEE)
    return _interp_coef(table, t)


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=DisaggResponse, summary="Desagregar chuva de 24h")
def disaggregate(req: DisaggRequest):
    """
    Desagrega a chuva total de 24h em durações menores, retornando coeficiente,
    lâmina (mm) e intensidade (mm/h) para cada duração solicitada.

    **Métodos disponíveis:**
    - `CETESB_DAEE` — relações clássicas, interpolação em tabela
    - `REGIONAL_SUDESTE` — calibrado para região Sudeste
    - `KIMBALL` — potência (t/1440)^0,305
    - `KNOESSEN` — potência (t/1440)^0,3054
    """
    if req.metodo not in METODO_FONTE:
        from fastapi import HTTPException
        raise HTTPException(400, f"Método inválido. Válidos: {list(METODO_FONTE.keys())}")

    duracoes = sorted(set(req.duracoes_min))
    resultados = []
    for t in duracoes:
        coef_base = _calc_coef(req.metodo, t)
        coef = coef_base * req.fator_correcao
        lamina = req.chuva24h_mm * coef
        intensidade = lamina / (t / 60)
        resultados.append(DisaggResult(
            duracao_min=t,
            coeficiente=round(coef, 4),
            lamina_mm=round(lamina, 3),
            intensidade_mm_h=round(intensidade, 3),
        ))

    return DisaggResponse(
        input={
            "chuva24h_mm": req.chuva24h_mm,
            "duracoes_min": duracoes,
            "metodo": req.metodo,
            "fator_correcao": req.fator_correcao,
        },
        output=resultados,
        metadata={"fonte_coeficientes": METODO_FONTE[req.metodo]},
    )
