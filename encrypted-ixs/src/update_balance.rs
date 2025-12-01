use arcis_imports::*;

/// Encrypted instructions for updating margin account balances
/// All balance operations happen in MPC to maintain privacy
#[encrypted]
pub mod circuits {
    use arcis_imports::*;

    /// Deposit collateral input
    pub struct DepositInput {
        current_collateral: u64,
        deposit_amount: u64,
    }

    /// Deposit result
    pub struct DepositResult {
        new_collateral: u64,
        success: u8,
    }

    /// Deposit collateral - add to encrypted balance
    #[instruction]
    pub fn deposit_collateral(input_ctxt: Enc<Mxe, DepositInput>) -> Enc<Mxe, DepositResult> {
        let input = input_ctxt.to_arcis();

        // Check for overflow
        let (new_collateral, success) =
            if input.current_collateral > u64::MAX - input.deposit_amount {
                (input.current_collateral, 0)
            } else {
                (input.current_collateral + input.deposit_amount, 1)
            };

        let result = DepositResult {
            new_collateral,
            success,
        };

        input_ctxt.owner.from_arcis(result)
    }

    /// Withdraw collateral input
    pub struct WithdrawInput {
        current_collateral: u64,
        withdraw_amount: u64,
    }

    /// Withdraw result
    pub struct WithdrawResult {
        new_collateral: u64,
        success: u8,
    }

    /// Withdraw collateral - subtract from encrypted balance
    #[instruction]
    pub fn withdraw_collateral(input_ctxt: Enc<Mxe, WithdrawInput>) -> Enc<Mxe, WithdrawResult> {
        let input = input_ctxt.to_arcis();

        // Check for underflow
        let (new_collateral, success) = if input.withdraw_amount > input.current_collateral {
            (input.current_collateral, 0)
        } else {
            (input.current_collateral - input.withdraw_amount, 1)
        };

        let result = WithdrawResult {
            new_collateral,
            success,
        };

        input_ctxt.owner.from_arcis(result)
    }

    /// Trade settlement input (encrypted balances only)
    pub struct TradeBalances {
        buyer_collateral: u64,
        seller_collateral: u64,
    }

    /// Trade result
    pub struct TradeResult {
        new_buyer_collateral: u64,
        new_seller_collateral: u64,
        success: u8,
    }

    /// Settle trade - update both buyer and seller balances privately
    /// trade_value is passed as plaintext since it's public information
    #[instruction]
    pub fn settle_trade(
        balances_ctxt: Enc<Mxe, TradeBalances>,
        trade_value: u64,
    ) -> Enc<Mxe, TradeResult> {
        let balances = balances_ctxt.to_arcis();

        // Check if buyer has enough and no overflow on seller side
        let (new_buyer_collateral, new_seller_collateral, success) =
            if trade_value > balances.buyer_collateral {
                (balances.buyer_collateral, balances.seller_collateral, 0)
            } else if balances.seller_collateral > u64::MAX - trade_value {
                (balances.buyer_collateral, balances.seller_collateral, 0)
            } else {
                (
                    balances.buyer_collateral - trade_value,
                    balances.seller_collateral + trade_value,
                    1,
                )
            };

        let result = TradeResult {
            new_buyer_collateral,
            new_seller_collateral,
            success,
        };

        balances_ctxt.owner.from_arcis(result)
    }
}
