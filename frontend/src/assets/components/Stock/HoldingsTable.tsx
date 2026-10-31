import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { type Holding, type StockEvent } from "../../services/stocks";

const money = (value: number | string) =>
  `Rs. ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function HoldingsTable({
  holdings,
  transactions,
  onEdit,
  onDelete,
}: {
  holdings: Holding[];
  transactions: StockEvent[];
  onEdit: (event: StockEvent, holding: Holding) => void;
  onDelete: (symbol: string) => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  return (
    <>
      <div className="grid grid-cols-[1.25fr_.7fr_1fr_1fr_1fr_1fr_1fr_.45fr] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
        <span>Stock</span>
        <span>Quantity</span>
        <span>Purchase price</span>
        <span>Total price</span>
        <span>Current price</span>
        <span>Market value</span>
        <span>Unrealized P/L</span>
        <span />
      </div>
      {holdings.length === 0 ? (
        <p className="px-3.75 py-10 text-center text-xs text-[#758183]">
          No active holdings. Add a buy, IPO, right, or bonus event below.
        </p>
      ) : (
        holdings.map((holding) => (
          <div
            key={holding.symbol}
            className="grid grid-cols-[1.25fr_.7fr_1fr_1fr_1fr_1fr_1fr_.45fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px]"
          >
            <div>
              <strong className="block text-[#c4d2d0]">{holding.symbol}</strong>
            </div>
            <span className="text-[#a5b4b3]">
              {Number(holding.quantity)}
            </span>
            <span className="text-[#d4dfdd]">
              {holding.average_cost === null ? "-" : money(holding.average_cost)}
            </span>
            <span className="text-[#d4dfdd]">
              {holding.total_purchase_price == null ||
              !Number.isFinite(Number(holding.total_purchase_price))
                ? "-"
                : money(holding.total_purchase_price)}
            </span>
            <div>
              <span className="block text-[#d4dfdd]">
                {holding.current_price === null
                  ? "Not priced"
                  : money(holding.current_price)}
              </span>
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
            <div className="relative flex justify-end">
              {(() => {
                const event = transactions.find((item) => item.symbol === holding.symbol);
                return event ? (
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenu((current) =>
                          current === holding.symbol ? null : holding.symbol,
                        )
                      }
                      className="p-1 text-[#5ecdb7] hover:text-[#32c7aa]"
                      aria-label={`Actions for ${holding.symbol}`}
                      aria-expanded={openMenu === holding.symbol}
                    >
                      <MoreVertical size={17} />
                    </button>
                    {openMenu === holding.symbol && (
                      <div className="absolute right-0 top-full z-20 mt-1 min-w-28 rounded border border-[#294340] bg-[#0b1514] p-1 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenu(null);
                            onEdit(event, holding);
                          }}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[10px] text-[#5ecdb7] hover:bg-[#132522]"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenu(null);
                            onDelete(holding.symbol);
                          }}
                          className="flex w-full items-center gap-2 rounded bg-linear-to-br from-[#a94f58] to-[#7f303a] px-2 py-1.5 text-left text-[10px] text-white hover:from-[#bd626b] hover:to-[#913b46]"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        ))
      )}
    </>
  );
}
