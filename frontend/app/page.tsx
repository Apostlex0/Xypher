import Navbar from '@/components/navbar'
import HeroSection from '@/components/hero-section'
import FeaturesSection from '@/components/features-section'
import HowItWorksSection from '@/components/how-it-works-section'
import TechStackSection from '@/components/tech-stack-section'
import CTASection from '@/components/cta-section'
import Footer from '@/components/footer'

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Global Background Effects */}
      <div className="fixed inset-0 particles opacity-20 pointer-events-none" />
      
      {/* Navbar */}
      <Navbar />

      {/* Sections */}
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechStackSection />
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  )
}