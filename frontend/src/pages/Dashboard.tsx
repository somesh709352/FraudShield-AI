import { Activity, Atom, BarChart3, GitBranch, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const modules = [
  { title: 'Graph Fraud Analysis', description: 'Inspect transaction relationships, cycles, connected accounts and review-worthy paths.', href: '/graph', icon: GitBranch, tone: 'bg-emerald-50 text-emerald-700' },
  { title: 'Bayesian Probability', description: 'Combine labeled examples and observed evidence with explicit smoothing assumptions.', href: '/bayesian', icon: Sparkles, tone: 'bg-sky-50 text-sky-700' },
  { title: 'Statistical Anomaly', description: 'Compare candidate payments with supplied customer history and robust ranges.', href: '/anomaly', icon: Activity, tone: 'bg-amber-50 text-amber-700' },
  { title: 'Threshold Optimization', description: 'Measure false-positive and false-negative trade-offs on validation labels.', href: '/optimization', icon: SlidersHorizontal, tone: 'bg-rose-50 text-rose-700' },
  { title: 'FraudShield Quantum Lab', description: 'Experiment with case selection under limited analyst resources. Experimental only.', href: '/quantum', icon: Atom, tone: 'bg-indigo-50 text-indigo-700' },
  { title: 'Model Performance', description: 'Review measured validation metrics and the provenance of supplied scores.', href: '/performance', icon: BarChart3, tone: 'bg-teal-50 text-teal-700' },
]

export function Dashboard() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-800"><span className="h-px w-5 bg-emerald-700" /> Mathematical Intelligence</p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">Risk analysis, with its working shown.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">Explore statistical signals, transaction networks and validation metrics. Calculated outputs are shown only after a backend analysis runs on supplied data.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-600"><span className="rounded-md border border-gray-200 px-2.5 py-1.5">Analyst review only</span><span className="rounded-md border border-gray-200 px-2.5 py-1.5">Synthetic inputs are labeled</span><span className="rounded-md border border-gray-200 px-2.5 py-1.5">No bank integration configured</span></div>
      </section>

      <section>
        <div className="mb-4"><p className="text-xs font-semibold uppercase text-gray-500">Analysis modules</p><h2 className="mt-1 text-lg font-semibold text-gray-900">Choose a workbench</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => <Link key={module.href} to={module.href} className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"><div className="flex items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${module.tone}`}><module.icon size={18} /></span><span><strong className="block text-sm font-semibold text-gray-900">{module.title}</strong><span className="mt-1.5 block text-xs leading-5 text-gray-600">{module.description}</span></span></div><span className="mt-4 block text-xs font-semibold text-emerald-800 group-hover:underline">Open analysis <span aria-hidden="true">-&gt;</span></span></Link>)}
        </div>
      </section>

      <aside className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><Activity className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>Interpretation policy.</strong> Statistical outliers and graph connections are indicators for investigation, not proof of fraud. Model and threshold metrics require representative labeled data.</p></aside>
    </div>
  )
}