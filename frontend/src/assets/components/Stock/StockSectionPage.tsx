import { useEffect, useState } from "react";
import HoldingsTable from "./HoldingsTable";
import { stockApi, type Holding } from "../../services/stocks";

type Props = {
  portfolioId: string;
  holdings: Holding[];
  onChanged?: () => void;
};

export default function StockSectionPage({
  portfolioId,
  holdings,
  onChanged,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  return (
    <section className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
            Holdings
          </span>
          <h2 className="text-[17px] font-semibold text-[#eef3f1]">
            Buy or sell shares
          </h2>
        </div>
        <button
          onClick={() => setFormOpen((open) => !open)}
          className="flex items-center gap-1.5 rounded border border-[#294340] px-2.5 py-1.5 text-[10px] text-[#5ecdb7]"
        >
          {formOpen ? "Close" : "Add transaction"}
        </button>
      </div>
      {formOpen ? (
        <StockForm
          portfolioId={portfolioId}
          onDone={() => {
            setFormOpen(false);
            onChanged?.();
          }}
        />
      ) : (
        <p className="text-[11px] text-[#718582]">
          Open Add transaction to record a buy, sell, IPO, bonus, dividend, or
          right-share event.
        </p>
      )}
      <div className="mt-5 border-t border-[#1b2222] pt-4">
        <h3 className="mb-3 text-[12px] font-semibold text-[#d4dfdd]">
          Current holdings
        </h3>
        <HoldingsTable
          holdings={holdings}
          portfolioId={portfolioId}
          onPriceUpdated={() => onChanged?.()}
        />
      </div>
    </section>
  );
}

function StockForm({
  portfolioId,
  onDone,
}: {
  portfolioId: string;
  onDone: () => void;
}) {
  const [symbol, setSymbol] = useState("");
  const [eventType, setEventType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (["IPO", "BONUS", "RIGHT"].includes(eventType)) setPrice("100");
    if (eventType === "DIVIDEND") setAmount("");
  }, [eventType]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      await stockApi.event({
        portfolioId,
        symbol,
        eventType,
        quantity: eventType === "DIVIDEND" ? 0 : Number(quantity),
        price: eventType === "DIVIDEND" ? 0 : Number(price),
        amount: eventType === "DIVIDEND" ? Number(amount) : undefined,
        eventDate,
        notes: notes || undefined,
      });
      onDone();
    } catch (caught) {
      setSaving(false);
      setMessage(
        caught instanceof Error ? caught.message : "Could not save event.",
      );
    }
  };
  return (
    <form
      onSubmit={submit}
      className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-[#203a38] bg-[#0b1514] p-4 text-xs max-[680px]:grid-cols-1"
    >
      <input
        required
        placeholder="Symbol"
        value={symbol}
        onChange={(event) => setSymbol(event.target.value)}
        className="rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
      />
      <select
        value={eventType}
        onChange={(event) => setEventType(event.target.value)}
        className="bank-field bank-select h-10 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[12px] text-[#d4dfdd] outline-none focus:border-[#32c7aa]"
      >
        <option value="BUY">BUY</option>
        <option value="SELL">SELL</option>
        <option value="IPO">IPO</option>
        <option value="BONUS">BONUS SHARE</option>
        <option value="DIVIDEND">CASH DIVIDEND</option>
        <option value="RIGHT">RIGHT SHARE</option>
      </select>
      {eventType === "DIVIDEND" ? (
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Cash dividend amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
        />
      ) : (
        <>
          <input
            required
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="Quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
          />
          <input
            required
            readOnly={["IPO", "BONUS", "RIGHT"].includes(eventType)}
            type="number"
            min="0"
            step="0.01"
            placeholder={
              eventType === "SELL" ? "Selling price" : "Purchase price"
            }
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
          />
        </>
      )}
      <input
        placeholder="Description (optional)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
      />
      <input
        required
        type="date"
        value={eventDate}
        onChange={(event) => setEventDate(event.target.value)}
        className="rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-[#32c7aa] px-3 py-2 font-bold text-[#041311] disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {message && <p className="col-span-2 text-[#e57b7b]">{message}</p>}
    </form>
  );
}
