import React from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface BarChartProps {
  data: Array<Record<string, any>>
  xKey: string
  yKeys: string[]
  colors?: string[]
  height?: number
  title?: string
}

export function BarChartComponent({ 
  data, 
  xKey, 
  yKeys, 
  colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'],
  height = 300,
  title
}: BarChartProps) {
  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="card-body">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis 
              type="category" 
              dataKey={xKey} 
              tick={{ fontSize: 12 }}
              width={120}
            />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), '']}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            {yKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colors[index % colors.length]}
                radius={[0, 4, 4, 0]}
              >
                {data.map((_, i) => (
                  <Cell key={`cell-${i}-${key}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface LineChartProps {
  data: Array<Record<string, any>>
  xKey: string
  yKeys: string[]
  colors?: string[]
  height?: number
  title?: string
}

export function LineChartComponent({ 
  data, 
  xKey, 
  yKeys, 
  colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'],
  height = 300,
  title
}: LineChartProps) {
  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="card-body">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            {yKeys.map((key, index) => (
              <Line key={key} dataKey={key} stroke={colors[index % colors.length]} strokeWidth={2} dot={false} type="monotone" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface PieChartProps {
  data: Array<{ name: string; value: number }>
  colors?: string[]
  height?: number
  title?: string
}

export function PieChartComponent({ 
  data, 
  colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'],
  height = 300,
  title
}: PieChartProps) {
  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="card-body">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), '']}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  subtitle?: string
}

export function MetricCard({ title, value, change, changeType = 'neutral', icon, subtitle }: MetricCardProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
        {change && (
          <div className="mt-3 flex items-center gap-1">
            <span className={`text-sm font-medium ${
              changeType === 'positive' ? 'text-success-600' :
              changeType === 'negative' ? 'text-danger-600' : 'text-gray-500'
            }`}>
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface TableProps {
  columns: Array<{ key: string; header: string; render?: (value: any, row: any) => React.ReactNode }>
  data: any[]
  keyField: string
  striped?: boolean
  hoverable?: boolean
}

export function DataTable({ columns, data, keyField, striped = true, hoverable = true }: TableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, rowIndex) => (
              <tr key={row[keyField]} className={`${hoverable ? 'hover:bg-gray-50' : ''} ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''}`}>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-900">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="p-8 text-center text-gray-500">No data available</div>
      )}
    </div>
  )
}

interface StatGridProps {
  children: React.ReactNode
  columns?: number
}

export function StatGrid({ children, columns = 4 }: StatGridProps) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${columns}`}>
      {children}
    </div>
  )
}