'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface PriceChartProps {
  currentPrice: number
}

interface PricePoint {
  time: string
  price: number
}

export default function PriceChart({ currentPrice }: PriceChartProps) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])

  useEffect(() => {
    // Initialize with some historical data
    const now = Date.now()
    const initialData: PricePoint[] = []
    
    for (let i = 60; i >= 0; i--) {
      const time = new Date(now - i * 2000) // 2 seconds apart
      const randomVariation = (Math.random() - 0.5) * 2
      initialData.push({
        time: time.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }),
        price: currentPrice + randomVariation
      })
    }
    
    setPriceHistory(initialData)
  }, [])

  useEffect(() => {
    // Add new price point when currentPrice changes
    if (priceHistory.length === 0) return

    const newPoint: PricePoint = {
      time: new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }),
      price: currentPrice
    }

    setPriceHistory(prev => {
      const updated = [...prev, newPoint]
      // Keep only last 60 points (2 minutes of data)
      return updated.slice(-60)
    })
  }, [currentPrice])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-primary/20 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">{payload[0].payload.time}</p>
          <p className="text-sm font-bold text-primary">${payload[0].value.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  if (priceHistory.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Loading chart...</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={priceHistory} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <XAxis 
            dataKey="time" 
            stroke="#666"
            tick={{ fill: '#666', fontSize: 10 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#666"
            tick={{ fill: '#666', fontSize: 10 }}
            tickLine={false}
            domain={['dataMin - 1', 'dataMax + 1']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#00ff9d" 
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
