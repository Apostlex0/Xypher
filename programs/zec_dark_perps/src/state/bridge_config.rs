use anchor_lang::prelude::*;

/// Bridge configuration storing validators and processed deposits
///
/// Address: seeds = [b"bridge_config"], bump stored in `bump`
#[account]
pub struct BridgeConfig {
    /// Authority that can update validators
    pub authority: Pubkey,
    
    /// Three validator public keys for 2-of-3 multisig
    pub validator1: Pubkey,
    pub validator2: Pubkey,
    pub validator3: Pubkey,
    
    /// wZEC mint address
    pub wzec_mint: Pubkey,
    
    /// Number of processed deposits (for tracking)
    pub deposit_count: u64,
    
    /// PDA bump seed
    pub bump: u8,
}

impl BridgeConfig {
    pub const SEED_PREFIX: &'static [u8] = b"bridge_config";
    
    /// Check if a pubkey is one of the authorized validators
    pub fn is_validator(&self, pubkey: &Pubkey) -> bool {
        pubkey == &self.validator1 || pubkey == &self.validator2 || pubkey == &self.validator3
    }
}

/// Tracks individual processed deposits to prevent double-minting
///
/// Address: seeds = [b"deposit", zcash_txid_bytes], bump stored in `bump`
#[account]
pub struct ProcessedDeposit {
    /// Zcash transaction ID (32 bytes)
    pub zcash_txid: [u8; 32],
    
    /// Recipient who received the minted wZEC
    pub recipient: Pubkey,
    
    /// Amount minted
    pub amount: u64,
    
    /// Timestamp when processed
    pub timestamp: i64,
    
    /// PDA bump seed
    pub bump: u8,
}

impl ProcessedDeposit {
    pub const SEED_PREFIX: &'static [u8] = b"deposit";
}
