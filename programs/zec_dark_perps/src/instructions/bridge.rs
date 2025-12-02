use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, MintTo, Token, TokenAccount, Mint};

use crate::error::ErrorCode;
use crate::state::bridge_config::{BridgeConfig, ProcessedDeposit};

// ========== INITIALIZE BRIDGE ==========

/// Initialize bridge configuration with validators
pub fn initialize_bridge(
    ctx: Context<InitializeBridge>,
    validator1: Pubkey,
    validator2: Pubkey,
    validator3: Pubkey,
) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    bridge_config.authority = ctx.accounts.authority.key();
    bridge_config.validator1 = validator1;
    bridge_config.validator2 = validator2;
    bridge_config.validator3 = validator3;
    bridge_config.wzec_mint = ctx.accounts.wzec_mint.key();
    bridge_config.deposit_count = 0;
    bridge_config.bump = ctx.bumps.bridge_config;

    msg!("Bridge initialized with validators: {}, {}, {}", validator1, validator2, validator3);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeBridge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        seeds = [BridgeConfig::SEED_PREFIX],
        bump,
        space = 8 + 32 + 32 + 32 + 32 + 32 + 8 + 1 // discriminator + authority + 3 validators + mint + count + bump
    )]
    pub bridge_config: Account<'info, BridgeConfig>,

    /// wZEC mint that will be controlled by bridge
    pub wzec_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

// ========== MINT WRAPPED (DEPOSITS) ==========

/// Mint wZEC when ZEC deposit is detected
/// Requires 2-of-3 validator signatures
pub fn mint_wrapped(
    ctx: Context<MintWrapped>,
    amount: u64,
    zcash_txid: [u8; 32],
) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    // Verify at least 2 validators signed
    let mut valid_signer_count = 0;
    if ctx.accounts.validator1.is_signer && ctx.accounts.bridge_config.is_validator(&ctx.accounts.validator1.key()) {
        valid_signer_count += 1;
    }
    if ctx.accounts.validator2.is_signer && ctx.accounts.bridge_config.is_validator(&ctx.accounts.validator2.key()) {
        valid_signer_count += 1;
    }

    require!(valid_signer_count >= 2, ErrorCode::InsufficientSignatures);

    // Initialize processed deposit record to prevent double-minting
    let processed_deposit = &mut ctx.accounts.processed_deposit;
    processed_deposit.zcash_txid = zcash_txid;
    processed_deposit.recipient = ctx.accounts.recipient.key();
    processed_deposit.amount = amount;
    processed_deposit.timestamp = Clock::get()?.unix_timestamp;
    processed_deposit.bump = ctx.bumps.processed_deposit;

    // Mint wZEC to recipient
    let bump = ctx.accounts.bridge_config.bump;
    let seeds: &[&[u8]] = &[BridgeConfig::SEED_PREFIX, &[bump]];
    let signer_seeds = &[seeds];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.wzec_mint.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.bridge_config.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::mint_to(cpi_ctx, amount)?;

    // Update deposit count
    let bridge_config = &mut ctx.accounts.bridge_config;
    bridge_config.deposit_count = bridge_config.deposit_count.checked_add(1).ok_or(ErrorCode::MathOverflow)?;

    emit!(DepositProcessed {
        zcash_txid,
        recipient: ctx.accounts.recipient.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Minted {} wZEC to {} for Zcash txid {:?}", amount, ctx.accounts.recipient.key(), zcash_txid);
    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, zcash_txid: [u8; 32])]
pub struct MintWrapped<'info> {
    /// First validator (must sign)
    #[account(mut)]
    pub validator1: Signer<'info>,

    /// Second validator (must sign)
    pub validator2: Signer<'info>,

    /// Bridge configuration
    #[account(
        mut,
        seeds = [BridgeConfig::SEED_PREFIX],
        bump = bridge_config.bump,
    )]
    pub bridge_config: Account<'info, BridgeConfig>,

    /// Processed deposit tracker (prevents double-minting)
    #[account(
        init,
        payer = validator1,
        seeds = [ProcessedDeposit::SEED_PREFIX, &zcash_txid],
        bump,
        space = 8 + 32 + 32 + 8 + 8 + 1 // discriminator + txid + recipient + amount + timestamp + bump
    )]
    pub processed_deposit: Account<'info, ProcessedDeposit>,

    /// Recipient of minted wZEC
    /// CHECK: Can be any account, validated by validators
    pub recipient: UncheckedAccount<'info>,

    /// Recipient's wZEC token account
    #[account(
        mut,
        constraint = recipient_token_account.mint == wzec_mint.key(),
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// wZEC mint
    #[account(
        mut,
        constraint = wzec_mint.key() == bridge_config.wzec_mint,
    )]
    pub wzec_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct DepositProcessed {
    pub zcash_txid: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// ========== REQUEST WITHDRAWAL ==========

/// Request withdrawal by burning wZEC
/// Zcash address is stored in instruction data for off-chain processor
#[derive(Accounts)]
pub struct RequestWithdrawal<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// User's wZEC token account
    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == wzec_mint.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    /// wZEC mint
    #[account(mut)]
    pub wzec_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

#[event]
pub struct WithdrawalRequested {
    pub user: Pubkey,
    pub amount: u64,
    pub zcash_address: String,
    pub timestamp: i64,
}

pub fn request_withdrawal(
    ctx: Context<RequestWithdrawal>,
    amount: u64,
    zcash_address: String,
) -> Result<()> {
    require!(amount > 0, BridgeError::InvalidAmount);
    require!(!zcash_address.is_empty(), BridgeError::InvalidZcashAddress);
    require!(zcash_address.len() <= 256, BridgeError::ZcashAddressTooLong);

    // Burn wZEC tokens
    let cpi_accounts = Burn {
        mint: ctx.accounts.wzec_mint.to_account_info(),
        from: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::burn(cpi_ctx, amount)?;

    // Emit event for off-chain processor
    emit!(WithdrawalRequested {
        user: ctx.accounts.user.key(),
        amount,
        zcash_address: zcash_address.clone(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Withdrawal requested: {} wZEC to {}", amount, zcash_address);

    Ok(())
}

#[error_code]
pub enum BridgeError {
    #[msg("Amount must be greater than 0")]
    InvalidAmount,
    #[msg("Zcash address cannot be empty")]
    InvalidZcashAddress,
    #[msg("Zcash address too long (max 256 chars)")]
    ZcashAddressTooLong,
}
