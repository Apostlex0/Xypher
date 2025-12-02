-- ZEC Dark Perps Database Schema
-- Hybrid privacy approach: hashed user IDs + encrypted details

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_hash TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  size_bucket TEXT NOT NULL,  -- '0-1', '1-10', '10-100', '100+'
  price_level DECIMAL(10, 2) NOT NULL,
  encrypted_details TEXT NOT NULL,  -- Contains: {userPubkey, exactSize, exactPrice}
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled', 'partial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  filled_size DECIMAL(18, 8) DEFAULT 0  -- Track partial fills
);

CREATE INDEX idx_orders_user_hash ON orders(user_hash);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_user_status ON orders(user_hash, status);

-- Trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_hash TEXT NOT NULL,
  seller_hash TEXT NOT NULL,
  buyer_order_id UUID NOT NULL REFERENCES orders(id),
  seller_order_id UUID NOT NULL REFERENCES orders(id),
  price DECIMAL(10, 2) NOT NULL,
  size_bucket TEXT NOT NULL,
  encrypted_details TEXT NOT NULL,  -- Contains: {buyerPubkey, sellerPubkey, exactSize}
  settlement_tx TEXT,  -- Solana transaction signature
  settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'queued', 'settled', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX idx_trades_buyer_hash ON trades(buyer_hash);
CREATE INDEX idx_trades_seller_hash ON trades(seller_hash);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX idx_trades_settlement_status ON trades(settlement_status);

-- Positions table
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_hash TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  encrypted_details TEXT NOT NULL,  -- Contains: {userPubkey, size, entryPrice, leverage, currentPnL}
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_positions_user_hash ON positions(user_hash);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_user_status ON positions(user_hash, status);

-- Aggregate metrics table (public data)
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  total_volume_24h DECIMAL(18, 2) DEFAULT 0,
  open_interest DECIMAL(18, 2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  active_orders INTEGER DEFAULT 0,
  unique_traders INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_timestamp ON metrics(timestamp DESC);

-- Function to update metrics
CREATE OR REPLACE FUNCTION update_metrics()
RETURNS void AS $$
BEGIN
  INSERT INTO metrics (
    total_volume_24h,
    open_interest,
    total_trades,
    active_orders,
    unique_traders
  )
  SELECT
    COALESCE(SUM(price * CAST(SUBSTRING(size_bucket FROM '[0-9]+') AS DECIMAL)), 0) as total_volume_24h,
    COALESCE(SUM(price * CAST(SUBSTRING(size_bucket FROM '[0-9]+') AS DECIMAL)), 0) * 0.3 as open_interest,
    COUNT(*) as total_trades,
    (SELECT COUNT(*) FROM orders WHERE status = 'open') as active_orders,
    (SELECT COUNT(DISTINCT buyer_hash) + COUNT(DISTINCT seller_hash) FROM trades WHERE created_at > NOW() - INTERVAL '24 hours') as unique_traders
  FROM trades
  WHERE created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial metrics row
INSERT INTO metrics (total_volume_24h, open_interest, total_trades, active_orders, unique_traders)
VALUES (0, 0, 0, 0, 0);
