import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardLayout from "../Sidebar";
import StockSectionPage from "./StockSectionPage.tsx";
import {
  stockApi,
  type Holding,
  type StockPortfolio,
} from "../../services/stocks";

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function StockPortfolio() {
  const [portfolios, setPortfolios] = useState<StockPortfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await stockApi.portfolios();
      setPortfolios(result.portfolios);
      const portfolioId = result.portfolios.some(
        (item) => item.id === selectedPortfolioId,
      )
        ? selectedPortfolioId
        : result.portfolios[0]?.id || "";
      setSelectedPortfolioId(portfolioId);
      setHoldings(
        portfolioId ? (await stockApi.portfolio(portfolioId)).holdings : [],
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load portfolios.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [selectedPortfolioId]);

  const pricedHoldings = holdings.filter((item) => item.market_value !== null);
  const totalValue = pricedHoldings.reduce(
    (sum, item) => sum + (item.market_value || 0),
    0,
  );
  const totalCost = holdings.reduce(
    (sum, item) => sum + Number(item.total_cost),
    0,
  );
  const totalShares = holdings.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );
  const totalPl = pricedHoldings.reduce(
    (sum, item) => sum + (item.unrealized_pl || 0),
    0,
  );
  const totalReturn = totalCost > 0 ? (totalPl / totalCost) * 100 : null;

  return (
    <DashboardLayout activePage="stock-portfolio" breadcrumb="Stock portfolio">
      <div className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7">
        <div className="mb-8 flex items-end justify-between max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-4.5">
          <div>
            <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              Stocks / portfolio
            </p>
            <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
              Portfolio
            </h1>
            <p className="text-[12px] text-[#758183]">
              Manage portfolios, holdings, and manually updated market values.
            </p>
            {portfolios.length > 0 && (
              <label className="mt-4 block max-w-80 text-[10px] text-[#819091]">
                Active portfolio
                <select
                  value={selectedPortfolioId}
                  onChange={(event) =>
                    setSelectedPortfolioId(event.target.value)
                  }
                  className="bank-field bank-select mt-1.5 h-10 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[12px] text-[#d4dfdd] outline-none focus:border-[#32c7aa]"
                >
                  {portfolios.map((portfolio) => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <button
            onClick={() => setFormOpen((open) => !open)}
            className="flex items-center justify-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311] hover:bg-[#5bdec8] max-[680px]:w-full"
          >
            <Plus size={16} />
            Add portfolio
          </button>
        </div>
        {formOpen && (
          <PortfolioForm
            onDone={(portfolioId) => {
              setFormOpen(false);
              setSelectedPortfolioId(portfolioId);
            }}
          />
        )}
        {error && (
          <p className="mb-4 rounded border border-[#402326] px-3 py-3 text-xs text-[#e57b7b]">
            {error}
          </p>
        )}
        <section className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
          <Summary
            label="Current value"
            value={
              loading
                ? "Loading..."
                : pricedHoldings.length === 0
                  ? "Not priced"
                  : money(totalValue)
            }
            detail={`${holdings.length} total holdings`}
          />
          <Summary
            label="Invested"
            value={money(totalCost)}
            detail={`${totalShares.toLocaleString("en-IN")} total shares`}
          />
          <Summary
            label="P/L at current price"
            value={pricedHoldings.length === 0 ? "Not priced" : money(totalPl)}
            detail={
              totalReturn === null
                ? "Set current prices to calculate"
                : `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}% of invested`
            }
            detailTone={
              totalReturn !== null && totalReturn < 0 ? "negative" : "positive"
            }
          />
        </section>
        <StockSectionPage
          portfolioId={selectedPortfolioId}
          holdings={holdings}
          onChanged={() => void load()}
        />
      </div>
    </DashboardLayout>
  );
}

function PortfolioForm({ onDone }: { onDone: (portfolioId: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  return (
    <form
      className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-[#203a38] bg-[#0b1514] p-4 text-xs max-[680px]:grid-cols-1"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          const result = await stockApi.createPortfolio({
            name,
            description: description || undefined,
          });
          onDone(result.portfolio.id);
        } catch (caught) {
          setMessage(
            caught instanceof Error
              ? caught.message
              : "Could not create portfolio.",
          );
        }
      }}
    >
      <input
        required
        placeholder="Portfolio name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
      />
      <input
        placeholder="Description (optional)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
      />
      <button className="rounded bg-[#32c7aa] px-3 py-2 font-bold text-[#041311]">
        Create portfolio
      </button>
      {message && <p className="col-span-2 text-[#e57b7b]">{message}</p>}
    </form>
  );
}

function Summary({
  label,
  value,
  detail,
  detailTone = "positive",
}: {
  label: string;
  value: string;
  detail: string;
  detailTone?: "positive" | "negative";
}) {
  return (
    <article className="rounded-lg border border-[#203034] bg-[#0b1112] p-4.5">
      <span className="text-[10px] text-[#aab6b6]">{label}</span>
      <strong className="mt-3 block text-[22px] font-semibold text-[#eff4f2]">
        {value}
      </strong>
      <p
        className={`mt-1 text-[9px] ${detailTone === "negative" ? "text-[#e57b7b]" : "text-[#57d1ae]"}`}
      >
        {detail}
      </p>
    </article>
  );
}
