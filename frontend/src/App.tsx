import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { GraphAnalysis } from './pages/GraphAnalysis'
import { BayesianAnalysis } from './pages/BayesianAnalysis'
import { AnomalyDetection } from './pages/AnomalyDetection'
import { ThresholdOptimization } from './pages/ThresholdOptimization'
import { QuantumLab } from './pages/QuantumLab'
import { ModelPerformance } from './pages/ModelPerformance'
import { Settings } from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="graph" element={<GraphAnalysis />} />
        <Route path="bayesian" element={<BayesianAnalysis />} />
        <Route path="anomaly" element={<AnomalyDetection />} />
        <Route path="optimization" element={<ThresholdOptimization />} />
        <Route path="quantum" element={<QuantumLab />} />
        <Route path="performance" element={<ModelPerformance />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App