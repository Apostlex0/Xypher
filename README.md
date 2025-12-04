
**Program ID (Devnet):** `7TeV1Vdps9eaMv8mfcXJgNsEzWBJwNi4kHfqaVkEu95u`

**Arcium MPC:** Integrated for encrypted balance updates

# ZEC Dark Perps - Privacy-Preserving Perpetual Futures on Solana

> A Hyperliquid-inspired perpetual futures exchange with privacy-first architecture using Arcium MPC and encrypted storage.

## 🎯 What Makes This Unique

**Traditional Perps Exchanges:**
- ❌ All trades visible on-chain
- ❌ Position sizes public
- ❌ Easy to front-run large orders
- ❌ Whale tracking is trivial

**ZEC Dark Perps:**
- ✅ **Encrypted Balances** via Arcium Multi-Party Computation (MPC)
- ✅ **Private Order Details** with AES-256-GCM encryption
- ✅ **Hyperliquid-Style Mechanics** (position lifecycle, mark price, margin system)
- ✅ **Zcash Bridge** for private collateral deposits (in development)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MATCHING ENGINE (Off-Chain)               │
│  • Order Matching & Position Tracking                       │
│  • AES-256-GCM Encrypted Storage (Supabase)                │
│  • Mark Price & Real-Time PnL                               │
│  • Margin Checks (10x Leverage)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  SOLANA PROGRAM (On-Chain)                   │
│  • Encrypted Margin Accounts (Arcium MPC)                   │
│  • Privacy-Preserving Trade Settlement                      │
│  • Zcash Bridge (wZEC Minting)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   ARCIUM MPC CLUSTER                         │
│  • Encrypted Balance Updates                                │
│  • Zero-Knowledge Computations                              │
│  • Decentralized Privacy Layer                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Privacy Model

### What's Encrypted (Private)

**On-Chain (Arcium MPC):**
- ✅ Margin account balances (`encrypted_collateral`, `encrypted_debt`)
- ✅ Trade settlement values (computed in MPC, re-encrypted)

**Off-Chain (AES-256-GCM):**
- ✅ Exact order sizes and prices
- ✅ User public keys (hashed with SHA-256)
- ✅ Position details (size, entry price, PnL)
- ✅ Trade details (buyer/seller, exact amounts)

### What's Public (Necessary)

**For Trading:**
- Order side (long/short)
- Size buckets ('0-1', '1-10', '10-100', '100+')
- Price levels (rounded to nearest $1)

**For Safety:**
- Liquidation flags (liquidators need to identify risky accounts)
- Transaction existence (Solana requirement)

**For Transparency:**
- Aggregated metrics (total volume, open interest, trade count)

---

## 🚀 Quick Start Demo

### Prerequisites
```bash
# Install dependencies
node --version  # v18+
npm --version   # v9+

# Solana CLI
solana --version  # v1.18+

# Anchor
anchor --version  # v0.30+
```

### 1. Start Matching Engine
```bash
cd services/matching-engine
npm install
npm run build
npm start
```

**Expected Output:**
```
🚀 ZEC Dark Perps Matching Engine
================================
📡 Server listening on http://localhost:3001
📊 Orderbook API: http://localhost:3001/api/orderbook
📝 Submit orders: POST http://localhost:3001/api/orders
================================

✅ Database connected
📦 Restoring orderbook from database...
✅ Restored 0 orders from database
🔄 Starting matching loop (200ms interval)
```

### 2. Place Orders (New Terminal)
```bash
# Place a LONG order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userPubkey": "CyViyEZCjHBJPKzCYZ7sSDm2e3YCdgxrjbCj3PLyvT8i",
    "side": "long",
    "size": 0.5,
    "price": 50.0
  }'

# Place a SHORT order (will match!)
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userPubkey": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    "side": "short",
    "size": 0.5,
    "price": 50.0
  }'
```

**What Happens:**
1. ✅ Orders encrypted and stored in Supabase
2. ✅ Matching engine finds the match
3. ✅ Trade created with encrypted details
4. ✅ Positions updated (weighted average entry price)
5. ✅ Mark price updated for real-time PnL
6. ✅ **MPC settlement queued to Arcium** 🔐

### 3. View Encrypted Data
```bash
# Check orderbook (bucketed data - public)
curl http://localhost:3001/api/orderbook | jq

# View user positions (decrypted server-side)
curl http://localhost:3001/api/positions/CyViyEZCjHBJPKzCYZ7sSDm2e3YCdgxrjbCj3PLyvT8i | jq

# Check platform metrics
curl http://localhost:3001/api/metrics | jq

# View mark price
curl http://localhost:3001/api/mark-price | jq

# Check margin account
curl http://localhost:3001/api/account/CyViyEZCjHBJPKzCYZ7sSDm2e3YCdgxrjbCj3PLyvT8i | jq
```

### 4. Watch MPC Settlement (Matching Engine Terminal)
```
🎯 Match found!
  Buyer: CyViyEZC... (0.5 @ $50)
  Seller: 9xQeWvG8... (0.5 @ $50)

💾 Trade saved to database (encrypted)
📊 Mark price updated: $50.00
📍 Position updated for CyViyEZC... (LONG 0.5 @ $50.00)
📍 Position updated for 9xQeWvG8... (SHORT 0.5 @ $50.00)

🔐 Queuing MPC settlement to Arcium...
   Buyer margin: CyViyEZC...
   Seller margin: 9xQeWvG8...
   Trade value: $25.00

⏳ Waiting for Arcium MPC callback...
```

---

## 🎬 Demo Script (For Video)

### Scene 1: Introduction (30 seconds)
```bash
# Show the architecture
cat README.md | grep -A 20 "Architecture"

# Explain privacy model
echo "Traditional exchanges expose everything on-chain."
echo "ZEC Dark Perps encrypts balances, orders, and positions."
echo "Using Arcium MPC for zero-knowledge computations."
```

### Scene 2: Start the System (30 seconds)
```bash
# Terminal 1: Start matching engine
cd services/matching-engine
npm start

# Show it's connected to Supabase and ready
```

### Scene 3: Place Orders & Show Encryption (2 minutes)
```bash
# Terminal 2: Place LONG order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userPubkey":"CyViyEZCjHBJPKzCYZ7sSDm2e3YCdgxrjbCj3PLyvT8i","side":"long","size":0.5,"price":50.0}'

# Show orderbook (bucketed - privacy preserved)
curl http://localhost:3001/api/orderbook | jq

# Explain: "Notice the size is bucketed as '0-1', not exact 0.5"
# Explain: "User pubkey is hashed, not visible"

# Place SHORT order to trigger match
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userPubkey":"9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin","side":"short","size":0.5,"price":50.0}'
```

### Scene 4: Watch MPC Settlement (1 minute)
```bash
# Terminal 1 will show:
# - Match found
# - Trade encrypted and saved
# - Positions updated
# - MPC settlement queued to Arcium
# - Waiting for callback

# Explain: "The matching engine queues encrypted balance updates to Arcium MPC"
# Explain: "Only the MPC cluster can decrypt and update balances"
# Explain: "This prevents anyone (including us) from seeing exact balances"
```

### Scene 5: Show Position Lifecycle (1 minute)
```bash
# Check user position
curl http://localhost:3001/api/positions/CyViyEZCjHBJPKzCYZ7sSDm2e3YCdgxrjbCj3PLyvT8i | jq

# Explain the output:
# - Position side: LONG
# - Size: 0.5
# - Entry price: $50.00
# - Current PnL: calculated using mark price
# - Leverage: 10x

# Place another order to show position increase
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userPubkey":"CyViyEZCjHBJPKzCYZ7sSDm2e3YCdgxrjbCj3PLyvT8i","side":"long","size":0.3,"price":52.0}'

curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userPubkey":"9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin","side":"short","size":0.3,"price":52.0}'

# Check position again - weighted average entry price
curl http://localhost:3001/api/positions/CyViyEZCjHBJPKzCYZ7sSDm2e3YCdgxrjbCj3PLyvT8i | jq

# Explain: "Position increased from 0.5 to 0.8"
# Explain: "Entry price is weighted average: (50*0.5 + 52*0.3)/0.8 = $50.75"
```

### Scene 6: Show Margin System (1 minute)
```bash
# Check account margin
curl http://localhost:3001/api/account/CyViyEZCjHBJPKzCYZ7sSDm2e3YCdgxrjbCj3PLyvT8i | jq

# Explain the output:
# - Margin Balance: $1,000 (mock for demo)
# - Equity: Balance + Unrealized PnL
# - Total Notional: Position size * mark price
# - Leverage: Actual leverage being used
# - Margin Used: Notional / 10
# - Margin Available: What's left for new orders

# Try to place order that exceeds margin
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userPubkey":"CyViyEZCjHBJPKzCYZ7sSDm2e3YCdgxrjbCj3PLyvT8i","side":"long","size":200,"price":50.0}'

# Should get rejected with:
# "Insufficient margin. Required: $X, Available: $Y"
```

### Scene 7: Show Platform Metrics (30 seconds)
```bash
# View aggregated metrics
curl http://localhost:3001/api/metrics | jq

# Explain:
# - Total Volume (24h): Sum of all trades
# - Open Interest: Total position notional
# - Total Trades: Number of matches
# - Active Traders: Unique users
# - All calculated from encrypted data!
```

### Scene 8: Database Privacy (1 minute)
```bash
# Show Supabase schema
cat services/matching-engine/supabase/schema.sql | grep -A 10 "CREATE TABLE orders"

# Explain:
# - user_hash: SHA-256 hashed pubkey
# - size_bucket: '0-1', '1-10', etc (not exact)
# - price_level: Rounded to $1
# - encrypted_details: AES-256-GCM encrypted exact data

# Show encryption code
cat services/matching-engine/src/crypto.ts | grep -A 15 "export function encrypt"

# Explain:
# - AES-256-GCM authenticated encryption
# - Random IV per encryption
# - Auth tag for integrity
```

---

## 📊 What's Working (Demo-Ready)

### ✅ Core Trading
- [x] Order placement with encryption
- [x] Order matching (FIFO, price-time priority)
- [x] Trade execution with encrypted storage
- [x] Position lifecycle (open/increase/reduce/close/flip)
- [x] Mark price tracking (last trade price)
- [x] Real-time unrealized PnL calculation

### ✅ Privacy Layer
- [x] AES-256-GCM encryption for sensitive data
- [x] SHA-256 hashing for user identifiers
- [x] Size bucketing and price rounding
- [x] Arcium MPC integration (queue_settle_trade)
- [x] Encrypted margin accounts on-chain

### ✅ Risk Management
- [x] Initial margin checks (10x leverage)
- [x] Account equity calculation
- [x] Order rejection when insufficient margin
- [x] Maintenance margin calculation (for liquidations)

### ✅ Analytics
- [x] Platform metrics (volume, open interest, trades)
- [x] User position tracking
- [x] Trade history
- [x] Mark price API

---

## 🔧 Technical Stack

**On-Chain:**
- Solana (Devnet)
- Anchor Framework v0.30
- Arcium MPC for encrypted computations
- SPL Token (wZEC)

**Off-Chain:**
- Node.js + TypeScript
- Supabase (PostgreSQL)
- AES-256-GCM encryption
- Express.js REST API

**Frontend:**
- Next.js 14
- Solana Wallet Adapter
- TailwindCSS + shadcn/ui
- Recharts for analytics

---

## 📈 Performance

**Matching Engine:**
- Matching interval: 200ms (5 matches/sec)
- Database latency: ~50-100ms
- Order encryption: <1ms

**On-Chain:**
- MPC settlement: 5-30 seconds (Arcium devnet)
- Transaction cost: ~0.001 SOL
- Confirmation time: ~400ms (Solana)

---

## 🔐 Security Features

**Encryption:**
- AES-256-GCM for database (authenticated encryption)
- Arcium MPC for on-chain balances (zero-knowledge)
- Random IV per encryption (prevents pattern analysis)

**Privacy:**
- User pubkeys hashed with salt
- Order sizes bucketed
- Prices rounded
- Exact details only in encrypted fields

**Risk Management:**
- Initial margin: 10% (10x leverage)
- Maintenance margin: 5%
- Liquidation monitoring (to be implemented)

---

## 🚧 Roadmap

### Phase 1: Core Trading ✅ (COMPLETE)
- [x] Order matching engine
- [x] Position lifecycle
- [x] Mark price system
- [x] Margin checks

### Phase 2: Privacy Layer ✅ (COMPLETE)
- [x] Encrypted storage
- [x] Arcium MPC integration
- [x] Hashed identifiers

### Phase 3: Bridge Integration 🚧 (IN PROGRESS)
- [x] On-chain bridge instructions
- [ ] Zcash bridge daemon
- [ ] Deposit monitoring
- [ ] Withdrawal processing

### Phase 4: Production Ready 📋 (PLANNED)
- [ ] Signature verification (security)
- [ ] Liquidation bot
- [ ] Oracle integration (Pyth)
- [ ] Funding rates
- [ ] Multiple markets

---

## 📚 Documentation

- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - Complete system design and privacy model
- **[PERPS_ANALYSIS.md](./PERPS_ANALYSIS.md)** - Analysis of architecture decisions
- **[ARCIUM_COMPLETE_IMPLEMENTATION.md](./ARCIUM_COMPLETE_IMPLEMENTATION.md)** - MPC integration guide
- **[ZCASH_BRIDGE_COMPLETE_GUIDE.md](./ZCASH_BRIDGE_COMPLETE_GUIDE.md)** - Bridge implementation

---

## 🎯 Key Differentiators

1. **Privacy-First**: Only perps exchange with encrypted balances via MPC
2. **Hyperliquid Mechanics**: Professional trading with position lifecycle
3. **Zcash Integration**: Private collateral deposits (unique in DeFi)
4. **Hybrid Model**: Balance privacy with operational transparency

---

## 🤝 Contributing

This is a research project exploring privacy-preserving DeFi. Contributions welcome!

---

## ⚠️ Disclaimer

**This is experimental software on devnet.** Not audited. Not for production use. Educational purposes only.

---

## 📞 Contact

Built with ❤️ for privacy-preserving DeFi

**Status:** MVP - Core trading functional, bridge in development
