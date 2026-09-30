import { ArrowUpRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  stockApi,
  type StockEvent,
  type StockPortfolio,
} from "../../services/stocks";
import { StockPageChrome, Summary, money, date } from "./StockPageChrome";

export default function StockTransactions() {
  const [portfolios, setPortfolios] = useState<StockPortfolio[]>([]);
  const [portfolioId, setPortfolioId] = useState("");
  const [events, setEvents] = useState<StockEvent[]>([]);
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
      setEvents(id ? (await stockApi.transactions(id)).transactions : []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load transactions.",
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
      activePage="stock-transactions"
      breadcrumb="Stock transactions"
      eyebrow="Stocks / transactions"
      title="Stock transactions"
      description="Record and review every buy, sell, IPO, and right-share execution. Entries remain permanent for cost basis, realized P/L, and transfer tracking."
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
          label="Records"
          value={String(events.length)}
          detail="Permanent records"
        />
        <Summary
          label="Needs attention"
          value={String(
            events.filter((event) => event.event_type === "SELL").length,
          )}
          detail="Sell events"
        />
        <Summary
          label="Data integrity"
          value="Atomic"
          detail="Database transactions"
        />
      </section>
      <section className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
        {error && <p className="p-4 text-xs text-[#e57b7b]">{error}</p>}
        {loading ? (
          <p className="p-8 text-xs text-[#758183]">Loading transactions...</p>
        ) : (
          <EventTable events={events} />
        )}
      </section>
    </StockPageChrome>
  );
}

function EventTable({ events }: { events: StockEvent[] }) {
  return (
    <>
      <div className="grid grid-cols-[1.5fr_1.1fr_1fr_1fr] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
        <span>Event</span>
        <span>Details</span>
        <span>Amount</span>
        <span>Status</span>
      </div>
      {events.length === 0 ? (
        <p className="p-8 text-center text-xs text-[#758183]">
          No stock transactions recorded yet.
        </p>
      ) : (
        events.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1.5fr_1.1fr_1fr_1fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px]"
          >
            <strong className="flex items-center gap-2 text-[#c4d2d0]">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[#102c26] text-[#57d1ae]">
                <ArrowUpRight size={14} />
              </span>
              {item.event_type} · {item.symbol}
            </strong>
            <span className="text-[#9aabaa]">
              {date(item.event_date)} · {Number(item.quantity)} shares
            </span>
            <span className="text-[#d4dfdd]">{money(item.amount)}</span>
            <span className="text-[#57d1ae]">Recorded</span>
          </div>
        ))
      )}
    </>
  );
}
