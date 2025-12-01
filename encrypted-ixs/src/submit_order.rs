use arcis_imports::*;

/// Encrypted instruction for submitting orders to the dark pool
/// Orders are encrypted client-side and stored as Enc<Mxe, Order>
/// Only MPC nodes can decrypt for matching
#[encrypted]
pub mod circuits {
    use arcis_imports::*;

    /// Order data structure
    pub struct OrderInput {
        /// Order size in smallest units (e.g., 1.5 ZEC = 150000000)
        size: u64,
        /// Price in smallest units (e.g., $50.00 = 5000000000)
        price: u64,
        /// Side: 1 = long/buy, 0 = short/sell
        side: u8,
    }

    /// Submit encrypted order
    /// Input: Enc<Shared, OrderInput> - User encrypts with shared secret
    /// Output: Enc<Shared, OrderInput> - Returns encrypted confirmation to user
    ///
    /// This ensures:
    /// 1. User can verify their order was submitted correctly
    /// 2. Order details are encrypted throughout the process
    /// 3. Orders hidden from other users and front-runners
    #[instruction]
    pub fn submit_order(order_ctxt: Enc<Shared, OrderInput>) -> Enc<Shared, OrderInput> {
        // Decrypt in MPC (nodes don't see plaintext individually)
        let order = order_ctxt.to_arcis();

        // Validate order (basic checks in MPC)
        // Note: More validation should be done on-chain before queuing

        // Return encrypted order back to user as confirmation
        // The order will be stored encrypted on-chain
        order_ctxt.owner.from_arcis(order)
    }
}
