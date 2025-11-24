import { AnchorProvider, Program, Idl, BN, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import { RPC_URL, PROGRAM_ID, ANCHOR_WALLET } from './config';
import { Match } from './orderbook';

// Import the generated IDL
import idlJson from '../../../target/idl/zec_dark_perps.json';

const idl = idlJson as Idl;

// Load wallet keypair
const walletKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(ANCHOR_WALLET, 'utf-8')))
);

// Create connection
const connection = new Connection(RPC_URL, 'confirmed');

// Create provider
const wallet = new Wallet(walletKeypair);
const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
});

// Create program instance
const programId = new PublicKey(PROGRAM_ID);
const program = new Program(idl, provider) as Program;

/**
 * Get the Anchor program instance (for use by other modules)
 */
export function getProgram() {
  return program;
}

/**
 * Settle a matched trade on-chain by calling settle_trade instruction
 */
export async function settleMatchOnChain(match: Match): Promise<string> {
  const buyer = new PublicKey(match.buy.userPubkey);
  const seller = new PublicKey(match.sell.userPubkey);

  // Derive margin account PDAs
  // Seeds: [b"margin", owner_pubkey]
  const [buyerMarginPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('margin'), buyer.toBuffer()],
    program.programId
  );

  const [sellerMarginPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('margin'), seller.toBuffer()],
    program.programId
  );

  console.log('Settling trade on-chain:');
  console.log('  Buyer:', buyer.toBase58());
  console.log('  Seller:', seller.toBase58());
  console.log('  Price:', match.price);
  console.log('  Size:', match.size);

  // Convert to fixed-point u64 (multiply by 1e6)
  const priceU64 = new BN(Math.round(match.price * 1_000_000));
  const sizeU64 = new BN(Math.round(match.size * 1_000_000));

  try {
    const txSig = await program.methods
      .settleTrade(priceU64, sizeU64)
      .accounts({
        authority: walletKeypair.publicKey,
        buyerMargin: buyerMarginPda,
        sellerMargin: sellerMarginPda,
      })
      .rpc();

    console.log('✅ Trade settled! Tx:', txSig);
    return txSig;
  } catch (error) {
    console.error('❌ Error settling trade:', error);
    throw error;
  }
}

/**
 * Get connection instance
 */
export function getConnection() {
  return connection;
}
