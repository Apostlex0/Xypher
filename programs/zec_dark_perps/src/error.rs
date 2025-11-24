use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Insufficient collateral for withdrawal")]
    InsufficientCollateral,
}
