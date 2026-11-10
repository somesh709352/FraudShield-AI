import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  GitBranch, 
  Calculator, 
  BarChart2, 
  SlidersHorizontal, 
  Atom, 
  LineChart,
  Settings,
  Menu,
  X,
  Shield,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getApiStatus } from '../services/api'

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Graph Analysis', href: '/graph', icon: GitBranch },
  { name: 'Bayesian Analysis', href: '/bayesian', icon: Calculator },
  { name: 'Anomaly Detection', href: '/anomaly', icon: BarChart2 },
  { name: 'Threshold Optimization', href: '/optimization', icon: SlidersHorizontal },
  { name: 'Quantum Lab', href: '/quantum', icon: Atom },
  { name: 'Model Performance', href: '/performance', icon: LineChart },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [apiOnline, setApiOnline] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let active = true
    getApiStatus().then((online) => { if (active) setApiOnline(online) })
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <NavLink to="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">FraudShield AI</span>
            </NavLink>
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href))
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {item.name}
                </NavLink>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Mathematical Intelligence Engine v1.0.0
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {navigation.find(n => location.pathname === n.href || (n.href !== '/' && location.pathname.startsWith(n.href)))?.name || 'FraudShield AI'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
                <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-success-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs font-medium text-primary-700">{apiOnline ? 'API Connected' : 'API Offline'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}