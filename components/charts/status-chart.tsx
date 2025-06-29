'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface StatusData {
  status: string
  count: number
  amount: number
}

interface StatusChartProps {
  data: StatusData[]
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280', // gray
  SENT: '#3b82f6', // blue
  PAID: '#22c55e', // green
  OVERDUE: '#ef4444', // red
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  PAID: 'Ödendi',
  OVERDUE: 'Gecikmiş',
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white">
          {STATUS_LABELS[data.status] || data.status}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Adet: {data.count} fatura
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Toplam: {formatCurrency(data.amount)}
        </p>
      </div>
    )
  }
  return null
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {value}
    </text>
  ) : null
}

export function StatusChart({ data }: StatusChartProps) {
  const dataWithLabels = data.map(item => ({
    ...item,
    label: STATUS_LABELS[item.status] || item.status,
    fill: STATUS_COLORS[item.status] || '#6b7280',
  }))

  return (
    <div className="w-full h-80 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithLabels}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            innerRadius={40}
            fill="#8884d8"
            dataKey="count"
          >
            {dataWithLabels.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>
                {entry.payload.label} ({entry.payload.count})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {data.reduce((sum, item) => sum + item.count, 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Toplam Fatura
          </div>
        </div>
      </div>
    </div>
  )
} 