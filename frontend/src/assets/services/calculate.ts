export interface TradeInput {
  type: "BUY" | "SELL";
  quantity: number;
  pricePerShare: number;
  costBasisPerShare?: number;
  isCostBasisWacc?: boolean;
  basisType?: "WACC" | "MARKET";
  holdingDays?: number; 
  isInstitutional?: boolean; 
}

export interface TradeOutput {
  grossAmount: number;
  brokerFee: number;
  sebonFee: number;
  dpFee: number;
  totalCharges: number;

  // Buy specific outputs
  totalPayable?: number;
  effectiveCostPerShare?: number;

  totalCostBasis?: number;
  netProceedsBeforeTax?: number;
  grossProfit?: number;
  cgtRateApplied?: number;
  cgtAmount?: number;
  netProfit?: number;
  netCashInBank?: number;
}

export class NepseTradeCalculator {
  /**
   * Evaluates the single slab rate based on total trade amount
   */
  private static getBrokerRate(tradeAmount: number): number {
    if (tradeAmount <= 50000) return 0.0036;
    if (tradeAmount <= 500000) return 0.0033;
    if (tradeAmount <= 2000000) return 0.0031;
    if (tradeAmount <= 10000000) return 0.0027;
    return 0.0024;
  }

  /**
   * Executes full trade fee and tax calculations
   */
  public static calculate(input: TradeInput): TradeOutput {
    const { quantity, pricePerShare, type } = input;
    const grossAmount = quantity * pricePerShare;

    // 1. Calculate Broker Commission
    const rate = this.getBrokerRate(grossAmount);
    const rawBrokerFee = grossAmount * rate;
    const brokerFee = Number(Math.max(rawBrokerFee, 10.0).toFixed(2));

    // 2. Calculate SEBON Fee (0.015%)
    const sebonFee = Number((grossAmount * 0.00015).toFixed(2));

    // 3. Flat DP Charge
    const dpFee = 25.0;

    // Total Transaction Costs
    const totalCharges = Number((brokerFee + sebonFee + dpFee).toFixed(2));

    if (type === "BUY") {
      const totalPayable = Number((grossAmount + totalCharges).toFixed(2));
      const effectiveCostPerShare = Number(
        (totalPayable / quantity).toFixed(4),
      );

      return {
        grossAmount,
        brokerFee,
        sebonFee,
        dpFee,
        totalCharges,
        totalPayable,
        effectiveCostPerShare,
      };
    } else {
      // SELL Workflow
      const costBasis = input.costBasisPerShare ?? 0;
      const holdingDays = input.holdingDays ?? 0;
      const isWacc =
        input.basisType !== undefined
          ? input.basisType === "WACC"
          : (input.isCostBasisWacc ?? true);

      const netProceedsBeforeTax = Number(
        (grossAmount - totalCharges).toFixed(2),
      );

      let totalCostBasis: number;
      if (isWacc || costBasis <= 0) {
        totalCostBasis = Number((quantity * costBasis).toFixed(2));
      } else {
        // Market price basis: calculate raw purchase buy-side expenses
        const rawGrossBuy = quantity * costBasis;
        const buyBrokerFee = Number(
          Math.max(rawGrossBuy * this.getBrokerRate(rawGrossBuy), 10.0).toFixed(2),
        );
        const buySebonFee = Number((rawGrossBuy * 0.00015).toFixed(2));
        const buyDpFee = 25.0;
        const totalBuyExpenses = Number(
          (buyBrokerFee + buySebonFee + buyDpFee).toFixed(2),
        );
        totalCostBasis = Number((rawGrossBuy + totalBuyExpenses).toFixed(2));
      }
      const grossProfit = Number(
        (netProceedsBeforeTax - totalCostBasis).toFixed(2),
      );

      let cgtRateApplied = 0;
      let cgtAmount = 0.0;

      if (grossProfit > 0) {
        if (input.isInstitutional) {
          cgtRateApplied = 0.1;
        } else {
          cgtRateApplied = holdingDays <= 365 ? 0.05 : 0.0375;
        }
        cgtAmount = Number((grossProfit * cgtRateApplied).toFixed(2));
      }

      const netProfit = Number((grossProfit - cgtAmount).toFixed(2));
      const netCashInBank = Number(
        (netProceedsBeforeTax - cgtAmount).toFixed(2),
      );

      return {
        grossAmount,
        brokerFee,
        sebonFee,
        dpFee,
        totalCharges,
        totalCostBasis,
        netProceedsBeforeTax,
        grossProfit,
        cgtRateApplied,
        cgtAmount,
        netProfit,
        netCashInBank,
      };
    }
  }
}
