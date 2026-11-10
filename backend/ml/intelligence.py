"""Evidence-based mathematical analysis services for the intelligence API."""

from itertools import product
from math import exp, log
from statistics import mean, median, pstdev
from time import perf_counter
from typing import Any, Dict, Sequence


def _percentile(values: Sequence[float], fraction: float) -> float:
    ordered = sorted(values)
    position = (len(ordered) - 1) * fraction
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    weight = position - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def analyze_anomaly(request: Dict[str, Any]) -> Dict[str, Any]:
    history = request["history"]
    amounts = [float(item["amount"]) for item in history]
    candidate = float(request["candidate_amount"])
    average = mean(amounts)
    deviation = pstdev(amounts)
    q1 = _percentile(amounts, 0.25)
    q3 = _percentile(amounts, 0.75)
    iqr = q3 - q1
    lower = max(0.0, q1 - float(request["iqr_multiplier"]) * iqr)
    upper = q3 + float(request["iqr_multiplier"]) * iqr
    zscore = (candidate - average) / deviation if deviation else (0.0 if candidate == average else None)
    outside_iqr = candidate < lower or candidate > upper
    exceeds_zscore = zscore is not None and abs(zscore) >= float(request["zscore_threshold"])

    known_beneficiaries = [item.get("beneficiary") for item in history if item.get("beneficiary")]
    new_beneficiary = bool(
        request.get("candidate_beneficiary")
        and known_beneficiaries
        and request["candidate_beneficiary"] not in known_beneficiaries
    )
    timestamps = sorted(item["timestamp"] for item in history if item.get("timestamp"))
    gaps_hours = [
        (right - left).total_seconds() / 3600
        for left, right in zip(timestamps, timestamps[1:])
    ]
    unusual = outside_iqr or exceeds_zscore
    return {
        "sample_size": len(amounts),
        "statistics": {
            "mean": average,
            "median": median(amounts),
            "population_standard_deviation": deviation,
            "q1": q1,
            "q3": q3,
            "iqr": iqr,
            "normal_range": {"lower": lower, "upper": upper},
            "recent_moving_average": mean(amounts[-5:]),
            "median_inter_transaction_hours": median(gaps_hours) if gaps_hours else None,
        },
        "candidate": {"amount": candidate, "z_score": zscore},
        "history_amounts": amounts,
        "signals": {
            "outside_iqr_range": outside_iqr,
            "exceeds_zscore_threshold": exceeds_zscore,
            "new_beneficiary": new_beneficiary,
        },
        "status": "unusual_pattern" if unusual else "within_observed_range",
        "interpretation": "An unusual pattern requires context; it is not proof of fraud.",
        "method": "Population z-score and Tukey 1.5-IQR fence over supplied history.",
    }


def analyze_bayesian(request: Dict[str, Any]) -> Dict[str, Any]:
    samples = request["training_data"]
    evidence = request["evidence"]
    alpha = float(request.get("smoothing_alpha", 1.0))
    fraud_rows = [sample for sample in samples if sample["fraud"]]
    legitimate_rows = [sample for sample in samples if not sample["fraud"]]
    if not fraud_rows or not legitimate_rows:
        raise ValueError("training_data must include both fraud and legitimate examples")
    if not evidence:
        raise ValueError("evidence must include at least one boolean feature")
    missing_features = [
        feature
        for feature in evidence
        if any(feature not in sample["features"] for sample in samples)
    ]
    if missing_features:
        raise ValueError(f"training_data is missing evidence features: {', '.join(missing_features)}")

    prior = len(fraud_rows) / len(samples)
    log_odds = log(prior / (1 - prior))
    contributions = []
    for feature, observed in evidence.items():
        fraud_observed = sum(row["features"].get(feature) is observed for row in fraud_rows)
        legitimate_observed = sum(row["features"].get(feature) is observed for row in legitimate_rows)
        fraud_likelihood = (fraud_observed + alpha) / (len(fraud_rows) + 2 * alpha)
        legitimate_likelihood = (legitimate_observed + alpha) / (len(legitimate_rows) + 2 * alpha)
        contribution = log(fraud_likelihood / legitimate_likelihood)
        log_odds += contribution
        contributions.append({
            "feature": feature,
            "observed": observed,
            "fraud_likelihood": fraud_likelihood,
            "legitimate_likelihood": legitimate_likelihood,
            "log_likelihood_ratio": contribution,
        })

    probability = 1 / (1 + exp(-max(-700.0, min(700.0, log_odds))))
    return {
        "fraud_probability": probability,
        "prior_probability": prior,
        "posterior_log_odds": log_odds,
        "training_support": {"fraud": len(fraud_rows), "legitimate": len(legitimate_rows)},
        "evidence_contributions": contributions,
        "method": "Bernoulli Naive Bayes with symmetric additive smoothing.",
        "assumption": "Evidence features are conditionally independent given the class.",
        "calibration_status": "not_independently_calibrated",
    }


def _binary_metrics(labels, scores, threshold):
    tp = fp = tn = fn = 0
    for label, score in zip(labels, scores):
        predicted = score >= threshold
        if predicted and label == 1:
            tp += 1
        elif predicted:
            fp += 1
        elif label == 1:
            fn += 1
        else:
            tn += 1
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "threshold": threshold,
        "true_positive": tp,
        "false_positive": fp,
        "true_negative": tn,
        "false_negative": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def _average_precision(labels, scores):
    positives = sum(labels)
    if not positives:
        return 0.0
    ordered = sorted(zip(scores, labels), reverse=True)
    seen = true_positives = 0
    previous_recall = 0.0
    area = 0.0
    index = 0
    while index < len(ordered):
        score = ordered[index][0]
        while index < len(ordered) and ordered[index][0] == score:
            seen += 1
            true_positives += ordered[index][1]
            index += 1
        recall = true_positives / positives
        precision = true_positives / seen
        area += (recall - previous_recall) * precision
        previous_recall = recall
    return area


def optimize_threshold(request: Dict[str, Any], default_cost_fn: float, default_cost_fp: float) -> Dict[str, Any]:
    labels = request["labels"]
    scores = request["scores"]
    if len(set(labels)) < 2:
        raise ValueError("validation labels must contain both classes")
    cost_fn = float(request.get("cost_fn") or default_cost_fn)
    cost_fp = float(request.get("cost_fp") or default_cost_fp)
    thresholds = request.get("thresholds") or sorted({0.0, 1.0, *scores})
    comparisons = []
    for threshold in thresholds:
        metrics = _binary_metrics(labels, scores, float(threshold))
        metrics["expected_cost"] = cost_fn * metrics["false_negative"] + cost_fp * metrics["false_positive"]
        comparisons.append(metrics)
    best = min(comparisons, key=lambda row: (row["expected_cost"], -row["threshold"]))
    return {
        "split": "validation",
        "sample_count": len(labels),
        "positive_count": sum(labels),
        "pr_auc_average_precision": _average_precision(labels, scores),
        "cost_assumptions": {"false_negative": cost_fn, "false_positive": cost_fp},
        "selected_threshold": best["threshold"],
        "selected_metrics": best,
        "comparisons": comparisons,
        "objective": "Minimize C_FN * FN + C_FP * FP over supplied validation thresholds.",
        "warning": "Threshold selection is empirical and does not guarantee fraud prevention.",
    }


def prioritize_cases(request: Dict[str, Any]) -> Dict[str, Any]:
    started_at = perf_counter()
    cases = request["cases"]
    budget = int(request["resource_limit"])
    count = len(cases)
    values = [float(case["expected_value"]) for case in cases]
    costs = [int(case["resource_units"]) for case in cases]
    slack_bits = max(1, budget.bit_length())
    variables = [f"x_{case['case_id']}" for case in cases] + [f"s_{bit}" for bit in range(slack_bits)]
    coefficients = costs + [1 << bit for bit in range(slack_bits)]
    penalty = sum(values) + 1.0
    qubo: Dict[str, float] = {}
    for index, coefficient in enumerate(coefficients):
        linear = penalty * (coefficient * coefficient - 2 * budget * coefficient)
        if index < count:
            linear -= values[index]
        qubo[variables[index]] = linear
        for other in range(index + 1, len(coefficients)):
            qubo[f"{variables[index]},{variables[other]}"] = 2 * penalty * coefficient * coefficients[other]

    best_classical = (0.0, 0, [])
    best_qubo = (float("inf"), 0.0, 0, [])
    for selection in product((0, 1), repeat=count):
        used = sum(cost * bit for cost, bit in zip(costs, selection))
        value = sum(amount * bit for amount, bit in zip(values, selection))
        if used <= budget and (value > best_classical[0] or (value == best_classical[0] and used < best_classical[1])):
            best_classical = (value, used, list(selection))
        residual = budget - used
        slack_value = residual if 0 <= residual < 1 << slack_bits else 0
        slack_selection = [(slack_value >> bit) & 1 for bit in range(slack_bits)]
        assignment = list(selection) + slack_selection
        energy = sum(qubo[variables[index]] * bit for index, bit in enumerate(assignment))
        for index in range(len(assignment)):
            if not assignment[index]:
                continue
            for other in range(index + 1, len(assignment)):
                if assignment[other]:
                    energy += qubo[f"{variables[index]},{variables[other]}"]
        if energy < best_qubo[0]:
            best_qubo = (energy, value, used, list(selection))
    runtime_seconds = perf_counter() - started_at

    classical_cases = [cases[i]["case_id"] for i, selected in enumerate(best_classical[2]) if selected]
    qubo_cases = [cases[i]["case_id"] for i, selected in enumerate(best_qubo[3]) if selected]
    return {
        "experimental": True,
        "resource_limit": budget,
        "classical_baseline": {
            "selected_cases": classical_cases,
            "objective_value": best_classical[0],
            "resources_used": best_classical[1],
            "solver": "Exact enumeration of the constrained selection problem",
            "execution_time_seconds": runtime_seconds,
        },
        "qubo_result": {
            "selected_cases": qubo_cases,
            "objective_value": best_qubo[1],
            "resources_used": best_qubo[2],
            "qubo_energy": best_qubo[0],
            "solver": "Exact enumeration of case assignments with binary slack",
            "execution_time_seconds": runtime_seconds,
        },
        "qubo": {
            "variables": variables,
            "matrix_upper_triangle": qubo,
            "constraint": "sum(resource_units_i * x_i) + binary_slack = resource_limit",
            "energy": "-sum(expected_value_i * x_i) + penalty * (resource_use + slack - limit)^2",
            "penalty": penalty,
        },
        "qaoa": {"available": False, "reason": "A compatible qiskit-algorithms simulator is not configured."},
        "warning": "Experimental investigation aid only; no quantum advantage is claimed.",
    }


def evaluate_risk(request: Dict[str, Any]) -> Dict[str, Any]:
    posterior = analyze_bayesian(request)
    probability = posterior["fraud_probability"]
    low_max = float(request["low_max"])
    high_min = float(request["high_min"])
    category = "Low" if probability < low_max else "High" if probability >= high_min else "Medium"
    action = {
        "Low": "No automated action; retain standard monitoring.",
        "Medium": "Review the evidence and transaction context.",
        "High": "Prioritize analyst review; verify the transaction context.",
    }[category]
    return {
        "risk_score": probability * 100,
        "risk_probability": probability,
        "risk_category": category,
        "recommended_action": action,
        "ml_prediction": None,
        "ml_status": "No trained ML model is configured in this project.",
        "mathematical_evidence": posterior,
        "thresholds": {"low_max": low_max, "high_min": high_min},
        "payment_action": "None; analyst review only.",
    }