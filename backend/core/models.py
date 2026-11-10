from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"
    CARD = "CARD"
    WALLET = "WALLET"


class Transaction(BaseModel):
    transaction_id: str
    sender_account: str
    receiver_account: str
    amount: float = Field(gt=0)
    timestamp: datetime
    transaction_type: TransactionType = TransactionType.UPI
    sender_upi_id: Optional[str] = None
    receiver_upi_id: Optional[str] = None
    metadata: Dict[str, Any] = {}


class GraphNode(BaseModel):
    id: str
    label: str
    type: str = "account"
    risk_score: float = 0.0
    transaction_count: int = 0
    total_amount: float = 0.0
    metadata: Dict[str, Any] = {}


class GraphEdge(BaseModel):
    source: str
    target: str
    weight: float
    transaction_count: int = 1
    first_transaction: datetime
    last_transaction: datetime
    metadata: Dict[str, Any] = {}


class GraphAnalysisRequest(BaseModel):
    transactions: List[Transaction]
    min_transactions: int = 5
    suspicious_threshold: float = 0.7


class CentralityMetrics(BaseModel):
    degree_centrality: Dict[str, float]
    betweenness_centrality: Dict[str, float]
    pagerank: Dict[str, float]


class CommunityDetectionResult(BaseModel):
    communities: List[List[str]]
    modularity: float
    num_communities: int


class CycleDetectionResult(BaseModel):
    cycles: List[List[str]]
    cycle_count: int
    suspicious_cycles: List[List[str]]


class SuspiciousPathResult(BaseModel):
    paths: List[List[str]]
    path_scores: List[float]
    common_beneficiaries: Dict[str, List[str]]


class ConnectedComponentsResult(BaseModel):
    components: List[List[str]]
    component_sizes: List[int]
    largest_component: List[str]
    num_components: int


class GraphAnalysisResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    centrality: CentralityMetrics
    communities: CommunityDetectionResult
    cycles: CycleDetectionResult
    suspicious_paths: SuspiciousPathResult
    connected_components: ConnectedComponentsResult
    risk_indicators: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.utcnow)