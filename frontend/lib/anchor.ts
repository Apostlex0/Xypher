/**
 * Anchor Program Hook for ZEC Dark Perps
 * Provides typed access to the on-chain program
 */

import { useMemo } from 'react';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import idlJson from '../../target/idl/zec_dark_perps.json';

const idl = idlJson as Idl;

/**
 * Hook to get the ZEC Dark Perps program instance
 * Returns null if wallet is not connected
 */
export function useZecDarkPerpsProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );

    const programId = new PublicKey(
      process.env.NEXT_PUBLIC_PROGRAM_ID!
    );

    return new Program(idl, provider);
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  return program;
}
