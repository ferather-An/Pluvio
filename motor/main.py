"""
Pluvio Web 3.1 — Motor de Cálculo Hidrológico (FastAPI)
Endpoints: GEV fitting, desagregação de chuvas, interpolação espacial.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import disaggregation, gev, interpolation

app = FastAPI(
    title="Pluvio Motor — API Hidrológica",
    description=(
        "Serviço Python para análise estatística de séries pluviométricas.\n\n"
        "- **GEV**: ajuste de distribuição de valores extremos por L-momentos\n"
        "- **Desagregação**: CETESB/DAEE, Regional-Sudeste, Kimball, Knoessen\n"
        "- **Interpolação**: IDW e Kriging ordinário (pykrige)\n\n"
        "Pluvio Web 3.1 — André Phillipe dos Santos Batista, 2026"
    ),
    version="3.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gev.router, prefix="/gev", tags=["GEV"])
app.include_router(disaggregation.router, prefix="/disaggregation", tags=["Desagregação"])
app.include_router(interpolation.router, prefix="/interpolation", tags=["Interpolação"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "pluvio-motor", "version": "3.1.0"}
