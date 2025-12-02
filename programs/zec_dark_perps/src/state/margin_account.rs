use anchor_lang::prelude::*;

/// PDA that tracks a user's margin information.
///
/// Address: seeds = [b"margin", owner_pubkey], bump stored in `bump`.
///
/// **PRIVACY:** All balance fields are encrypted using Arcium MPC.
/// Only the MPC cluster can decrypt and perform operations on balances.
/// Users can decrypt their own balances using viewing keys (to be implemented).
#[account]
pub struct MarginAccount {
    /// The wallet that owns this margin account.
    pub owner: Pubkey,

    /// Encrypted collateral balance (ciphertext)
    /// Updated via Arcium MPC computations
    pub encrypted_collateral: [u8; 32],

    /// Encrypted debt balance (ciphertext)
    /// Updated via Arcium MPC computations
    pub encrypted_debt: [u8; 32],

    /// Nonce for encryption/decryption
    /// Used by MPC to decrypt and re-encrypt balances
    pub nonce: u128,

    /// Flag indicating if this account is liquidatable (set by Arcium health check callback).
    /// This can remain public as it's a boolean flag set by MPC
    pub is_liquidatable: bool,

    /// PDA bump seed.
    pub bump: u8,
}

impl MarginAccount {
    pub const SEED_PREFIX: &'static [u8] = b"margin";

    /// Space calculation for account
    /// discriminator(8) + owner(32) + encrypted_collateral(32) + encrypted_debt(32)
    /// + nonce(16) + is_liquidatable(1) + bump(1) = 122 bytes
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 16 + 1 + 1;
}
