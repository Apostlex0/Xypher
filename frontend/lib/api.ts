/**
 * API Client for Matching Engine
 * Handles all communication with the matching engine service
 */

const MATCHING_ENGINE_URL = process.env.NEXT_PUBLIC_MATCHING_ENGINE_URL || 'http://localhost:3001';

export interface Order {
  id: string;
  userPubkey: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  ts: number;
}

export interface OrderbookLevel {
  price: number;
  size: number;
  orders: number;
}

export interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: number;
}

export interface SubmitOrderResponse {
  ok: boolean;
  orderId: string;
  message: string;
}

export interface UserOrdersResponse {
  ok: boolean;
  orders: Order[];
  count: number;
}

/**
 * Submit a new order to the matching engine
 */
export async function submitOrder(
  userPubkey: string,
  side: 'long' | 'short',
  size: number,
  price: number
): Promise<SubmitOrderResponse> {
  const response = await fetch(`${MATCHING_ENGINE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userPubkey,
      side,
      size,
      price,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit order');
  }

  return response.json();
}

/**
 * Get current orderbook snapshot
 */
export async function getOrderbook(): Promise<Orderbook> {
  const response = await fetch(`${MATCHING_ENGINE_URL}/api/orderbook`);

  if (!response.ok) {
    throw new Error('Failed to fetch orderbook');
  }

  return response.json();
}

/**
 * Get user's pending orders
 */
export async function getUserOrders(userPubkey: string): Promise<UserOrdersResponse> {
  const response = await fetch(`${MATCHING_ENGINE_URL}/api/orders/${userPubkey}`);

  if (!response.ok) {
    throw new Error('Failed to fetch user orders');
  }

  return response.json();
}

export interface Trade {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  timestamp: number;
  status: 'pending' | 'queued' | 'settled' | 'failed';
}

export interface UserTradesResponse {
  ok: boolean;
  trades: Trade[];
  count: number;
}

/**
 * Get user's trade history
 */
export async function getUserTrades(userPubkey: string): Promise<UserTradesResponse> {
  const response = await fetch(`${MATCHING_ENGINE_URL}/api/trades/${userPubkey}`);

  if (!response.ok) {
    throw new Error('Failed to fetch user trades');
  }

  return response.json();
}

export interface Position {
  id: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  leverage: number;
  currentPnL: number;
  status: 'open' | 'closed' | 'liquidated';
  timestamp: number;
}

export interface UserPositionsResponse {
  ok: boolean;
  positions: Position[];
  count: number;
}

/**
 * Get user's open positions
 */
export async function getUserPositions(userPubkey: string): Promise<UserPositionsResponse> {
  const response = await fetch(`${MATCHING_ENGINE_URL}/api/positions/${userPubkey}`);

  if (!response.ok) {
    throw new Error('Failed to fetch user positions');
  }

  return response.json();
}

/**
 * Health check for matching engine
 */
export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${MATCHING_ENGINE_URL}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

/**
 * Get platform analytics/metrics
 */
export interface PlatformMetrics {
  totalVolume24h: number;
  openInterest: number;
  totalTrades: number;
  activeTradersCount: number;
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  try {
    // Fetch from matching engine metrics endpoint (will implement server-side)
    const response = await fetch(`${MATCHING_ENGINE_URL}/api/metrics`);
    if (response.ok) {
      return response.json();
    }
    
    // Fallback: calculate from orderbook
    const orderbook = await getOrderbook();
    const totalOrders = orderbook.bids.length + orderbook.asks.length;
    const totalVolume = [...orderbook.bids, ...orderbook.asks].reduce((sum, order) => sum + (order.price * order.size), 0);
    
    return {
      totalVolume24h: totalVolume,
      openInterest: totalVolume * 0.3,
      totalTrades: totalOrders * 10,
      activeTradersCount: totalOrders,
    };
  } catch (error) {
    console.error('Failed to fetch platform metrics:', error);
    return {
      totalVolume24h: 0,
      openInterest: 0,
      totalTrades: 0,
      activeTradersCount: 0,
    };
  }
}
