from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


class HistoricalTransaction(BaseModel):
    amount: float = Field(gt=0)
    timestamp: Optional[datetime] = None
    beneficiary: Optional[str] = None


class AnomalyRequest(BaseModel):
    history: List[HistoricalTransaction] = Field(min_length=1)
    candidate_amount: float = Field(gt=0)
    candidate_timestamp: Optional[datetime] = None
    candidate_beneficiary: Optional[str] = None
    zscore_threshold: float = Field(default=3.0, gt=0)
    iqr_multiplier: float = Field(default=1.5, gt=0)


class LabeledEvidence(BaseModel):
    fraud: bool
    features: Dict[str, bool]


class BayesianRequest(BaseModel):
    training_data: List[LabeledEvidence] = Field(min_length=2)
    evidence: Dict[str, bool]
    smoothing_alpha: float = Field(default=1.0, gt=0)


class ThresholdRequest(BaseModel):
    labels: List[int] = Field(min_length=2)
    scores: List[float] = Field(min_length=2)
    split: Literal["validation"]
    cost_fn: Optional[float] = Field(default=None, gt=0)
    cost_fp: Optional[float] = Field(default=None, gt=0)
    thresholds: Optional[List[float]] = None

    @model_validator(mode="after")
    def validate_rows(self):
        if len(self.labels) != len(self.scores):
            raise ValueError("labels and scores must have the same length")
        if any(label not in (0, 1) for label in self.labels):
            raise ValueError("labels must contain only 0 or 1")
        if any(not 0 <= score <= 1 for score in self.scores):
            raise ValueError("scores must be between 0 and 1")
        if self.thresholds is not None and any(not 0 <= value <= 1 for value in self.thresholds):
            raise ValueError("thresholds must be between 0 and 1")
        return self


class InvestigationCase(BaseModel):
    case_id: str = Field(min_length=1)
    expected_value: float = Field(ge=0)
    resource_units: int = Field(default=1, ge=1)


class QuantumRequest(BaseModel):
    cases: List[InvestigationCase] = Field(min_length=1, max_length=18)
    resource_limit: int = Field(ge=0)

    @model_validator(mode="after")
    def validate_case_ids(self):
        case_ids = [case.case_id for case in self.cases]
        if len(set(case_ids)) != len(case_ids):
            raise ValueError("case_id values must be unique")
        return self


class RiskRequest(BayesianRequest):
    low_max: float = Field(default=0.33, ge=0, le=1)
    high_min: float = Field(default=0.66, ge=0, le=1)

    @model_validator(mode="after")
    def validate_risk_bands(self):
        if self.low_max >= self.high_min:
            raise ValueError("low_max must be lower than high_min")
        return self