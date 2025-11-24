'use client';

import { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

const MATCHING_ENGINE_URL =
  process.env.NEXT_PUBLIC_MATCHING_ENGINE_URL || 'http://localhost:3001';

export default function TradePage() {
  const { publicKey } = useWallet();
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      setStatus('Connect wallet first.');
      return;
    }
    const sizeNum = Number(size);
    const priceNum = Number(price);
    if (!sizeNum || !priceNum) {
      setStatus('Enter valid size and price.');
      return;
    }

    try {
      setStatus('Sending order...');
      const res = await fetch(`${MATCHING_ENGINE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPubkey: publicKey.toBase58(),
          side,
          size: sizeNum,
          price: priceNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }
      setStatus(`✅ Order submitted! ID: ${data.orderId}`);
      
      // Clear form
      setSize('');
      setPrice('');
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message ?? 'unknown error'}`);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <div className="w-full max-w-xl">
        <header className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-2xl font-bold hover:text-gray-300">
              ZEC Dark Perps
            </Link>
            <p className="text-sm text-gray-400">Place Orders</p>
          </div>
          <WalletMultiButton />
        </header>

        {!publicKey && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              Connect your wallet to place orders.
            </p>
          </div>
        )}

        {publicKey && (
          <>
            <form onSubmit={onSubmit} className="space-y-4 mb-6">
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`flex-1 py-3 rounded-lg border font-semibold transition-colors ${
                    side === 'long'
                      ? 'bg-emerald-600 border-emerald-400'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSide('long')}
                >
                  Long
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 rounded-lg border font-semibold transition-colors ${
                    side === 'short'
                      ? 'bg-red-600 border-red-400'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSide('short')}
                >
                  Short
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Size (ZEC)
                </label>
                <input
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:border-blue-500 focus:outline-none"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Limit Price (USD)
                </label>
                <input
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 focus:border-blue-500 focus:outline-none"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold transition-colors"
              >
                Submit Order
              </button>
            </form>

            {status && (
              <div className={`p-4 rounded-lg border ${
                status.includes('✅') 
                  ? 'border-green-700 bg-green-900/20' 
                  : status.includes('❌')
                  ? 'border-red-700 bg-red-900/20'
                  : 'border-gray-700 bg-gray-900'
              }`}>
                <p className="text-sm">{status}</p>
              </div>
            )}

            <div className="mt-8 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">ℹ️ Info</h3>
              <p className="text-sm text-gray-400">
                Orders are submitted to the off-chain matching engine. 
                Matches are settled on-chain automatically.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
