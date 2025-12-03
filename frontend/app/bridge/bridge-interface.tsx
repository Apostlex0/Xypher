'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowDownUp,
  Copy,
  Check,
  QrCode,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Eye,
  Lock,
  Zap,
  ArrowRight,
  Info
} from 'lucide-react'

interface BridgeTransaction {
  id: string
  type: 'deposit' | 'withdraw'
  amount: number
  status: 'pending' | 'confirming' | 'processing' | 'complete' | 'failed'
  fromChain: string
  toChain: string
  txHash?: string
  timestamp: number
  estimatedTime?: number
}

export default function BridgeInterface() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showQR, setShowQR] = useState(false)
  
  // Mock bridge address
  const bridgeAddress = 'ztestsapling1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
  const solanaAddress = 'YourSolAddr123abc...'
  
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([
    {
      id: '1',
      type: 'deposit',
      amount: 1.5,
      status: 'complete',
      fromChain: 'Zcash',
      toChain: 'Solana',
      txHash: '0xabcd...1234',
      timestamp: Date.now() - 3600000,
    },
    {
      id: '2',
      type: 'withdraw',
      amount: 0.5,
      status: 'confirming',
      fromChain: 'Solana',
      toChain: 'Zcash',
      txHash: '0xefgh...5678',
      timestamp: Date.now() - 300000,
      estimatedTime: 480,
    },
  ])

  const [currentTransaction, setCurrentTransaction] = useState<BridgeTransaction | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeposit = async () => {
    if (!amount) return
    
    setIsProcessing(true)
    
    const newTx: BridgeTransaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amount: parseFloat(amount),
      status: 'pending',
      fromChain: 'Zcash',
      toChain: 'Solana',
      timestamp: Date.now(),
      estimatedTime: 480,
    }
    
    setCurrentTransaction(newTx)
    setTransactions(prev => [newTx, ...prev])
    
    // Simulate deposit flow
    setTimeout(() => {
      setCurrentTransaction(prev => prev ? { ...prev, status: 'confirming' } : null)
      setTransactions(prev => prev.map(tx => 
        tx.id === newTx.id ? { ...tx, status: 'confirming' } : tx
      ))
    }, 2000)
    
    setTimeout(() => {
      setCurrentTransaction(prev => prev ? { ...prev, status: 'processing', txHash: '0x' + Math.random().toString(36).substring(7) } : null)
      setTransactions(prev => prev.map(tx => 
        tx.id === newTx.id ? { ...tx, status: 'processing', txHash: '0x' + Math.random().toString(36).substring(7) } : tx
      ))
    }, 5000)
    
    setTimeout(() => {
      setCurrentTransaction(prev => prev ? { ...prev, status: 'complete' } : null)
      setTransactions(prev => prev.map(tx => 
        tx.id === newTx.id ? { ...tx, status: 'complete' } : tx
      ))
      setIsProcessing(false)
      setAmount('')
    }, 10000)
  }

  const handleWithdraw = async () => {
    if (!amount || !recipientAddress) return
    
    setIsProcessing(true)
    
    const newTx: BridgeTransaction = {
      id: `tx-${Date.now()}`,
      type: 'withdraw',
      amount: parseFloat(amount),
      status: 'pending',
      fromChain: 'Solana',
      toChain: 'Zcash',
      timestamp: Date.now(),
      estimatedTime: 480,
    }
    
    setCurrentTransaction(newTx)
    setTransactions(prev => [newTx, ...prev])
    
    // Simulate withdraw flow
    setTimeout(() => {
      setCurrentTransaction(prev => prev ? { ...prev, status: 'confirming', txHash: '0x' + Math.random().toString(36).substring(7) } : null)
      setTransactions(prev => prev.map(tx => 
        tx.id === newTx.id ? { ...tx, status: 'confirming', txHash: '0x' + Math.random().toString(36).substring(7) } : tx
      ))
    }, 2000)
    
    setTimeout(() => {
      setCurrentTransaction(prev => prev ? { ...prev, status: 'processing' } : null)
      setTransactions(prev => prev.map(tx => 
        tx.id === newTx.id ? { ...tx, status: 'processing' } : tx
      ))
    }, 5000)
    
    setTimeout(() => {
      setCurrentTransaction(prev => prev ? { ...prev, status: 'complete' } : null)
      setTransactions(prev => prev.map(tx => 
        tx.id === newTx.id ? { ...tx, status: 'complete' } : tx
      ))
      setIsProcessing(false)
      setAmount('')
      setRecipientAddress('')
    }, 10000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'confirming':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      case 'processing':
        return <Zap className="w-5 h-5 text-primary animate-pulse" />
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-primary" />
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-destructive" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting for deposit...'
      case 'confirming':
        return 'Confirming on blockchain...'
      case 'processing':
        return 'Validators processing...'
      case 'complete':
        return 'Complete!'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center space-x-2 glass px-4 py-2 rounded-full border border-primary/20">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm">2-of-3 Multisig Bridge</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">
          Cross-Chain <span className="text-primary">Bridge</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Bridge ZEC to Solana as wZEC with full privacy via shielded transactions
        </p>
      </motion.div>

      {/* Main Bridge Interface */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Bridge Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Tab Selector */}
          <div className="glass rounded-2xl p-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'deposit'
                  ? 'bg-primary text-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Deposit ZEC
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'withdraw'
                  ? 'bg-primary text-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Withdraw ZEC
            </button>
          </div>

          {/* Bridge Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'deposit' ? (
              <motion.div
                key="deposit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass rounded-2xl p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Deposit ZEC → Receive wZEC</h2>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="p-2 glass rounded-lg hover:bg-secondary/50 transition-all"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                </div>

                {/* Visual Flow */}
                <div className="relative py-8">
                  <div className="flex items-center justify-between relative z-10">
                    {/* From */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center space-y-2"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-sm font-semibold">Zcash</span>
                      <span className="text-xs text-muted-foreground">Shielded</span>
                    </motion.div>

                    {/* Arrow with particles */}
                    <div className="flex-1 relative mx-8">
                      <div className="h-1 bg-gradient-to-r from-yellow-500 via-primary to-blue-500 rounded-full" />
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ left: '0%' }}
                          animate={{ left: '100%' }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: 'linear',
                          }}
                          className="absolute top-1/2 w-2 h-2 bg-primary rounded-full -translate-y-1/2"
                          style={{ boxShadow: '0 0 10px rgba(0, 255, 136, 0.8)' }}
                        />
                      ))}
                      <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                    </div>

                    {/* To */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center space-y-2"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-sm font-semibold">Solana</span>
                      <span className="text-xs text-muted-foreground">wZEC Token</span>
                    </motion.div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm space-y-2">
                      <div className="font-semibold text-primary">How to deposit:</div>
                      <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                        <li>Send ZEC from your shielded wallet to the bridge address below</li>
                        <li>Include your Solana address in the memo field</li>
                        <li>Wait ~8 minutes for validators to detect and mint wZEC</li>
                      </ol>
                    </div>
                  </div>

                  {/* Bridge Address */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Bridge Shielded Address</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-4 py-3 bg-black/40 border border-border rounded-lg font-mono text-sm overflow-hidden text-ellipsis">
                        {bridgeAddress}
                      </div>
                      <button
                        onClick={() => handleCopy(bridgeAddress)}
                        className="px-4 py-3 glass rounded-lg hover:bg-secondary/50 transition-all"
                      >
                        {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Memo Field */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Your Solana Address (for memo)</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-4 py-3 bg-black/40 border border-primary/30 rounded-lg font-mono text-sm">
                        {solanaAddress}
                      </div>
                      <button
                        onClick={() => handleCopy(solanaAddress)}
                        className="px-4 py-3 glass rounded-lg hover:bg-secondary/50 transition-all"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <AnimatePresence>
                    {showQR && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6 bg-white rounded-lg"
                      >
                        <div className="aspect-square bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <QrCode className="w-32 h-32 text-white" />
                          <div className="absolute text-center text-black font-mono text-xs">
                            QR Code Placeholder
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-black/40 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">Est. Time</div>
                      <div className="text-sm font-semibold text-primary">~8 min</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">Min Deposit</div>
                      <div className="text-sm font-semibold">0.01 ZEC</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">Bridge Fee</div>
                      <div className="text-sm font-semibold text-primary">0%</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="withdraw"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass rounded-2xl p-6 space-y-6"
              >
                <h2 className="text-xl font-semibold">Withdraw wZEC → Receive ZEC</h2>

                {/* Visual Flow */}
                <div className="relative py-8">
                  <div className="flex items-center justify-between relative z-10">
                    {/* From */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center space-y-2"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-sm font-semibold">Solana</span>
                      <span className="text-xs text-muted-foreground">wZEC Token</span>
                    </motion.div>

                    {/* Arrow with particles */}
                    <div className="flex-1 relative mx-8">
                      <div className="h-1 bg-gradient-to-r from-blue-500 via-primary to-yellow-500 rounded-full" />
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ left: '0%' }}
                          animate={{ left: '100%' }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: 'linear',
                          }}
                          className="absolute top-1/2 w-2 h-2 bg-primary rounded-full -translate-y-1/2"
                          style={{ boxShadow: '0 0 10px rgba(0, 255, 136, 0.8)' }}
                        />
                      ))}
                      <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                    </div>

                    {/* To */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center space-y-2"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-sm font-semibold">Zcash</span>
                      <span className="text-xs text-muted-foreground">Shielded</span>
                    </motion.div>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm space-y-2">
                      <div className="font-semibold text-primary">How to withdraw:</div>
                      <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                        <li>Enter the amount of wZEC to withdraw</li>
                        <li>Provide your Zcash shielded address</li>
                        <li>Confirm transaction to burn wZEC and receive ZEC</li>
                      </ol>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Amount (wZEC)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-border rounded-lg focus:border-primary focus:outline-none transition-all"
                      placeholder="0.0"
                    />
                  </div>

                  {/* Recipient Address */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Your Zcash Shielded Address</label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-border rounded-lg font-mono text-sm focus:border-primary focus:outline-none transition-all"
                      placeholder="ztestsapling1..."
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-black/40 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">Est. Time</div>
                      <div className="text-sm font-semibold text-primary">~8 min</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">Min Withdraw</div>
                      <div className="text-sm font-semibold">0.01 wZEC</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">Bridge Fee</div>
                      <div className="text-sm font-semibold text-primary">0%</div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleWithdraw}
                    disabled={isProcessing || !amount || !recipientAddress}
                    className="w-full py-4 bg-primary text-black rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </span>
                    ) : (
                      'Request Withdrawal'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Transaction Status */}
          <AnimatePresence>
            {currentTransaction && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-6 border border-primary/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Current Transaction</h3>
                  {getStatusIcon(currentTransaction.status)}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm font-semibold">{getStatusText(currentTransaction.status)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-semibold">{currentTransaction.amount} {currentTransaction.type === 'deposit' ? 'ZEC' : 'wZEC'}</span>
                  </div>

                  {currentTransaction.txHash && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transaction</span>
                      <button className="text-sm font-mono text-primary hover:underline flex items-center space-x-1">
                        <span>{currentTransaction.txHash}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {currentTransaction.status !== 'complete' && currentTransaction.status !== 'failed' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-muted-foreground">~{Math.floor(currentTransaction.estimatedTime! / 60)} min remaining</span>
                      </div>
                      <div className="h-2 bg-border/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ 
                            width: currentTransaction.status === 'pending' ? '25%' :
                                   currentTransaction.status === 'confirming' ? '50%' :
                                   currentTransaction.status === 'processing' ? '75%' : '100%'
                          }}
                          className="h-full bg-primary rounded-full"
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: Transaction History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Bridge History</h2>
            <Lock className="w-5 h-5 text-primary" />
          </div>

          <div className="space-y-3">
            {transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-black/40 rounded-lg border border-border/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(tx.status)}
                    <span className="text-sm font-semibold capitalize">{tx.type}</span>
                  </div>
                  <span className="text-sm font-semibold">{tx.amount} {tx.type === 'deposit' ? 'ZEC' : 'wZEC'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{tx.fromChain} → {tx.toChain}</span>
                  <span className="text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {tx.txHash && (
                  <button className="text-xs font-mono text-primary hover:underline flex items-center space-x-1">
                    <span>{tx.txHash}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}