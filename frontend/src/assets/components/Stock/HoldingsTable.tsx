import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { stockApi, type Holding, type StockEvent } from "../../services/stocks";

const money = (value: number | string) =>
  `Rs. ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function HoldingsTable({
  holdings,
  portfolioId,
  transactions,
  onEdit,
  onDelete,
  onPriceUpdated,
}: {
  holdings: Holding[];
  portfolioId: string;
  transactions: StockEvent[];
  onEdit: (event: StockEvent) => void;
  onDelete: (symbol: string) => void;
  onPriceUpdated: () => void;
}) {
  return (
    <>
      <div className="grid grid-cols-[1.35fr_.8fr_1fr_1.1fr_1fr_1fr_1.2fr] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
        <span>Holding</span>
        <span>Shares</span>
        <span>Purchase price</span>
        <span>Current price</span>
        <span>Market value</span>
        <span>Unrealized P/L</span>
        <span>Actions</span>
      </div>
      {holdings.length === 0 ? (
        <p className="px-3.75 py-10 text-center text-xs text-[#758183]">
          No active holdings. Add a buy, IPO, right, or bonus event below.
        </p>
      ) : (
        holdings.map((holding) => (
          <div
            key={holding.symbol}
            className="grid grid-cols-[1.35fr_.8fr_1fr_1.1fr_1fr_1fr_1.2fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px]"
          >
            <div>
              <strong className="block text-[#c4d2d0]">{holding.symbol}</strong>
              <small className="text-[#647374]">Active holding</small>
            </div>
            <span className="text-[#a5b4b3]">
              {Number(holding.quantity)} shares
            </span>
            <span className="text-[#d4dfdd]">
              {holding.average_cost > 0 ? money(holding.average_cost) : "Not set"}
            </span>
            <div>
              <span className="block text-[#d4dfdd]">
                {holding.current_price === null
                  ? "Not priced"
                  : money(holding.current_price)}
              </span>
              <PriceEditor
                symbol={holding.symbol}
                portfolioId={portfolioId}
                currentPrice={holding.current_price}
                onDone={onPriceUpdated}
              />
            </div>
            <span className="text-[#d4dfdd]">
              {holding.market_value === null
                ? "-"
                : money(holding.market_value)}
            </span>
            <span
              className={
                holding.unrealized_pl === null
                  ? "text-[#718582]"
                  : holding.unrealized_pl >= 0
                    ? "text-[#57d1ae]"
                    : "text-[#e57b7b]"
              }
            >
              {holding.unrealized_pl === null
                ? "-"
                : money(holding.unrealized_pl)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(() => {
                const event = transactions.find((item) => item.symbol === holding.symbol);
                return event ? (
                  <>
                    <button type="button" onClick={() => onEdit(event)} className="flex items-center gap-1 rounded border border-[#294340] px-2 py-1.5 text-[9px] text-[#5ecdb7] hover:border-[#32c7aa]" aria-label={`Edit ${holding.symbol} transaction`}>
                      <Pencil size={11} /> Edit
                    </button>
                    <button type="button" onClick={() => onDelete(holding.symbol)} className="flex items-center gap-1 rounded border border-[#553139] px-2 py-1.5 text-[9px] text-[#e57b7b] hover:border-[#a94f58]" aria-label={`Delete ${holding.symbol} scrip`}>
                      <Trash2 size={11} /> Delete
                    </button>
                  </>
                ) : null;
              })()}
            </div>
          </div>
        ))
      )}
    </>
  );
}

function PriceEditor({
  symbol,
  portfolioId,
  currentPrice,
  onDone,
}: {
  symbol: string;
  portfolioId: string;
  currentPrice: string | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(currentPrice || "");
  const [message, setMessage] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-[9px] text-[#5ecdb7] hover:text-[#8ce4d2]"
      >
        Update price
      </button>
    );
  }

  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-1.5"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          await stockApi.price({ portfolioId, symbol, price: Number(price) });
          setOpen(false);
          onDone();
        } catch (caught) {
          setMessage(
            caught instanceof Error
              ? caught.message
              : "Could not update price.",
          );
        }
      }}
    >
      <input
        required
        min="0"
        step="0.01"
        type="number"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
        className="w-28 rounded border border-[#294340] bg-[#08100f] px-2 py-1.5 text-[10px] text-[#d4dfdd]"
        aria-label={`${symbol} latest price`}
      />
      <button
        type="submit"
        className="rounded bg-[#32c7aa] px-2 py-1.5 text-[9px] font-bold text-[#041311]"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-1 text-[9px] text-[#758183]"
      >
        Cancel
      </button>
      {message && <small className="w-full text-[#e57b7b]">{message}</small>}
    </form>
  );
}
