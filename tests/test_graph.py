"""
Tests for Graph Fraud Detection Module

Tests cover:
- Graph building from transactions
- Degree centrality calculation
- Betweenness centrality calculation
- PageRank calculation
- Community detection
- Cycle detection
- Suspicious path detection
- Connected component analysis
- Edge cases: empty graph, single node, missing data
"""

import pytest
from datetime import datetime, timedelta
import networkx as nx
import numpy as np

from backend.api.graph_analysis import GraphFraudDetector
from backend.core.models import Transaction, TransactionType


class TestGraphFraudDetector:
    
    @pytest.fixture
    def sample_transactions(self):
        """Create sample transactions for testing."""
        base_time = datetime(2026, 1, 1, 10, 0, 0)
        return [
            Transaction(
                transaction_id="tx1",
                sender_account="ACC001",
                receiver_account="ACC002",
                amount=5000.0,
                timestamp=base_time,
                transaction_type=TransactionType.UPI
            ),
            Transaction(
                transaction_id="tx2",
                sender_account="ACC002",
                receiver_account="ACC003",
                amount=3000.0,
                timestamp=base_time + timedelta(hours=1),
                transaction_type=TransactionType.UPI
            ),
            Transaction(
                transaction_id="tx3",
                sender_account="ACC003",
                receiver_account="ACC001",
                amount=2000.0,
                timestamp=base_time + timedelta(hours=2),
                transaction_type=TransactionType.UPI
            ),
            Transaction(
                transaction_id="tx4",
                sender_account="ACC004",
                receiver_account="ACC002",
                amount=10000.0,
                timestamp=base_time + timedelta(hours=3),
                transaction_type=TransactionType.BANK_TRANSFER
            ),
            Transaction(
                transaction_id="tx5",
                sender_account="ACC005",
                receiver_account="ACC002",
                amount=8000.0,
                timestamp=base_time + timedelta(hours=4),
                transaction_type=TransactionType.UPI
            ),
            Transaction(
                transaction_id="tx6",
                sender_account="ACC006",
                receiver_account="ACC002",
                amount=12000.0,
                timestamp=base_time + timedelta(hours=5),
                transaction_type=TransactionType.UPI
            ),
        ]
    
    @pytest.fixture
    def detector(self):
        return GraphFraudDetector(min_transactions=1, suspicious_threshold=0.5)
    
    def test_build_graph(self, detector, sample_transactions):
        """Test graph construction from transactions."""
        graph = detector.build_graph(sample_transactions)
        
        assert graph.number_of_nodes() == 6
        assert graph.number_of_edges() == 6
        
        assert graph.has_node("ACC001")
        assert graph.has_node("ACC002")
        assert graph.has_edge("ACC001", "ACC002")
        assert graph["ACC001"]["ACC002"]["weight"] == 5000.0
        assert graph["ACC001"]["ACC002"]["count"] == 1
    
    def test_degree_centrality(self, detector, sample_transactions):
        """Test degree centrality calculation."""
        detector.build_graph(sample_transactions)
        centrality = detector.calculate_centrality()
        
        assert "degree_centrality" in centrality.model_dump()
        assert "betweenness_centrality" in centrality.model_dump()
        assert "pagerank" in centrality.model_dump()
        
        deg = centrality.degree_centrality
        assert "ACC002" in deg
        assert deg["ACC002"] > 0.5
    
    def test_betweenness_centrality(self, detector, sample_transactions):
        """Test betweenness centrality identifies bridges."""
        detector.build_graph(sample_transactions)
        centrality = detector.calculate_centrality()
        
        bet = centrality.betweenness_centrality
        assert "ACC002" in bet
        assert bet["ACC002"] > 0
    
    def test_pagerank(self, detector, sample_transactions):
        """Test PageRank calculation."""
        detector.build_graph(sample_transactions)
        centrality = detector.calculate_centrality()
        
        pr = centrality.pagerank
        assert len(pr) == 6
        assert all(0 <= v <= 1 for v in pr.values())
        assert abs(sum(pr.values()) - 1.0) < 0.01
    
    def test_community_detection(self, detector, sample_transactions):
        """Test community detection."""
        detector.build_graph(sample_transactions)
        communities = detector.detect_communities()
        
        assert communities.num_communities >= 1
        assert communities.modularity >= -1 and communities.modularity <= 1
        assert sum(len(c) for c in communities.communities) == 6
    
    def test_cycle_detection(self, detector, sample_transactions):
        """Test cycle detection finds circular flows."""
        detector.build_graph(sample_transactions)
        cycles = detector.detect_cycles()
        
        assert cycles.cycle_count >= 1
        assert len(cycles.cycles) >= 1
        
        cycle = cycles.cycles[0]
        assert cycle[0] == cycle[-1] or len(cycle) >= 3
    
    def test_suspicious_paths_common_beneficiary(self, detector, sample_transactions):
        """Test detection of multiple senders to common receiver."""
        detector.build_graph(sample_transactions)
        paths = detector.detect_suspicious_paths()
        
        assert "ACC002" in paths.common_beneficiaries
        assert len(paths.common_beneficiaries["ACC002"]) >= 3
        assert len(paths.paths) >= 3
    
    def test_connected_components(self, detector, sample_transactions):
        """Test connected component analysis."""
        detector.build_graph(sample_transactions)
        components = detector.analyze_connected_components()
        
        assert components.num_components >= 1
        assert len(components.largest_component) > 0
        assert sum(components.component_sizes) == 6
    
    def test_risk_indicators(self, detector, sample_transactions):
        """Test risk indicator generation."""
        detector.build_graph(sample_transactions)
        
        centrality = detector.calculate_centrality()
        communities = detector.detect_communities()
        cycles = detector.detect_cycles()
        paths = detector.detect_suspicious_paths()
        components = detector.analyze_connected_components()
        
        indicators = detector.generate_risk_indicators(
            centrality, communities, cycles, paths, components
        )
        
        assert "risk_score" in indicators
        assert 0 <= indicators["risk_score"] <= 100
        assert "suspicious_cycle_count" in indicators
        assert "common_beneficiary_count" in indicators
    
    def test_full_analysis(self, detector, sample_transactions):
        """Test complete analysis pipeline."""
        from backend.core.models import GraphAnalysisRequest
        
        request = GraphAnalysisRequest(transactions=sample_transactions)
        result = detector.analyze(request)
        
        assert len(result.nodes) == 6
        assert len(result.edges) == 6
        assert result.centrality is not None
        assert result.communities is not None
        assert result.cycles is not None
        assert result.suspicious_paths is not None
        assert result.connected_components is not None
        assert result.risk_indicators is not None
    
    def test_empty_graph(self, detector):
        """Test handling of empty transaction list."""
        from backend.core.models import GraphAnalysisRequest
        
        request = GraphAnalysisRequest(transactions=[])
        result = detector.analyze(request)
        
        assert len(result.nodes) == 0
        assert len(result.edges) == 0
        assert result.centrality.degree_centrality == {}
        assert result.risk_indicators["risk_score"] == 0.0
    
    def test_single_transaction(self, detector):
        """Test handling of single transaction."""
        from backend.core.models import GraphAnalysisRequest
        
        tx = Transaction(
            transaction_id="tx1",
            sender_account="ACC001",
            receiver_account="ACC002",
            amount=1000.0,
            timestamp=datetime.now(),
            transaction_type=TransactionType.UPI
        )
        
        request = GraphAnalysisRequest(transactions=[tx])
        result = detector.analyze(request)
        
        assert len(result.nodes) == 2
        assert len(result.edges) == 1
        assert result.cycles.cycle_count == 0
    
    def test_duplicate_transactions_aggregated(self, detector):
        """Test that duplicate edges are aggregated."""
        base_time = datetime.now()
        transactions = [
            Transaction(
                transaction_id=f"tx{i}",
                sender_account="ACC001",
                receiver_account="ACC002",
                amount=1000.0,
                timestamp=base_time + timedelta(minutes=i),
                transaction_type=TransactionType.UPI
            )
            for i in range(5)
        ]
        
        detector.build_graph(transactions)
        
        assert detector.graph["ACC001"]["ACC002"]["weight"] == 5000.0
        assert detector.graph["ACC001"]["ACC002"]["count"] == 5
    
    def test_self_loop_handling(self, detector):
        """Test handling of self-loop transactions."""
        tx = Transaction(
            transaction_id="tx1",
            sender_account="ACC001",
            receiver_account="ACC001",
            amount=1000.0,
            timestamp=datetime.now(),
            transaction_type=TransactionType.UPI
        )
        
        detector.build_graph([tx])
        
        assert detector.graph.has_edge("ACC001", "ACC001")
        cycles = detector.detect_cycles()
        assert cycles.cycle_count >= 1


class TestGraphMathematicalProperties:
    """Test mathematical correctness of graph algorithms."""

    def test_betweenness_uses_amount_as_strength_not_distance(self):
        detector = GraphFraudDetector()
        timestamp = datetime.now()
        transactions = [
            Transaction(transaction_id="tx1", sender_account="A", receiver_account="B", amount=1000, timestamp=timestamp, transaction_type=TransactionType.UPI),
            Transaction(transaction_id="tx2", sender_account="B", receiver_account="C", amount=1000, timestamp=timestamp, transaction_type=TransactionType.UPI),
            Transaction(transaction_id="tx3", sender_account="A", receiver_account="C", amount=1, timestamp=timestamp, transaction_type=TransactionType.UPI),
        ]

        detector.build_graph(transactions)
        centrality = detector.calculate_centrality()

        assert centrality.betweenness_centrality["B"] > 0

    def test_upi_ids_are_graph_nodes_with_account_aliases(self):
        detector = GraphFraudDetector()
        transaction = Transaction(
            transaction_id="upi-transfer",
            sender_account="bank-account-1",
            receiver_account="bank-account-2",
            sender_upi_id="sender@upi",
            receiver_upi_id="receiver@upi",
            amount=250.0,
            timestamp=datetime.now(),
            transaction_type=TransactionType.UPI,
        )

        detector.build_graph([transaction])

        assert detector.graph.has_edge("sender@upi", "receiver@upi")
        assert detector.graph.nodes["sender@upi"]["account_ids"] == ["bank-account-1"]
        assert detector.graph.nodes["sender@upi"]["upi_ids"] == ["sender@upi"]
    
    def test_degree_centrality_formula(self):
        """Verify degree centrality formula: C_D(v) = deg(v) / (n-1)"""
        detector = GraphFraudDetector()
        
        txs = [
            Transaction(transaction_id="tx1", sender_account="A", receiver_account="B", amount=100, timestamp=datetime.now(), transaction_type=TransactionType.UPI),
            Transaction(transaction_id="tx2", sender_account="B", receiver_account="C", amount=100, timestamp=datetime.now(), transaction_type=TransactionType.UPI),
            Transaction(transaction_id="tx3", sender_account="C", receiver_account="A", amount=100, timestamp=datetime.now(), transaction_type=TransactionType.UPI),
        ]
        
        detector.build_graph(txs)
        centrality = detector.calculate_centrality()
        
        n = 3
        for node in ["A", "B", "C"]:
            expected = 2 / (n - 1)
            actual = centrality.degree_centrality[node]
            assert abs(actual - expected) < 0.001
    
    def test_pagerank_stochastic_matrix(self):
        """Verify PageRank produces valid probability distribution."""
        detector = GraphFraudDetector()
        
        txs = [
            Transaction(transaction_id=f"tx{i}", sender_account=f"A{i}", receiver_account=f"A{(i+1)%5}", amount=100, timestamp=datetime.now(), transaction_type=TransactionType.UPI)
            for i in range(5)
        ]
        
        detector.build_graph(txs)
        centrality = detector.calculate_centrality()
        
        pr_sum = sum(centrality.pagerank.values())
        assert abs(pr_sum - 1.0) < 0.001
        assert all(v >= 0 for v in centrality.pagerank.values())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])