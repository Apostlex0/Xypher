use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::{CircuitSource, OffChainCircuitSource};

use crate::state::margin_account::MarginAccount;
use crate::state::SignerAccount;
use crate::ID;
use crate::ID as ID_CONST;

// Computation definition offsets for encrypted instructions
const COMP_DEF_OFFSET_DEPOSIT: u32 = comp_def_offset("deposit_collateral");
const COMP_DEF_OFFSET_WITHDRAW: u32 = comp_def_offset("withdraw_collateral");
const COMP_DEF_OFFSET_SETTLE: u32 = comp_def_offset("settle_trade");

// Helper function expected by arcium_callback macro
fn validate_callback_ixs(_account_info: &AccountInfo, _pubkey: &Pubkey) -> Result<()> {
    Ok(())
}

// ========== DEPOSIT COLLATERAL ==========

/// Initialize computation definition for deposit
pub fn init_deposit_comp_def(ctx: Context<InitDepositCompDef>) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: "https://ffzjucisiaierxyonwlx.supabase.co/storage/v1/object/public/arcium-circuits/deposit_collateral.arcis".to_string(),
            hash: [0; 32],
        })),
        None,
    )?;
    msg!("Deposit computation definition initialized with circuit");
    Ok(())
}

/// Queue deposit computation to MPC
/// This updates the encrypted collateral balance
pub fn queue_deposit(
    ctx: Context<QueueDeposit>,
    computation_offset: u64,
    amount: u64,
) -> Result<()> {
    let margin_account = &ctx.accounts.margin_account;

    // For Enc<Mxe, DepositInput>, we need to pass:
    // 1. Nonce (PlaintextU128)
    // 2. Then encrypted struct fields: current_collateral, deposit_amount
    let args = vec![
        Argument::PlaintextU128(margin_account.nonce),
        Argument::EncryptedU64(margin_account.encrypted_collateral),
        Argument::PlaintextU64(amount),
    ];

    // Set bump
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Queue computation
    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![DepositCollateralCallback::callback_ix(&[])],
        1,
    )?;

    msg!("Deposit queued to MPC cluster");
    Ok(())
}

/// Callback after deposit computation
/// Emits event with encrypted balance result
#[arcium_callback(encrypted_ix = "deposit_collateral")]
pub fn deposit_collateral_callback(
    ctx: Context<DepositCollateralCallback>,
    output: ComputationOutputs<DepositCollateralOutput>,
) -> Result<()> {
    let result = match output {
        ComputationOutputs::Success(DepositCollateralOutput { field_0 }) => field_0,
        _ => return Err(crate::error::ErrorCode::AbortedComputation.into()),
    };

    // Extract encrypted results from MPC computation
    let new_balance_ciphertext = result.ciphertexts[0];
    let success_flag = result.ciphertexts[1];

    // Emit event with encrypted results
    // Account updates happen in a separate instruction
    emit!(DepositEvent {
        nonce: result.nonce.to_le_bytes(),
        new_balance: new_balance_ciphertext,
        success: success_flag[0],
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Deposit computation completed");
    Ok(())
}

// ========== WITHDRAW COLLATERAL ==========

/// Initialize computation definition for withdraw
pub fn init_withdraw_comp_def(ctx: Context<InitWithdrawCompDef>) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: "https://ffzjucisiaierxyonwlx.supabase.co/storage/v1/object/public/arcium-circuits/withdraw_collateral.arcis".to_string(),
            hash: [0; 32],
        })),
        None,
    )?;
    msg!("Withdraw computation definition initialized with circuit");
    Ok(())
}

/// Queue withdraw computation to MPC
pub fn queue_withdraw(
    ctx: Context<QueueWithdraw>,
    computation_offset: u64,
    amount: u64,
) -> Result<()> {
    let margin_account = &ctx.accounts.margin_account;

    // For Enc<Mxe, WithdrawInput>, we need to pass:
    // 1. Nonce (PlaintextU128)
    // 2. Then encrypted struct fields: current_collateral, withdraw_amount
    let args = vec![
        Argument::PlaintextU128(margin_account.nonce),
        Argument::EncryptedU64(margin_account.encrypted_collateral),
        Argument::PlaintextU64(amount),
    ];

    // Set bump
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Queue computation
    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![WithdrawCollateralCallback::callback_ix(&[])],
        1,
    )?;

    msg!("Withdraw queued to MPC cluster");
    Ok(())
}

/// Callback after withdraw computation
/// Emits event with encrypted balance result
#[arcium_callback(encrypted_ix = "withdraw_collateral")]
pub fn withdraw_collateral_callback(
    ctx: Context<WithdrawCollateralCallback>,
    output: ComputationOutputs<WithdrawCollateralOutput>,
) -> Result<()> {
    let result = match output {
        ComputationOutputs::Success(WithdrawCollateralOutput { field_0 }) => field_0,
        _ => return Err(crate::error::ErrorCode::AbortedComputation.into()),
    };

    // Extract encrypted results from MPC computation
    let new_balance_ciphertext = result.ciphertexts[0];
    let success_flag = result.ciphertexts[1];

    // Emit event with encrypted results
    // Account updates happen in a separate instruction
    emit!(WithdrawEvent {
        nonce: result.nonce.to_le_bytes(),
        new_balance: new_balance_ciphertext,
        success: success_flag[0],
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Withdraw computation completed");
    Ok(())
}

// ========== ACCOUNT STRUCTS ==========

/// Initialize deposit computation definition
#[init_computation_definition_accounts("deposit_collateral", payer)]
#[derive(Accounts)]
pub struct InitDepositCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,

    #[account(mut)]
    /// CHECK: Computation definition account, checked by Arcium program
    pub comp_def_account: UncheckedAccount<'info>,

    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

/// Queue deposit computation
#[queue_computation_accounts("deposit_collateral", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct QueueDeposit<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    #[account(mut, address = derive_mempool_pda!())]
    /// CHECK: mempool_account, checked by arcium program
    pub mempool_account: UncheckedAccount<'info>,

    #[account(mut, address = derive_execpool_pda!())]
    /// CHECK: executing_pool, checked by arcium program
    pub executing_pool: UncheckedAccount<'info>,

    #[account(mut, address = derive_comp_pda!(computation_offset))]
    /// CHECK: computation_account, checked by arcium program
    pub computation_account: UncheckedAccount<'info>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_DEPOSIT))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, crate::error::ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,

    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Account<'info, FeePool>,

    #[account(address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Account<'info, ClockAccount>,

    /// Margin account being updated
    #[account(
        mut,
        seeds = [MarginAccount::SEED_PREFIX, margin_account.owner.as_ref()],
        bump = margin_account.bump
    )]
    pub margin_account: Account<'info, MarginAccount>,

    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

/// Deposit callback
#[callback_accounts("deposit_collateral")]
#[derive(Accounts)]
pub struct DepositCollateralCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_DEPOSIT))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

/// Initialize withdraw computation definition
#[init_computation_definition_accounts("withdraw_collateral", payer)]
#[derive(Accounts)]
pub struct InitWithdrawCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,

    #[account(mut)]
    /// CHECK: Computation definition account, checked by Arcium program
    pub comp_def_account: UncheckedAccount<'info>,

    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

/// Queue withdraw computation
#[queue_computation_accounts("withdraw_collateral", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct QueueWithdraw<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    #[account(mut, address = derive_mempool_pda!())]
    /// CHECK: mempool_account, checked by arcium program
    pub mempool_account: UncheckedAccount<'info>,

    #[account(mut, address = derive_execpool_pda!())]
    /// CHECK: executing_pool, checked by arcium program
    pub executing_pool: UncheckedAccount<'info>,

    #[account(mut, address = derive_comp_pda!(computation_offset))]
    /// CHECK: computation_account, checked by arcium program
    pub computation_account: UncheckedAccount<'info>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_WITHDRAW))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, crate::error::ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,

    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Account<'info, FeePool>,

    #[account(address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Account<'info, ClockAccount>,

    /// Margin account being updated
    #[account(
        mut,
        seeds = [MarginAccount::SEED_PREFIX, margin_account.owner.as_ref()],
        bump = margin_account.bump
    )]
    pub margin_account: Account<'info, MarginAccount>,

    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

/// Withdraw callback
#[callback_accounts("withdraw_collateral")]
#[derive(Accounts)]
pub struct WithdrawCollateralCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_WITHDRAW))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

// ========== EVENTS ==========

#[event]
pub struct DepositEvent {
    pub nonce: [u8; 16],
    pub new_balance: [u8; 32],
    pub success: u8,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub nonce: [u8; 16],
    pub new_balance: [u8; 32],
    pub success: u8,
    pub timestamp: i64,
}

// ========== SETTLE TRADE ==========

/// Initialize computation definition for settle_trade
pub fn init_settle_comp_def(ctx: Context<InitSettleCompDef>) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: "https://ffzjucisiaierxyonwlx.supabase.co/storage/v1/object/public/arcium-circuits/settle_trade.arcis".to_string(),
            hash: [0; 32],
        })),
        None,
    )?;
    msg!("Settle trade computation definition initialized with circuit");
    Ok(())
}

/// Queue settle trade computation to MPC
/// Updates both buyer and seller encrypted balances atomically
pub fn queue_settle_trade(
    ctx: Context<QueueSettleTrade>,
    computation_offset: u64,
    trade_value: u64,
) -> Result<()> {
    let buyer = &ctx.accounts.buyer_margin;
    let seller = &ctx.accounts.seller_margin;

    // For Enc<Mxe, TradeSettlement>, we need to pass:
    // 1. Nonce (PlaintextU128) - shared nonce for the encrypted context
    // 2. Then the encrypted struct fields in order:
    //    - buyer_collateral (EncryptedU64)
    //    - seller_collateral (EncryptedU64)
    //    - trade_value (PlaintextU64)

    // Use buyer's nonce (both should have same nonce for MXE encryption)
    let args = vec![
        Argument::PlaintextU128(buyer.nonce),
        Argument::EncryptedU64(buyer.encrypted_collateral),
        Argument::EncryptedU64(seller.encrypted_collateral),
        Argument::PlaintextU64(trade_value),
    ];

    // Set bump
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Queue computation
    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![SettleTradeCallback::callback_ix(&[])],
        1,
    )?;

    msg!("Trade settlement queued to MPC cluster");
    Ok(())
}

/// Callback after settle trade computation
/// Emits event with encrypted balance results for both parties
#[arcium_callback(encrypted_ix = "settle_trade")]
pub fn settle_trade_callback(
    ctx: Context<SettleTradeCallback>,
    output: ComputationOutputs<SettleTradeOutput>,
) -> Result<()> {
    let result = match output {
        ComputationOutputs::Success(SettleTradeOutput { field_0 }) => field_0,
        _ => return Err(crate::error::ErrorCode::AbortedComputation.into()),
    };

    // Extract encrypted results from MPC computation
    // Result has: new_buyer_collateral, new_seller_collateral, success
    let new_buyer_balance = result.ciphertexts[0];
    let new_seller_balance = result.ciphertexts[1];
    let success_flag = result.ciphertexts[2];

    // Emit event with encrypted results
    // Account updates happen in a separate instruction
    emit!(TradeSettledEvent {
        nonce: result.nonce.to_le_bytes(),
        buyer_balance: new_buyer_balance,
        seller_balance: new_seller_balance,
        success: success_flag[0],
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Trade settlement computation completed");
    Ok(())
}

// ========== SETTLE TRADE ACCOUNT STRUCTS ==========

/// Initialize settle_trade computation definition
#[init_computation_definition_accounts("settle_trade", payer)]
#[derive(Accounts)]
pub struct InitSettleCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,

    #[account(mut)]
    /// CHECK: Computation definition account, checked by Arcium program
    pub comp_def_account: UncheckedAccount<'info>,

    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

/// Queue settle trade computation
#[queue_computation_accounts("settle_trade", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct QueueSettleTrade<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    #[account(mut, address = derive_mempool_pda!())]
    /// CHECK: mempool_account, checked by arcium program
    pub mempool_account: UncheckedAccount<'info>,

    #[account(mut, address = derive_execpool_pda!())]
    /// CHECK: executing_pool, checked by arcium program
    pub executing_pool: UncheckedAccount<'info>,

    #[account(mut, address = derive_comp_pda!(computation_offset))]
    /// CHECK: computation_account, checked by arcium program
    pub computation_account: UncheckedAccount<'info>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_SETTLE))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, crate::error::ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,

    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Account<'info, FeePool>,

    #[account(address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Account<'info, ClockAccount>,

    /// Buyer's margin account
    #[account(mut)]
    pub buyer_margin: Account<'info, MarginAccount>,

    /// Seller's margin account
    #[account(mut)]
    pub seller_margin: Account<'info, MarginAccount>,

    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

/// Settle trade callback
#[callback_accounts("settle_trade")]
#[derive(Accounts)]
pub struct SettleTradeCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_SETTLE))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[event]
pub struct TradeSettledEvent {
    pub nonce: [u8; 16],
    pub buyer_balance: [u8; 32],
    pub seller_balance: [u8; 32],
    pub success: u8,
    pub timestamp: i64,
}
