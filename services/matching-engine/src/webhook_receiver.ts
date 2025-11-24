/**
 * Helius Webhook Receiver
 * 
 * Handles webhooks from Helius for:
 * - Health check failures (triggers liquidation)
 * - Trade settlements (for analytics)
 */

import { PublicKey } from '@solana/web3.js';
import { triggerLiquidation } from './liquidation';

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

    // You can add more event handlers here
    // For example, listening for TradeExecuted events for analytics
  }
}
