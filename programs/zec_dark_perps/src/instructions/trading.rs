use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::state::margin_account::MarginAccount;

/// Settle a matched trade between buyer and seller.
/// Called by the off-chain matching engine after finding a match.
///
/// **PRIVACY:** Balance updates happen via Arcium MPC (see margin_arcium::queue_settle_trade)
/// This function only validates and emits the trade event.
/// The actual encrypted balance settlement is done separately via MPC.
///
/// For MVP:
/// - Price and size are in fixed-point (multiply by 1e6)
/// - Encrypted balance updates via MPC ensure privacy
pub fn settle_trade(
    ctx: Context<SettleTrade>,
    price: u64, // Price in fixed-point (e.g., $50.00 = 50_000_000)
    size: u64,  // Size in fixed-point (e.g., 1.5 ZEC = 1_500_000)
) -> Result<()> {
    require!(price > 0, ErrorCode::InvalidAmount);
    require!(size > 0, ErrorCode::InvalidAmount);

    // Calculate trade value: (price * size) / 1e6
    // Using u128 to prevent overflow
    let trade_value = (price as u128)
        .checked_mul(size as u128)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(1_000_000)
        .ok_or(ErrorCode::MathOverflow)? as u64;

    // NOTE: Encrypted balance updates must be done via margin_arcium::queue_settle_trade
    // This keeps trade validation and encrypted accounting as separate steps

    // Emit event for off-chain tracking
    emit!(TradeExecuted {
        buyer: ctx.accounts.buyer_margin.owner,
        seller: ctx.accounts.seller_margin.owner,
        price,
        size,
        trade_value,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Trade validated. Call queue_settle_trade to update encrypted balances.");
    Ok(())
}

/// Accounts for settling a trade
#[derive(Accounts)]
pub struct SettleTrade<'info> {
    /// The matching engine authority (off-chain service)
    pub authority: Signer<'info>,

    /// Buyer's margin account
    #[account(
        mut,
        seeds = [MarginAccount::SEED_PREFIX, buyer_margin.owner.as_ref()],
        bump = buyer_margin.bump
    )]
    pub buyer_margin: Account<'info, MarginAccount>,

    /// Seller's margin account
    #[account(
        mut,
        seeds = [MarginAccount::SEED_PREFIX, seller_margin.owner.as_ref()],
        bump = seller_margin.bump
    )]
    pub seller_margin: Account<'info, MarginAccount>,
}

/// Event emitted when a trade is executed
#[event]
pub struct TradeExecuted {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
    pub size: u64,
    pub trade_value: u64,
    pub timestamp: i64,
}
