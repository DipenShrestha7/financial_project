import { useEffect, useState } from "react";
import {
  stockApi,
  type StockPortfolio,
} from "../../services/stocks";
import { StockPageChrome } from "./StockPageChrome";
import AllTimePlCalculator from "./AllTimePlCalculator";

export default function AllTimePlPage() {
  const [portfolios, setPortfolios] = useState<StockPortfolio[]>([]);
  const [portfolioId, setPortfolioId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void stockApi.portfolios().then(
      (result) => {
        setPortfolios(result.portfolios);
        setPortfolioId(result.portfolios[0]?.id || "");
      },
      (caught) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load portfolios.",
        );
      },
    );
  }, []);

  return (
    <StockPageChrome
      activePage="stock-all-time-pl"
      breadcrumb="All-time P/L"
      eyebrow="Stocks / all-time P/L"
      title="All-time P/L calculator"
      description="Reconstruct lifetime performance from a portfolio CSV, including sold transactions and open holdings."
      portfolios={portfolios}
      selectedPortfolioId={portfolioId}
      onPortfolioChange={setPortfolioId}
    >
      {error && (
        <p className="mb-4 rounded border border-[#402326] p-3 text-xs text-[#e57b7b]">
          {error}
        </p>
      )}
      <AllTimePlCalculator />
    </StockPageChrome>
  );
}
