import { orderbook } from './orderbook';
import { settleMatchOnChain } from './settlement';
import { saveTrade, updateTradeSettlement } from './database';
import { randomUUID } from 'crypto';

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
      const match = await orderbook.matchOne();
      
      if (!match) {
        // No match found, continue
        return;
      }

      console.log('\n💰 Match found!');
      console.log('  Buyer:', match.buy.userPubkey.slice(0, 8) + '...');
      console.log('  Seller:', match.sell.userPubkey.slice(0, 8) + '...');
      console.log('  Price:', match.price);
      console.log('  Size:', match.size);

      // Save trade to database
      const tradeId = randomUUID();
      await saveTrade(
        match.buy.userPubkey,
        match.sell.userPubkey,
        match.buy.id,
        match.sell.id,
        match.price,
        match.size,
        tradeId
      );
      console.log('  💾 Trade saved to database:', tradeId);

      // Settle on-chain
      try {
        const settlementTx = await settleMatchOnChain(match);
        
        // Update trade with settlement tx
        if (settlementTx) {
          await updateTradeSettlement(tradeId, 'queued', settlementTx);
          console.log('  ⛓️  Settlement queued:', settlementTx);
        }
      } catch (settlementError) {
        console.error('  ❌ Settlement failed:', settlementError);
        await updateTradeSettlement(tradeId, 'failed');
      }

    } catch (error) {
      console.error('❌ Error in matching loop:', error);
      // Continue matching even if one settlement fails
    }
  }, MATCHING_INTERVAL_MS);
}
