/**
 * Database service for persistent storage
 * Uses Supabase PostgreSQL with privacy-preserving encryption
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';
import {
  hashUserPubkey,
  getSizeBucket,
  getPriceLevel,
  encryptOrderDetails,
  decryptOrderDetails,
  encryptTradeDetails,
  decryptTradeDetails,
  encryptPositionDetails,
  decryptPositionDetails,
  type OrderDetails,
  type TradeDetails,
  type PositionDetails,
} from './crypto';

// Supabase configuration
const DATABASE_URL = process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.warn('⚠️  Database not configured. Database features will be disabled.');
}

// Extract Supabase URL from connection string
// postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
const SUPABASE_URL = DATABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Create Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========== TYPES ==========

export interface DBOrder {
  id: string;
  user_hash: string;
  side: 'long' | 'short';
  size_bucket: string;
  price_level: number;
  encrypted_details: string;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  created_at: string;
  updated_at: string;
  filled_size: number;
}

export interface DBTrade {
  id: string;
  buyer_hash: string;
  seller_hash: string;
  buyer_order_id: string;
  seller_order_id: string;
  price: number;
  size_bucket: string;
  encrypted_details: string;
  settlement_tx: string | null;
  settlement_status: 'pending' | 'queued' | 'settled' | 'failed';
  created_at: string;
  settled_at: string | null;
}

export interface DBPosition {
  id: string;
  user_hash: string;
  side: 'long' | 'short';
  encrypted_details: string;
  status: 'open' | 'closed' | 'liquidated';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

// Frontend-compatible order format
export interface UserOrder {
  id: string;
  userPubkey: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  ts: number;
}

// Frontend-compatible trade format
export interface UserTrade {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  timestamp: number;
  status: 'pending' | 'queued' | 'settled' | 'failed';
}

// Frontend-compatible position format
export interface UserPosition {
  id: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  leverage: number;
  currentPnL: number;
  status: 'open' | 'closed' | 'liquidated';
  timestamp: number;
}

// ========== ORDERS ==========

/**
 * Save order to database
 */
export async function saveOrder(
  userPubkey: string,
  side: 'long' | 'short',
  size: number,
  price: number,
  orderId: string
): Promise<DBOrder | null> {
  try {
    const userHash = hashUserPubkey(userPubkey);
    const sizeBucket = getSizeBucket(size);
    const priceLevel = getPriceLevel(price);
    
    const encryptedDetails = encryptOrderDetails({
      userPubkey,
      exactSize: size,
      exactPrice: price,
    });

    const { data, error } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_hash: userHash,
        side,
        size_bucket: sizeBucket,
        price_level: priceLevel,
        encrypted_details: encryptedDetails,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving order:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to save order:', error);
    return null;
  }
}

/**
 * Get user's orders (all statuses)
 * Returns decrypted orders in frontend-compatible format
 */
export async function getUserOrders(userPubkey: string): Promise<UserOrder[]> {
  try {
    const userHash = hashUserPubkey(userPubkey);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_hash', userHash)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }

    // Decrypt details and format for frontend
    return data.map((order): UserOrder => {
      const details = decryptOrderDetails(order.encrypted_details);
      return {
        id: order.id,
        userPubkey: details.userPubkey,
        side: order.side,
        size: details.exactSize,
        price: details.exactPrice,
        status: order.status,
        ts: new Date(order.created_at).getTime(),
      };
    });
  } catch (error) {
    console.error('Failed to fetch user orders:', error);
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'open' | 'filled' | 'cancelled' | 'partial',
  filledSize?: number
): Promise<boolean> {
  try {
    const updateData: any = { status };
    if (filledSize !== undefined) {
      updateData.filled_size = filledSize;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update order status:', error);
    return false;
  }
}

/**
 * Get all open orders (for orderbook restoration)
 */
export async function getOpenOrders(): Promise<Array<DBOrder & { details: OrderDetails }>> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching open orders:', error);
      return [];
    }

    // Decrypt all orders
    return data.map(order => ({
      ...order,
      details: decryptOrderDetails(order.encrypted_details),
    }));
  } catch (error) {
    console.error('Failed to fetch open orders:', error);
    return [];
  }
}

// ========== TRADES ==========

/**
 * Save trade to database
 */
export async function saveTrade(
  buyerPubkey: string,
  sellerPubkey: string,
  buyerOrderId: string,
  sellerOrderId: string,
  price: number,
  size: number,
  tradeId: string
): Promise<DBTrade | null> {
  try {
    const buyerHash = hashUserPubkey(buyerPubkey);
    const sellerHash = hashUserPubkey(sellerPubkey);
    const sizeBucket = getSizeBucket(size);

    const encryptedDetails = encryptTradeDetails({
      buyerPubkey,
      sellerPubkey,
      exactSize: size,
    });

    const { data, error } = await supabase
      .from('trades')
      .insert({
        id: tradeId,
        buyer_hash: buyerHash,
        seller_hash: sellerHash,
        buyer_order_id: buyerOrderId,
        seller_order_id: sellerOrderId,
        price,
        size_bucket: sizeBucket,
        encrypted_details: encryptedDetails,
        settlement_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving trade:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to save trade:', error);
    return null;
  }
}

/**
 * Update trade settlement status
 */
export async function updateTradeSettlement(
  tradeId: string,
  status: 'pending' | 'queued' | 'settled' | 'failed',
  settlementTx?: string
): Promise<boolean> {
  try {
    const updateData: any = { settlement_status: status };
    if (settlementTx) {
      updateData.settlement_tx = settlementTx;
    }
    if (status === 'settled') {
      updateData.settled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', tradeId);

    if (error) {
      console.error('Error updating trade settlement:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update trade settlement:', error);
    return false;
  }
}

/**
 * Update trade settlement status by settlement transaction signature
 */
export async function updateTradeSettlementByTx(
  settlementTx: string,
  status: 'settled' | 'failed'
): Promise<boolean> {
  try {
    const updateData: any = { settlement_status: status };
    if (status === 'settled') {
      updateData.settled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('settlement_tx', settlementTx);

    if (error) {
      console.error('Error updating trade settlement by tx:', error);
      return false;
    }

    console.log(`✅ Updated trade with tx ${settlementTx} to status: ${status}`);
    return true;
  } catch (error) {
    console.error('Failed to update trade settlement by tx:', error);
    return false;
  }
}

/**
 * Get user's trades
 * Returns decrypted trades in frontend-compatible format
 */
export async function getUserTrades(userPubkey: string): Promise<UserTrade[]> {
  try {
    const userHash = hashUserPubkey(userPubkey);

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .or(`buyer_hash.eq.${userHash},seller_hash.eq.${userHash}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user trades:', error);
      return [];
    }

    // Decrypt details and format for frontend
    return data.map((trade): UserTrade => {
      const details = decryptTradeDetails(trade.encrypted_details);
      const isBuyer = trade.buyer_hash === userHash;
      
      return {
        id: trade.id,
        side: isBuyer ? 'buy' : 'sell',
        price: trade.price,
        size: details.exactSize,
        timestamp: new Date(trade.created_at).getTime(),
        status: trade.settlement_status,
      };
    });
  } catch (error) {
    console.error('Failed to fetch user trades:', error);
    return [];
  }
}

// ========== POSITIONS ==========

/**
 * Create or update position
 */
export async function upsertPosition(
  userPubkey: string,
  side: 'long' | 'short',
  size: number,
  entryPrice: number,
  leverage: number,
  currentPnL: number
): Promise<DBPosition | null> {
  try {
    const userHash = hashUserPubkey(userPubkey);

    const encryptedDetails = encryptPositionDetails({
      userPubkey,
      size,
      entryPrice,
      leverage,
      currentPnL,
    });

    // Check if position exists
    const { data: existing } = await supabase
      .from('positions')
      .select('*')
      .eq('user_hash', userHash)
      .eq('side', side)
      .eq('status', 'open')
      .single();

    if (existing) {
      // Update existing position
      const { data, error } = await supabase
        .from('positions')
        .update({
          encrypted_details: encryptedDetails,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating position:', error);
        return null;
      }

      return data;
    } else {
      // Create new position
      const { data, error } = await supabase
        .from('positions')
        .insert({
          user_hash: userHash,
          side,
          encrypted_details: encryptedDetails,
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating position:', error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('Failed to upsert position:', error);
    return null;
  }
}

/**
 * Get user's positions
 * Returns decrypted positions in frontend-compatible format
 */
export async function getUserPositions(userPubkey: string): Promise<UserPosition[]> {
  try {
    const userHash = hashUserPubkey(userPubkey);

    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_hash', userHash)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }

    // Decrypt details and format for frontend
    return data.map((position): UserPosition => {
      const details = decryptPositionDetails(position.encrypted_details);
      
      return {
        id: position.id,
        side: position.side,
        size: details.size,
        entryPrice: details.entryPrice,
        leverage: details.leverage,
        currentPnL: details.currentPnL,
        status: position.status,
        timestamp: new Date(position.created_at).getTime(),
      };
    });
  } catch (error) {
    console.error('Failed to fetch user positions:', error);
    return [];
  }
}

// ========== METRICS ==========

/**
 * Get latest platform metrics
 */
export async function getMetrics() {
  try {
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching metrics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return null;
  }
}

/**
 * Check if database is connected
 */
export async function isDatabaseConnected(): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return false;
  }

  try {
    const { error } = await supabase.from('metrics').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
