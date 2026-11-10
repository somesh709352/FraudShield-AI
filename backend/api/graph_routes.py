from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from core.models import (
    Transaction, GraphAnalysisRequest, GraphAnalysisResponse
)
from api.graph_analysis import GraphFraudDetector, create_graph_detector

router = APIRouter(prefix="/api/v1/graph", tags=["Graph Fraud Analysis"])


@router.post("/analyze", response_model=GraphAnalysisResponse)
async def analyze_fraud_network(
    request: GraphAnalysisRequest,
    detector: GraphFraudDetector = Depends(create_graph_detector)
):
    """
    Analyze transaction network for fraud patterns using graph theory.
    
    Implements:
    - Degree, Betweenness, PageRank centrality
    - Community detection (Louvain/modularity)
    - Cycle detection (circular money flows)
    - Suspicious path detection (multiple senders -> common receiver)
    - Connected component analysis
    
    Returns suspicious patterns requiring investigation.
    Does NOT label accounts as criminal - only flags patterns.
    """
    try:
        result = detector.analyze(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph analysis failed: {str(e)}")


@router.post("/centrality")
async def calculate_centrality(
    request: GraphAnalysisRequest,
    detector: GraphFraudDetector = Depends(create_graph_detector)
):
    """Calculate centrality metrics only."""
    try:
        detector.build_graph(request.transactions)
        centrality = detector.calculate_centrality()
        return centrality
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Centrality calculation failed: {str(e)}")


@router.post("/communities")
async def detect_communities(
    request: GraphAnalysisRequest,
    detector: GraphFraudDetector = Depends(create_graph_detector)
):
    """Detect communities in transaction network."""
    try:
        detector.build_graph(request.transactions)
        communities = detector.detect_communities()
        return communities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Community detection failed: {str(e)}")


@router.post("/cycles")
async def detect_cycles(
    request: GraphAnalysisRequest,
    detector: GraphFraudDetector = Depends(create_graph_detector)
):
    """Detect circular money transfer patterns."""
    try:
        detector.build_graph(request.transactions)
        cycles = detector.detect_cycles()
        return cycles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cycle detection failed: {str(e)}")


@router.post("/suspicious-paths")
async def detect_suspicious_paths(
    request: GraphAnalysisRequest,
    detector: GraphFraudDetector = Depends(create_graph_detector)
):
    """Detect multiple accounts sending to common beneficiary."""
    try:
        detector.build_graph(request.transactions)
        paths = detector.detect_suspicious_paths()
        return paths
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suspicious path detection failed: {str(e)}")


@router.post("/components")
async def analyze_components(
    request: GraphAnalysisRequest,
    detector: GraphFraudDetector = Depends(create_graph_detector)
):
    """Analyze connected components in transaction network."""
    try:
        detector.build_graph(request.transactions)
        components = detector.analyze_connected_components()
        return components
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Component analysis failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "graph-fraud-analysis", "timestamp": datetime.utcnow().isoformat()}