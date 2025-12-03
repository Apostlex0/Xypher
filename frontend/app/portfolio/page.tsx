'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Shield,
  Activity,
  ArrowUpDown,
  Clock,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Lock
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import Navbar from '@/components/navbar'
import { useZecDarkPerpsProgram, fetchMarginAccount, type MarginAccount } from '@/lib/anchor'
import { getUserPositions, getUserTrades, type Position as APIPosition, type Trade } from '@/lib/api'

interface Position extends APIPosition {
  currentPrice: number
  liquidationPrice: number
  pnl: number  // Alias for currentPnL
  pnlPercent: number
}

export default function PortfolioInterface() {
  const wallet = useWallet()
  const program = useZecDarkPerpsProgram()
  const [showBalances, setShowBalances] = useState(true)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [marginAccount, setMarginAccount] = useState<MarginAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [trades, setTrades] = useState<Trade[]>([])

  // Account data derived from margin account
  const [accountData, setAccountData] = useState({
    totalBalance: 0,
    collateral: 0,
    debt: 0,
    available: 0,
    healthRatio: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
  })

  const [positions, setPositions] = useState<Position[]>([])

  // PnL history (will be populated from trade history)
  const [pnlHistory, setPnlHistory] = useState<any[]>([])

  // Fetch margin account data
  useEffect(() => {
    if (!wallet.publicKey || !program) {
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const account = await fetchMarginAccount(program, wallet.publicKey!)
        
        // Fetch positions and trades from database
        const [positionsData, tradesData] = await Promise.all([
          getUserPositions(wallet.publicKey!.toString()).catch(() => ({ ok: false, positions: [], count: 0 })),
          getUserTrades(wallet.publicKey!.toString()).catch(() => ({ ok: false, trades: [], count: 0 }))
        ])
        
        // Transform positions to include UI fields
        const enrichedPositions: Position[] = positionsData.positions.map(p => ({
          ...p,
          currentPrice: 45.23, // TODO: Get from price feed
          liquidationPrice: p.entryPrice * 0.8, // Simplified calculation
          pnl: p.currentPnL,  // Alias for compatibility
          pnlPercent: (p.currentPnL / (p.entryPrice * p.size)) * 100
        }))
        
        setPositions(enrichedPositions)
        setTrades(tradesData.trades)
        
        if (account) {
          setMarginAccount(account)
          
          // Note: Balances are encrypted, need viewing key to decrypt
          // For now, show that account exists but balances are encrypted
          setAccountData({
            totalBalance: 0, // Encrypted
            collateral: 0, // Encrypted
            debt: 0, // Encrypted
            available: 0, // Encrypted
            healthRatio: 0, // Needs decryption
            totalPnL: 0,
            totalPnLPercent: 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch margin account:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [wallet.publicKey, program])

  // Collateral breakdown
  const collateralBreakdown = [
    { name: 'Available', value: accountData.available, color: '#00ff88' },
    { name: 'Used in Positions', value: accountData.collateral - accountData.available, color: '#60a5fa' },
    { name: 'Debt', value: accountData.debt, color: '#f472b6' },
  ]

  // Health ratio data
  const healthData = [
    { range: '0-100%', value: 0, color: '#ef4444' },
    { range: '100-150%', value: 0, color: '#f97316' },
    { range: '150-200%', value: 0, color: '#eab308' },
    { range: '200%+', value: accountData.healthRatio, color: '#00ff88' },
  ]

  const handleDeposit = async () => {
    if (!depositAmount) return
    setIsDepositing(true)
    
    // Simulate deposit
    setTimeout(() => {
      setAccountData(prev => ({
        ...prev,
        totalBalance: prev.totalBalance + parseFloat(depositAmount),
        collateral: prev.collateral + parseFloat(depositAmount),
        available: prev.available + parseFloat(depositAmount),
      }))
      setIsDepositing(false)
      setDepositAmount('')
    }, 2000)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount) return
    setIsWithdrawing(true)
    
    // Simulate withdrawal
    setTimeout(() => {
      setAccountData(prev => ({
        ...prev,
        totalBalance: prev.totalBalance - parseFloat(withdrawAmount),
        available: prev.available - parseFloat(withdrawAmount),
      }))
      setIsWithdrawing(false)
      setWithdrawAmount('')
    }, 2000)
  }

  const getHealthColor = (ratio: number) => {
    if (ratio < 100) return 'text-destructive'
    if (ratio < 150) return 'text-orange-500'
    if (ratio < 200) return 'text-yellow-500'
    return 'text-primary'
  }

  const getHealthBgColor = (ratio: number) => {
    if (ratio < 100) return 'bg-destructive/20 border-destructive/40'
    if (ratio < 150) return 'bg-orange-500/20 border-orange-500/40'
    if (ratio < 200) return 'bg-yellow-500/20 border-yellow-500/40'
    return 'bg-primary/20 border-primary/40'
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Your <span className="text-primary">Portfolio</span>
          </h1>
          <p className="text-muted-foreground">Manage margin, positions, and track performance</p>
        </div>
        <button
          onClick={() => setShowBalances(!showBalances)}
          className="p-3 glass rounded-lg hover:bg-secondary/50 transition-all"
        >
          {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </motion.div>

      {/* Wallet Connection / Viewing Key Banner */}
      {!wallet.publicKey ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-primary/10 border border-primary/20 rounded-lg text-center"
        >
          <Lock className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Connect Wallet to View Portfolio</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Solana wallet to access your encrypted margin account
          </p>
        </motion.div>
      ) : marginAccount ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/10 border border-primary/20 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-primary" />
              <div>
                <div className="font-semibold text-sm">Encrypted Balances</div>
                <div className="text-xs text-muted-foreground">
                  Your balances are encrypted on-chain. Enter viewing key to decrypt.
                </div>
              </div>
            </div>
            <button className="px-4 py-2 glass rounded-lg text-sm font-semibold hover:bg-secondary/50 transition-all">
              Enter Viewing Key
            </button>
          </div>
        </motion.div>
      ) : !isLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center"
        >
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">No Margin Account Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Initialize your margin account on the Trade page to start trading
          </p>
        </motion.div>
      ) : null}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 text-primary" />
            <div className="text-xs text-muted-foreground">wZEC</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Balance</div>
            <div className="text-3xl font-bold">
              {!wallet.publicKey ? '—' : !marginAccount ? 'N/A' : showBalances ? '🔒 Encrypted' : '••••'}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass rounded-2xl p-6 border ${getHealthBgColor(accountData.healthRatio)}`}
        >
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <div className={`text-xs font-semibold ${getHealthColor(accountData.healthRatio)}`}>
              {accountData.healthRatio >= 200 ? 'Safe' : accountData.healthRatio >= 150 ? 'Good' : accountData.healthRatio >= 100 ? 'Warning' : 'Danger'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Health Ratio</div>
            <div className={`text-3xl font-bold ${getHealthColor(accountData.healthRatio)}`}>
              {accountData.healthRatio}%
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-blue-400" />
            <div className="text-xs text-muted-foreground">24h</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total PnL</div>
            <div className={`text-3xl font-bold ${accountData.totalPnL >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {showBalances ? (
                <>{accountData.totalPnL >= 0 ? '+' : ''}${accountData.totalPnL.toFixed(2)}</>
              ) : '••••'}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <div className="text-xs text-muted-foreground">Open</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Positions</div>
            <div className="text-3xl font-bold">{positions.length}</div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Margin Account */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 space-y-6"
        >
          <h2 className="text-lg font-semibold">Margin Account</h2>

          {/* Collateral Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Collateral</span>
              <span className="font-semibold">{accountData.collateral.toFixed(2)} wZEC</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Debt</span>
              <span className="font-semibold text-pink-400">{accountData.debt.toFixed(2)} wZEC</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-semibold text-primary">{accountData.available.toFixed(2)} wZEC</span>
            </div>
          </div>

          {/* Visual Breakdown */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={collateralBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {collateralBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {collateralBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold">{item.value.toFixed(2)} wZEC</span>
              </div>
            ))}
          </div>

          {/* Deposit/Withdraw */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Deposit wZEC</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/40 border border-border rounded-lg text-sm focus:border-primary focus:outline-none"
                  placeholder="0.0"
                />
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount}
                  className="px-4 py-2 bg-primary text-black rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isDepositing ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Withdraw wZEC</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/40 border border-border rounded-lg text-sm focus:border-primary focus:outline-none"
                  placeholder="0.0"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount}
                  className="px-4 py-2 glass rounded-lg font-semibold text-sm hover:bg-secondary/50 transition-all disabled:opacity-50"
                >
                  {isWithdrawing ? (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Charts & Positions */}
        <div className="lg:col-span-2 space-y-6">
          {/* PnL Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">PnL History</h2>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Decrypted with your key</span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pnlHistory}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #00ff88',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="#00ff88" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#pnlGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Open Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Open Positions</h2>

            {positions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No open positions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((pos) => (
                  <motion.div
                    key={pos.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-black/40 rounded-xl border border-border/50 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-lg font-semibold text-sm ${
                          pos.side === 'long' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          {pos.side.toUpperCase()} {pos.leverage}x
                        </div>
                        <span className="font-semibold">{pos.size} ZEC</span>
                      </div>
                      <div className={`text-xl font-bold ${pos.pnl >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
                        <div className="font-semibold">${pos.entryPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Current Price</div>
                        <div className="font-semibold">${pos.currentPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Liq. Price</div>
                        <div className="font-semibold text-destructive">${pos.liquidationPrice.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* PnL Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">PnL Progress</span>
                        <span className={`font-semibold ${pos.pnlPercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-2 bg-border/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(Math.abs(pos.pnlPercent) * 5, 100)}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full rounded-full ${pos.pnl >= 0 ? 'bg-primary' : 'bg-destructive'}`}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <button className="flex-1 px-4 py-2 glass rounded-lg text-sm font-semibold hover:bg-secondary/50 transition-all">
                        Close Position
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
    </div>
    </main>
    
  )
}