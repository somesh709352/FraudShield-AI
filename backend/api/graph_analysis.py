"""
Graph Theory Fraud Detection Module

Mathematical Foundation:
- Nodes: Bank accounts / UPI IDs
- Edges: Financial transfers (directed, weighted)
- Edge attributes: amount, timestamp, transaction count

Algorithms Implemented:
1. Degree Centrality: C_D(v) = deg(v) / (n-1)
2. Betweenness Centrality: C_B(v) = Σ_{s≠v≠t} σ_st(v) / σ_st
3. PageRank: PR(p_i) = (1-d)/N + d Σ_{p_j∈M(p_i)} PR(p_j)/L(p_j)
4. Community Detection: Louvain method (modularity optimization)
5. Cycle Detection: Johnson's algorithm for elementary cycles
6. Suspicious Path Detection: Shortest paths to common beneficiaries
7. Connected Components: Weakly/strongly connected components

References:
- Newman, M. (2010). Networks: An Introduction. Oxford University Press.
- Fortunato, S. (2010). Community detection in graphs. Physics Reports.
"""

import networkx as nx
from typing import List, Dict, Any, Tuple, Set
from datetime import datetime
from collections import defaultdict
import numpy as np

from core.models import (
    Transaction, GraphNode, GraphEdge, GraphAnalysisRequest,
    CentralityMetrics, CommunityDetectionResult, CycleDetectionResult,
    SuspiciousPathResult, ConnectedComponentsResult, GraphAnalysisResponse
)
from core.config import settings


class GraphFraudDetector:
    """
    Graph-based fraud detection using NetworkX.
    
    Represents financial network as directed graph:
    - Nodes: Accounts/UPI IDs
    - Edges: Transfers with weight = total amount, count = frequency
    """
    
    def __init__(self, min_transactions: int = None, suspicious_threshold: float = None):
        self.min_transactions = min_transactions or settings.graph_min_transactions
        self.suspicious_threshold = suspicious_threshold or settings.graph_suspicious_threshold
        self.graph = nx.DiGraph()
        self.reverse_graph = nx.DiGraph()
        
    def build_graph(self, transactions: List[Transaction]) -> nx.DiGraph:
        """Build directed weighted graph from transactions."""
        self.graph.clear()
        self.reverse_graph.clear()
        
        node_stats = defaultdict(lambda: {
            'tx_count': 0, 'total_sent': 0.0, 'total_received': 0.0,
            'first_seen': None, 'last_seen': None,
            'account_ids': set(), 'upi_ids': set()
        })
        
        edge_data = defaultdict(lambda: {
            'weight': 0.0, 'count': 0, 'first_tx': None, 'last_tx': None
        })
        
        for tx in transactions:
            sender = tx.sender_upi_id or tx.sender_account
            receiver = tx.receiver_upi_id or tx.receiver_account
            amount = tx.amount
            timestamp = tx.timestamp
            
            node_stats[sender]['tx_count'] += 1
            node_stats[sender]['total_sent'] += amount
            node_stats[sender]['account_ids'].add(tx.sender_account)
            if tx.sender_upi_id:
                node_stats[sender]['upi_ids'].add(tx.sender_upi_id)
            node_stats[sender]['first_seen'] = min(
                node_stats[sender]['first_seen'] or timestamp, timestamp
            )
            node_stats[sender]['last_seen'] = max(
                node_stats[sender]['last_seen'] or timestamp, timestamp
            )
            
            node_stats[receiver]['tx_count'] += 1
            node_stats[receiver]['total_received'] += amount
            node_stats[receiver]['account_ids'].add(tx.receiver_account)
            if tx.receiver_upi_id:
                node_stats[receiver]['upi_ids'].add(tx.receiver_upi_id)
            node_stats[receiver]['first_seen'] = min(
                node_stats[receiver]['first_seen'] or timestamp, timestamp
            )
            node_stats[receiver]['last_seen'] = max(
                node_stats[receiver]['last_seen'] or timestamp, timestamp
            )
            
            edge_key = (sender, receiver)
            edge_data[edge_key]['weight'] += amount
            edge_data[edge_key]['count'] += 1
            edge_data[edge_key]['first_tx'] = min(
                edge_data[edge_key]['first_tx'] or timestamp, timestamp
            )
            edge_data[edge_key]['last_tx'] = max(
                edge_data[edge_key]['last_tx'] or timestamp, timestamp
            )
        
        for node_id, stats in node_stats.items():
            stats['account_ids'] = sorted(stats['account_ids'])
            stats['upi_ids'] = sorted(stats['upi_ids'])
            self.graph.add_node(node_id, **stats)
            self.reverse_graph.add_node(node_id, **stats)
        
        for (src, tgt), data in edge_data.items():
            self.graph.add_edge(src, tgt, **data)
            self.reverse_graph.add_edge(tgt, src, **data)
        
        return self.graph
    
    def calculate_centrality(self) -> CentralityMetrics:
        """Calculate centrality metrics for all nodes."""
        if self.graph.number_of_nodes() == 0:
            return CentralityMetrics(
                degree_centrality={},
                betweenness_centrality={},
                pagerank={}
            )
        
        deg_cent = nx.degree_centrality(self.graph)
        distance_graph = nx.DiGraph()
        distance_graph.add_nodes_from(self.graph.nodes(data=True))
        distance_graph.add_edges_from(
            (source, target, {'distance': 1.0 / data['weight']})
            for source, target, data in self.graph.edges(data=True)
        )
        bet_cent = nx.betweenness_centrality(distance_graph, weight='distance')
        pr = nx.pagerank(self.graph, weight='weight', alpha=0.85)
        
        return CentralityMetrics(
            degree_centrality=deg_cent,
            betweenness_centrality=bet_cent,
            pagerank=pr
        )
    
    def detect_communities(self) -> CommunityDetectionResult:
        """Detect communities using Louvain method (modularity maximization)."""
        if self.graph.number_of_nodes() == 0:
            return CommunityDetectionResult(
                communities=[], modularity=0.0, num_communities=0
            )
        
        try:
            import community as community_louvain
            partition = community_louvain.best_partition(self.graph.to_undirected(), weight='weight')
            
            communities_dict = defaultdict(list)
            for node, comm_id in partition.items():
                communities_dict[comm_id].append(node)
            
            communities = list(communities_dict.values())
            modularity = community_louvain.modularity(partition, self.graph.to_undirected(), weight='weight')
            
        except ImportError:
            communities = list(nx.algorithms.community.greedy_modularity_communities(
                self.graph.to_undirected(), weight='weight'
            ))
            communities = [list(c) for c in communities]
            modularity = nx.algorithms.community.modularity(
                self.graph.to_undirected(), communities, weight='weight'
            )
        
        return CommunityDetectionResult(
            communities=communities,
            modularity=float(modularity),
            num_communities=len(communities)
        )
    
    def detect_cycles(self, max_cycle_length: int = 6) -> CycleDetectionResult:
        """Detect elementary cycles (circular money flows)."""
        if self.graph.number_of_nodes() == 0:
            return CycleDetectionResult(
                cycles=[], cycle_count=0, suspicious_cycles=[]
            )
        
        cycles = []
        truncated = False
        max_reported_cycles = 500
        try:
            for cycle in nx.simple_cycles(self.graph, length_bound=max_cycle_length):
                if len(cycles) == max_reported_cycles:
                    truncated = True
                    break
                cycles.append(cycle)
            
            suspicious_cycles = []
            for cycle in cycles:
                cycle_amounts = []
                for i in range(len(cycle)):
                    src = cycle[i]
                    tgt = cycle[(i + 1) % len(cycle)]
                    if self.graph.has_edge(src, tgt):
                        cycle_amounts.append(self.graph[src][tgt]['weight'])
                
                if cycle_amounts:
                    total_cycle_amount = sum(cycle_amounts)
                    avg_amount = np.mean(cycle_amounts)
                    if total_cycle_amount > 100000 or avg_amount > 50000:
                        suspicious_cycles.append(cycle)
                        
        except (nx.NetworkXNoCycle, RecursionError):
            cycles = []
            suspicious_cycles = []
            truncated = False
        
        return CycleDetectionResult(
            cycles=cycles,
            cycle_count=len(cycles),
            suspicious_cycles=suspicious_cycles,
            truncated=truncated,
        )
    
    def detect_suspicious_paths(self, max_path_length: int = 4) -> SuspiciousPathResult:
        """Detect suspicious paths: multiple accounts -> common beneficiary."""
        if self.graph.number_of_nodes() == 0:
            return SuspiciousPathResult(
                paths=[], path_scores=[], common_beneficiaries={}
            )
        
        in_degree = dict(self.graph.in_degree())
        potential_targets = {n: d for n, d in in_degree.items() if d >= 3}
        
        paths = []
        path_scores = []
        common_beneficiaries = {}
        
        for target in potential_targets:
            predecessors = list(self.graph.predecessors(target))
            if len(predecessors) >= 3:
                common_beneficiaries[target] = predecessors
                
                for pred in predecessors:
                    try:
                        path = nx.shortest_path(self.graph, pred, target)
                        if len(path) <= max_path_length:
                            paths.append(path)
                            path_weight = sum(
                                self.graph[path[i]][path[i+1]]['weight']
                                for i in range(len(path)-1)
                            )
                            path_scores.append(float(path_weight))
                    except nx.NetworkXNoPath:
                        continue
        
        return SuspiciousPathResult(
            paths=paths,
            path_scores=path_scores,
            common_beneficiaries=common_beneficiaries
        )
    
    def analyze_connected_components(self) -> ConnectedComponentsResult:
        """Analyze weakly connected components in the transaction graph."""
        if self.graph.number_of_nodes() == 0:
            return ConnectedComponentsResult(
                components=[], component_sizes=[], largest_component=[], num_components=0
            )
        
        undirected = self.graph.to_undirected()
        components = list(nx.connected_components(undirected))
        components = [list(c) for c in components]
        component_sizes = [len(c) for c in components]
        
        largest_component = max(components, key=len) if components else []
        
        return ConnectedComponentsResult(
            components=components,
            component_sizes=component_sizes,
            largest_component=largest_component,
            num_components=len(components)
        )
    
    def generate_risk_indicators(
        self, centrality: CentralityMetrics, communities: CommunityDetectionResult,
        cycles: CycleDetectionResult, paths: SuspiciousPathResult,
        components: ConnectedComponentsResult
    ) -> Dict[str, Any]:
        """Generate consolidated risk indicators from all graph analyses."""
        
        high_degree_nodes = [
            n for n, c in centrality.degree_centrality.items()
            if c > np.percentile(list(centrality.degree_centrality.values()), 90)
        ] if centrality.degree_centrality else []
        
        high_betweenness_nodes = [
            n for n, c in centrality.betweenness_centrality.items()
            if c > np.percentile(list(centrality.betweenness_centrality.values()), 90)
        ] if centrality.betweenness_centrality else []
        
        high_pagerank_nodes = [
            n for n, c in centrality.pagerank.items()
            if c > np.percentile(list(centrality.pagerank.values()), 90)
        ] if centrality.pagerank else []
        
        large_communities = [
            c for c in communities.communities if len(c) > 5
        ]
        
        return {
            "high_degree_accounts": high_degree_nodes,
            "high_betweenness_accounts": high_betweenness_nodes,
            "high_pagerank_accounts": high_pagerank_nodes,
            "suspicious_cycle_count": len(cycles.suspicious_cycles),
            "total_cycles": cycles.cycle_count,
            "common_beneficiary_count": len(paths.common_beneficiaries),
            "suspicious_path_count": len(paths.paths),
            "large_community_count": len(large_communities),
            "largest_community_size": max([len(c) for c in communities.communities], default=0),
            "component_count": components.num_components,
            "largest_component_size": len(components.largest_component),
            "potential_money_mules": list(set(high_degree_nodes) & set(high_betweenness_nodes)),
            "potential_layering": list(set(high_betweenness_nodes) & set(high_pagerank_nodes)),
            "risk_score": self._calculate_graph_risk_score(
                cycles, paths, communities, components
            )
        }
    
    def _calculate_graph_risk_score(
        self, cycles: CycleDetectionResult, paths: SuspiciousPathResult,
        communities: CommunityDetectionResult, components: ConnectedComponentsResult
    ) -> float:
        """Calculate composite graph risk score (0-100)."""
        score = 0.0
        
        if cycles.cycle_count > 0:
            score += min(20, cycles.cycle_count * 2)
        if len(cycles.suspicious_cycles) > 0:
            score += min(20, len(cycles.suspicious_cycles) * 5)
        if paths.common_beneficiaries:
            score += min(20, len(paths.common_beneficiaries) * 3)
        if paths.paths:
            score += min(15, len(paths.paths) * 2)
        if communities.num_communities > 0:
            large_comm = sum(1 for c in communities.communities if len(c) > 5)
            score += min(15, large_comm * 3)
        if components.num_components > 10:
            score += min(10, components.num_components * 0.5)
        
        return min(100.0, score)
    
    def analyze(self, request: GraphAnalysisRequest) -> GraphAnalysisResponse:
        """Run complete graph analysis on transactions."""
        self.build_graph(request.transactions)
        
        centrality = self.calculate_centrality()
        communities = self.detect_communities()
        cycles = self.detect_cycles()
        paths = self.detect_suspicious_paths()
        components = self.analyze_connected_components()
        risk_indicators = self.generate_risk_indicators(
            centrality, communities, cycles, paths, components
        )
        
        nodes = [
            GraphNode(
                id=node_id,
                label=node_id[:20],
                type="upi" if data.get('upi_ids') else "account",
                risk_score=0.0,
                transaction_count=data.get('tx_count', 0),
                total_amount=data.get('total_sent', 0) + data.get('total_received', 0),
                metadata=data
            )
            for node_id, data in self.graph.nodes(data=True)
        ]
        
        edges = [
            GraphEdge(
                source=src,
                target=tgt,
                weight=data['weight'],
                transaction_count=data['count'],
                first_transaction=data['first_tx'],
                last_transaction=data['last_tx'],
                metadata=data
            )
            for src, tgt, data in self.graph.edges(data=True)
        ]
        
        return GraphAnalysisResponse(
            nodes=nodes,
            edges=edges,
            centrality=centrality,
            communities=communities,
            cycles=cycles,
            suspicious_paths=paths,
            connected_components=components,
            risk_indicators=risk_indicators
        )


def create_graph_detector() -> GraphFraudDetector:
    """Factory function for dependency injection."""
    return GraphFraudDetector()