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

interface CategoryData {
  category: string
  amount: number
}

interface CategoryChartProps {
  data: CategoryData[]
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#10b981', // emerald
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white">{data.category}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Toplam: {formatCurrency(data.amount)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Oran: {((data.amount / payload[0].payload.total) * 100).toFixed(1)}%
        </p>
      </div>
    )
  }
  return null
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null
}

export function CategoryChart({ data }: CategoryChartProps) {
  // Add total to each data point for tooltip
  const total = data.reduce((sum, item) => sum + item.amount, 0)
  const dataWithTotal = data.map(item => ({ ...item, total }))

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="amount"
          >
            {dataWithTotal.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>
                {value} ({formatCurrency(entry.payload.amount)})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 