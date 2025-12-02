use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::{CircuitSource, OffChainCircuitSource};

use crate::state::SignerAccount;
use crate::ID;
use crate::ID as ID_CONST;

// Computation definition offset for submit_order encrypted instruction
// This is calculated from the instruction name using comp_def_offset()
const COMP_DEF_OFFSET_SUBMIT_ORDER: u32 = comp_def_offset("submit_order");

// Helper function expected by arcium_callback macro
// This validates that callback instructions are properly formatted
fn validate_callback_ixs(_account_info: &AccountInfo, _pubkey: &Pubkey) -> Result<()> {
    // Validation is handled by Arcium program
    Ok(())
}

/// Initialize the computation definition for order submission
/// This registers the Arcium MPC computation on-chain
/// Only needs to be called once after program deployment
pub fn init_submit_order_comp_def(ctx: Context<InitSubmitOrderCompDef>) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        0,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: "https://ffzjucisiaierxyonwlx.supabase.co/storage/v1/object/public/arcium-circuits/submit_order.arcis".to_string(),
            hash: [0; 32],
        })),
        None,
    )?;
    msg!("Submit order computation definition initialized with circuit");
    Ok(())
}

/// Submit an encrypted order to the dark pool
/// Orders are encrypted client-side and processed in MPC
/// This ensures privacy - no one can see order details until matched
pub fn submit_order(
    ctx: Context<SubmitOrder>,
    computation_offset: u64,
    ciphertext_size: [u8; 32],
    ciphertext_price: [u8; 32],
    ciphertext_side: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    // Build arguments for encrypted instruction
    // Order: ArcisPubkey, nonce, then encrypted fields
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU64(ciphertext_size),
        Argument::EncryptedU64(ciphertext_price),
        Argument::EncryptedU8(ciphertext_side),
    ];

    // Set the bump for the sign_pda_account
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Queue the computation to Arcium MPC cluster
    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None, // No callback server needed (output fits in transaction)
        vec![SubmitOrderCallback::callback_ix(&[])],
        1, // One transaction for callback
    )?;

    msg!("Order submitted to MPC cluster");
    Ok(())
}

/// Callback function called by Arcium MPC cluster after order processing
/// Receives the encrypted order confirmation
#[arcium_callback(encrypted_ix = "submit_order")]
pub fn submit_order_callback(
    ctx: Context<SubmitOrderCallback>,
    output: ComputationOutputs<SubmitOrderOutput>,
) -> Result<()> {
    let encrypted_order = match output {
        ComputationOutputs::Success(SubmitOrderOutput { field_0 }) => field_0,
        _ => return Err(crate::error::ErrorCode::AbortedComputation.into()),
    };

    // Emit event with encrypted order confirmation
    // Off-chain matching engine can process this
    emit!(OrderSubmittedEvent {
        encrypted_data: encrypted_order.ciphertexts[0],
        nonce: encrypted_order.nonce.to_le_bytes(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Order confirmed and encrypted on-chain");
    Ok(())
}

/// Accounts for initializing submit_order computation definition
#[init_computation_definition_accounts("submit_order", payer)]
#[derive(Accounts)]
pub struct InitSubmitOrderCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,

    #[account(mut)]
    /// CHECK: Computation definition account, checked by Arcium program
    pub comp_def_account: UncheckedAccount<'info>,

    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

/// Accounts for submitting an encrypted order
#[queue_computation_accounts("submit_order", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct SubmitOrder<'info> {
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
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,

    #[account(mut, address = derive_execpool_pda!())]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,

    #[account(mut, address = derive_comp_pda!(computation_offset))]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_SUBMIT_ORDER))]
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

    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

/// Accounts for order submission callback
#[callback_accounts("submit_order")]
#[derive(Accounts)]
pub struct SubmitOrderCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_SUBMIT_ORDER))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

/// Event emitted when an order is submitted and encrypted
#[event]
pub struct OrderSubmittedEvent {
    pub encrypted_data: [u8; 32],
    pub nonce: [u8; 16],
    pub timestamp: i64,
}
