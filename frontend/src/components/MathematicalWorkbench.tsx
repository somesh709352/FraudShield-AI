import { useState } from 'react'
import { AlertCircle, Loader2, Play, RotateCcw } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { examples } from '../services/examples'
import { postAnalysis } from '../services/api'

type WorkbenchPage = 'bayesian' | 'anomaly' | 'thresholds' | 'quantum' | 'performance'
type DataObject = Record<string, unknown>

const endpoints: Record<WorkbenchPage, string> = {
  bayesian: '/intelligence/bayesian',
  anomaly: '/intelligence/anomaly',
  thresholds: '/intelligence/thresholds/optimize',
  quantum: '/intelligence/quantum/prioritize',
  performance: '/intelligence/thresholds/optimize',
}

const explanations: Record<WorkbenchPage, { formula: string; variables: string; limitation: string }> = {
  bayesian: {
    formula: 'P(F|E) = P(F)P(E|F) / P(E)',
    variables: 'F is the supplied fraud label; E is the observed binary evidence. Likelihoods use symmetric additive smoothing.',
    limitation: 'The result depends on labeled examples and a conditional-independence assumption; it is not independently calibrated.',
  },
  anomaly: {
    formula: 'z = (x - μ)/σ; IQR = Q₃ - Q₁; fences = [Q₁ - 1.5·IQR, Q₃ + 1.5·IQR]',
    variables: 'x is the candidate amount; μ and σ are the historical mean and population standard deviation.',
    limitation: 'Small samples, seasonal behavior and legitimate one-off payments can all produce outliers.',
  },
  thresholds: {
    formula: 'Cost(t) = C_FN·FN(t) + C_FP·FP(t)',
    variables: 't is a threshold on validation scores; C_FN and C_FP are configurable miss and false-alert costs.',
    limitation: 'The threshold is selected on the supplied validation data and may not transfer to future populations.',
  },
  quantum: {
    formula: 'E(x,s) = -Σᵢ vᵢxᵢ + λ(Σᵢ rᵢxᵢ + s - B)²',
    variables: 'xᵢ selects a case, vᵢ is expected review value, rᵢ is resource use, B is capacity, and s is binary slack.',
    limitation: 'The implementation is an exact classical baseline and QUBO evaluation. It is not QAOA and makes no quantum-advantage claim.',
  },
  performance: {
    formula: 'Precision = TP/(TP+FP); Recall = TP/(TP+FN); F1 = 2·Precision·Recall/(Precision+Recall)',
    variables: 'TP, FP and FN are counted from the supplied validation labels and scores at each threshold.',
    limitation: 'No trained ML model or real labeled dataset is configured. The bundled validation example is synthetic.',
  },
}

function record(value: unknown): DataObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as DataObject : {}
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function display(value: unknown, digits = 3): string {
  const parsed = finite(value)
  return parsed === undefined ? String(value ?? '—') : parsed.toLocaleString('en-IN', { maximumFractionDigits: digits })
}

export default function MathematicalWorkbench({ page }: { page: WorkbenchPage }) {
  const [requestText, setRequestText] = useState('')
  const [result, setResult] = useState<DataObject | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSynthetic, setIsSynthetic] = useState(false)

  const loadExample = () => {
    setRequestText(JSON.stringify(examples[page === 'performance' ? 'thresholds' : page], null, 2))
    setResult(null)
    setError('')
    setIsSynthetic(true)
  }

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = JSON.parse(requestText) as unknown
      setResult(record(await postAnalysis(endpoints[page], payload)))
    } catch (reason) {
      setResult(null)
      setError(reason instanceof Error ? reason.message : 'Analysis request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div><h3 className="text-sm font-semibold text-gray-900">Analysis input</h3><p className="mt-1 text-xs text-gray-500">{isSynthetic ? 'Synthetic demonstration data' : 'Paste a request or load a synthetic example'}</p></div>
          <div className="flex gap-2"><button className="btn-secondary text-sm" onClick={loadExample}><RotateCcw className="mr-2 h-4 w-4" />Load example</button><button className="btn-primary text-sm" onClick={runAnalysis} disabled={loading || !requestText.trim()}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}{loading ? 'Calculating' : 'Run analysis'}</button></div>
        </div>
        {isSynthetic && <p className="flex gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900"><AlertCircle className="h-4 w-4 shrink-0" />Synthetic demonstration only. Results are calculated by the backend from illustrative inputs.</p>}
        <label className="block p-4"><span className="mb-2 block text-xs font-semibold uppercase text-gray-500">Request JSON</span><textarea className="min-h-48 w-full resize-y rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs leading-5 text-gray-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" value={requestText} onChange={(event) => { setRequestText(event.target.value); setIsSynthetic(false) }} spellCheck={false} placeholder="Load an example or paste a valid API request" /></label>
        {error && <p role="alert" className="flex gap-2 px-4 pb-4 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3"><div><p className="text-xs font-semibold uppercase text-gray-500">Calculated output</p><h3 className="mt-1 text-sm font-semibold text-gray-900">{result ? 'API response' : 'Waiting for an analysis'}</h3></div><span className={`rounded-full px-2.5 py-1 text-xs ${result ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>{result ? 'Complete' : 'No result'}</span></div>
        {result ? <ResultView page={page} result={result} /> : <div className="px-5 py-10 text-center"><ActivityIcon /><p className="mt-3 text-sm font-medium text-gray-800">No calculated values to show</p><p className="mt-1 text-xs text-gray-500">Run an analysis to populate this area from the backend.</p></div>}
        <div className="border-t border-gray-200 px-4 py-4"><p className="text-xs font-semibold uppercase text-gray-500">Method and limitations</p><p className="mt-2 font-mono text-sm text-emerald-900">{explanations[page].formula}</p><p className="mt-2 text-xs leading-5 text-gray-600">{explanations[page].variables}</p><p className="mt-2 text-xs leading-5 text-amber-800">{explanations[page].limitation}</p></div>
      </section>
    </div>
  )
}

function ActivityIcon() {
  return <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-500"><Play size={16} /></div>
}

function ResultView({ page, result }: { page: WorkbenchPage; result: DataObject }) {
  const summary = page === 'bayesian'
    ? [['Posterior', result.fraud_probability === undefined ? '—' : `${display(Number(result.fraud_probability) * 100, 1)}%`], ['Prior', result.prior_probability === undefined ? '—' : `${display(Number(result.prior_probability) * 100, 1)}%`], ['Fraud samples', record(result.training_support).fraud], ['Legitimate samples', record(result.training_support).legitimate]]
    : page === 'anomaly'
      ? [['Mean', record(result.statistics).mean], ['Median', record(result.statistics).median], ['Std. deviation', record(result.statistics).population_standard_deviation], ['Z-score', record(result.candidate).z_score]]
      : page === 'thresholds' || page === 'performance'
        ? [['Selected threshold', result.selected_threshold], ['Precision', record(result.selected_metrics).precision], ['Recall', record(result.selected_metrics).recall], ['PR-AUC (AP)', result.pr_auc_average_precision]]
        : [['Capacity', result.resource_limit], ['Classical value', record(result.classical_baseline).objective_value], ['QUBO value', record(result.qubo_result).objective_value], ['Runtime (ms)', finite(record(result.qubo_result).execution_time_seconds) === undefined ? undefined : Number(record(result.qubo_result).execution_time_seconds) * 1000]]

  const contributions = Array.isArray(result.evidence_contributions) ? result.evidence_contributions.map(record) : []
  const thresholds = Array.isArray(result.comparisons) ? result.comparisons.map(record) : []
  const history = Array.isArray(result.history_amounts) ? result.history_amounts.map((amount, index) => ({ index: index + 1, amount: finite(amount) })) : []
  const candidateAmount = finite(record(result.candidate).amount)
  if (page === 'anomaly' && candidateAmount !== undefined) history.push({ index: history.length + 1, amount: candidateAmount })
  const qubo = record(result.qubo)
  const matrix = record(qubo.matrix_upper_triangle)

  return <div className="space-y-5 p-4">
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{summary.map(([label, value]) => <div key={String(label)} className="rounded-md border border-gray-200 bg-gray-50 p-3"><p className="text-xs text-gray-500">{String(label)}</p><p className="mt-1 text-lg font-semibold text-gray-900">{display(value)}</p></div>)}</div>
    {page === 'bayesian' && <ChartFrame><BarChart data={contributions}><CartesianGrid strokeDasharray="3 4" vertical={false} /><XAxis dataKey="feature" /><YAxis /><Tooltip /><Bar dataKey="log_likelihood_ratio">{contributions.map((item, index) => <Cell key={index} fill={Number(item.log_likelihood_ratio) >= 0 ? '#15803d' : '#c2413b'} />)}</Bar></BarChart></ChartFrame>}
    {page === 'anomaly' && <ChartFrame><LineChart data={history}><CartesianGrid strokeDasharray="3 4" vertical={false} /><XAxis dataKey="index" /><YAxis /><Tooltip /><Line dataKey="amount" name="Amount (INR)" stroke="#15803d" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ChartFrame>}
    {(page === 'thresholds' || page === 'performance') && <ChartFrame><LineChart data={thresholds}><CartesianGrid strokeDasharray="3 4" vertical={false} /><XAxis dataKey="threshold" type="number" domain={[0, 1]} /><YAxis domain={[0, 1]} /><Tooltip /><Line dataKey="precision" stroke="#15803d" strokeWidth={2} dot={false} /><Line dataKey="recall" stroke="#b45309" strokeWidth={2} dot={false} /></LineChart></ChartFrame>}
    {page === 'quantum' && <div className="space-y-3"><div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">Experimental classical QUBO baseline. QAOA is not reported as available, and no quantum advantage is claimed.</div><p className="text-sm text-gray-700">Selected cases: {Array.isArray(record(result.classical_baseline).selected_cases) ? (record(result.classical_baseline).selected_cases as string[]).join(', ') || 'None' : '—'}</p><DataTable data={matrix} /></div>}
    <details className="rounded-md border border-gray-200"><summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-gray-700">Inspect full API response</summary><pre className="max-h-96 overflow-auto border-t border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">{JSON.stringify(result, null, 2)}</pre></details>
  </div>
}

function ChartFrame({ children }: { children: React.ReactElement }) {
  return <div className="h-64 w-full rounded-md border border-gray-200 bg-white p-3"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>
}

function DataTable({ data }: { data: DataObject }) {
  const entries = Object.entries(data)
  return <div className="max-h-64 overflow-auto rounded-md border border-gray-200"><table className="min-w-full text-xs"><thead className="sticky top-0 bg-gray-100 text-left text-gray-600"><tr><th className="px-3 py-2">Variable</th><th className="px-3 py-2">Coefficient</th></tr></thead><tbody>{entries.map(([key, value]) => <tr key={key} className="border-t border-gray-100"><td className="px-3 py-2 font-mono">{key}</td><td className="px-3 py-2">{display(value)}</td></tr>)}</tbody></table></div>
}