import { useEffect, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import HoldingsTable from "./HoldingsTable";
import { stockApi, type Holding, type StockEvent } from "../../services/stocks";

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
  const [transactions, setTransactions] = useState<StockEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<StockEvent | null>(null);
  const [deletingSymbol, setDeletingSymbol] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scrips, setScrips] = useState<string[]>([]);
  const [scripMessage, setScripMessage] = useState("");

  useEffect(() => {
    if (!portfolioId) return;
    void stockApi.transactions(portfolioId).then(
      (result) => setTransactions(result.transactions),
      () => setTransactions([]),
    );
  }, [portfolioId, holdings]);

  useEffect(() => {
    void stockApi.scrips().then(
      (result) => {
        setScrips(result.symbols);
        setScripMessage("");
      },
      (caught) => {
        setScripMessage(
          caught instanceof Error
            ? caught.message
            : "Could not load NEPSE scrips.",
        );
      },
    );
  }, []);

  const refresh = () => {
    setEditingEvent(null);
    setFormOpen(false);
    onChanged?.();
  };

  const removeScrip = async () => {
    if (!deletingSymbol) return;
    setDeleting(true);
    setDeleteMessage("");
    try {
      await stockApi.removeScrip(portfolioId, deletingSymbol);
      setDeletingSymbol(null);
      refresh();
    } catch (caught) {
      setDeleteMessage(
        caught instanceof Error ? caught.message : "Could not delete scrip.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const readImportFile = async (file: File) => {
    setImportMessage("");
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error("The CSV file has no transactions.");
      setImportRows(rows);
    } catch (caught) {
      setImportRows([]);
      setImportMessage(
        caught instanceof Error ? caught.message : "Could not read CSV file.",
      );
    }
  };

  const importTransactions = async () => {
    setImporting(true);
    setImportMessage("");
    try {
      await stockApi.importEvents(
        portfolioId,
        importRows.map((row) => ({
          symbol: row.symbol,
          eventType: row.eventType,
          quantity: row.quantity,
          eventDate: row.eventDate,
          notes: row.notes,
        })),
      );
      setImportRows([]);
      refresh();
    } catch (caught) {
      setImportMessage(
        caught instanceof Error ? caught.message : "Could not import transactions.",
      );
    } finally {
      setImporting(false);
    }
  };

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
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readImportFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded border border-[#294340] px-2.5 py-1.5 text-[10px] text-[#5ecdb7]"
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            className="rounded border border-[#294340] px-2.5 py-1.5 text-[10px] text-[#5ecdb7]"
          >
            {formOpen ? "Close" : "Add transaction"}
          </button>
        </div>
      </div>
      {importRows.length > 0 && (
        <div className="mb-4 rounded-lg border border-[#294340] bg-[#0b1514] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[12px] font-semibold text-[#eef3f1]">
                Review imported transactions
              </h3>
            </div>
            <button
              type="button"
              disabled={importing}
              onClick={() => void importTransactions()}
              className="rounded bg-[#32c7aa] px-3 py-2 text-[10px] font-bold text-[#041311] disabled:opacity-60"
            >
              {importing ? "Importing..." : `Add ${importRows.length} transactions`}
            </button>
          </div>
          <div className="max-h-64 overflow-auto">
            <div className="sticky top-0 z-10 grid grid-cols-4 gap-3 border-b border-[#1b2222] bg-[#0b1514] px-2 py-2 text-[8px] uppercase tracking-[.8px] text-[#627071]">
              <span>Symbol</span><span>Type</span><span>Quantity</span><span>Date</span>
            </div>
            {importRows.map((row, index) => (
              <div key={`${row.symbol}-${row.eventDate}-${index}`} className="grid grid-cols-4 gap-3 border-b border-[#171d1d] px-2 py-2 text-[10px] text-[#c4d2d0]">
                <span>{row.symbol}</span><span>{row.eventType}</span><span>{row.quantity}</span><span>{row.eventDate}</span>
              </div>
            ))}
          </div>
          {importMessage && <p className="mt-3 text-[11px] text-[#e57b7b]">{importMessage}</p>}
        </div>
      )}
      {formOpen ? (
        <StockForm
          key={editingEvent?.id || "new"}
          portfolioId={portfolioId}
          scrips={scrips}
          scripMessage={scripMessage}
          initialEvent={editingEvent}
          onDone={refresh}
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
          transactions={transactions}
          onEdit={(event) => {
            setEditingEvent(event);
            setFormOpen(true);
          }}
          onDelete={setDeletingSymbol}
          onPriceUpdated={() => onChanged?.()}
        />
      </div>
      {deletingSymbol && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-transaction-title"
        >
          <div className="w-full max-w-md rounded-lg border border-[#294340] bg-[#0b1514] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2
                  id="delete-transaction-title"
                  className="text-[16px] font-semibold text-[#eef3f1]"
                >
                  Delete transaction?
                </h2>
                <p className="mt-2 text-[11px] leading-5 text-[#9aabaa]">
                  This will permanently delete all {deletingSymbol}{" "}
                  transactions, lots, transfers, and price records from this
                  portfolio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingSymbol(null)}
                aria-label="Close confirmation"
                className="text-[#819091] hover:text-white"
              >
                <X size={17} />
              </button>
            </div>
            {deleteMessage && (
              <p className="mt-3 rounded border border-[#402326] px-3 py-2 text-[11px] text-[#e57b7b]">
                {deleteMessage}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeletingSymbol(null)}
                className="rounded border border-[#294340] px-3 py-2 text-[11px] text-[#b7c4c2]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void removeScrip()}
                className="flex items-center gap-1.5 rounded bg-[#a94f58] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
              >
                <Trash2 size={14} /> {deleting ? "Deleting scrip..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type ImportRow = {
  symbol: string;
  eventType: "BUY" | "SELL" | "IPO" | "BONUS";
  quantity: number;
  eventDate: string;
  notes: string;
};

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field.trim());
      field = "";
    } else {
      field += character;
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseCsv(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const indexOf = (name: string) => headers.indexOf(name.toLowerCase());
  const scripIndex = indexOf("scrip");
  const dateIndex = indexOf("transaction date");
  const creditIndex = indexOf("credit quantity");
  const debitIndex = indexOf("debit quantity");
  const descriptionIndex = indexOf("history description");
  if ([scripIndex, dateIndex, creditIndex, debitIndex].some((index) => index < 0)) {
    throw new Error("CSV must include Scrip, Transaction Date, Credit Quantity, and Debit Quantity.");
  }
  return lines.slice(1).flatMap((line) => {
    const values = parseCsvLine(line);
    const credit = Number(values[creditIndex]?.replace(/,/g, "") || 0);
    const debit = Number(values[debitIndex]?.replace(/,/g, "") || 0);
    const symbol = values[scripIndex]?.toUpperCase();
    const description = values[descriptionIndex] || "";
    const eventType = credit > 0
      ? /bonus/i.test(description) ? "BONUS" : /ipo|initial public offering/i.test(description) ? "IPO" : "BUY"
      : "SELL";
    const quantity = credit > 0 ? credit : debit;
    return symbol && quantity > 0
      ? [{ symbol, eventType, quantity, eventDate: values[dateIndex], notes: description }]
      : [];
  });
}

function StockForm({
  portfolioId,
  scrips,
  scripMessage,
  initialEvent,
  onDone,
}: {
  portfolioId: string;
  scrips: string[];
  scripMessage: string;
  initialEvent: StockEvent | null;
  onDone: () => void;
}) {
  const [symbol, setSymbol] = useState(initialEvent?.symbol || "");
  const [eventType, setEventType] = useState(initialEvent?.event_type || "BUY");
  const [quantity, setQuantity] = useState(initialEvent?.quantity || "");
  const [amount, setAmount] = useState(initialEvent?.amount || "");
  const [price, setPrice] = useState(initialEvent?.price || "");
  const [notes, setNotes] = useState(initialEvent?.notes || "");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      const data = {
        portfolioId,
        symbol,
        eventType,
        quantity: eventType === "DIVIDEND" ? 0 : Number(quantity),
        price: eventType === "DIVIDEND" ? 0 : Number(price),
        amount: eventType === "DIVIDEND" ? Number(amount) : undefined,
        eventDate,
        notes: notes || undefined,
      };
      if (initialEvent) await stockApi.updateEvent(initialEvent.id, data);
      else await stockApi.event(data);
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
      <div>
        <input
          required
          list="nepse-scrip-symbols"
          placeholder={scrips.length ? "Search scrip symbol" : "Symbol"}
          value={symbol}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          className="w-full rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
          aria-label="Scrip symbol"
        />
        <datalist id="nepse-scrip-symbols">
          {scrips.map((scrip) => (
            <option key={scrip} value={scrip} />
          ))}
        </datalist>
        {scripMessage && (
          <small className="mt-1 block text-[#e57b7b]">{scripMessage}</small>
        )}
      </div>
      <select
        value={eventType}
        onChange={(event) => {
          const nextEventType = event.target.value;
          setEventType(nextEventType);
          if (["IPO", "BONUS", "RIGHT"].includes(nextEventType)) {
            setPrice("100");
          }
          if (nextEventType === "DIVIDEND") setAmount("");
        }}
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
        {saving
          ? "Saving..."
          : initialEvent
            ? "Update transaction"
            : "Save transaction"}
      </button>
      {message && <p className="col-span-2 text-[#e57b7b]">{message}</p>}
    </form>
  );
}
