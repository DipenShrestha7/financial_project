import { StockPageChrome } from "./StockPageChrome";
import AllTimePlCalculator from "./AllTimePlCalculator";

export default function AllTimePlPage() {
  return (
    <StockPageChrome
      activePage="stock-all-time-pl"
      breadcrumb="All-time P/L"
      eyebrow="Stocks / all-time P/L"
      title="All-time P/L calculator"
      description="Reconstruct lifetime performance from a portfolio CSV, including sold transactions and open holdings."
    >
      <AllTimePlCalculator />
    </StockPageChrome>
  );
}
