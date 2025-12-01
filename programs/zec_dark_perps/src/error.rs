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

    // Bridge errors
    #[msg("Insufficient validator signatures (need 2 of 3)")]
    InsufficientSignatures,

    #[msg("Unauthorized validator")]
    UnauthorizedValidator,

    #[msg("Deposit already processed")]
    DepositAlreadyProcessed,

    #[msg("Invalid Zcash transaction ID")]
    InvalidZcashTxid,

    // Arcium errors
    #[msg("Arcium cluster not set")]
    ClusterNotSet,
}
