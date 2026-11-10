import { useEffect, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import coseBilkent from 'cytoscape-cose-bilkent'
import dagre from 'cytoscape-dagre'
import { GraphNode, GraphEdge } from '../services/api'

cytoscape.use(coseBilkent)
cytoscape.use(dagre)

interface GraphVisualizationProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNode?: string
  onNodeSelect: (nodeId: string) => void
  layout?: 'cose-bilkent' | 'dagre' | 'circle' | 'grid'
  highlightNodes?: string[]
  highlightEdges?: string[]
}

export function GraphVisualization({
  nodes,
  edges,
  selectedNode,
  onNodeSelect,
  layout = 'cose-bilkent',
  highlightNodes = [],
  highlightEdges = [],
}: GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)
  const [activeLayout, setActiveLayout] = useState<NonNullable<GraphVisualizationProps['layout']>>(layout)

  useEffect(() => {
    if (!containerRef.current) return

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map(node => ({
          group: 'nodes' as const,
          data: {
            id: node.id,
            label: node.label,
            riskScore: node.risk_score,
            txCount: node.transaction_count,
            totalAmount: node.total_amount,
            ...node.metadata,
          },
          classes: highlightNodes.includes(node.id) ? 'highlighted' : '',
        })),
        ...edges.map((edge, index) => ({
          group: 'edges' as const,
          data: {
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            weight: edge.weight,
            txCount: edge.transaction_count,
            ...edge.metadata,
          },
          classes: highlightEdges.includes(`${edge.source}-${edge.target}`) ? 'highlighted' : '',
        })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-size': '11px',
            'font-family': 'Inter, sans-serif',
            'font-weight': 500,
            'color': '#1f2937',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 10,
            'background-color': '#3b82f6',
            'width': 'mapData(riskScore, 0, 100, 20, 60)',
            'height': 'mapData(riskScore, 0, 100, 20, 60)',
            'border-width': 2,
            'border-color': '#fff',
            'overlay-padding': 6,
            'z-index': 10,
          },
        },
        {
          selector: 'node.highlighted',
          style: {
            'background-color': '#ef4444',
            'border-color': '#fef2f2',
            'border-width': 3,
            'z-index': 20,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#fffbeb',
            'border-width': 3,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 'mapData(weight, 0, 100000, 1, 6)',
            'line-color': '#9ca3af',
            'target-arrow-color': '#9ca3af',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.6,
            'z-index': 1,
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'width': 'mapData(weight, 0, 100000, 2, 8)',
            'opacity': 1,
            'z-index': 15,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
          },
        },
      ],
      layout: { name: 'cose', animate: false, fit: true, padding: 50 },
      minZoom: 0.1,
      maxZoom: 2,
      wheelSensitivity: 0.2,
    })

    cyRef.current = cy

    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id()
      onNodeSelect(nodeId)
    })

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onNodeSelect('')
      }
    })

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [onNodeSelect])

  useEffect(() => {
    if (!cyRef.current) return
    
    const cy = cyRef.current
    
    // Update nodes
    nodes.forEach(node => {
      const ele = cy.getElementById(node.id)
      if (ele.length) {
        ele.data({
          label: node.label,
          riskScore: node.risk_score,
          txCount: node.transaction_count,
          totalAmount: node.total_amount,
        })
        ele.removeClass('highlighted')
        if (highlightNodes.includes(node.id)) {
          ele.addClass('highlighted')
        }
      }
    })

    // Update edges
    edges.forEach((edge, index) => {
      const ele = cy.getElementById(`edge-${index}`)
      if (ele.length) {
        ele.data({
          weight: edge.weight,
          txCount: edge.transaction_count,
        })
        ele.removeClass('highlighted')
        if (highlightEdges.includes(`${edge.source}-${edge.target}`)) {
          ele.addClass('highlighted')
        }
      }
    })

    // Update selection
    if (selectedNode) {
      cy.$(`#${selectedNode}`).select()
    } else {
      cy.$(':selected').unselect()
    }
  }, [nodes, edges, selectedNode, highlightNodes, highlightEdges])

  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.layout({
      name: activeLayout,
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 50,
      ...(activeLayout === 'dagre' && { rankDir: 'LR', nodeSep: 50, rankSep: 80, edgeSep: 20 }),
      ...(activeLayout === 'cose-bilkent' && {
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 2500,
        tile: true,
        tillingPaddingVertical: 10,
        tillingPaddingHorizontal: 10,
      }),
    }).run()
  }, [activeLayout])

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Transaction Network Graph</h3>
        <div className="flex items-center gap-2">
          <select
            value={activeLayout}
            onChange={(event) => setActiveLayout(event.target.value as NonNullable<GraphVisualizationProps['layout']>)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value="cose-bilkent">Force Directed</option>
            <option value="dagre">Hierarchical</option>
            <option value="circle">Circle</option>
            <option value="grid">Grid</option>
          </select>
          <button
            onClick={() => cyRef.current?.fit()}
            className="btn-secondary text-sm"
          >
            Fit View
          </button>
        </div>
      </div>
      <div className="card-body p-0">
        <div ref={containerRef} style={{ width: '100%', height: '600px' }} />
      </div>
      
      {/* Legend */}
      <div className="p-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary-500" />
          <span className="text-gray-600">Normal Account</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-gray-600">High Risk / Highlighted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500" />
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-gray-400 rounded" />
          <span className="text-gray-600">Low Amount</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 bg-gray-400 rounded" />
          <span className="text-gray-600">High Amount</span>
        </div>
      </div>
    </div>
  )
}

interface NodeDetailPanelProps {
  node: GraphNode | null
  edges: GraphEdge[]
  centrality?: {
    degree: number
    betweenness: number
    pagerank: number
  }
}

export function NodeDetailPanel({ node, edges, centrality }: NodeDetailPanelProps) {
  if (!node) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
        </div>
        <div className="card-body flex items-center justify-center h-64 text-gray-500">
          Click on a node in the graph to view details
        </div>
      </div>
    )
  }

  const incomingEdges = edges.filter(e => e.target === node.id)
  const outgoingEdges = edges.filter(e => e.source === node.id)
  const totalIncoming = incomingEdges.reduce((sum, e) => sum + e.weight, 0)
  const totalOutgoing = outgoingEdges.reduce((sum, e) => sum + e.weight, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
      </div>
      <div className="card-body space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Account Info</h4>
          <dl className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Account ID</dt>
              <dd className="font-mono font-medium text-gray-900">{node.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Label</dt>
              <dd className="font-medium text-gray-900">{node.label}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium text-gray-900 capitalize">{node.type}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Risk Score</dt>
              <dd className="font-medium text-gray-900">{node.risk_score.toFixed(1)} / 100</dd>
            </div>
          </dl>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Transaction Summary</h4>
          <dl className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Total Transactions</dt>
              <dd className="font-medium text-gray-900">{node.transaction_count}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Total Volume</dt>
              <dd className="font-medium text-gray-900">₹{node.total_amount.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Net Flow</dt>
              <dd className={`font-medium ${totalIncoming > totalOutgoing ? 'text-success-600' : 'text-danger-600'}`}>
                ₹{(totalIncoming - totalOutgoing).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Incoming</dt>
              <dd className="font-medium text-gray-900">₹{totalIncoming.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Outgoing</dt>
              <dd className="font-medium text-gray-900">₹{totalOutgoing.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Unique Counterparties</dt>
              <dd className="font-medium text-gray-900">
                {new Set([...incomingEdges.map(e => e.source), ...outgoingEdges.map(e => e.target)]).size}
              </dd>
            </div>
          </dl>
        </div>

        {centrality && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Centrality Metrics</h4>
            <dl className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Degree Centrality</dt>
                <dd className="font-medium text-gray-900">{centrality.degree.toFixed(4)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Betweenness</dt>
                <dd className="font-medium text-gray-900">{centrality.betweenness.toFixed(4)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">PageRank</dt>
                <dd className="font-medium text-gray-900">{centrality.pagerank.toFixed(4)}</dd>
              </div>
            </dl>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Top Counterparties</h4>
          <div className="mt-2 max-h-40 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1 text-gray-500">Account</th>
                  <th className="text-right py-1 text-gray-500">Amount</th>
                  <th className="text-right py-1 text-gray-500">Count</th>
                  <th className="text-left py-1 text-gray-500">Direction</th>
                </tr>
              </thead>
              <tbody>
                {[...incomingEdges, ...outgoingEdges]
                  .sort((a, b) => b.weight - a.weight)
                  .slice(0, 5)
                  .map((edge, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1 font-mono">
                        {edge.source === node.id ? edge.target : edge.source}
                      </td>
                      <td className="py-1 text-right">₹{edge.weight.toLocaleString()}</td>
                      <td className="py-1 text-right">{edge.transaction_count}</td>
                      <td className="py-1">
                        <span className={`badge ${edge.source === node.id ? 'badge-danger' : 'badge-success'}`}>
                          {edge.source === node.id ? 'Sent' : 'Received'}
                        </span>
                      </td>
                    </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}