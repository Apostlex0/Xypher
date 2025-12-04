'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

export default function TechStackSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const sponsors = [
    {
      name: 'Arcium',
      letter: 'A',
      category: 'INFRASTRUCTURE',
      description: 'Confidential computing network enabling encrypted order matching and private health checks via MPC.',
      link: 'https://arcium.com',
    },
    {
      name: 'Helius',
      letter: 'H',
      category: 'INFRASTRUCTURE',
      description: 'High-performance RPC infrastructure enabling sub-100ms execution with real-time liquidation triggers.',
      link: 'https://helius.dev',
    },
    {
      name: 'Zcash',
      letter: 'Z',
      category: 'INFRASTRUCTURE',
      description: 'Shielded privacy protocol powering the bridge from Zcash to Solana with viewing key verification.',
      link: 'https://z.cash',
    },
    {
      name: 'Solana',
      letter: 'S',
      category: 'INFRASTRUCTURE',
      description: 'Base layer blockchain providing fast settlement and SPL token infrastructure for wZEC.',
      link: 'https://solana.com',
    },
  ]

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-black" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            Built With <span className="text-primary">Best-in-Class</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powered by leading infrastructure and privacy protocols
          </p>
        </motion.div>

        {/* Sponsors Grid - LayerZero Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sponsors.map((sponsor, index) => {
            const isHovered = hoveredIndex === index
            
            return (
              <motion.a
                key={index}
                href={sponsor.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group relative bg-black/40 rounded-xl border border-white/5 hover:border-primary/30 transition-all duration-300 overflow-hidden"
              >
                {/* Category Label */}
                <div className="absolute top-3 left-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-mono">
                  {sponsor.category}
                </div>

                {/* Arrow Icon */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                </div>

                {/* Content Container */}
                <div className="relative p-6 pt-10 min-h-[200px] flex flex-col">
                  {/* Letter Circle */}
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300">
                    <span className="text-2xl font-bold text-primary font-mono">{sponsor.letter}</span>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-200">
                    {sponsor.name}
                  </h3>

                  {/* Description - Shows on hover */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      height: isHovered ? 'auto' : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {sponsor.description}
                    </p>
                  </motion.div>
                </div>

                {/* Bottom Border Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/50 transition-all duration-300" />
              </motion.a>
            )
          })}
        </div>

        {/* Tech Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 flex flex-wrap justify-center gap-3"
        >
          {['Anchor', 'Next.js', 'TypeScript', 'Rust', 'MPC', 'SPL Tokens'].map((tech, i) => (
            <span
              key={i}
              className="px-4 py-2 bg-black/40 rounded-full text-sm font-mono text-muted-foreground hover:text-primary border border-white/5 hover:border-primary/30 transition-all duration-200"
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}