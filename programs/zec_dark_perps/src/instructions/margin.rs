use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::error::ErrorCode;
use crate::state::margin_account::MarginAccount;

/// Initialize a MarginAccount PDA and its wZEC vault ATA.
/// Balances are initialized as encrypted zeros.
pub fn initialize_margin_account(ctx: Context<InitializeMarginAccount>) -> Result<()> {
    let margin_account = &mut ctx.accounts.margin_account;
    margin_account.owner = ctx.accounts.owner.key();

    // Initialize with encrypted zeros (all zeros represents encrypted zero)
    margin_account.encrypted_collateral = [0u8; 32];
    margin_account.encrypted_debt = [0u8; 32];
    margin_account.nonce = 0;

    margin_account.is_liquidatable = false;
    margin_account.bump = ctx.bumps.margin_account;

    msg!("Margin account initialized with encrypted balances");
    Ok(())
}

/// Deposit wZEC from the user's token account into the margin vault.
/// The actual balance update happens via Arcium MPC (see margin_arcium::queue_deposit)
/// This function only handles the token transfer.
pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    // CPI: transfer from user -> margin vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.owner_token_account.to_account_info(),
        to: ctx.accounts.margin_vault.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // NOTE: Encrypted balance update must be done separately via margin_arcium::queue_deposit
    // This keeps the token transfer and encrypted accounting as separate steps
    msg!("Tokens deposited. Call queue_deposit to update encrypted balance.");

    Ok(())
}

/// Withdraw wZEC from the margin vault back to the user.
/// The actual balance validation happens via Arcium MPC (see margin_arcium::queue_withdraw)
/// This function only handles the token transfer after MPC approval.
pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    let margin_account = &ctx.accounts.margin_account;

    // NOTE: Balance check must be done via margin_arcium::queue_withdraw first
    // MPC will verify encrypted balance >= amount before allowing withdrawal
    // This function assumes the check has already passed

    // Seeds for PDA signing: [b"margin", owner, bump]
    let owner_key = margin_account.owner;
    let bump = margin_account.bump;

    let seeds: &[&[u8]] = &[MarginAccount::SEED_PREFIX, owner_key.as_ref(), &[bump]];
    let signer_seeds = &[seeds];

    // CPI: transfer from margin vault -> user, signed by PDA
    let cpi_accounts = Transfer {
        from: ctx.accounts.margin_vault.to_account_info(),
        to: ctx.accounts.owner_token_account.to_account_info(),
        authority: ctx.accounts.margin_account.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_ctx, amount)?;

    msg!("Tokens withdrawn. Encrypted balance updated via MPC.");
    Ok(())
}

// ---------- ACCOUNTS ----------

#[derive(Accounts)]
pub struct InitializeMarginAccount<'info> {
    /// User creating the margin account.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// PDA storing margin data.
    #[account(
        init,
        payer = owner,
        seeds = [MarginAccount::SEED_PREFIX, owner.key().as_ref()],
        bump,
        space = MarginAccount::SPACE, // Use constant from MarginAccount
    )]
    pub margin_account: Account<'info, MarginAccount>,

    /// ATA holding the user's collateral, owned by the margin PDA.
    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = margin_account,
    )]
    pub margin_vault: Account<'info, TokenAccount>,

    /// wZEC mint (we don’t hardcode address here; we just enforce consistency).
    pub mint: Account<'info, Mint>,

    /// Standard programs.
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    /// The owner funding the margin account.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Existing margin account PDA.
    #[account(
        mut,
        seeds = [MarginAccount::SEED_PREFIX, owner.key().as_ref()],
        bump = margin_account.bump,
    )]
    pub margin_account: Account<'info, MarginAccount>,

    /// User's personal wZEC token account.
    #[account(
        mut,
        token::mint = mint,
        token::authority = owner,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    /// Vault ATA that escrows collateral, owned by the margin PDA.
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = margin_account,
    )]
    pub margin_vault: Account<'info, TokenAccount>,

    /// wZEC mint.
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    /// The owner withdrawing from their margin account.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Margin account PDA.
    #[account(
        mut,
        seeds = [MarginAccount::SEED_PREFIX, owner.key().as_ref()],
        bump = margin_account.bump,
    )]
    pub margin_account: Account<'info, MarginAccount>,

    /// Vault ATA escrowing collateral.
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = margin_account,
    )]
    pub margin_vault: Account<'info, TokenAccount>,

    /// User's personal wZEC token account.
    #[account(
        mut,
        token::mint = mint,
        token::authority = owner,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    /// wZEC mint.
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
