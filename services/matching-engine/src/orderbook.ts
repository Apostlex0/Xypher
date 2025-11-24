/**
 * In-memory orderbook for dark pool trading
 * Orders are kept private until matched
 */

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
   */
  add(order: Order): void {
    if (order.side === 'long') {
      this.bids.push(order);
      // Sort bids: highest price first, then by time priority
      this.bids.sort((a, b) => b.price - a.price || a.ts - b.ts);
    } else {
      this.asks.push(order);
      // Sort asks: lowest price first, then by time priority
      this.asks.sort((a, b) => a.price - b.price || a.ts - b.ts);
    }
  }

  /**
   * Attempt to match one order
   * Returns a match if bid price >= ask price
   */
  matchOne(): Match | null {
    if (this.bids.length === 0 || this.asks.length === 0) {
      return null;
    }

    const bestBid = this.bids[0];
    const bestAsk = this.asks[0];

    // Check if orders cross
    if (bestBid.price < bestAsk.price) {
      return null; // No match possible
    }

    // Calculate execution price (midpoint)
    const executionPrice = (bestBid.price + bestAsk.price) / 2;
    
    // Calculate execution size (minimum of both orders)
    const executionSize = Math.min(bestBid.size, bestAsk.size);

    // Update order sizes
    bestBid.size -= executionSize;
    bestAsk.size -= executionSize;

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
