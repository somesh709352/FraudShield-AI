import MathematicalWorkbench from '../components/MathematicalWorkbench'

export type WorkbenchRoute = 'bayesian' | 'anomaly' | 'thresholds' | 'quantum' | 'performance'

export function ModulePage({ title, description, page }: { title: string; description: string; page: WorkbenchRoute }) {
  return <div className="space-y-5"><header><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Mathematical Intelligence</p><h2 className="mt-1 text-2xl font-semibold text-gray-900">{title}</h2><p className="mt-2 text-sm text-gray-600">{description}</p></header><MathematicalWorkbench page={page} /></div>
}