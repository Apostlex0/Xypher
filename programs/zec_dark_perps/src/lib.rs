use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("GX2qLDQRuA8LCkHYQaQxkno1VWz442ZyKcA31w27yLAo"); // replace real program ID when deployed

#[program]
pub mod zec_dark_perps {
    use super::*;

    pub fn initialize_margin_account(
        ctx: Context<InitializeMarginAccount>,
    ) -> Result<()> {
        instructions::margin::initialize_margin_account(ctx)
    }

    pub fn deposit_collateral(
        ctx: Context<DepositCollateral>,
        amount: u64,
    ) -> Result<()> {
        instructions::margin::deposit_collateral(ctx, amount)
    }

    pub fn withdraw_collateral(
        ctx: Context<WithdrawCollateral>,
        amount: u64,
    ) -> Result<()> {
        instructions::margin::withdraw_collateral(ctx, amount)
    }
}
