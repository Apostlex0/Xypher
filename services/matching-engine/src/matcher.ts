import { orderbook } from './orderbook';
import { settleMatchOnChain } from './settlement';

// Matching interval in milliseconds
const MATCHING_INTERVAL_MS = 200; // 5 matches/second max

/**
 * Start the continuous matching loop
 * Checks for matches every 200ms and settles them on-chain
 */
export function startMatchingLoop(): void {
  console.log(`🔄 Starting matching loop (${MATCHING_INTERVAL_MS}ms interval)`);

  setInterval(async () => {
    try {
      const match = orderbook.matchOne();
      
      if (!match) {
        // No match found, continue
        return;
      }

      console.log('\n💰 Match found!');
      console.log('  Buyer:', match.buy.userPubkey.slice(0, 8) + '...');
      console.log('  Seller:', match.sell.userPubkey.slice(0, 8) + '...');
      console.log('  Price:', match.price);
      console.log('  Size:', match.size);

      // Settle on-chain (fire-and-forget for MVP)
      // In production, you'd want a queue with retry logic
      await settleMatchOnChain(match);

    } catch (error) {
      console.error('❌ Error in matching loop:', error);
      // Continue matching even if one settlement fails
    }
  }, MATCHING_INTERVAL_MS);
}
