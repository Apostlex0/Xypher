/**
 * Pricing engine for mark price and PnL calculations
 * MVP: Uses last trade price as mark price
 * Future: Integrate with Pyth/Switchboard oracles
 */

interface MarkPrice {
  symbol: string;
  price: number;
  lastUpdated: number;
}

// In-memory mark price storage (MVP)
const markPrices = new Map<string, MarkPrice>();

// Default symbol for MVP
const DEFAULT_SYMBOL = 'SOL-PERP';

/**
 * Update mark price when a trade executes
 */
export function updateMarkPrice(symbol: string, price: number): void {
  markPrices.set(symbol, {
    symbol,
    price,
    lastUpdated: Date.now(),
  });
}

/**
 * Get current mark price for a symbol
 */
export function getMarkPrice(symbol: string = DEFAULT_SYMBOL): number {
  const mark = markPrices.get(symbol);
  if (!mark) {
    // Return a default price if no trades yet (for testing)
    return 50.0;
  }
  return mark.price;
}

/**
 * Calculate unrealized PnL for a position
 * Formula: side * (mark_price - entry_price) * size
 * side: +1 for long, -1 for short
 */
export function calculateUnrealizedPnL(
  side: 'long' | 'short',
  entryPrice: number,
  size: number,
  symbol: string = DEFAULT_SYMBOL
): number {
  const markPrice = getMarkPrice(symbol);
  const sideMultiplier = side === 'long' ? 1 : -1;
  return sideMultiplier * (markPrice - entryPrice) * size;
}

/**
 * Calculate position notional value
 * Used for margin calculations
 */
export function calculateNotional(
  size: number,
  symbol: string = DEFAULT_SYMBOL
): number {
  const markPrice = getMarkPrice(symbol);
  return Math.abs(size) * markPrice;
}

/**
 * Get all mark prices (for API)
 */
export function getAllMarkPrices(): MarkPrice[] {
  return Array.from(markPrices.values());
}
