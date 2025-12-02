use anchor_lang::prelude::*;

/// Simple account to store the bump for the sign PDA
/// Used by Arcium computations for signing
#[account]
#[derive(Default)]
pub struct SignerAccount {
    pub bump: u8,
}
