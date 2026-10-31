import { useMemo, useRef, useState } from "react";
import {
  calculateAllTimePl,
  parseAllTimeCsv,
  type AllTimeEvent,
  type AllTimeResult,
} from "../../services/allTimePl";

const money = (value: number | null) =>
  value === null
    ? "Needs price"
    : `Rs. ${value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

export default function AllTimePlCalculator() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [events, setEvents] = useState<AllTimeEvent[]>([]);
  const [result, setResult] = useState<AllTimeResult | null>(null);
  const [message, setMessage] = useState("");

  const symbolsNeedingCurrentPrice = useMemo(
    () =>
      [...new Set(
        events
          .filter(
            (event, index, current) =>
              event.currentPrice === null &&
              current
                .filter((item) => item.symbol === event.symbol)
                .every((item) => item.currentPrice === null) &&
              current.findIndex((item) => item.symbol === event.symbol) === index,
          )
          .map((event) => event.symbol),
      )],
    [events],
  );

  const readFile = async (file: File) => {
    try {
      setMessage("");
      setResult(null);
      setEvents(parseAllTimeCsv(await file.text()));
    } catch (caught) {
      setEvents([]);
      setMessage(caught instanceof Error ? caught.message : "Could not read CSV file.");
    }
  };

  const updateEvent = (id: string, patch: Partial<AllTimeEvent>) => {
    setEvents((current) =>
      current.map((event) => (event.id === id ? { ...event, ...patch } : event)),
    );
    setResult(null);
  };

  const updateCurrentPrice = (symbol: string, value: string) => {
    const currentPrice = value === "" ? null : Number(value);
    setEvents((current) =>
      current.map((event) =>
        event.symbol === symbol ? { ...event, currentPrice } : event,
      ),
    );
    setResult(null);
  };

  const calculate = () => {
    const invalid = events.find(
      (event) =>
        (event.eventType !== "BONUS" &&
          event.eventType !== "IPO" &&
          (event.purchasePrice === null || event.purchasePrice <= 0)) ||
        (event.eventType === "SELL" &&
          (event.sellPrice === null || event.sellPrice <= 0)),
    );
    if (invalid) {
      setMessage(`Enter the missing price for ${invalid.symbol} before calculating.`);
      return;
    }
    const missingCurrent = symbolsNeedingCurrentPrice.find((symbol) => {
      const event = events.find((item) => item.symbol === symbol);
      return event?.currentPrice === null;
    });
    if (missingCurrent) {
      setMessage(`Enter the current market price for ${missingCurrent}.`);
      return;
    }
    setMessage("");
    setResult(calculateAllTimePl(events));
  };

  return (
    <section className="mt-4 rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
      <div className="flex items-start justify-between gap-4 max-[680px]:flex-col">
        <div>
          <h2 className="text-[17px] font-semibold text-[#eef3f1]">
            All-time P/L calculator
          </h2>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded border border-[#294340] px-3 py-2 text-[10px] text-[#5ecdb7]"
          >
            Upload portfolio CSV
          </button>
        </div>
      </div>
      {events.length > 0 && (
        <div className="mt-5">
          <div className="overflow-x-auto">
            <div className="min-w-245">
              <div className="grid grid-cols-[1.1fr_.7fr_.7fr_1fr_1fr_1.2fr] gap-3 border-b border-[#1b2222] px-2 py-2 text-[8px] uppercase tracking-[.8px] text-[#627071]">
                <span>Transaction</span><span>Shares</span><span>Date</span>
                <span>Purchase price</span><span>Sell price</span><span>WACC?</span>
              </div>
              {events.map((event) => (
                <div
                  key={event.id}
                  className="grid grid-cols-[1.1fr_.7fr_.7fr_1fr_1fr_1.2fr] items-center gap-3 border-b border-[#171d1d] px-2 py-2.5 text-[10px]"
                >
                  <strong className="text-[#c4d2d0]">
                    {event.symbol} <small className="text-[#718582]">{event.eventType}</small>
                  </strong>
                  <span className="text-[#a5b4b3]">{event.quantity}</span>
                  <span className="text-[#9aabaa]">{event.eventDate}</span>
                  {event.eventType === "IPO" ? (
                    <span className="text-[#57d1ae]">Rs. 100.00</span>
                  ) : event.eventType === "MUTUAL_FUND" ? (
                    <span className="text-[#57d1ae]">Fixed fund basis</span>
                  ) : event.eventType === "BONUS" ? (
                    <span className="text-[#718582]">Free</span>
                  ) : (
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={event.purchasePrice ?? ""}
                      onChange={(input) =>
                        updateEvent(event.id, {
                          purchasePrice: input.target.value === "" ? null : Number(input.target.value),
                        })
                      }
                      placeholder="Estimated price"
                      title="Exact or estimated purchase price"
                      className="w-full rounded border border-[#294340] bg-[#08100f] px-2 py-1.5 text-[10px] text-[#d4dfdd]"
                      aria-label={`${event.symbol} purchase price`}
                    />
                  )}
                  {event.eventType === "SELL" ? (
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={event.sellPrice ?? ""}
                      onChange={(input) =>
                        updateEvent(event.id, {
                          sellPrice: input.target.value === "" ? null : Number(input.target.value),
                        })
                      }
                      placeholder="Estimated price"
                      title="Exact or estimated selling price"
                      className="w-full rounded border border-[#294340] bg-[#08100f] px-2 py-1.5 text-[10px] text-[#d4dfdd]"
                      aria-label={`${event.symbol} sell price`}
                    />
                  ) : (
                    <span className="text-[#718582]">-</span>
                  )}
                  {!["IPO", "MUTUAL_FUND"].includes(event.eventType) ? (
                    <label className="flex items-center gap-2 text-[#b7c4c2]">
                      <input
                        type="checkbox"
                        checked={event.purchasePriceIsWacc}
                        onChange={(input) =>
                          updateEvent(event.id, { purchasePriceIsWacc: input.target.checked })
                        }
                        className="accent-[#32c7aa]"
                      />
                      Price is WACC
                    </label>
                  ) : (
                    <span className="text-[#718582]">Not applicable</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {symbolsNeedingCurrentPrice.length > 0 && (
            <div className="mt-4 rounded border border-[#294340] bg-[#0b1514] p-3">
              <div className="grid grid-cols-3 gap-3 max-[680px]:grid-cols-1">
                {symbolsNeedingCurrentPrice.map((symbol) => (
                  <label key={symbol} className="text-[10px] text-[#b7c4c2]">
                    {symbol} current price
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={events.find((event) => event.symbol === symbol)?.currentPrice ?? ""}
                      onChange={(input) => updateCurrentPrice(symbol, input.target.value)}
                      className="mt-1 w-full rounded border border-[#294340] bg-[#08100f] px-2 py-1.5 text-[10px] text-[#d4dfdd]"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={calculate}
            className="mt-4 rounded bg-[#32c7aa] px-4 py-2 text-[10px] font-bold text-[#041311]"
          >
            Calculate all-time P/L
          </button>
        </div>
      )}
      {message && <p className="mt-3 text-[11px] text-[#e57b7b]">{message}</p>}
      {result && <ResultView result={result} />}
    </section>
  );
}

function ResultView({ result }: { result: AllTimeResult }) {
  const maximum = Math.max(
    1,
    ...result.stocks.map((stock) => Math.abs(stock.totalPl || stock.realizedPl)),
  );
  return (
    <div className="mt-6">
      <div className="grid grid-cols-6 gap-3 max-[1100px]:grid-cols-3 max-[680px]:grid-cols-1">
        <Metric label="Invested / open cost" value={money(result.invested)} />
        <Metric label="Realized P/L" value={money(result.realizedPl)} tone={result.realizedPl} />
        <Metric label="Unrealized P/L" value={money(result.unrealizedPl)} tone={result.unrealizedPl} />
        <Metric label="All-time P/L" value={money(result.totalPl)} tone={result.totalPl} />
        <Metric label="Trading fees" value={money(result.fees)} />
        <Metric label="Capital-gains tax" value={money(result.capitalGainsTax)} />
      </div>
      <div className="mt-5 grid grid-cols-[1.3fr_1fr] gap-5 max-[900px]:grid-cols-1">
        <div>
          <h3 className="mb-3 text-[12px] font-semibold text-[#d4dfdd]">P/L by stock</h3>
          {result.stocks.map((stock) => {
            const value = stock.totalPl ?? stock.realizedPl;
            return (
              <div key={stock.symbol} className="mb-3">
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="text-[#c4d2d0]">{stock.symbol}</span>
                  <span className={value >= 0 ? "text-[#57d1ae]" : "text-[#e57b7b]"}>{money(value)}</span>
                </div>
                <div className="h-2 rounded bg-[#182323]">
                  <div
                    className={`h-2 rounded ${value >= 0 ? "bg-[#32c7aa]" : "bg-[#a94f58]"}`}
                    style={{ width: `${Math.max(3, (Math.abs(value) / maximum) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <h3 className="mb-3 text-[12px] font-semibold text-[#d4dfdd]">Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="text-[8px] uppercase tracking-[.8px] text-[#627071]">
                <tr><th className="py-2">Stock</th><th>Open</th><th>Realized</th><th>Fees</th><th>CGT</th><th>Total</th></tr>
              </thead>
              <tbody>
                {result.stocks.map((stock) => (
                  <tr key={stock.symbol} className="border-t border-[#171d1d] text-[#b7c4c2]">
                    <td className="py-2">{stock.symbol}</td>
                    <td>{stock.remaining}</td>
                    <td className={stock.realizedPl >= 0 ? "text-[#57d1ae]" : "text-[#e57b7b]"}>{money(stock.realizedPl)}</td>
                    <td>{money(stock.fees)}</td>
                    <td>{money(stock.capitalGainsTax)}</td>
                    <td>{money(stock.totalPl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: number | null;
}) {
  return (
    <article className="rounded border border-[#203034] bg-[#0b1112] p-3">
      <span className="text-[9px] text-[#819091]">{label}</span>
      <strong className={`mt-2 block text-[15px] ${tone === undefined || tone === null ? "text-[#eef3f1]" : tone >= 0 ? "text-[#57d1ae]" : "text-[#e57b7b]"}`}>
        {value}
      </strong>
    </article>
  );
}
