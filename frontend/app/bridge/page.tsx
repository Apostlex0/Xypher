import Navbar from '@/components/navbar'
import BridgeInterface from './bridge-interface'
import Footer from '@/components/footer'

export default function BridgePage() {
  return (
    <main className="relative min-h-screen bg-transparent text-white">
      <div className="fixed inset-0 particles opacity-20 pointer-events-none" />
      
      <Navbar />
      
      <div className="pt-24 pb-16">
        <BridgeInterface />
      </div>

      <Footer />
    </main>
  )
}