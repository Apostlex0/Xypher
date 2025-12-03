'use client'

import { motion } from 'framer-motion'
import { Shield, Zap, Link as LinkIcon, Eye, Lock, Activity } from 'lucide-react'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export default function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const features = [
    {
      icon: Lock,
      title: 'Dark Pool Trading',
      description: 'Orders encrypted via Arcium MPC. No front-running. No MEV. Complete privacy until execution.',
      gradient: 'from-primary/20 to-emerald-500/20',
      borderGradient: 'from-primary to-emerald-500',
    },
    {
      icon: Zap,
      title: 'Sub-100ms Execution',
      description: 'Helius RPC infrastructure enables institutional-grade speed with real-time liquidation triggers.',
      gradient: 'from-yellow-500/20 to-orange-500/20',
      borderGradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: LinkIcon,
      title: 'Cross-Chain Bridge',
      description: 'First Zcash shielded → Solana bridge. Move ZEC to wZEC with privacy preserved on both chains.',
      gradient: 'from-blue-500/20 to-purple-500/20',
      borderGradient: 'from-blue-500 to-purple-500',
    },
    {
      icon: Eye,
      title: 'Privacy Analytics',
      description: 'View your stats with viewing keys. Platform aggregates stay public. Your data stays yours.',
      gradient: 'from-pink-500/20 to-red-500/20',
      borderGradient: 'from-pink-500 to-red-500',
    },
    {
      icon: Shield,
      title: 'Self-Custodial',
      description: 'WalletConnect integration with Unstoppable Wallet. Your keys, your crypto, always.',
      gradient: 'from-cyan-500/20 to-teal-500/20',
      borderGradient: 'from-cyan-500 to-teal-500',
    },
    {
      icon: Activity,
      title: 'Margin & Perps',
      description: 'Up to 5x leverage on ZEC perpetuals. Private health checks prevent liquidation surprises.',
      gradient: 'from-primary/20 to-green-500/20',
      borderGradient: 'from-primary to-green-500',
    },
  ]

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-black" />
      <div className="absolute inset-0 particles opacity-30" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            Built for <span className="text-primary">Privacy</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Leveraging cutting-edge cryptography and cross-chain infrastructure to bring institutional trading to the dark.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              
              {/* Card - LayerZero/Hyperbeat style */}
              <div className="relative bg-transparent rounded-xl p-6 h-full border border-white/5 group-hover:border-primary/30 transition-all duration-300 hover:translate-y-[-2px]">
                {/* Icon - minimal border box */}
                <div className="w-12 h-12 rounded-lg border border-white/10 bg-black/50 flex items-center justify-center mb-4 group-hover:border-primary/40 transition-all duration-300">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-primary transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Corner accent - appears on hover */}
                <div className="absolute bottom-0 right-0 w-5 h-5 border-r border-b border-primary/0 group-hover:border-primary/50 transition-all duration-300 rounded-br-xl" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <button className="group glass px-8 py-4 rounded-lg font-semibold hover:bg-secondary/50 transition-all duration-200">
            <span className="mr-2">Explore Technical Docs</span>
            <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </motion.div>
      </div>
    </section>
  )
}