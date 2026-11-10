import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.core.intelligence_models import QuantumRequest, ThresholdRequest
from backend.main import app
from backend.ml.intelligence import (
    _average_precision,
    analyze_anomaly,
    analyze_bayesian,
    evaluate_risk,
    optimize_threshold,
    prioritize_cases,
)


def test_anomaly_statistics_and_large_candidate():
    result = analyze_anomaly({
        "history": [{"amount": 100.0}, {"amount": 200.0}, {"amount": 300.0}],
        "candidate_amount": 80000.0,
        "zscore_threshold": 3.0,
        "iqr_multiplier": 1.5,
    })

    assert result["statistics"]["mean"] == 200.0
    assert result["statistics"]["median"] == 200.0
    assert result["statistics"]["iqr"] == 100.0
    assert result["history_amounts"] == [100.0, 200.0, 300.0]
    assert result["status"] == "unusual_pattern"
    assert result["interpretation"].endswith("not proof of fraud.")


def test_anomaly_zero_variance_has_defined_iqr_result():
    result = analyze_anomaly({
        "history": [{"amount": 500.0}, {"amount": 500.0}],
        "candidate_amount": 500.0,
        "zscore_threshold": 3.0,
        "iqr_multiplier": 1.5,
    })

    assert result["candidate"]["z_score"] == 0.0
    assert result["statistics"]["population_standard_deviation"] == 0.0
    assert result["status"] == "within_observed_range"


def test_bayesian_smoothed_posterior():
    request = {
        "training_data": [
            {"fraud": True, "features": {"new_beneficiary": True}},
            {"fraud": True, "features": {"new_beneficiary": True}},
            {"fraud": False, "features": {"new_beneficiary": False}},
            {"fraud": False, "features": {"new_beneficiary": False}},
        ],
        "evidence": {"new_beneficiary": True},
        "smoothing_alpha": 1.0,
    }

    result = analyze_bayesian(request)

    assert result["prior_probability"] == 0.5
    assert result["evidence_contributions"][0]["fraud_likelihood"] == 0.75
    assert result["evidence_contributions"][0]["legitimate_likelihood"] == 0.25
    assert result["fraud_probability"] == pytest.approx(0.75)
    assert result["calibration_status"] == "not_independently_calibrated"


def test_bayesian_rejects_missing_training_features():
    with pytest.raises(ValueError, match="missing evidence features"):
        analyze_bayesian({
            "training_data": [
                {"fraud": True, "features": {}},
                {"fraud": False, "features": {}},
            ],
            "evidence": {"unseen": True},
        })


def test_threshold_optimization_uses_validation_costs():
    request = {
        "split": "validation",
        "labels": [0, 1, 1, 0],
        "scores": [0.1, 0.8, 0.7, 0.6],
        "thresholds": [0.5, 0.65],
        "cost_fn": 100.0,
        "cost_fp": 10.0,
    }

    result = optimize_threshold(request, 10000.0, 100.0)

    assert result["selected_threshold"] == 0.65
    assert result["selected_metrics"]["false_positive"] == 0
    assert result["selected_metrics"]["false_negative"] == 0
    assert result["selected_metrics"]["expected_cost"] == 0
    assert result["pr_auc_average_precision"] == 1.0


def test_average_precision_groups_tied_scores():
    assert _average_precision([1, 0], [0.5, 0.5]) == 0.5
    assert _average_precision([0, 1], [0.9, 0.8]) == 0.5


def test_threshold_inputs_reject_invalid_values():
    with pytest.raises(ValidationError):
        ThresholdRequest(split="validation", labels=[0, 1], scores=[0.2, 1.2])
    with pytest.raises(ValueError, match="both classes"):
        optimize_threshold({"labels": [1, 1], "scores": [0.4, 0.8]}, 10.0, 1.0)


def test_qubo_matches_classical_optimum_and_respects_budget():
    cases = [
        {"case_id": "case-a", "expected_value": 8.0, "resource_units": 2},
        {"case_id": "case-b", "expected_value": 5.0, "resource_units": 1},
        {"case_id": "case-c", "expected_value": 4.0, "resource_units": 2},
    ]
    result = prioritize_cases({"cases": cases, "resource_limit": 3})

    assert result["classical_baseline"]["selected_cases"] == ["case-a", "case-b"]
    assert result["qubo_result"]["objective_value"] == result["classical_baseline"]["objective_value"]
    assert result["qubo_result"]["resources_used"] <= 3
    assert "x_case-a,x_case-b" in result["qubo"]["matrix_upper_triangle"]
    assert result["qaoa"]["available"] is False


def test_qubo_schema_rejects_duplicate_case_ids():
    with pytest.raises(ValidationError, match="unique"):
        QuantumRequest.model_validate({
            "cases": [
                {"case_id": "same", "expected_value": 2.0},
                {"case_id": "same", "expected_value": 1.0},
            ],
            "resource_limit": 1,
        })


def test_risk_response_never_acts_on_payments():
    evidence = {
        "training_data": [
            {"fraud": False, "features": {"pattern": False}},
            {"fraud": False, "features": {"pattern": False}},
            {"fraud": True, "features": {"pattern": True}},
            {"fraud": True, "features": {"pattern": True}},
        ],
        "evidence": {"pattern": True},
        "low_max": 0.3,
        "high_min": 0.7,
    }

    result = evaluate_risk(evidence)

    assert result["risk_score"] == 75.0
    assert result["risk_category"] == "High"
    assert result["ml_prediction"] is None
    assert result["payment_action"].startswith("None")


def test_anomaly_api_returns_calculated_result():
    client = TestClient(app)
    response = client.post("/api/v1/intelligence/anomaly", json={
        "history": [{"amount": 100}, {"amount": 200}, {"amount": 300}],
        "candidate_amount": 80000,
    })

    assert response.status_code == 200
    body = response.json()
    assert body["statistics"]["mean"] == 200
    assert body["candidate"]["amount"] == 80000
    assert body["status"] == "unusual_pattern"