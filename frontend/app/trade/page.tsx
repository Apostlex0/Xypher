'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Zap, 
  ArrowUpDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import Navbar from '@/components/navbar'
import PriceChart from '@/components/price-chart'
import { submitOrder, getOrderbook, getUserOrders, type Order as APIOrder, type Orderbook } from '@/lib/api'
import { useZecDarkPerpsProgram, fetchMarginAccount, initializeMarginAccount } from '@/lib/anchor'

interface Order {
  id: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  status: 'pending' | 'matching' | 'executed'
  timestamp: number
}

interface Position {
  side: 'long' | 'short'
  size: number
  entryPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
}

export default function TradingInterface() {
  const wallet = useWallet()
  const program = useZecDarkPerpsProgram()
  const [orderForm, setOrderForm] = useState({
    side: 'long' as 'long' | 'short',
    size: '',
    leverage: 1,
  })
  
  const [currentPrice, setCurrentPrice] = useState(45.23)
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null)
  const [userOrders, setUserOrders] = useState<APIOrder[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(true)
  const [hasMarginAccount, setHasMarginAccount] = useState<boolean | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  // Fetch orderbook and update price
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOrderbook()
        setOrderbook(data)
        
        // Calculate mid-market price
        if (data.bids.length > 0 && data.asks.length > 0) {
          const midPrice = (data.bids[0].price + data.asks[0].price) / 2
          setCurrentPrice(midPrice)
        } else if (data.bids.length > 0) {
          setCurrentPrice(data.bids[0].price)
        } else if (data.asks.length > 0) {
          setCurrentPrice(data.asks[0].price)
        }
      } catch (error) {
        console.error('Failed to fetch orderbook:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [])

  // Check for margin account
  useEffect(() => {
    if (!wallet.publicKey || !program) {
      setHasMarginAccount(null)
      return
    }

    const checkMarginAccount = async () => {
      try {
        const account = await fetchMarginAccount(program, wallet.publicKey!)
        setHasMarginAccount(account !== null)
      } catch (error) {
        console.error('Failed to check margin account:', error)
        setHasMarginAccount(false)
      }
    }

    checkMarginAccount()
  }, [wallet.publicKey, program])

  // Fetch user orders
  useEffect(() => {
    if (!wallet.publicKey) return

    const fetchUserOrders = async () => {
      try {
        const data = await getUserOrders(wallet.publicKey!.toString())
        setUserOrders(data.orders)
      } catch (error) {
        console.error('Failed to fetch user orders:', error)
      }
    }

    fetchUserOrders()
    const interval = setInterval(fetchUserOrders, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [wallet.publicKey])

  const handleInitializeAccount = async () => {
    if (!wallet.publicKey || !program) {
      toast.error('Please connect your wallet')
      return
    }

    setIsInitializing(true)
    try {
      // wZEC mint address from env
      const mintAddress = new PublicKey(process.env.NEXT_PUBLIC_WZEC_MINT || '72CogbNLkZoFvMhzCWvaWXFikDwRAH16Xygwp8KabzBt')
      
      const tx = await initializeMarginAccount(program, wallet.publicKey, mintAddress)
      
      toast.success('Margin account initialized! You can now trade.')
      console.log('Transaction:', tx)
      
      // Refresh margin account status
      const account = await fetchMarginAccount(program, wallet.publicKey)
      setHasMarginAccount(account !== null)
    } catch (error: any) {
      console.error('Failed to initialize margin account:', error)
      
      // Handle user rejection specifically
      if (error.message?.includes('User rejected') || error.message?.includes('rejected the request')) {
        toast.error('Transaction cancelled')
      } else {
        toast.error(error.message || 'Failed to initialize account')
      }
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSubmitOrder = async () => {
    if (!wallet.publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    if (!orderForm.size || parseFloat(orderForm.size) <= 0) {
      toast.error('Please enter a valid size')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const result = await submitOrder(
        wallet.publicKey.toString(),
        orderForm.side,
        parseFloat(orderForm.size),
        currentPrice
      )

      toast.success(`Order submitted! ID: ${result.orderId.slice(0, 8)}...`)
      
      // Clear form
      setOrderForm({ ...orderForm, size: '' })
      
      // Refresh user orders immediately
      const data = await getUserOrders(wallet.publicKey.toString())
      setUserOrders(data.orders)
    } catch (error: any) {
      console.error('Failed to submit order:', error)
      toast.error(error.message || 'Failed to submit order')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update position PnL
  useEffect(() => {
    setPositions(prev => prev.map(pos => {
      const priceDiff = pos.side === 'long' 
        ? currentPrice - pos.entryPrice 
        : pos.entryPrice - currentPrice
      const pnl = priceDiff * pos.size
      const pnlPercent = (priceDiff / pos.entryPrice) * 100 * pos.size
      
      return { ...pos, currentPrice, pnl, pnlPercent }
    }))
  }, [currentPrice])

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
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-sm">Dark Pool Trading</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">
          Private <span className="text-primary">Perpetuals</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Trade ZEC perpetuals with up to 5x leverage. Orders encrypted via Arcium MPC.
        </p>
      </motion.div>

      {/* Main Trading Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Order Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Place Order</h2>
            <button
              onClick={() => setShowPrivacy(!showPrivacy)}
              className="p-2 hover:bg-secondary/50 rounded-lg transition-all"
            >
              {showPrivacy ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Margin Account Warning */}
          {wallet.publicKey && hasMarginAccount === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">Margin Account Required</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Initialize your margin account to enable private trading with encrypted balances.
                  </div>
                  <button
                    onClick={handleInitializeAccount}
                    disabled={isInitializing}
                    className="w-full py-2 px-4 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isInitializing ? (
                      <span className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Initializing...</span>
                      </span>
                    ) : (
                      'Initialize Margin Account'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Privacy Badge */}
          <AnimatePresence>
            {showPrivacy && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-primary/10 border border-primary/20 rounded-lg"
              >
                <div className="flex items-start space-x-2">
                  <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-primary">
                    <div className="font-semibold mb-1">🔒 Encrypted Order</div>
                    <div className="opacity-80">
                      Your order details are encrypted via Arcium MPC and never visible to other traders until execution.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Side Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOrderForm({ ...orderForm, side: 'long' })}
              className={`p-4 rounded-xl font-semibold transition-all ${
                orderForm.side === 'long'
                  ? 'bg-primary text-black'
                  : 'bg-secondary/30 text-foreground hover:bg-secondary/50'
              }`}
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-1" />
              Long
            </button>
            <button
              onClick={() => setOrderForm({ ...orderForm, side: 'short' })}
              className={`p-4 rounded-xl font-semibold transition-all ${
                orderForm.side === 'short'
                  ? 'bg-destructive text-white'
                  : 'bg-secondary/30 text-foreground hover:bg-secondary/50'
              }`}
            >
              <TrendingDown className="w-5 h-5 mx-auto mb-1" />
              Short
            </button>
          </div>

          {/* Size Input */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Size (ZEC)</label>
            <input
              type="number"
              step="0.1"
              value={orderForm.size}
              onChange={(e) => setOrderForm({ ...orderForm, size: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-border rounded-lg focus:border-primary focus:outline-none transition-all"
              placeholder="0.0"
            />
          </div>

          {/* Leverage Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">Leverage</label>
              <span className="text-sm font-semibold">{orderForm.leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={orderForm.leverage}
              onChange={(e) => setOrderForm({ ...orderForm, leverage: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1x</span>
              <span>5x</span>
            </div>
          </div>

          {/* Entry Price */}
          <div className="p-4 bg-black/40 rounded-lg border border-border/50">
            <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
            <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !orderForm.size || hasMarginAccount === false}
            className="w-full py-4 bg-primary text-black rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Encrypting Order...</span>
              </span>
            ) : hasMarginAccount === false ? (
              'Initialize Account First'
            ) : (
              `Place ${orderForm.side === 'long' ? 'Long' : 'Short'} Order`
            )}
          </button>
        </motion.div>

        {/* Right: Chart & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">ZEC/USD</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl font-bold">${currentPrice.toFixed(2)}</span>
                  <span className="text-xs text-primary">Live Price Feed</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                <span>Helius RPC: &lt;100ms</span>
              </div>
            </div>

            {/* Live Price Chart */}
            <div className="bg-black/40 rounded-lg border border-border/50 p-4">
              <PriceChart currentPrice={currentPrice} />
            </div>
          </motion.div>

          {/* Open Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Your Positions</h2>
            
            {positions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No open positions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map((pos, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-black/40 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          pos.side === 'long' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {pos.side.toUpperCase()}
                        </div>
                        <span className="font-semibold">{pos.size} ZEC</span>
                      </div>
                      <div className={`text-lg font-bold ${pos.pnl >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)} USD
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Entry</div>
                        <div className="font-semibold">${pos.entryPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Current</div>
                        <div className="font-semibold">${pos.currentPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">PnL %</div>
                        <div className={`font-semibold ${pos.pnlPercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Your Pending Orders</h2>
            
            {!wallet.publicKey ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Connect wallet to view orders</p>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No pending orders</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userOrders.filter(o => o.status === 'open').slice(0, 5).map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-black/40 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.side === 'long' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {order.side.toUpperCase()}
                        </div>
                        <span className="text-sm">{order.size} ZEC @ ${order.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-primary flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      </div>
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