'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, BarChart3, TrendingUp, Users, Activity, Shield, Eye, EyeOff, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts'
import { useWallet } from '@solana/wallet-adapter-react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { getPlatformMetrics, getUserTrades, type PlatformMetrics, type Trade } from '@/lib/api'

// Mock data for charts
const volumeData = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
]

const pnlData = [
  { name: 'W1', value: 100 },
  { name: 'W2', value: 250 },
  { name: 'W3', value: 180 },
  { name: 'W4', value: 420 },
]

export default function AnalyticsPage() {
  const wallet = useWallet()
  const [viewingKey, setViewingKey] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [userTrades, setUserTrades] = useState<Trade[]>([])
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalVolume24h: 0,
    openInterest: 0,
    totalTrades: 0,
    activeTradersCount: 0,
  })

  // Fetch platform metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await getPlatformMetrics()
      setMetrics(data)
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const handleUnlock = async () => {
    if (viewingKey.length > 0 && wallet.publicKey) {
      setIsUnlocked(true)
      // Fetch user's trade history
      try {
        const data = await getUserTrades(wallet.publicKey.toString())
        setUserTrades(data.trades)
      } catch (error) {
        console.error('Failed to fetch user trades:', error)
      }
    }
  }

  return (
    <main className="relative min-h-screen bg-transparent text-white">
      <div className="fixed inset-0 particles opacity-20 pointer-events-none" />
      
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center space-x-2 glass px-4 py-2 rounded-full border border-primary/20">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm">Privacy-First Analytics</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Trading <span className="text-primary">Analytics</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              View encrypted personal stats and aggregate platform metrics
            </p>
          </motion.div>
      
          {/* PRIVACY GATE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 border border-primary/20"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {isUnlocked ? (
                    <><Unlock className="text-primary h-5 w-5"/> Personal Analytics Unlocked</>
                  ) : (
                    <><Lock className="text-primary h-5 w-5"/> Personal Analytics</>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your trading data is encrypted. Enter viewing key to decrypt client-side.
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <input 
                  placeholder="Paste Viewing Key..." 
                  className="w-full md:w-64 px-4 py-2 bg-black/50 border border-primary/30 rounded-lg font-mono text-xs focus:border-primary focus:outline-none transition-all" 
                  value={viewingKey}
                  onChange={(e) => setViewingKey(e.target.value)}
                  type="password"
                />
                <button 
                  className="px-6 py-2 glass rounded-lg border border-primary/50 text-primary hover:bg-primary/10 transition-all font-semibold"
                  onClick={handleUnlock}
                >
                  {isUnlocked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* PERSONAL STATS (Only visible when unlocked) */}
          <AnimatePresence>
          {isUnlocked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Your Trading Performance</h3>
                <span className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary font-semibold">
                  🔒 Client-side only
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold font-mono">24</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Trades</div>
                </div>
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold font-mono text-primary">67%</div>
                  <div className="text-xs text-muted-foreground mt-1">Win Rate</div>
                </div>
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold font-mono text-primary">+$420</div>
                  <div className="text-xs text-muted-foreground mt-1">Total PnL</div>
                </div>
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold font-mono text-primary">$45</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg PnL</div>
                </div>
              </div>

              {/* PNL CHART */}
              <div className="glass rounded-2xl p-6">
                <h4 className="font-semibold mb-4">Cumulative PnL</h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pnlData}>
                  <defs>
                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#22c55e' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorPnl)" />
                </AreaChart>
              </ResponsiveContainer>
              </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* PLATFORM METRICS (Always visible - Aggregate data) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Platform Metrics</h3>
              <span className="px-3 py-1 glass rounded-full text-xs text-muted-foreground border border-white/5">
                Aggregate Data
              </span>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass rounded-xl p-6 flex flex-col items-center text-center">
                <Activity className="h-8 w-8 text-primary mb-2"/>
                <div className="text-3xl font-bold font-mono">${(metrics.totalVolume24h / 1000).toFixed(1)}K</div>
                <div className="text-xs text-muted-foreground mt-1">24h Volume</div>
              </div>

              <div className="glass rounded-xl p-6 flex flex-col items-center text-center">
                <BarChart3 className="h-8 w-8 text-primary mb-2"/>
                <div className="text-3xl font-bold font-mono">${(metrics.openInterest / 1000).toFixed(1)}K</div>
                <div className="text-xs text-muted-foreground mt-1">Open Interest</div>
              </div>

              <div className="glass rounded-xl p-6 flex flex-col items-center text-center">
                <TrendingUp className="h-8 w-8 text-primary mb-2"/>
                <div className="text-3xl font-bold font-mono text-primary">{metrics.totalTrades}</div>
                <div className="text-xs text-muted-foreground mt-1">Shielded Trades</div>
              </div>

              <div className="glass rounded-xl p-6 flex flex-col items-center text-center">
                <Users className="h-8 w-8 text-primary mb-2"/>
                <div className="text-3xl font-bold font-mono">{metrics.activeTradersCount}</div>
                <div className="text-xs text-muted-foreground mt-1">Active Orders</div>
              </div>
            </div>

            {/* CHARTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* VOLUME CHART */}
              <div className="glass rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold">Volume History (Shielded)</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded cursor-pointer">7D</span>
                <span className="px-2 py-1 bg-muted text-muted-foreground rounded cursor-pointer hover:bg-muted/70">30D</span>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#22c55e' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
              </div>
              </div>

              {/* LONG/SHORT RATIO */}
              <div className="glass rounded-2xl p-6">
            <h4 className="text-sm font-semibold mb-4">Long/Short Ratio</h4>
            <div className="space-y-6">
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-green-500 w-[65%]"></div>
                <div className="h-full bg-red-500 w-[35%]"></div>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-green-500">65% LONG</span>
                <span className="text-red-500">35% SHORT</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="text-sm font-semibold mb-4">Trade Distribution</h4>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'LONG', value: 780 },
                    { name: 'SHORT', value: 424 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              </div>
              </div>

            </div>
          </motion.div>

          {/* PRIVACY NOTICE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6 border border-primary/10"
          >
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          Privacy Guarantees
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <span>Personal data: Client-side decryption only</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <span>Aggregate data: No user breakdown</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <span>Shielded txs: Viewing key required</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <span>Zero knowledge: MPC computations</span>
          </div>
          </div>
          </motion.div>

        </div>
      </div>
      
      <Footer />
    </main>
  )
}