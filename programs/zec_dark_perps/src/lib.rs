use anchor_lang::prelude::*;

declare_id!("GX2qLDQRuA8LCkHYQaQxkno1VWz442ZyKcA31w27yLAo");

#[program]
pub mod zec_dark_perps {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
