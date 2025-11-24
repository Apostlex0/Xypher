import 'dotenv/config';

export const RPC_URL = process.env.RPC_URL || 'http://localhost:8899';
export const PROGRAM_ID = process.env.PROGRAM_ID!;
export const ANCHOR_WALLET = process.env.ANCHOR_WALLET!;
export const PORT = Number(process.env.PORT || 3001);

// For Arcium health checks (will be used in Phase 3.5)
export const HEALTH_COMPUTATION_OFFSET = BigInt(
  process.env.HEALTH_COMPUTATION_OFFSET || '0'
);

// Validate required env vars
if (!PROGRAM_ID) {
  throw new Error('PROGRAM_ID environment variable is required');
}

if (!ANCHOR_WALLET) {
  throw new Error('ANCHOR_WALLET environment variable is required');
}

console.log('Config loaded:');
console.log('  RPC_URL:', RPC_URL);
console.log('  PROGRAM_ID:', PROGRAM_ID);
console.log('  PORT:', PORT);
