/**
 * Margin and risk management engine
 * Implements Hyperliquid-style margin checks
 */

import { calculateNotional, calculateUnrealizedPnL } from './pricing';

// MVP: In-memory margin balances (in production, this would be from on-chain margin accounts)
const marginBalances = new Map<string, number>();

// Risk parameters
const DEFAULT_LEVERAGE = 10;
const MAINTENANCE_MARGIN_FRACTION = 0.05; // 5% (half of initial at 10x leverage)

/**
 * Get or initialize margin balance for a user
 * MVP: Returns mock balance, in production would fetch from on-chain margin account
 */
export function getMarginBalance(userPubkey: string): number {
  if (!marginBalances.has(userPubkey)) {
    // MVP: Give users a default balance for testing
    marginBalances.set(userPubkey, 1000); // $1000 default
  }
  return marginBalances.get(userPubkey)!;
}

/**
 * Set margin balance (for testing)
 */
export function setMarginBalance(userPubkey: string, balance: number): void {
  marginBalances.set(userPubkey, balance);
}

/**
 * Calculate account equity
 * Formula: margin_balance + sum(unrealized_pnl_all_positions)
 */
export async function calculateAccountEquity(
  userPubkey: string,
  positions: Array<{ side: 'long' | 'short'; size: number; entryPrice: number }>
): Promise<number> {
  const marginBalance = getMarginBalance(userPubkey);
  
  let totalUnrealizedPnL = 0;
  for (const pos of positions) {
    const unrealizedPnL = calculateUnrealizedPnL(
      pos.side,
      pos.entryPrice,
      pos.size,
      'SOL-PERP'
    );
    totalUnrealizedPnL += unrealizedPnL;
  }
  
  return marginBalance + totalUnrealizedPnL;
}

/**
 * Calculate total notional value of all positions
 */
export function calculateTotalNotional(
  positions: Array<{ size: number }>
): number {
  let total = 0;
  for (const pos of positions) {
    total += calculateNotional(pos.size, 'SOL-PERP');
  }
  return total;
}

/**
 * Calculate required initial margin for a new order
 * Formula: order_notional / leverage
 */
export function calculateRequiredInitialMargin(
  orderSize: number,
  orderPrice: number,
  leverage: number = DEFAULT_LEVERAGE
): number {
  const orderNotional = orderSize * orderPrice;
  return orderNotional / leverage;
}

/**
 * Check if user has enough margin to place an order
 * This is the critical check before accepting any order
 */
export async function checkInitialMargin(
  userPubkey: string,
  orderSize: number,
  orderPrice: number,
  currentPositions: Array<{ side: 'long' | 'short'; size: number; entryPrice: number }>,
  leverage: number = DEFAULT_LEVERAGE
): Promise<{ allowed: boolean; reason?: string; equity?: number; required?: number }> {
  // Calculate current account equity
  const equity = await calculateAccountEquity(userPubkey, currentPositions);
  
  // Calculate current total notional
  const currentNotional = calculateTotalNotional(currentPositions);
  
  // Calculate new order notional
  const newOrderNotional = orderSize * orderPrice;
  
  // Calculate total notional after this order
  const totalNotional = currentNotional + newOrderNotional;
  
  // Calculate required initial margin
  const requiredMargin = totalNotional / leverage;
  
  // Check if equity is sufficient
  if (equity < requiredMargin) {
    return {
      allowed: false,
      reason: `Insufficient margin. Required: $${requiredMargin.toFixed(2)}, Available: $${equity.toFixed(2)}`,
      equity,
      required: requiredMargin,
    };
  }
  
  return {
    allowed: true,
    equity,
    required: requiredMargin,
  };
}

/**
 * Check if account should be liquidated
 * Formula: equity < maintenance_margin_required
 */
export async function checkLiquidation(
  userPubkey: string,
  positions: Array<{ side: 'long' | 'short'; size: number; entryPrice: number }>
): Promise<{ shouldLiquidate: boolean; equity?: number; maintenanceRequired?: number }> {
  if (positions.length === 0) {
    return { shouldLiquidate: false };
  }
  
  const equity = await calculateAccountEquity(userPubkey, positions);
  const totalNotional = calculateTotalNotional(positions);
  const maintenanceRequired = totalNotional * MAINTENANCE_MARGIN_FRACTION;
  
  if (equity < maintenanceRequired) {
    return {
      shouldLiquidate: true,
      equity,
      maintenanceRequired,
    };
  }
  
  return {
    shouldLiquidate: false,
    equity,
    maintenanceRequired,
  };
}

/**
 * Get account summary for display
 */
export async function getAccountSummary(
  userPubkey: string,
  positions: Array<{ side: 'long' | 'short'; size: number; entryPrice: number }>
): Promise<{
  marginBalance: number;
  equity: number;
  totalNotional: number;
  leverage: number;
  marginUsed: number;
  marginAvailable: number;
}> {
  const marginBalance = getMarginBalance(userPubkey);
  const equity = await calculateAccountEquity(userPubkey, positions);
  const totalNotional = calculateTotalNotional(positions);
  const marginUsed = totalNotional / DEFAULT_LEVERAGE;
  const marginAvailable = equity - marginUsed;
  const actualLeverage = totalNotional > 0 ? totalNotional / equity : 0;
  
  return {
    marginBalance,
    equity,
    totalNotional,
    leverage: actualLeverage,
    marginUsed,
    marginAvailable,
  };
}
