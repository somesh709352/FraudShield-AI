export interface Transaction {
  transaction_id: string
  sender_account: string
  receiver_account: string
  amount: number
  timestamp: string
  transaction_type: 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'WALLET'
  sender_upi_id?: string
  receiver_upi_id?: string
  metadata?: Record<string, any>
}

export interface GraphNode {
  id: string
  label: string
  type: string
  risk_score: number
  transaction_count: number
  total_amount: number
  metadata: Record<string, any>
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
  transaction_count: number
  first_transaction: string
  last_transaction: string
  metadata: Record<string, any>
}

export interface CentralityMetrics {
  degree_centrality: Record<string, number>
  betweenness_centrality: Record<string, number>
  pagerank: Record<string, number>
}

export interface CommunityDetectionResult {
  communities: string[][]
  modularity: number
  num_communities: number
}

export interface CycleDetectionResult {
  cycles: string[][]
  cycle_count: number
  suspicious_cycles: string[][]
}

export interface SuspiciousPathResult {
  paths: string[][]
  path_scores: number[]
  common_beneficiaries: Record<string, string[]>
}

export interface ConnectedComponentsResult {
  components: string[][]
  component_sizes: number[]
  largest_component: string[]
  num_components: number
}

export interface GraphAnalysisResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
  centrality: CentralityMetrics
  communities: CommunityDetectionResult
  cycles: CycleDetectionResult
  suspicious_paths: SuspiciousPathResult
  connected_components: ConnectedComponentsResult
  risk_indicators: Record<string, any>
  generated_at: string
}

export interface GraphAnalysisRequest {
  transactions: Transaction[]
  min_transactions?: number
  suspicious_threshold?: number
}

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : '/api/v1'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async analyzeGraph(request: GraphAnalysisRequest): Promise<GraphAnalysisResponse> {
    return this.request<GraphAnalysisResponse>('/graph/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getCentrality(request: GraphAnalysisRequest): Promise<CentralityMetrics> {
    return this.request<CentralityMetrics>('/graph/centrality', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getCommunities(request: GraphAnalysisRequest): Promise<CommunityDetectionResult> {
    return this.request<CommunityDetectionResult>('/graph/communities', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getCycles(request: GraphAnalysisRequest): Promise<CycleDetectionResult> {
    return this.request<CycleDetectionResult>('/graph/cycles', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getSuspiciousPaths(request: GraphAnalysisRequest): Promise<SuspiciousPathResult> {
    return this.request<SuspiciousPathResult>('/graph/suspicious-paths', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getComponents(request: GraphAnalysisRequest): Promise<ConnectedComponentsResult> {
    return this.request<ConnectedComponentsResult>('/graph/components', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/graph/health')
  }
}

export const api = new ApiClient()

export async function postAnalysis<T>(endpoint: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function getApiStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/intelligence/status`)
    return response.ok
  } catch {
    return false
  }
}

// Generate sample transaction data for demo
export function generateSampleTransactions(count: number = 50): Transaction[] {
  const accounts = Array.from({ length: 20 }, (_, i) => `ACC${String(i + 1).padStart(3, '0')}`)
  const types: Transaction['transaction_type'][] = ['UPI', 'BANK_TRANSFER', 'CARD', 'WALLET']
  const baseTime = new Date('2026-01-01T10:00:00Z')
  
  const transactions: Transaction[] = []
  
  for (let i = 0; i < count; i++) {
    const sender = accounts[Math.floor(Math.random() * accounts.length)]
    let receiver = accounts[Math.floor(Math.random() * accounts.length)]
    while (receiver === sender) {
      receiver = accounts[Math.floor(Math.random() * accounts.length)]
    }
    
    const amount = Math.round((Math.random() * 50000 + 100) * 100) / 100
    const timestamp = new Date(baseTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
    
    transactions.push({
      transaction_id: `TX${String(i + 1).padStart(6, '0')}`,
      sender_account: sender,
      receiver_account: receiver,
      amount,
      timestamp: timestamp.toISOString(),
      transaction_type: types[Math.floor(Math.random() * types.length)],
      sender_upi_id: `${sender.toLowerCase()}@upi`,
      receiver_upi_id: `${receiver.toLowerCase()}@upi`,
    })
  }
  
  // Add some suspicious patterns
  // Pattern 1: Multiple accounts sending to ACC002 (common beneficiary)
  for (let i = 0; i < 5; i++) {
    transactions.push({
      transaction_id: `TX${String(transactions.length + 1).padStart(6, '0')}`,
      sender_account: accounts[6 + i],
      receiver_account: 'ACC002',
      amount: Math.round((Math.random() * 20000 + 10000) * 100) / 100,
      timestamp: new Date(baseTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      transaction_type: 'UPI',
    })
  }
  
  // Pattern 2: Circular flow ACC001 -> ACC003 -> ACC005 -> ACC001
  const circularAmounts = [15000, 14000, 13000]
  for (let i = 0; i < 3; i++) {
    transactions.push({
      transaction_id: `TX${String(transactions.length + 1).padStart(6, '0')}`,
      sender_account: ['ACC001', 'ACC003', 'ACC005'][i],
      receiver_account: ['ACC003', 'ACC005', 'ACC001'][i],
      amount: circularAmounts[i],
      timestamp: new Date(baseTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      transaction_type: 'BANK_TRANSFER',
    })
  }
  
  return transactions
}