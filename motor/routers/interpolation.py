"""
Interpolação espacial de parâmetros IDF.
Métodos: IDW (Inverse Distance Weighting) e Kriging Ordinário (pykrige).
"""

from typing import List, Optional

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()


# ─── Modelos ──────────────────────────────────────────────────────────────────

class StationParams(BaseModel):
    lat: float
    lon: float
    K: float
    a: float
    b: float
    c: float
    estacao: Optional[str] = None
    municipio: Optional[str] = None


class InterpolRequest(BaseModel):
    target_lat: float = Field(..., description="Latitude do ponto alvo")
    target_lon: float = Field(..., description="Longitude do ponto alvo")
    stations: List[StationParams] = Field(..., min_length=1, description="Estações vizinhas com parâmetros IDF")
    method: str = Field(default="IDW", description="Método: IDW | KRIGING")
    idw_power: float = Field(default=2.0, ge=1.0, le=5.0, description="Expoente IDW (padrão 2)")


class InterpolResponse(BaseModel):
    K: float
    a: float
    b: float
    c: float
    method_used: str
    n_stations: int
    distances_km: List[float]


# ─── Haversine ────────────────────────────────────────────────────────────────

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distância em km entre dois pontos geográficos."""
    R = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlam = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlam / 2) ** 2
    return R * 2 * np.arcsin(np.sqrt(a))


# ─── IDW ──────────────────────────────────────────────────────────────────────

def idw_interpolate(
    target_lat: float,
    target_lon: float,
    stations: List[StationParams],
    power: float = 2.0,
) -> dict:
    distances = [haversine(target_lat, target_lon, s.lat, s.lon) for s in stations]

    # Evita divisão por zero (ponto coincidente com estação)
    min_dist = min(distances)
    if min_dist < 0.001:
        idx = distances.index(min_dist)
        s = stations[idx]
        return {
            "K": s.K, "a": s.a, "b": s.b, "c": s.c,
            "distances_km": [round(d, 3) for d in distances],
        }

    weights = [1 / (d ** power) for d in distances]
    w_sum = sum(weights)

    K = sum(w * s.K for w, s in zip(weights, stations)) / w_sum
    a = sum(w * s.a for w, s in zip(weights, stations)) / w_sum
    b = sum(w * s.b for w, s in zip(weights, stations)) / w_sum
    c = sum(w * s.c for w, s in zip(weights, stations)) / w_sum

    return {
        "K": round(K, 4), "a": round(a, 6), "b": round(b, 4), "c": round(c, 6),
        "distances_km": [round(d, 3) for d in distances],
    }


# ─── Kriging ──────────────────────────────────────────────────────────────────

def kriging_interpolate(
    target_lat: float,
    target_lon: float,
    stations: List[StationParams],
) -> dict:
    """
    Kriging Ordinário usando pykrige.
    Fallback para IDW se n < 4 ou importação falhar.
    """
    if len(stations) < 4:
        result = idw_interpolate(target_lat, target_lon, stations)
        result["_fallback"] = "IDW (n < 4)"
        return result

    try:
        from pykrige.ok import OrdinaryKriging

        lats = np.array([s.lat for s in stations])
        lons = np.array([s.lon for s in stations])
        results = {}

        for param in ["K", "a", "b", "c"]:
            values = np.array([getattr(s, param) for s in stations])
            ok = OrdinaryKriging(lons, lats, values, variogram_model="spherical", verbose=False)
            z, _ = ok.execute("points", np.array([target_lon]), np.array([target_lat]))
            results[param] = round(float(z[0]), 6 if param in ("a", "c") else 4)

        distances = [haversine(target_lat, target_lon, s.lat, s.lon) for s in stations]
        results["distances_km"] = [round(d, 3) for d in distances]
        return results

    except Exception:
        result = idw_interpolate(target_lat, target_lon, stations)
        result["_fallback"] = "IDW (Kriging falhou)"
        return result


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/", response_model=InterpolResponse, summary="Interpolar parâmetros IDF")
def interpolate(req: InterpolRequest):
    """
    Interpola os parâmetros K, a, b, c da equação de Sherman para um ponto
    geográfico qualquer, com base nas estações vizinhas fornecidas.

    **Métodos:**
    - `IDW` — Inverse Distance Weighting (padrão)
    - `KRIGING` — Kriging Ordinário (recomenda-se ≥ 4 estações)
    """
    if req.method.upper() not in ("IDW", "KRIGING"):
        raise HTTPException(400, "Método inválido. Use IDW ou KRIGING.")

    if req.method.upper() == "KRIGING":
        result = kriging_interpolate(req.target_lat, req.target_lon, req.stations)
        method_used = result.pop("_fallback", "KRIGING")
    else:
        result = idw_interpolate(req.target_lat, req.target_lon, req.stations, req.idw_power)
        method_used = "IDW"

    return InterpolResponse(
        K=result["K"],
        a=result["a"],
        b=result["b"],
        c=result["c"],
        method_used=method_used,
        n_stations=len(req.stations),
        distances_km=result["distances_km"],
    )


@router.post("/nearest", summary="Estação mais próxima de um ponto")
def nearest_station(target_lat: float, target_lon: float, stations: List[StationParams]):
    """Retorna a estação mais próxima e sua distância em km."""
    if not stations:
        raise HTTPException(400, "Lista de estações vazia")

    distances = [(haversine(target_lat, target_lon, s.lat, s.lon), s) for s in stations]
    distances.sort(key=lambda x: x[0])
    dist, nearest = distances[0]

    return {
        "estacao": nearest.estacao,
        "municipio": nearest.municipio,
        "lat": nearest.lat,
        "lon": nearest.lon,
        "distancia_km": round(dist, 3),
        "K": nearest.K,
        "a": nearest.a,
        "b": nearest.b,
        "c": nearest.c,
    }
