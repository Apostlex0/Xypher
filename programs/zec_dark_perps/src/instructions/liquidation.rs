use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::error::ErrorCode;
use crate::state::margin_account::MarginAccount;

/// Liquidate an unhealthy margin account.
///
/// **PRIVACY:** Balances are encrypted, so we can't read the exact collateral amount.
/// Instead, we transfer ALL tokens from the vault and reset encrypted balances to zero.
///
/// Requirements:
/// - The margin account must have is_liquidatable = true (set by Arcium health check)
/// - Liquidator receives all collateral from the vault
/// - Encrypted balances are reset to zero
///
/// This is a simplified liquidation for MVP:
/// - Full collateral goes to liquidator
/// - No partial liquidations
/// - No liquidation penalty/bonus (can add later)
pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
    // Check if account is liquidatable (set by Arcium health check callback)
    require!(
        ctx.accounts.margin_account.is_liquidatable,
        ErrorCode::HealthyPosition
    );

    // Get the actual token balance from the vault (this is public on-chain)
    let vault_balance = ctx.accounts.margin_vault.amount;
    require!(vault_balance > 0, ErrorCode::InvalidAmount);

    // Prepare seeds for PDA signing
    let owner_key = ctx.accounts.margin_account.owner;
    let bump = ctx.accounts.margin_account.bump;
    let seeds = &[MarginAccount::SEED_PREFIX, owner_key.as_ref(), &[bump]];
    let signer_seeds = &[&seeds[..]];

    // Transfer ALL collateral from margin vault to liquidator
    let cpi_accounts = Transfer {
        from: ctx.accounts.margin_vault.to_account_info(),
        to: ctx.accounts.liquidator_token_account.to_account_info(),
        authority: ctx.accounts.margin_account.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_ctx, vault_balance)?;

    // Reset encrypted balances to zero
    let margin_account = &mut ctx.accounts.margin_account;
    margin_account.encrypted_collateral = [0u8; 32];
    margin_account.encrypted_debt = [0u8; 32];
    margin_account.nonce = 0;
    margin_account.is_liquidatable = false;

    // Emit event
    emit!(Liquidated {
        liquidator: ctx.accounts.liquidator.key(),
        margin_account_owner: owner_key,
        collateral_seized: vault_balance,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Account liquidated. Encrypted balances reset to zero.");
    Ok(())
}

/// Accounts for liquidation
#[derive(Accounts)]
pub struct Liquidate<'info> {
    /// The liquidator (anyone can liquidate an unhealthy account)
    #[account(mut)]
    pub liquidator: Signer<'info>,

    /// The margin account being liquidated
    #[account(
        mut,
        seeds = [MarginAccount::SEED_PREFIX, margin_account.owner.as_ref()],
        bump = margin_account.bump
    )]
    pub margin_account: Account<'info, MarginAccount>,

    /// The margin vault (ATA owned by margin_account PDA)
    #[account(
        mut,
        associated_token::mint = liquidator_token_account.mint,
        associated_token::authority = margin_account,
    )]
    pub margin_vault: Account<'info, TokenAccount>,

    /// Liquidator's token account to receive collateral
    #[account(mut)]
    pub liquidator_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Event emitted when liquidation occurs
#[event]
pub struct Liquidated {
    pub liquidator: Pubkey,
    pub margin_account_owner: Pubkey,
    pub collateral_seized: u64,
    pub timestamp: i64,
}
