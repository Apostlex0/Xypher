use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("6SAEE3DKSYxj8rqMgzP2pkWWgivkN5cfkDtcNRFyhv5");

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

    // Trading instructions
    pub fn settle_trade(
        ctx: Context<SettleTrade>,
        price: u64,
        size: u64,
    ) -> Result<()> {
        instructions::trading::settle_trade(ctx, price, size)
    }

    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        instructions::liquidation::liquidate(ctx)
    }

    // Arcium MPC health check instructions
    pub fn init_health_check_comp_def(
        ctx: Context<InitHealthCheckCompDef>,
    ) -> Result<()> {
        instructions::arcium::init_health_check_comp_def(ctx)
    }

    pub fn queue_health_check(
        ctx: Context<QueueHealthCheck>,
        computation_offset: u64,
        ciphertext_collateral: [u8; 32],
        ciphertext_debt: [u8; 32],
        ciphertext_price: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        instructions::arcium::queue_health_check(
            ctx,
            computation_offset,
            ciphertext_collateral,
            ciphertext_debt,
            ciphertext_price,
            pub_key,
            nonce,
        )
    }

    pub fn health_check_callback(
        ctx: Context<HealthCheckCallback>,
        encrypted_result: [u8; 32],
        nonce: [u8; 16],
    ) -> Result<()> {
        instructions::arcium::health_check_callback(ctx, encrypted_result, nonce)
    }
}
