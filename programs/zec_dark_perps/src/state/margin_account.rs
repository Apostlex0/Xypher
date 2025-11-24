use anchor_lang::prelude::*;

/// PDA that tracks a user's margin information.
///
/// Address: seeds = [b"margin", owner_pubkey], bump stored in `bump`.
#[account]
pub struct MarginAccount {
    /// The wallet that owns this margin account.
    pub owner: Pubkey,

    /// Total wZEC collateral (in smallest units, e.g. 10^-8).
    pub collateral: u64,

    /// Total debt (we’ll use this when lending/borrowing is wired).
    pub debt: u64,

    /// Flag indicating if this account is liquidatable (set by Arcium health check callback).
    pub is_liquidatable: bool,

    /// PDA bump seed.
    pub bump: u8,
}

impl MarginAccount {
    pub const SEED_PREFIX: &'static [u8] = b"margin";
}
