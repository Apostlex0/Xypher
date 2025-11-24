import express from 'express';
import { randomUUID } from 'crypto';
import { orderbook, Side, Order } from './orderbook';
import { startMatchingLoop } from './matcher';
import { startHealthCheckerLoop } from './health_checker';
import { handleHeliusWebhook } from './webhook_receiver';
import { PORT } from './config';

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
app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    timestamp: Date.now(),
    service: 'matching-engine'
  });
});

/**
 * Submit order endpoint
 * Frontend calls this to add orders to the orderbook
 */
app.post('/api/orders', (req, res) => {
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

    // Create order
    const order: Order = {
      id: randomUUID(),
      userPubkey,
      side,
      size,
      price,
      ts: Date.now(),
    };

    // Add to orderbook
    orderbook.add(order);

    console.log('📝 New order added:', {
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
app.listen(PORT, () => {
  console.log('\n🚀 ZEC Dark Perps Matching Engine');
  console.log('================================');
  console.log(`📡 Server listening on http://localhost:${PORT}`);
  console.log(`📊 Orderbook API: http://localhost:${PORT}/api/orderbook`);
  console.log(`📝 Submit orders: POST http://localhost:${PORT}/api/orders`);
  console.log('================================\n');

  // Start matching loop
  startMatchingLoop();

  // Start health checker (placeholder for now)
  startHealthCheckerLoop();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down matching engine...');
  process.exit(0);
});
