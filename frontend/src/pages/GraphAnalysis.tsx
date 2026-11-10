import { useState, useEffect } from 'react'
import { api, generateSampleTransactions, GraphAnalysisResponse } from '../services/api'
import { GraphVisualization, NodeDetailPanel } from '../components/GraphVisualization'
import { MetricCard, StatGrid, DataTable, BarChartComponent } from '../components/Charts'
import { GitBranch, AlertTriangle, Share2, Download, RefreshCw } from 'lucide-react'

export function GraphAnalysis() {
  const [transactions] = useState(() => generateSampleTransactions(100))
  const [analysis, setAnalysis] = useState<GraphAnalysisResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string>('')
  const layout = 'cose-bilkent' as const
  const [showExplanation, setShowExplanation] = useState(false)

  const selectedNode = analysis?.nodes.find(n => n.id === selectedNodeId) || null
  const nodeCentrality = selectedNode && analysis ? {
    degree: analysis.centrality.degree_centrality[selectedNodeId] || 0,
    betweenness: analysis.centrality.betweenness_centrality[selectedNodeId] || 0,
    pagerank: analysis.centrality.pagerank[selectedNodeId] || 0,
  } : undefined

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const result = await api.analyzeGraph({ transactions, min_transactions: 1 })
      setAnalysis(result)
      setError('')
    } catch (reason) {
      setAnalysis(null)
      setError(reason instanceof Error ? reason.message : 'Graph analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runAnalysis()
  }, [])

  const highlightNodes = analysis?.risk_indicators?.potential_money_mules || []
  const highlightEdges = analysis?.suspicious_paths.paths.flatMap((path) => 
    path.slice(0, -1).map((node, j) => `${node}-${path[j + 1]}`)
  ) || []

  if (!analysis) {
    return <div className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center gap-3 text-center"><p className="text-sm text-gray-700">{loading ? 'Calculating graph measures from synthetic example transactions...' : error || 'Waiting for graph analysis.'}</p>{error && <button className="btn-primary" onClick={runAnalysis} disabled={loading}>Retry analysis</button>}<p className="text-xs text-gray-500">The example transactions are synthetic; no financial institution data is connected.</p></div>
  }

  const riskIndicators = analysis.risk_indicators

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">Synthetic demonstration input. All graph outputs below are returned by the backend from these illustrative transactions.</div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Graph Fraud Analysis</h1>
          <p className="text-gray-500 mt-1">Network-based fraud detection using graph theory algorithms</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runAnalysis} disabled={loading} className="btn-primary">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button onClick={() => setShowExplanation(!showExplanation)} className="btn-ghost">
            <Share2 className="w-4 h-4 mr-2" />
            Methodology
          </button>
        </div>
      </div>

      {/* Risk Summary Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Graph Pattern Indicator"
          value={`${riskIndicators.risk_score.toFixed(1)} / 100`}
          change={riskIndicators.risk_score > 50 ? 'High Risk' : riskIndicators.risk_score > 25 ? 'Medium Risk' : 'Low Risk'}
          changeType={riskIndicators.risk_score > 50 ? 'negative' : riskIndicators.risk_score > 25 ? 'neutral' : 'positive'}
          subtitle="Heuristic network signal, not fraud probability"
          icon={<AlertTriangle className="w-6 h-6" />}
        />
        <MetricCard
          title="Suspicious Cycles"
          value={riskIndicators.suspicious_cycle_count}
          change={`${riskIndicators.total_cycles} total cycles`}
          changeType={riskIndicators.suspicious_cycle_count > 0 ? 'negative' : 'positive'}
          subtitle={analysis.cycles.truncated ? 'Cycle search capped at 500 results' : 'All bounded cycles enumerated'}
          icon={<GitBranch className="w-6 h-6" />}
        />
        <MetricCard
          title="Common Beneficiaries"
          value={riskIndicators.common_beneficiary_count}
          change={`${riskIndicators.suspicious_path_count} suspicious paths`}
          changeType={riskIndicators.common_beneficiary_count > 0 ? 'negative' : 'positive'}
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          title="Accounts for Review"
          value={riskIndicators.potential_money_mules?.length || 0}
          change={`${riskIndicators.potential_layering?.length || 0} layering suspects`}
          changeType={(riskIndicators.potential_money_mules?.length || 0) > 0 ? 'negative' : 'positive'}
          icon={<AlertTriangle className="w-6 h-6" />}
        />
      </StatGrid>

      {/* Methodology Explanation */}
      {showExplanation && (
        <div className="card border-primary-200 bg-primary-50">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Mathematical Methodology</h3>
            <button onClick={() => setShowExplanation(false)} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
          <div className="card-body space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700">Graph Representation</h4>
              <p className="text-gray-600 mt-1">
                Financial network modeled as directed graph G = (V, E) where V = accounts/UPI IDs and E = transfers.
                Edge weights = transaction amounts, edge attributes = timestamps, counts.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <MethodCard title="Degree Centrality" formula="C_D(v) = deg(v) / (n-1)" description="Identifies highly connected accounts (hubs)" />
              <MethodCard title="Betweenness Centrality" formula="C_B(v) = Σ σ_st(v) / σ_st" description="Finds bridge accounts controlling flow" />
              <MethodCard title="PageRank" formula="PR(p) = (1-d)/N + d Σ PR(p_j)/L(p_j)" description="Ranks accounts by influence in network" />
              <MethodCard title="Louvain Communities" formula="Maximize modularity Q" description="Detects coordinated groups / clusters" />
              <MethodCard title="Cycle Detection" formula="Johnson's algorithm" description="Finds circular money flows (layering)" />
              <MethodCard title="Suspicious Paths" formula="Multi-source → common target" description="Detects smurfing / structuring patterns" />
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">⚠️ Important Disclaimer</h4>
              <p className="text-gray-600 text-sm">
                This analysis identifies <strong>suspicious patterns requiring investigation</strong>. 
                It does NOT label any account holder as a criminal. Graph patterns can have legitimate explanations
                (e.g., business payroll, family transfers, marketplace settlements). All flags require human analyst review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Graph Visualization */}
        <div className="lg:col-span-3">
          <GraphVisualization
            nodes={analysis.nodes}
            edges={analysis.edges}
            selectedNode={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
            layout={layout}
            highlightNodes={highlightNodes}
            highlightEdges={highlightEdges}
          />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <NodeDetailPanel
            node={selectedNode}
            edges={analysis.edges}
            centrality={nodeCentrality}
          />

          {/* Community Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Communities ({analysis.communities.num_communities})</h3>
            </div>
            <div className="card-body">
              <BarChartComponent
                data={analysis.communities.communities.map((c, i) => ({
                  community: `C${i + 1}`,
                  size: c.length,
                }))}
                xKey="community"
                yKeys={['size']}
                colors={['#3b82f6']}
                height={200}
              />
              <p className="text-sm text-gray-500 mt-2">
                Modularity: {analysis.communities.modularity.toFixed(3)} • 
                Largest: {Math.max(...analysis.communities.communities.map(c => c.length))} accounts
              </p>
            </div>
          </div>

          {/* Centrality Rankings */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Top Accounts by Centrality</h3>
            </div>
            <div className="card-body p-0">
              <DataTable
                columns={[
                  { key: 'id', header: 'Account', render: (v) => (
                    <span className={`font-mono ${highlightNodes.includes(v) ? 'text-red-600 font-medium' : ''}`}>{v}</span>
                  )},
                  { key: 'degree', header: 'Degree', render: (v) => v.toFixed(3) },
                  { key: 'betweenness', header: 'Betweenness', render: (v) => v.toFixed(3) },
                  { key: 'pagerank', header: 'PageRank', render: (v) => v.toFixed(4) },
                ]}
                data={Object.keys(analysis.centrality.degree_centrality)
                  .map(id => ({
                    id,
                    degree: analysis.centrality.degree_centrality[id],
                    betweenness: analysis.centrality.betweenness_centrality[id],
                    pagerank: analysis.centrality.pagerank[id],
                  }))
                  .sort((a, b) => b.pagerank - a.pagerank)
                  .slice(0, 10)}
                keyField="id"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cycles & Suspicious Paths */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Detected Cycles ({analysis.cycles.cycle_count}{analysis.cycles.truncated ? '+' : ''})</h3>
          </div>
          <div className="card-body">
            {analysis.cycles.suspicious_cycles.length > 0 ? (
              <ul className="space-y-2">
                {analysis.cycles.suspicious_cycles.slice(0, 5).map((cycle, i) => (
                  <li key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="font-mono text-sm text-red-700">
                      {cycle.join(' → ')} → {cycle[0]}
                    </p>
                    <p className="text-xs text-red-600 mt-1">Suspicious: High-value circular flow detected</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">No suspicious cycles detected</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Common Beneficiaries</h3>
          </div>
          <div className="card-body">
            {Object.keys(analysis.suspicious_paths.common_beneficiaries).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analysis.suspicious_paths.common_beneficiaries).map(([beneficiary, senders]) => (
                  <div key={beneficiary} className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-gray-900">{beneficiary}</span>
                      <span className="badge badge-warning">{senders.length} senders</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Senders: {senders.map(s => <span key={s} className="font-mono mx-1">{s}</span>).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No common beneficiary patterns detected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MethodCardProps {
  title: string
  formula: string
  description: string
}

function MethodCard({ title, formula, description }: MethodCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h5 className="font-medium text-gray-900">{title}</h5>
      <p className="font-mono text-sm text-primary-600 mt-1">{formula}</p>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  )
}

import { Users } from 'lucide-react'
