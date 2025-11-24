use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::error::ErrorCode;
use crate::state::margin_account::MarginAccount;

/// Liquidate an unhealthy margin account.
/// 
/// Requirements:
/// - The margin account must have is_liquidatable = true (set by Arcium health check)
/// - Liquidator receives the collateral
/// - Account debt is cleared
/// 
/// This is a simplified liquidation for MVP:
/// - Full collateral goes to liquidator
/// - No partial liquidations
/// - No liquidation penalty/bonus (can add later)
pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
    // Check if account is liquidatable
    require!(
        ctx.accounts.margin_account.is_liquidatable,
        ErrorCode::HealthyPosition
    );

    let collateral_amount = ctx.accounts.margin_account.collateral;
    require!(collateral_amount > 0, ErrorCode::InvalidAmount);

    // Prepare seeds for PDA signing
    let owner_key = ctx.accounts.margin_account.owner;
    let bump = ctx.accounts.margin_account.bump;
    let seeds = &[
        MarginAccount::SEED_PREFIX,
        owner_key.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // Transfer collateral from margin vault to liquidator
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
    token::transfer(cpi_ctx, collateral_amount)?;

    // Clear the account state
    let margin_account = &mut ctx.accounts.margin_account;
    margin_account.collateral = 0;
    margin_account.debt = 0;
    margin_account.is_liquidatable = false;

    // Emit event
    emit!(Liquidated {
        liquidator: ctx.accounts.liquidator.key(),
        margin_account_owner: owner_key,
        collateral_seized: collateral_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

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
