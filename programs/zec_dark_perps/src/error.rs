use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Insufficient collateral for withdrawal")]
    InsufficientCollateral,

    #[msg("Arcium computation was aborted")]
    AbortedComputation,

    #[msg("Unauthorized liquidation attempt")]
    UnauthorizedLiquidation,

    #[msg("Position is healthy, cannot liquidate")]
    HealthyPosition,
}
