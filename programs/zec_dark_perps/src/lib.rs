use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("7TeV1Vdps9eaMv8mfcXJgNsEzWBJwNi4kHfqaVkEu95u");

#[arcium_program]
pub mod zec_dark_perps {
    use super::*;

    pub fn initialize_margin_account(ctx: Context<InitializeMarginAccount>) -> Result<()> {
        instructions::margin::initialize_margin_account(ctx)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        instructions::margin::deposit_collateral(ctx, amount)
    }

    pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>, amount: u64) -> Result<()> {
        instructions::margin::withdraw_collateral(ctx, amount)
    }

    // Trading instructions
    pub fn settle_trade(ctx: Context<SettleTrade>, price: u64, size: u64) -> Result<()> {
        instructions::trading::settle_trade(ctx, price, size)
    }

    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        instructions::liquidation::liquidate(ctx)
    }

    // Arcium MPC health check instructions
    pub fn init_health_check_comp_def(ctx: Context<InitHealthCheckCompDef>) -> Result<()> {
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

    // Bridge instructions
    pub fn initialize_bridge(
        ctx: Context<InitializeBridge>,
        validator1: Pubkey,
        validator2: Pubkey,
        validator3: Pubkey,
    ) -> Result<()> {
        instructions::bridge::initialize_bridge(ctx, validator1, validator2, validator3)
    }

    pub fn mint_wrapped(
        ctx: Context<MintWrapped>,
        amount: u64,
        zcash_txid: [u8; 32],
    ) -> Result<()> {
        instructions::bridge::mint_wrapped(ctx, amount, zcash_txid)
    }

    pub fn request_withdrawal(
        ctx: Context<RequestWithdrawal>,
        amount: u64,
        zcash_address: String,
    ) -> Result<()> {
        instructions::bridge::request_withdrawal(ctx, amount, zcash_address)
    }

    // Arcium encrypted order submission
    pub fn init_submit_order_comp_def(ctx: Context<InitSubmitOrderCompDef>) -> Result<()> {
        instructions::trading_arcium::init_submit_order_comp_def(ctx)
    }

    pub fn submit_order(
        ctx: Context<SubmitOrder>,
        computation_offset: u64,
        ciphertext_size: [u8; 32],
        ciphertext_price: [u8; 32],
        ciphertext_side: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        instructions::trading_arcium::submit_order(
            ctx,
            computation_offset,
            ciphertext_size,
            ciphertext_price,
            ciphertext_side,
            pub_key,
            nonce,
        )
    }

    pub fn submit_order_callback(
        ctx: Context<SubmitOrderCallback>,
        output: ComputationOutputs<SubmitOrderOutput>,
    ) -> Result<()> {
        instructions::trading_arcium::submit_order_callback(ctx, output)
    }

    // Margin Arcium MPC instructions
    pub fn init_deposit_comp_def(ctx: Context<InitDepositCompDef>) -> Result<()> {
        instructions::margin_arcium::init_deposit_comp_def(ctx)
    }

    pub fn queue_deposit(
        ctx: Context<QueueDeposit>,
        computation_offset: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::margin_arcium::queue_deposit(ctx, computation_offset, amount)
    }

    pub fn deposit_collateral_callback(
        ctx: Context<DepositCollateralCallback>,
        output: ComputationOutputs<DepositCollateralOutput>,
    ) -> Result<()> {
        instructions::margin_arcium::deposit_collateral_callback(ctx, output)
    }

    pub fn init_withdraw_comp_def(ctx: Context<InitWithdrawCompDef>) -> Result<()> {
        instructions::margin_arcium::init_withdraw_comp_def(ctx)
    }

    pub fn queue_withdraw(
        ctx: Context<QueueWithdraw>,
        computation_offset: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::margin_arcium::queue_withdraw(ctx, computation_offset, amount)
    }

    pub fn withdraw_collateral_callback(
        ctx: Context<WithdrawCollateralCallback>,
        output: ComputationOutputs<WithdrawCollateralOutput>,
    ) -> Result<()> {
        instructions::margin_arcium::withdraw_collateral_callback(ctx, output)
    }

    pub fn init_settle_comp_def(ctx: Context<InitSettleCompDef>) -> Result<()> {
        instructions::margin_arcium::init_settle_comp_def(ctx)
    }

    pub fn queue_settle_trade(
        ctx: Context<QueueSettleTrade>,
        computation_offset: u64,
        trade_value: u64,
    ) -> Result<()> {
        instructions::margin_arcium::queue_settle_trade(ctx, computation_offset, trade_value)
    }

    pub fn settle_trade_callback(
        ctx: Context<SettleTradeCallback>,
        output: ComputationOutputs<SettleTradeOutput>,
    ) -> Result<()> {
        instructions::margin_arcium::settle_trade_callback(ctx, output)
    }
}
