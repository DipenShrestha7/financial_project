import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  stockApi,
  type StockPortfolio,
  type HistorySummary,
  type StockHistoryAggregate,
} from "../../services/stocks";
import { StockPageChrome, Summary, money } from "./StockPageChrome";

export default function StockHistory() {
  const [portfolios, setPortfolios] = useState<StockPortfolio[]>([]);
  const [portfolioId, setPortfolioId] = useState("");
  const [summary, setSummary] = useState<HistorySummary>({
    total_profit: "0",
    total_loss: "0",
    net_realized_pl: "0",
    total_dividends: "0",
    sell_count: "0",
    bonus_count: "0",
  });
  const [stocks, setStocks] = useState<StockHistoryAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const result = await stockApi.portfolios();
      setPortfolios(result.portfolios);
      const id = result.portfolios.some((item) => item.id === portfolioId)
        ? portfolioId
        : result.portfolios[0]?.id || "";
      setPortfolioId(id);
      const history = id ? await stockApi.history(id) : null;
      setSummary(
        history?.summary || {
          total_profit: "0",
          total_loss: "0",
          net_realized_pl: "0",
          total_dividends: "0",
          sell_count: "0",
          bonus_count: "0",
        },
      );
      setStocks(history?.stocks || []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load portfolio history.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [portfolioId]);
  return (
    <StockPageChrome
      activePage="stock-history"
      breadcrumb="Stock history"
      eyebrow="Stocks / history"
      title="History"
      description="Review bonus shares, dividends, valuations, and sold positions across the selected portfolio."
      portfolios={portfolios}
      selectedPortfolioId={portfolioId}
      onPortfolioChange={setPortfolioId}
      action={
        <button className="flex items-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311]">
          <Plus size={16} />
          Record event
        </button>
      }
    >
      <section className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
        <Summary
          label="Total profit"
          value={money(summary.total_profit)}
          detail="Lifetime realized gains"
        />
        <Summary
          label="Total loss"
          value={money(summary.total_loss)}
          detail="Lifetime realized losses"
        />
        <Summary
          label="Net realized P/L"
          value={money(summary.net_realized_pl)}
          detail={`${summary.sell_count} sell events`}
        />
        <Summary
          label="Dividends"
          value={money(summary.total_dividends)}
          detail={`${summary.bonus_count} bonus events`}
        />
      </section>
      <section className="mb-3.5 rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
        <h2 className="mb-4 text-[15px] font-semibold text-[#eef3f1]">
          Performance by stock
        </h2>
        <StockHistoryTable stocks={stocks} />
      </section>
      {error && (
        <p className="mt-3.5 rounded border border-[#402326] p-4 text-xs text-[#e57b7b]">
          {error}
        </p>
      )}
      {loading && (
        <p className="mt-3.5 text-xs text-[#758183]">Loading history...</p>
      )}
    </StockPageChrome>
  );
}

function StockHistoryTable({ stocks }: { stocks: StockHistoryAggregate[] }) {
  return (
    <>
      {stocks.length === 0 ? (
        <p className="text-xs text-[#758183]">No lifetime stock history yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr] gap-3 border-b border-[#1b2222] px-2 py-3 text-[8px] uppercase tracking-[.8px] text-[#627071]">
            <span>Stock</span>
            <span>Acquired</span>
            <span>Sold</span>
            <span>Realized P/L</span>
            <span>Dividends</span>
          </div>
          {stocks.map((stock) => (
            <div
              key={stock.symbol}
              className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr] gap-3 border-b border-[#171d1d] px-2 py-3 text-[10px]"
            >
              <strong className="text-[#c4d2d0]">{stock.symbol}</strong>
              <span className="text-[#9aabaa]">
                {Number(stock.total_acquired)} shares
              </span>
              <span className="text-[#9aabaa]">
                {Number(stock.total_sold)} shares
              </span>
              <span
                className={
                  Number(stock.realized_pl) >= 0
                    ? "text-[#57d1ae]"
                    : "text-[#e57b7b]"
                }
              >
                {money(stock.realized_pl)}
              </span>
              <span className="text-[#d4dfdd]">{money(stock.dividends)}</span>
            </div>
          ))}
        </>
      )}
    </>
  );
}
