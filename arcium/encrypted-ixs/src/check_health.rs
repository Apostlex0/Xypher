use arcis_imports::*;

/// Encrypted instruction for calculating account health ratio
/// This allows private health checks without revealing position details
#[encrypted]
pub mod circuits {
    use arcis_imports::*;

    /// Input values for health check calculation
    pub struct HealthCheckInput {
        /// Total collateral value (in smallest units)
        collateral: u64,
        /// Total debt value (in smallest units)
        debt: u64,
    }

    /// Calculate health ratio: (collateral / debt) * 100
    /// Returns a percentage where:
    /// - > 150: Healthy position
    /// - 100-150: Warning zone
    /// - < 100: Liquidation zone
    #[instruction]
    pub fn calculate_health_ratio(
        input_ctxt: Enc<Shared, HealthCheckInput>,
    ) -> Enc<Shared, u64> {
        let input = input_ctxt.to_arcis();
        
        // If no debt, health ratio is maximum (very healthy)
        let health_ratio = if input.debt == 0 {
            u64::MAX
        } else {
            // Calculate (collateral * 100) / debt
            // Using u128 to prevent overflow during multiplication
            let collateral_scaled = input.collateral as u128 * 100u128;
            let ratio = collateral_scaled / input.debt as u128;
            ratio as u64
        };
        
        input_ctxt.owner.from_arcis(health_ratio)
    }
}
