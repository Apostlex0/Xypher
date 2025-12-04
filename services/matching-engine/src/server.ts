import express from 'express';
import { randomUUID } from 'crypto';
import { orderbook, type Order, type Side, restoreOrderbook } from './orderbook';
import { startMatchingLoop } from './matcher';
import { handleHeliusWebhook } from './webhook_receiver';
import { getUserOrders, getUserTrades, getUserPositions, isDatabaseConnected } from './database';
import { PORT } from './config';
import 'dotenv/config';

const app = express();

// Middleware
app.use(express.json());

// CORS for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', async (_req, res) => {
  const dbConnected = await isDatabaseConnected();
  res.json({ 
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

/**
 * Submit order endpoint
 * Frontend calls this to add orders to the orderbook
 */
app.post('/api/orders', async (req, res) => {
  try {
    const { userPubkey, side, size, price } = req.body as {
      userPubkey: string;
      side: Side;
      size: number;
      price: number;
    };

    // Validate input
    if (!userPubkey || !side || !size || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields: userPubkey, side, size, price' 
      });
    }

    // Validate Solana public key
    try {
      const { PublicKey } = await import('@solana/web3.js');
      new PublicKey(userPubkey);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid Solana public key format' 
      });
    }

    if (side !== 'long' && side !== 'short') {
      return res.status(400).json({ 
        error: 'Invalid side. Must be "long" or "short"' 
      });
    }

    if (size <= 0 || price <= 0) {
      return res.status(400).json({ 
        error: 'Size and price must be positive numbers' 
      });
    }

    // Check margin requirements before accepting order
    try {
      const { getUserPositions } = await import('./database');
      const { checkInitialMargin } = await import('./margin');
      const { decryptPositionDetails } = await import('./crypto');
      const { supabase } = await import('./database');
      const { hashUserPubkey } = await import('./crypto');
      
      // Get user's current positions
      const userHash = hashUserPubkey(userPubkey);
      const { data: positionsData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_hash', userHash)
        .eq('status', 'open');
      
      const positions = (positionsData || []).map(p => {
        const details = decryptPositionDetails(p.encrypted_details);
        return {
          side: p.side as 'long' | 'short',
          size: details.size,
          entryPrice: details.entryPrice,
        };
      });
      
      // Check if user has enough margin
      const marginCheck = await checkInitialMargin(userPubkey, size, price, positions);
      
      if (!marginCheck.allowed) {
        return res.status(400).json({
          error: 'Insufficient margin',
          details: marginCheck.reason,
          equity: marginCheck.equity,
          required: marginCheck.required,
        });
      }
      
      console.log(`✅ Margin check passed for ${userPubkey.slice(0, 8)}... (Equity: $${marginCheck.equity?.toFixed(2)})`);
    } catch (marginError) {
      console.error('Error checking margin:', marginError);
      // For MVP, continue even if margin check fails (can be made strict later)
    }

    // Create order
    const order: Order = {
      id: randomUUID(),
      userPubkey,
      side,
      size,
      price,
      ts: Date.now(),
    };

    // Add to orderbook (now async with database persistence)
    await orderbook.add(order);

    console.log(' New order added:', {
      id: order.id,
      user: userPubkey.slice(0, 8) + '...',
      side,
      size,
      price,
    });

    res.json({ 
      ok: true, 
      orderId: order.id,
      message: 'Order added to orderbook'
    });

  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get orderbook snapshot (for debugging)
 */
app.get('/api/orderbook', (_req, res) => {
  try {
    const snapshot = orderbook.getSnapshot();
    res.json({
      ok: true,
      bids: snapshot.bids,
      asks: snapshot.asks,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching orderbook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user's pending orders (from memory + database)
 */
app.get('/api/orders/:userPubkey', async (req, res) => {
  try {
    const { userPubkey } = req.params;
    
    if (!userPubkey) {
      return res.status(400).json({ error: 'Missing userPubkey parameter' });
    }

    // Get from database (includes filled/cancelled)
    const dbOrders = await getUserOrders(userPubkey);

    res.json({
      ok: true,
      orders: dbOrders,
      count: dbOrders.length,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user's trades
 */
app.get('/api/trades/:userPubkey', async (req, res) => {
  try {
    const { userPubkey } = req.params;
    
    if (!userPubkey) {
      return res.status(400).json({ error: 'Missing userPubkey parameter' });
    }

    const trades = await getUserTrades(userPubkey);

    res.json({
      ok: true,
      trades,
      count: trades.length,
    });
  } catch (error) {
    console.error('Error fetching user trades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user's positions
 */
app.get('/api/positions/:userPubkey', async (req, res) => {
  try {
    const { userPubkey } = req.params;
    
    if (!userPubkey) {
      return res.status(400).json({ error: 'Missing userPubkey parameter' });
    }

    const positions = await getUserPositions(userPubkey);

    res.json({
      ok: true,
      positions,
      count: positions.length,
    });
  } catch (error) {
    console.error('Error fetching user positions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get account margin summary
 */
app.get('/api/account/:userPubkey', async (req, res) => {
  try {
    const { userPubkey } = req.params;
    const { getAccountSummary } = await import('./margin');
    const { supabase } = await import('./database');
    const { hashUserPubkey, decryptPositionDetails } = await import('./crypto');
    
    // Get user's positions
    const userHash = hashUserPubkey(userPubkey);
    const { data: positionsData } = await supabase
      .from('positions')
      .select('*')
      .eq('user_hash', userHash)
      .eq('status', 'open');
    
    const positions = (positionsData || []).map(p => {
      const details = decryptPositionDetails(p.encrypted_details);
      return {
        side: p.side as 'long' | 'short',
        size: details.size,
        entryPrice: details.entryPrice,
      };
    });
    
    const summary = await getAccountSummary(userPubkey, positions);
    
    res.json({
      ok: true,
      account: summary,
    });
  } catch (error) {
    console.error('Error fetching account summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get current mark price
 */
app.get('/api/mark-price', async (_req, res) => {
  try {
    const { getMarkPrice, getAllMarkPrices } = await import('./pricing');
    const symbol = (_req.query.symbol as string) || 'SOL-PERP';
    
    if (symbol === 'all') {
      res.json({ prices: getAllMarkPrices() });
    } else {
      res.json({ 
        symbol,
        price: getMarkPrice(symbol),
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error fetching mark price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get platform metrics
 */
app.get('/api/metrics', async (_req, res) => {
  try {
    const { supabase } = await import('./database');
    const { decryptTradeDetails, decryptPositionDetails } = await import('./crypto');
    const { calculateNotional } = await import('./pricing');
    
    // Get total trades count
    const { count: tradesCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true });
    
    // Get trades from last 24h with encrypted details
    const { data: trades } = await supabase
      .from('trades')
      .select('price, encrypted_details')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    // Get unique users count
    const { data: orders } = await supabase
      .from('orders')
      .select('user_hash');
    
    const uniqueUsers = new Set(orders?.map(o => o.user_hash) || []).size;
    
    // Calculate actual volume by decrypting trade sizes
    let totalVolume = 0;
    for (const trade of trades || []) {
      try {
        const details = decryptTradeDetails(trade.encrypted_details);
        totalVolume += trade.price * details.exactSize;
      } catch (err) {
        // If decryption fails, skip this trade
        console.warn('Failed to decrypt trade for metrics:', err);
      }
    }
    
    // Get open positions for open interest calculation using mark price
    const { data: positions } = await supabase
      .from('positions')
      .select('side, encrypted_details')
      .eq('status', 'open');
    
    let openInterest = 0;
    for (const position of positions || []) {
      try {
        const details = decryptPositionDetails(position.encrypted_details);
        // Use mark price for notional calculation
        const notional = calculateNotional(details.size, 'SOL-PERP');
        openInterest += notional;
      } catch (err) {
        console.warn('Failed to decrypt position for metrics:', err);
      }
    }
    
    res.json({
      totalVolume24h: totalVolume,
      openInterest: openInterest,
      totalTrades: tradesCount || 0,
      activeTradersCount: uniqueUsers,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.json({
      totalVolume24h: 0,
      openInterest: 0,
      totalTrades: 0,
      activeTradersCount: 0,
    });
  }
});

/**
 * Webhook receiver for Helius
 * Helius will POST here when transactions occur
 */
app.post('/webhooks/helius', async (req, res) => {
  try {
    // Handle webhook asynchronously (don't block response)
    void handleHeliusWebhook(req.body);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Start server
 */
app.listen(PORT, async () => {
  console.log('\n🚀 ZEC Dark Perps Matching Engine');
  console.log('================================');
  console.log(`📡 Server listening on http://localhost:${PORT}`);
  console.log(`📊 Orderbook API: http://localhost:${PORT}/api/orderbook`);
  console.log(`📝 Submit orders: POST http://localhost:${PORT}/api/orders`);
  console.log('================================\n');

  // Check database connection
  const dbConnected = await isDatabaseConnected();
  if (dbConnected) {
    console.log('✅ Database connected');
    
    // Restore orderbook from database
    await restoreOrderbook();
  } else {
    console.log('⚠️  Database not connected - running in memory-only mode');
  }

  // Start matching loop
  startMatchingLoop();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down matching engine...');
  process.exit(0);
});
