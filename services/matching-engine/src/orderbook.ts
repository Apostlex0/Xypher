/**
 * In-memory orderbook for dark pool trading
 * Orders are kept private until matched
 * Now with database persistence!
 */

import { saveOrder, updateOrderStatus, getOpenOrders } from './database';

export type Side = 'long' | 'short';

export interface Order {
  id: string;
  userPubkey: string;
  side: Side;
  size: number;   // Size in ZEC units (e.g., 1.5 ZEC)
  price: number;  // Price in USD (e.g., 50.00)
  ts: number;     // Timestamp
}

export interface Match {
  buy: Order;
  sell: Order;
  price: number;  // Execution price
  size: number;   // Execution size
}

export class Orderbook {
  bids: Order[] = []; // Long orders (buyers)
  asks: Order[] = []; // Short orders (sellers)

  /**
   * Add an order to the orderbook
   * Now persists to database!
   */
  async add(order: Order): Promise<void> {
    if (order.side === 'long') {
      this.bids.push(order);
      // Sort bids: highest price first, then by time priority
      this.bids.sort((a, b) => b.price - a.price || a.ts - b.ts);
    } else {
      this.asks.push(order);
      // Sort asks: lowest price first, then by time priority
      this.asks.sort((a, b) => a.price - b.price || a.ts - b.ts);
    }

    // Persist to database
    await saveOrder(order.userPubkey, order.side, order.size, order.price, order.id);
  }

  /**
   * Attempt to match one order
   * Returns a match if bid price >= ask price
   * Updates order status in database
   */
  async matchOne(): Promise<Match | null> {
    if (this.bids.length === 0 || this.asks.length === 0) {
      return null;
    }

    const bestBid = this.bids[0];
    const bestAsk = this.asks[0];

    // Skip orders with zero size
    if (bestBid.size <= 0 || bestAsk.size <= 0) {
      // Remove zero-size orders
      if (bestBid.size <= 0) this.bids.shift();
      if (bestAsk.size <= 0) this.asks.shift();
      return null;
    }

    // Check if orders cross
    if (bestBid.price < bestAsk.price) {
      return null; // No match possible
    }

    // Calculate execution price (midpoint)
    const executionPrice = (bestBid.price + bestAsk.price) / 2;
    
    // Calculate execution size (minimum of both orders)
    const executionSize = Math.min(bestBid.size, bestAsk.size);
    
    // Skip if execution size is zero
    if (executionSize <= 0) {
      return null;
    }

    // Update order sizes
    bestBid.size -= executionSize;
    bestAsk.size -= executionSize;

    // Update order statuses in database
    const bidStatus = bestBid.size <= 0 ? 'filled' : 'partial';
    const askStatus = bestAsk.size <= 0 ? 'filled' : 'partial';
    
    await updateOrderStatus(bestBid.id, bidStatus, executionSize);
    await updateOrderStatus(bestAsk.id, askStatus, executionSize);

    // Remove fully filled orders
    if (bestBid.size <= 0) {
      this.bids.shift();
    }
    if (bestAsk.size <= 0) {
      this.asks.shift();
    }

    return {
      buy: bestBid,
      sell: bestAsk,
      price: executionPrice,
      size: executionSize,
    };
  }

  /**
   * Get orderbook snapshot (for debugging)
   */
  getSnapshot() {
    return {
      bids: this.bids.map(o => ({ 
        price: o.price, 
        size: o.size, 
        count: 1 
      })),
      asks: this.asks.map(o => ({ 
        price: o.price, 
        size: o.size, 
        count: 1 
      })),
    };
  }
}

// Singleton orderbook instance
export const orderbook = new Orderbook();

/**
 * Restore orderbook from database on startup
 */
export async function restoreOrderbook(): Promise<void> {
  console.log('📦 Restoring orderbook from database...');
  
  try {
    const openOrders = await getOpenOrders();
    
    for (const dbOrder of openOrders) {
      const order: Order = {
        id: dbOrder.id,
        userPubkey: dbOrder.details.userPubkey,
        side: dbOrder.side,
        size: dbOrder.details.exactSize - dbOrder.filled_size,
        price: dbOrder.details.exactPrice,
        ts: new Date(dbOrder.created_at).getTime(),
      };
      
      // Add to in-memory orderbook (without saving again)
      if (order.side === 'long') {
        orderbook.bids.push(order);
      } else {
        orderbook.asks.push(order);
      }
    }
    
    // Sort orders
    orderbook.bids.sort((a, b) => b.price - a.price || a.ts - b.ts);
    orderbook.asks.sort((a, b) => a.price - b.price || a.ts - b.ts);
    
    console.log(`✅ Restored ${openOrders.length} orders from database`);
    console.log(`   Bids: ${orderbook.bids.length}, Asks: ${orderbook.asks.length}`);
  } catch (error) {
    console.error('❌ Failed to restore orderbook:', error);
  }
}
