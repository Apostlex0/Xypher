'use client'

import Link from 'next/link'
import { Github, Twitter, MessageCircle, FileText, Mail } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    product: [
      { name: 'Trade', href: '/trade' },
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Bridge', href: '/bridge' },
      { name: 'Analytics', href: '/analytics' },
    ],
    developers: [
      { name: 'Documentation', href: '/docs' },
      { name: 'GitHub', href: 'https://github.com' },
      { name: 'Smart Contracts', href: '/contracts' },
      { name: 'API Reference', href: '/api' },
    ],
    resources: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Security', href: '/security' },
      { name: 'Terms', href: '/terms' },
    ],
    community: [
      { name: 'Discord', href: 'https://discord.gg' },
      { name: 'Twitter', href: 'https://twitter.com' },
      { name: 'Telegram', href: 'https://t.me' },
      { name: 'Forum', href: '/forum' },
    ],
  }

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: MessageCircle, href: 'https://discord.gg', label: 'Discord' },
    { icon: FileText, href: '/docs', label: 'Docs' },
  ]

  return (
    <footer className="relative border-t border-border/50 bg-black">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Top Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/50 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xl">Z</span>
              </div>
              <span className="text-xl font-bold">
                ZEC<span className="text-primary">Dark</span>
              </span>
            </Link>
            
            <p className="text-sm text-muted-foreground max-w-xs">
              The first privacy-preserving perpetual exchange bridging Zcash to Solana with MPC-powered dark pool trading.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-3">
              {socialLinks.map((social, i) => (
                <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 glass rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all duration-200"
                >
                    <social.icon className="w-5 h-5" />
                </a>
            ))}

            </div>
          </div>

          {/* Links Columns */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Developers</h3>
            <ul className="space-y-3">
              {footerLinks.developers.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Community</h3>
            <ul className="space-y-3">
              {footerLinks.community.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ZEC Dark Perps. Built for{' '}
            <span className="text-primary font-semibold">Zypherpunk Hackathon</span>.
          </div>

          {/* Disclaimer */}
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Testnet Only</span>
            </span>
            <span>•</span>
            <span>Not Financial Advice</span>
            <span>•</span>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Hackathon Badge */}
        <div className="mt-8 pt-8 border-t border-border/30">
          <div className="glass rounded-lg p-4 text-center">
            <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Powered by:</span>
              {['Arcium', 'Helius', 'Zcash', 'Solana', 'Pump Fun', 'Unstoppable'].map((sponsor, i) => (
                <span key={i} className="px-3 py-1 bg-secondary/50 rounded-full hover:text-primary transition-colors">
                  {sponsor}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}