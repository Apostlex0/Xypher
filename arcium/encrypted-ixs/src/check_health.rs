use arcis_imports::*;

/// Encrypted instruction for private health check (LTV calculation)
/// This is CRITICAL for liquidations without revealing user's exact collateral/debt
#[encrypted]
pub mod circuits {
    use arcis_imports::*;

    /// Liquidation threshold: 150% (collateral must be 1.5x debt)
    /// If LTV > 150%, position is liquidatable
    const LIQUIDATION_THRESHOLD: u64 = 150;

    /// Input values for health check calculation
    pub struct HealthCheckInput {
        /// Total collateral value (in smallest units, e.g., wZEC lamports)
        collateral: u64,
        /// Total debt value (in smallest units)
        debt: u64,
        /// Oracle price (scaled by 10^8 for precision)
        /// For simplicity, we assume collateral is already in USD terms
        /// In production, multiply collateral by price
        price: u64,
    }

    /// Check if position is liquidatable
    /// Returns encrypted boolean: true = liquidatable, false = healthy
    /// 
    /// Formula: LTV = (debt * 100) / collateral
    /// If LTV > LIQUIDATION_THRESHOLD (150%), position is underwater
    #[instruction]
    pub fn check_health(
        input_ctxt: Enc<Shared, HealthCheckInput>,
    ) -> Enc<Shared, bool> {
        let input = input_ctxt.to_arcis();
        
        // Calculate LTV ratio: (debt * 100) / collateral
        // Handle edge cases:
        // - No debt = healthy (LTV = 0)
        // - No collateral but has debt = liquidatable (LTV = infinity)
        let is_liquidatable = if input.debt == 0 {
            false
        } else if input.collateral == 0 {
            true
        } else {
            // Using u128 to prevent overflow
            let debt_scaled = input.debt as u128 * 100u128;
            let ltv = (debt_scaled / input.collateral as u128) as u64;
            ltv > LIQUIDATION_THRESHOLD
        };
        
        input_ctxt.owner.from_arcis(is_liquidatable)
    }
}
