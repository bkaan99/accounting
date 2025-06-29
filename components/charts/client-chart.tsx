'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ClientData {
  clientName: string
  revenue: number
}

interface ClientChartProps {
  data: ClientData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Gelir: {formatCurrency(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

const CustomLabel = ({ x, y, width, value }: any) => {
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="#6b7280"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs font-medium"
    >
      {formatCurrency(value)}
    </text>
  )
}

export function ClientChart({ data }: ClientChartProps) {
  // Take only top 8 clients for better visualization
  const topClients = data.slice(0, 8)

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={topClients}
          margin={{ top: 30, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="clientName"
            angle={-45}
            textAnchor="end"
            height={80}
            className="text-xs"
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            className="text-xs"
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="revenue"
            fill="url(#colorGradient)"
            radius={[4, 4, 0, 0]}
            label={<CustomLabel />}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 