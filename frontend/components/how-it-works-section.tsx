'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, ArrowRight, Wallet, ArrowLeftRight, TrendingUp, ArrowDownToLine, CheckCircle, Lock, Zap } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useInView } from 'framer-motion'

interface SimulationState {
  phase: 'idle' | 'bridging' | 'minting' | 'trading' | 'withdrawing' | 'complete'
  progress: number
  isPlaying: boolean
  currentEvent: number
}

export default function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  
  const [simState, setSimState] = useState<SimulationState>({
    phase: 'idle',
    progress: 0,
    isPlaying: false,
    currentEvent: 0,
  })

  const phases = [
    {
      id: 'bridging',
      number: '01',
      title: 'Bridge Your ZEC',
      description: 'Send Zcash from shielded address to multisig bridge',
      icon: Wallet,
      color: 'from-primary via-emerald-400 to-primary',
      duration: 4000,
      events: [
        'User sends ZEC to shielded bridge address',
        'Memo field includes Solana destination',
        'Transaction enters Zcash mempool',
        'Zcash block mined (~75 seconds)',
        'Validators detect deposit via viewing key',
        'Deposit confirmed (1 block)',
      ],
    },
    {
      id: 'minting',
      number: '02',
      title: 'Receive wZEC',
      description: 'Validators mint equivalent wZEC to your Solana wallet',
      icon: ArrowLeftRight,
      color: 'from-blue-400 via-cyan-400 to-blue-500',
      duration: 3500,
      events: [
        'Validator 1 verifies ZEC deposit',
        'Validator 2 independently confirms',
        '2-of-3 multisig threshold reached',
        'Solana mint transaction prepared',
        'wZEC minted to user Solana address',
        'Bridge event emitted via Helius webhook',
      ],
    },
    {
      id: 'trading',
      number: '03',
      title: 'Trade Privately',
      description: 'Place encrypted orders on dark pool via Arcium MPC',
      icon: TrendingUp,
      color: 'from-purple-400 via-pink-400 to-purple-500',
      duration: 3000,
      events: [
        'User deposits wZEC as margin collateral',
        'Order encrypted with Arcium shared key',
        'Encrypted order sent to matching engine',
        'Arcium MPC computes match privately',
        'Trade executed without revealing details',
        'Position updated on margin account PDA',
      ],
    },
    {
      id: 'withdrawing',
      number: '04',
      title: 'Withdraw Anytime',
      description: 'Burn wZEC and receive ZEC back to shielded address',
      icon: ArrowDownToLine,
      color: 'from-pink-400 via-rose-400 to-pink-500',
      duration: 3500,
      events: [
        'User initiates withdrawal request',
        'wZEC tokens burned on Solana',
        'Burn event detected by validators',
        'Validators prepare ZEC transaction',
        'ZEC sent to user shielded address',
        'Privacy maintained end-to-end',
      ],
    },
  ]

  // Auto-advance simulation
  useEffect(() => {
    if (!simState.isPlaying || simState.phase === 'idle' || simState.phase === 'complete') return

    const currentPhase = phases.find(p => p.id === simState.phase)
    if (!currentPhase) return

    const interval = setInterval(() => {
      setSimState(prev => {
        const increment = 100 / (currentPhase.duration / 50)
        const newProgress = Math.min(prev.progress + increment, 100)
        
        // Update current event based on progress
        const eventProgress = Math.floor((newProgress / 100) * currentPhase.events.length)
        
        if (newProgress >= 100) {
          const currentIndex = phases.findIndex(p => p.id === prev.phase)
          const nextPhase = phases[currentIndex + 1]
          
          if (nextPhase) {
            return {
              ...prev,
              phase: nextPhase.id as any,
              progress: 0,
              currentEvent: 0,
            }
          } else {
            return {
              ...prev,
              phase: 'complete',
              progress: 100,
              isPlaying: false,
            }
          }
        }
        
        return { ...prev, progress: newProgress, currentEvent: eventProgress }
      })
    }, 50)

    return () => clearInterval(interval)
  }, [simState.isPlaying, simState.phase])

  const handlePlay = () => {
    if (simState.phase === 'idle' || simState.phase === 'complete') {
      setSimState({
        phase: 'bridging',
        progress: 0,
        isPlaying: true,
        currentEvent: 0,
      })
    } else {
      setSimState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
    }
  }

  const handleReset = () => {
    setSimState({
      phase: 'idle',
      progress: 0,
      isPlaying: false,
      currentEvent: 0,
    })
  }

  const getCurrentPhase = () => phases.find(p => p.id === simState.phase) || phases[0]

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-secondary/20 to-black" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl md:text-6xl font-bold">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch a live simulation of the entire cross-chain flow
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Controls & Config */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-2xl p-6 space-y-6 h-fit"
          >
            <div>
              <h3 className="text-lg font-semibold mb-4">Simulation Control</h3>
              
              {/* Status Display */}
              <div className="p-4 bg-black/40 rounded-xl border border-primary/20 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {simState.phase !== 'idle' && simState.phase !== 'complete' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-xs text-primary">Running</span>
                    </div>
                  )}
                </div>
                <div className="text-lg font-semibold">
                  {simState.phase === 'idle' ? 'Ready to Start' :
                   simState.phase === 'complete' ? 'Complete!' :
                   getCurrentPhase().title}
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3">
                <div className="p-3 bg-black/40 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Amount</div>
                  <div className="text-sm font-semibold">0.5 ZEC → 0.5 wZEC</div>
                </div>
                <div className="p-3 bg-black/40 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Route</div>
                  <div className="text-sm font-semibold">Zcash → Solana</div>
                </div>
                <div className="p-3 bg-black/40 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Est. Time</div>
                  <div className="text-sm font-semibold text-primary">~8 minutes</div>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handlePlay}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition-all glow-primary"
              >
                {simState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{simState.phase === 'idle' ? 'Start' : simState.isPlaying ? 'Pause' : 'Resume'}</span>
              </button>
              <button
                onClick={handleReset}
                className="p-3 glass rounded-lg hover:bg-secondary/50 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Right: Simulation Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            {/* Phase Indicators */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {phases.map((phase, index) => {
                const Icon = phase.icon
                const isActive = phase.id === simState.phase
                const isComplete = phases.findIndex(p => p.id === simState.phase) > index
                
                return (
                  <div key={phase.id} className="relative">
                    <div className={`p-4 rounded-xl border transition-all ${
                      isActive ? 'bg-secondary/50 border-primary/50' :
                      isComplete ? 'bg-secondary/30 border-primary/30' :
                      'bg-black/20 border-border/50'
                    }`}>
                      <div className={`w-10 h-10 rounded-lg mb-2 flex items-center justify-center bg-gradient-to-br ${phase.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xs font-semibold mb-1">{phase.title}</div>
                      {isActive && (
                        <div className="h-1 bg-border rounded-full overflow-hidden mt-2">
                          <motion.div
                            className="h-full bg-primary"
                            style={{ width: `${simState.progress}%` }}
                          />
                        </div>
                      )}
                      {isComplete && (
                        <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Event Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center space-x-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>Live Events</span>
              </h3>

              <AnimatePresence mode="wait">
                {simState.phase === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Click "Start" to watch the simulation</p>
                  </motion.div>
                )}

                {simState.phase !== 'idle' && simState.phase !== 'complete' && (
                  <motion.div
                    key={simState.phase}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-2"
                  >
                    {getCurrentPhase().events.map((event, index) => {
                      const isComplete = index < simState.currentEvent
                      const isCurrent = index === simState.currentEvent
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ 
                            opacity: isComplete || isCurrent ? 1 : 0.3,
                            x: 0 
                          }}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-black/20"
                        >
                          {isComplete ? (
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                          )}
                          <span className="text-sm">{event}</span>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}

                {simState.phase === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 glass rounded-xl border border-primary/40"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Process Complete!</h3>
                    <p className="text-muted-foreground mb-4">
                      Full cross-chain flow executed successfully
                    </p>
                    <button
                      onClick={handleReset}
                      className="px-6 py-2 glass rounded-lg hover:bg-secondary/50 transition-all"
                    >
                      Run Again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}