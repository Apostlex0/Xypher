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

export interface MarginAccount {
  owner: PublicKey;
  encryptedCollateral: number[];
  encryptedDebt: number[];
  nonce: number[];
  isLiquidatable: boolean;
  bump: number;
}

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

/**
 * Derive margin account PDA for a user
 */
export function getMarginAccountPDA(owner: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('margin'), owner.toBuffer()],
    programId
  );
}

/**
 * Fetch margin account for a user
 * Returns null if account doesn't exist
 */
export async function fetchMarginAccount(
  program: Program,
  owner: PublicKey
): Promise<MarginAccount | null> {
  try {
    const [marginPDA] = getMarginAccountPDA(owner, program.programId);
    // @ts-ignore - IDL types are not fully generated
    const account = await program.account.marginAccount.fetch(marginPDA);
    return account as MarginAccount;
  } catch (error) {
    // Account doesn't exist
    return null;
  }
}

/**
 * Initialize margin account for a user
 * Creates the margin account PDA and margin vault
 */
export async function initializeMarginAccount(
  program: Program,
  owner: PublicKey,
  mintAddress: PublicKey
): Promise<string> {
  const [marginPDA] = getMarginAccountPDA(owner, program.programId);
  
  // Derive margin vault (ATA owned by margin account PDA)
  const { getAssociatedTokenAddressSync } = await import('@solana/spl-token');
  const marginVault = getAssociatedTokenAddressSync(
    mintAddress,
    marginPDA,
    true // allowOwnerOffCurve - PDA can own ATA
  );

  // @ts-ignore - IDL types
  const tx = await program.methods
    .initializeMarginAccount()
    .accounts({
      owner: owner,
      marginAccount: marginPDA,
      marginVault: marginVault,
      mint: mintAddress,
    })
    .rpc();

  return tx;
}
