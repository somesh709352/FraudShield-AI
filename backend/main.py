from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.core.config import settings
from backend.core.database import init_db
from backend.api.graph_routes import router as graph_router
from backend.api.intelligence_routes import router as intelligence_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered financial fraud detection platform with mathematical intelligence",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router)
app.include_router(intelligence_router)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2026-11-10T09:35:00Z",
        "services": {
            "graph_analysis": "available",
            "bayesian_analysis": "available_with_training_data",
            "statistical_anomaly": "available",
            "threshold_optimization": "available_with_validation_data",
            "quantum_lab": "experimental_classical_qubo_baseline",
            "risk_engine": "available_with_training_data"
        }
    }