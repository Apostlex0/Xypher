'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { useZecDarkPerpsProgram } from '../lib/anchor';
import Link from 'next/link';

interface MarginAccount {
  owner: string;
  collateral: number;
  debt: number;
  isLiquidatable: boolean;
}

export default function Home() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useZecDarkPerpsProgram();

  const [margin, setMargin] = useState<MarginAccount | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!program || !publicKey) return;

    (async () => {
      setLoading(true);
      try {
        const [marginPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('margin'), publicKey.toBuffer()],
          program.programId
        );

        const acc = await program.account.marginAccount.fetchNullable(
          marginPda
        );
        
        if (!acc) {
          setMargin(null);
        } else {
          setMargin({
            owner: (acc.owner as PublicKey).toBase58(),
            collateral: Number(acc.collateral),
            debt: Number(acc.debt),
            isLiquidatable: acc.isLiquidatable as boolean,
          });
        }
      } catch (e) {
        console.error('Error fetching margin account', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [program, publicKey, connection]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">ZEC Dark Perps</h1>
            <p className="text-sm text-gray-400">Privacy-First Perpetual Trading</p>
          </div>
          <WalletMultiButton />
        </header>

        {!publicKey && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              Connect your wallet to see your margin account.
            </p>
          </div>
        )}

        {publicKey && (
          <>
            <div className="mb-6">
              <h2 className="text-xl mb-4">Margin Account</h2>
              {loading && <p className="text-gray-400">Loading...</p>}
              {!loading && !margin && (
                <div className="rounded-xl border border-gray-700 p-6 text-center">
                  <p className="text-gray-400 mb-4">
                    No margin account found. Initialize one to start trading.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold">
                    Initialize Account
                  </button>
                </div>
              )}
              {!loading && margin && (
                <div className="rounded-xl border border-gray-700 p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Owner:</span>
                    <span className="font-mono text-sm">{margin.owner.slice(0, 8)}...{margin.owner.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Collateral (wZEC):</span>
                    <span className="font-semibold">{margin.collateral}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Debt:</span>
                    <span className="font-semibold">{margin.debt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health:</span>
                    <span
                      className={
                        margin.isLiquidatable ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'
                      }
                    >
                      {margin.isLiquidatable ? '⚠️ At Risk' : '✓ Safe'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Link
                href="/trade"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-center"
              >
                Trade
              </Link>
              <button className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold">
                Deposit
              </button>
              <button className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold">
                Withdraw
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
