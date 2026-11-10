from fastapi import APIRouter, HTTPException

from backend.core.config import settings
from backend.core.intelligence_models import (
    AnomalyRequest,
    BayesianRequest,
    QuantumRequest,
    RiskRequest,
    ThresholdRequest,
)
from backend.ml.intelligence import (
    analyze_anomaly,
    analyze_bayesian,
    evaluate_risk,
    optimize_threshold,
    prioritize_cases,
)

router = APIRouter(prefix="/api/v1/intelligence", tags=["Mathematical Intelligence"])


@router.post("/anomaly")
async def anomaly_analysis(request: AnomalyRequest):
    return analyze_anomaly(request.model_dump())


@router.post("/bayesian")
async def bayesian_analysis(request: BayesianRequest):
    try:
        return analyze_bayesian(request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/thresholds/optimize")
async def threshold_optimization(request: ThresholdRequest):
    try:
        return optimize_threshold(
            request.model_dump(),
            settings.optimization_cost_fn,
            settings.optimization_cost_fp,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/quantum/prioritize")
async def quantum_prioritization(request: QuantumRequest):
    return prioritize_cases(request.model_dump())


@router.post("/risk/evaluate")
async def unified_risk_evaluation(request: RiskRequest):
    try:
        return evaluate_risk(request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/status")
async def intelligence_status():
    return {
        "status": "available",
        "modules": {
            "graph": "available",
            "statistical_anomaly": "available",
            "bayesian": "available_with_supplied_labeled_samples",
            "threshold_optimization": "available_with_validation_labels",
            "quantum_lab": "experimental_classical_qubo_baseline",
            "ml_model": "not_configured",
        },
        "data_integration": "No financial institution integration is configured.",
    }