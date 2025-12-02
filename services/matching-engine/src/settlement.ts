import { AnchorProvider, Program, Idl, BN, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import { RPC_URL, PROGRAM_ID, ANCHOR_WALLET } from './config';
import { Match } from './orderbook';
import {
  getMXEAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getComputationAccAddress,
  getClusterAccAddress
} from '@arcium-hq/client';

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
 * Settle a matched trade on-chain via Arcium MPC
 * Queues encrypted balance updates for both buyer and seller
 */
export async function settleMatchOnChain(match: Match): Promise<string> {
  // Validate public keys
  let buyer: PublicKey;
  let seller: PublicKey;
  
  try {
    buyer = new PublicKey(match.buy.userPubkey);
    seller = new PublicKey(match.sell.userPubkey);
  } catch (error) {
    throw new Error(`Invalid public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

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

  // Derive Arcium accounts using client helpers
  const [signPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('SignerAccount')],
    program.programId
  );

  const arciumProgramId = new PublicKey('Bv3Fb9VjzjWGfX18QTUcVycAfeLoQ5zZN6vv2g3cTZxp');
  
  // Use Arcium client helpers
  const mxeAccount = getMXEAccAddress(program.programId);
  const mempoolAccount = getMempoolAccAddress(program.programId);
  const executingPoolAccount = getExecutingPoolAccAddress(program.programId);
  
  // Get settle_trade comp def
  const settleOffset = Buffer.from(getCompDefAccOffset('settle_trade')).readUInt32LE();
  const compDefAccount = getCompDefAccAddress(program.programId, settleOffset);
  
  // Get cluster account (cluster offset 768109697 for v0.4.0 devnet)
  const clusterAccount = getClusterAccAddress(768109697);
  
  // Use timestamp as computation offset
  const computationOffset = new BN(Date.now());
  const computationAccount = getComputationAccAddress(program.programId, computationOffset);

  console.log('🔐 Settling trade via Arcium MPC:');
  console.log('  Buyer:', buyer.toBase58());
  console.log('  Seller:', seller.toBase58());
  console.log('  Price:', match.price);
  console.log('  Size:', match.size);

  // Calculate trade value (price * size)
  const tradeValue = new BN(Math.round(match.price * match.size * 1_000_000));

  try {
    const txSig = await program.methods
      .queueSettleTrade(computationOffset, tradeValue)
      .accounts({
        payer: walletKeypair.publicKey,
        signPdaAccount: signPda,
        mxeAccount: mxeAccount,
        buyerMargin: buyerMarginPda,
        sellerMargin: sellerMarginPda,
        computationAccount: computationAccount,
        compDefAccount: compDefAccount,
        clusterAccount: clusterAccount,
        mempoolAccount: mempoolAccount,
        executingPool: executingPoolAccount,
        arciumProgram: arciumProgramId,
      })
      .rpc();

    console.log('✅ Trade settlement queued to MPC! Tx:', txSig);
    console.log('   Waiting for Arcium callback (via Helius webhook)...');
    
    return txSig;
  } catch (error) {
    console.error('❌ Error queueing trade settlement:', error);
    throw error;
  }
}

/**
 * Get connection instance
 */
export function getConnection() {
  return connection;
}
