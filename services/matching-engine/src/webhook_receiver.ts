/**
 * Helius Webhook Receiver
 * 
 * Handles webhooks from Helius for:
 * - Health check failures (triggers liquidation)
 * - Trade settlements (for analytics)
 */

import { PublicKey } from '@solana/web3.js';
import { triggerLiquidation } from './liquidation';
import { updateTradeSettlementByTx } from './database';

// Simplified Helius webhook payload type
interface HeliusWebhookPayload {
  webhookID: string;
  txs: Array<{
    signature: string;
    logs?: string[];
    events?: any;
    accountData?: any[];
  }>;
}

/**
 * Handle incoming Helius webhook
 * Parses transaction logs for liquidation triggers
 */
export async function handleHeliusWebhook(body: any): Promise<void> {
  const payload = body as HeliusWebhookPayload;

  console.log('📨 Received Helius webhook:', payload.webhookID);

  for (const tx of payload.txs) {
    const logs: string[] = tx.logs || [];

    // Look for trade settlement callbacks
    if (logs.some(log => log.includes('SettleTradeCallback'))) {
      console.log('✅ Trade settlement callback received!');
      console.log('   Transaction:', tx.signature);
      
      // Check if computation completed successfully
      if (logs.some(log => log.includes('Trade settlement computation completed'))) {
        console.log('   Status: Computation completed successfully');
        console.log('   Encrypted balances updated on-chain');
        
        // Update trade status in database
        await updateTradeSettlementByTx(tx.signature, 'settled');
      }
    }

    // Look for health check failure logs
    // Format: "HEALTH_LIQUIDATABLE:<margin_pubkey>"
    for (const log of logs) {
      if (log.includes('HEALTH_LIQUIDATABLE:')) {
        try {
          const marginPkStr = log.split(':')[1]?.trim();
          if (!marginPkStr) continue;

          const marginPk = new PublicKey(marginPkStr);
          
          console.log('⚠️  Liquidatable account detected:', marginPk.toBase58());
          
          // Trigger liquidation
          await triggerLiquidation(marginPk);
          
        } catch (error) {
          console.error('Error processing liquidation log:', error);
        }
      }
    }
  }
}
