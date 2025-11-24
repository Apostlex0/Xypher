use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::state::margin_account::MarginAccount;

/// Settle a matched trade between buyer and seller.
/// Called by the off-chain matching engine after finding a match.
/// 
/// This updates both margin accounts:
/// - Buyer: increases debt (borrows to go long)
/// - Seller: increases debt (borrows to go short)
/// 
/// For MVP, we're simplifying:
/// - No position tracking yet (will add in next iteration)
/// - Just update debt to represent exposure
/// - Price and size are in fixed-point (multiply by 1e6)
pub fn settle_trade(
    ctx: Context<SettleTrade>,
    price: u64,  // Price in fixed-point (e.g., $50.00 = 50_000_000)
    size: u64,   // Size in fixed-point (e.g., 1.5 ZEC = 1_500_000)
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

    let buyer_margin = &mut ctx.accounts.buyer_margin;
    let seller_margin = &mut ctx.accounts.seller_margin;

    // Buyer takes on debt (long position)
    buyer_margin.debt = buyer_margin
        .debt
        .checked_add(trade_value)
        .ok_or(ErrorCode::MathOverflow)?;

    // Seller takes on debt (short position)
    seller_margin.debt = seller_margin
        .debt
        .checked_add(trade_value)
        .ok_or(ErrorCode::MathOverflow)?;

    // Emit event for off-chain tracking
    emit!(TradeExecuted {
        buyer: buyer_margin.owner,
        seller: seller_margin.owner,
        price,
        size,
        trade_value,
        timestamp: Clock::get()?.unix_timestamp,
    });

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
