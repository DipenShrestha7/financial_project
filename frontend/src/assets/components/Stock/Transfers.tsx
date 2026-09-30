import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  stockApi,
  type StockPortfolio,
  type Transfer,
} from "../../services/stocks";
import { StockPageChrome, Summary, money, date } from "./StockPageChrome";

export default function Transfers() {
  const [portfolios, setPortfolios] = useState<StockPortfolio[]>([]);
  const [portfolioId, setPortfolioId] = useState("");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
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
      setTransfers(id ? (await stockApi.transfers(id)).transfers : []);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load transfers.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [portfolioId]);
  const updateStatus = async (id: string, status: Transfer["status"]) => {
    await stockApi.transfer(id, status);
    await load();
  };
  return (
    <StockPageChrome
      activePage="transfers"
      breadcrumb="Share transfers"
      eyebrow="Stocks / MeroShare"
      title="Share transfers"
      description="Resolve post-sale EDIS requests for the selected portfolio before their deadlines."
      portfolios={portfolios}
      selectedPortfolioId={portfolioId}
      onPortfolioChange={setPortfolioId}
      action={
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311]"
        >
          <Plus size={16} />
          Refresh transfers
        </button>
      }
    >
      <section className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
        <Summary
          label="Records"
          value={String(transfers.length)}
          detail="Permanent records"
        />
        <Summary
          label="Needs attention"
          value={String(
            transfers.filter(
              (item) => item.status === "PENDING" || item.status === "PROBLEM",
            ).length,
          )}
          detail="Unsettled transfers"
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
          <p className="p-8 text-xs text-[#758183]">Loading transfers...</p>
        ) : (
          <TransferTable transfers={transfers} onUpdate={updateStatus} />
        )}
      </section>
    </StockPageChrome>
  );
}

function TransferTable({
  transfers,
  onUpdate,
}: {
  transfers: Transfer[];
  onUpdate: (id: string, status: Transfer["status"]) => Promise<void>;
}) {
  return (
    <>
      <div className="grid grid-cols-[1.5fr_1.1fr_1fr_1fr] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
        <span>Transfer</span>
        <span>Deadline</span>
        <span>Amount</span>
        <span>Status</span>
      </div>
      {transfers.length === 0 ? (
        <p className="p-8 text-center text-xs text-[#758183]">
          No share transfers are pending.
        </p>
      ) : (
        transfers.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1.5fr_1.1fr_1fr_1fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px]"
          >
            <div>
              <strong className="block text-[#c4d2d0]">
                {item.symbol} · {Number(item.quantity)} shares
              </strong>
              <small className="text-[#647374]">EDIS / MeroShare</small>
            </div>
            <span className="text-[#a5b4b3]">{date(item.deadline)}</span>
            <span className="text-[#d4dfdd]">{money(item.amount)}</span>
            <span className="flex items-center gap-1">
              <select
                value={item.status}
                onChange={(event) =>
                  void onUpdate(
                    item.id,
                    event.target.value as Transfer["status"],
                  )
                }
                className="bank-field bank-select rounded border border-[#294340] bg-[#08100f] px-2 py-1 text-[9px] text-[#d4dfdd]"
              >
                <option>PENDING</option>
                <option>TRANSFERRED</option>
                <option>PROBLEM</option>
                <option>CANCELLED</option>
              </select>
              {item.status === "TRANSFERRED" && (
                <Check size={13} className="text-[#57d1ae]" />
              )}
            </span>
          </div>
        ))
      )}
    </>
  );
}
