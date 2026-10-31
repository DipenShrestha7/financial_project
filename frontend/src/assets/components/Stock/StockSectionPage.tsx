import { useEffect, useRef, useState } from "react";
import { ChevronDown, X, Trash2 } from "lucide-react";
import HoldingsTable from "./HoldingsTable";
import {
  stockApi,
  type Holding,
  type Scrip,
  type StockEvent,
} from "../../services/stocks";

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
  const [scrips, setScrips] = useState<Scrip[]>([]);
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
        setScrips(result.scrips);
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

  const refresh = async () => {
    await onChanged?.();
    setEditingEvent(null);
    setFormOpen(false);
  };
  const closeForm = () => {
    setEditingEvent(null);
    setFormOpen(false);
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
      if (rows.length === 0)
        throw new Error("The CSV file has no transactions.");
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
          price: row.price === "" ? null : Number(row.price),
          purchasePriceIsWacc: false,
          eventDate: row.eventDate,
          notes: row.notes,
        })),
      );
      setImportRows([]);
      refresh();
    } catch (caught) {
      setImportMessage(
        caught instanceof Error
          ? caught.message
          : "Could not import transactions.",
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <span className="mb-2.25 block text-10 font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
            Holdings
          </span>
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
            onClick={() => {
              setEditingEvent(null);
              setFormOpen(true);
            }}
            className="rounded border border-[#294340] px-2.5 py-1.5 text-[10px] text-[#5ecdb7]"
          >
            Add transaction
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
            <div className="flex gap-2">
              <button
                type="button"
                disabled={importing}
                onClick={() => {
                  setImportRows([]);
                  setImportMessage("");
                }}
                className="rounded border border-[#a94f58] bg-linear-to-br from-[#a94f58] to-[#7f303a] px-3 py-2 text-[10px] text-white hover:from-[#bd626b] hover:to-[#913b46] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={() => void importTransactions()}
                className="rounded bg-[#32c7aa] px-3 py-2 text-[10px] font-bold text-[#041311] disabled:opacity-60"
              >
                {importing
                  ? "Importing..."
                  : `Add ${importRows.length} transactions`}
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-auto">
            <div className="sticky top-0 z-10 grid grid-cols-5 gap-3 border-b border-[#1b2222] bg-[#0b1514] px-2 py-2 text-[8px] uppercase tracking-[.8px] text-[#627071]">
              <span>Symbol</span>
              <span>Type</span>
              <span>Quantity</span>
              <span>Date</span>
              <span>Price per share</span>
            </div>
            {importRows.map((row, index) => (
              <div
                key={`${row.symbol}-${row.eventDate}-${index}`}
                className="grid grid-cols-5 items-center gap-3 border-b border-[#171d1d] px-2 py-2 text-[10px] text-[#c4d2d0]"
              >
                <span>{row.symbol}</span>
                <span>
                  {row.eventType === "MUTUAL_FUND_BUY"
                    ? "MUTUAL FUND BUY"
                    : row.eventType === "MUTUAL_FUND_SELL"
                      ? "MUTUAL FUND SELL"
                      : row.eventType}
                </span>
                <span>{row.quantity}</span>
                <span>{row.eventDate}</span>
                {row.eventType !== "BONUS" ? (
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    readOnly={row.eventType === "IPO"}
                    placeholder={
                      ["SELL", "MUTUAL_FUND_SELL"].includes(row.eventType)
                        ? "Selling price"
                        : "Price per share"
                    }
                    value={row.price}
                    onChange={(event) => {
                      const price = event.target.value;
                      setImportRows((rows) =>
                        rows.map((item, rowIndex) =>
                          rowIndex === index ? { ...item, price } : item,
                        ),
                      );
                    }}
                    className="w-full rounded border border-[#294340] bg-[#08100f] px-2 py-1.5 text-[10px] text-[#d4dfdd]"
                    aria-label={`${row.symbol} price per share`}
                  />
                ) : (
                  <span className="text-[#718582]">
                    {row.eventType === "BONUS" ? "Free" : "-"}
                  </span>
                )}
              </div>
            ))}
          </div>
          {importMessage && (
            <p className="mt-3 text-[11px] text-[#e57b7b]">{importMessage}</p>
          )}
        </div>
      )}
      <p className="text-[11px] text-[#718582]">
        Add a buy, sell, IPO, mutual fund, bonus, dividend, or right-share event
        using the transaction button.
      </p>
      <div className="mt-5 border-t border-[#1b2222] pt-4">
        <HoldingsTable
          holdings={holdings}
          transactions={transactions}
          onEdit={(event, holding) => {
            const purchaseEvents = transactions.filter(
              (item) =>
                item.symbol === holding.symbol &&
                ["BUY", "MUTUAL_FUND_BUY"].includes(item.event_type),
            );
            const aggregateEvent = purchaseEvents[0] || event;
            setEditingEvent({
              ...aggregateEvent,
              quantity: holding.quantity,
              price:
                holding.average_cost === null
                  ? aggregateEvent.price
                  : String(holding.average_cost),
              aggregate: purchaseEvents.length > 0,
            });
            setFormOpen(true);
          }}
          onDelete={setDeletingSymbol}
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
                className="rounded-full bg-linear-to-br from-[#a94f58] to-[#7f303a] p-1.5 text-white hover:from-[#bd626b] hover:to-[#913b46]"
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
                className="rounded border border-[#a94f58] bg-linear-to-br from-[#a94f58] to-[#7f303a] px-3 py-2 text-[11px] text-white hover:from-[#bd626b] hover:to-[#913b46]"
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
      {formOpen && (
        <div
          className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-black/35 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stock-transaction-title"
        >
          <div className="my-auto w-full max-w-xl">
            <StockForm
              key={editingEvent?.id || "new"}
              portfolioId={portfolioId}
              scrips={scrips}
              scripMessage={scripMessage}
              initialEvent={editingEvent}
              onDone={refresh}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
    </section>
  );
}

type ImportRow = {
  symbol: string;
  eventType:
    | "BUY"
    | "SELL"
    | "IPO"
    | "RIGHT"
    | "BONUS"
    | "MUTUAL_FUND_BUY"
    | "MUTUAL_FUND_SELL";
  quantity: number;
  price: string;
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
  if (
    [scripIndex, dateIndex, creditIndex, debitIndex].some((index) => index < 0)
  ) {
    throw new Error(
      "CSV must include Scrip, Transaction Date, Credit Quantity, and Debit Quantity.",
    );
  }
  return lines.slice(1).flatMap((line) => {
    const values = parseCsvLine(line);
    const credit = Number(values[creditIndex]?.replace(/,/g, "") || 0);
    const debit = Number(values[debitIndex]?.replace(/,/g, "") || 0);
    const symbol = values[scripIndex]?.toUpperCase();
    const description = values[descriptionIndex] || "";
    const eventType = /mutual fund|mf\b/i.test(description)
      ? credit > 0
        ? "MUTUAL_FUND_BUY"
        : "MUTUAL_FUND_SELL"
      : credit > 0
        ? /bonus/i.test(description)
          ? "BONUS"
          : /right/i.test(description)
            ? "RIGHT"
            : /ipo|initial public offering/i.test(description)
              ? "IPO"
              : "BUY"
        : "SELL";
    const quantity = credit > 0 ? credit : debit;
    return symbol && quantity > 0
      ? [
          {
            symbol,
            eventType,
            quantity,
            price:
              eventType === "BONUS"
                ? "0"
                : eventType === "IPO"
                  ? "100"
                  : eventType === "MUTUAL_FUND_BUY"
                    ? "10"
                    : "",
            eventDate: values[dateIndex],
            notes: description,
          },
        ]
      : [];
  });
}

function StockForm({
  portfolioId,
  scrips,
  scripMessage,
  initialEvent,
  onDone,
  onCancel,
}: {
  portfolioId: string;
  scrips: Scrip[];
  scripMessage: string;
  initialEvent: StockEvent | null;
  onDone: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [symbol, setSymbol] = useState(initialEvent?.symbol || "");
  const [eventType, setEventType] = useState(initialEvent?.event_type || "BUY");
  const [quantity, setQuantity] = useState(initialEvent?.quantity || "");
  const [amount, setAmount] = useState(initialEvent?.amount || "");
  const [price, setPrice] = useState(
    initialEvent?.price == null ? "" : initialEvent.price,
  );
  const [purchasePriceIsWacc, setPurchasePriceIsWacc] = useState(
    initialEvent?.purchase_price_is_wacc ?? false,
  );
  const [notes, setNotes] = useState(initialEvent?.notes || "");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [scripSearchOpen, setScripSearchOpen] = useState(false);
  const searchQuery = symbol.trim().toLowerCase();
  const filteredScrips = scrips
    .filter((scrip) => {
      return (
        scrip.symbol.toLowerCase().includes(searchQuery) ||
        scrip.name.toLowerCase().includes(searchQuery)
      );
    })
    .slice(0, 40);
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
        price:
          eventType === "DIVIDEND"
            ? 0
            : eventType === "IPO"
              ? 100
              : price === ""
                ? null
                : Number(price),
        purchasePriceIsWacc: ["BUY", "MUTUAL_FUND_BUY"].includes(eventType)
          ? purchasePriceIsWacc
          : false,
        amount: eventType === "DIVIDEND" ? Number(amount) : undefined,
        eventDate,
        notes: notes || undefined,
      };
      if (initialEvent?.aggregate) {
        await stockApi.updateAggregateEvent(portfolioId, symbol, {
          quantity: Number(quantity),
          price: Number(price),
          purchasePriceIsWacc,
        });
      } else if (initialEvent) {
        await stockApi.updateEvent(initialEvent.id, data);
      } else await stockApi.event(data);
      await onDone();
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
      className="grid grid-cols-2 gap-2.5 rounded-xl border border-[#294340] bg-linear-to-br from-[#0d1b19] to-[#0a1212] p-4 text-xs shadow-2xl max-[680px]:grid-cols-1"
    >
      <div className="col-span-2 flex items-center justify-between border-b border-[#203a38] pb-3 max-[680px]:col-span-1">
        <h2
          id="stock-transaction-title"
          className="text-[15px] font-semibold text-[#eef3f1]"
        >
          {initialEvent ? "Edit transaction" : "Add transaction"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close transaction form"
          className="p-1 text-[#d4dfdd] hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
      <div className="relative col-span-2 max-[680px]:col-span-1">
        <input
          required
          placeholder={
            scrips.length ? "Search stock or company name" : "Symbol"
          }
          value={symbol}
          onFocus={() => setScripSearchOpen(Boolean(symbol.trim()))}
          onChange={(event) => {
            const value = event.target.value.toUpperCase();
            setSymbol(value);
            setScripSearchOpen(Boolean(value.trim()));
          }}
          className="h-10 w-full rounded border border-[#294340] bg-[#08100f] px-3 py-2 pr-9 text-[#d4dfdd]"
          aria-label="Scrip symbol"
        />
        {scripSearchOpen && searchQuery && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded border border-[#294340] bg-[#101918] p-1 shadow-2xl">
            {filteredScrips.length > 0 ? (
              filteredScrips.map((scrip) => (
                <button
                  key={scrip.symbol}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSymbol(scrip.symbol);
                    setScripSearchOpen(false);
                  }}
                  className="block w-full rounded px-3 py-2 text-left text-[11px] text-[#d4dfdd] hover:bg-[#18302c]"
                >
                  <span className="font-semibold text-[#eef3f1]">
                    {scrip.symbol}
                  </span>{" "}
                  <span className="text-[#9aabaa]">({scrip.name})</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-[11px] text-[#9aabaa]">
                Nothing found
              </p>
            )}
          </div>
        )}
        {scripMessage && (
          <small className="mt-1 block text-[#e57b7b]">{scripMessage}</small>
        )}
      </div>
      <div className="relative">
        <select
          value={eventType}
          onChange={(event) => {
            const nextEventType = event.target.value;
            setEventType(nextEventType);
            if (["IPO", "BONUS", "RIGHT"].includes(nextEventType)) {
              setPrice("100");
            }
            if (nextEventType === "MUTUAL_FUND_BUY") setPrice("10");
            if (nextEventType === "DIVIDEND") setAmount("");
          }}
          className="bank-field bank-select h-10 w-full appearance-none rounded-md border border-[#294340] bg-[#08100f] px-3 py-2 pr-9 text-[12px] text-[#d4dfdd] outline-none focus:border-[#32c7aa]"
        >
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
          <option value="IPO">IPO</option>
          <option value="BONUS">BONUS SHARE</option>
          <option value="DIVIDEND">CASH DIVIDEND</option>
          <option value="RIGHT">RIGHT SHARE</option>
          <option value="MUTUAL_FUND_BUY">MUTUAL FUND BUY</option>
          <option value="MUTUAL_FUND_SELL">MUTUAL FUND SELL</option>
        </select>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#d4dfdd]"
        />
      </div>
      {eventType === "DIVIDEND" ? (
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Cash dividend amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="h-10 rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
        />
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-2">
            <input
              required
              readOnly={["IPO", "BONUS", "RIGHT"].includes(eventType)}
              type="number"
              min="0"
              step="0.0001"
              placeholder={
                eventType === "SELL" ? "Selling price" : "Purchase price"
              }
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
            />
            {["BUY", "MUTUAL_FUND_BUY"].includes(eventType) && (
              <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[#b7c4c2]">
                <input
                  type="checkbox"
                  checked={purchasePriceIsWacc}
                  onChange={(event) =>
                    setPurchasePriceIsWacc(event.target.checked)
                  }
                  className="h-4 w-4 accent-[#32c7aa]"
                />
                Is price WACC?
              </label>
            )}
          </div>
          <input
            required
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="Quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="h-10 rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
          />
        </>
      )}
      <input
        required
        type="date"
        value={eventDate}
        onChange={(event) => setEventDate(event.target.value)}
        className="h-10 rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
      />
      <input
        placeholder="Description (optional)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="h-10 rounded border border-[#294340] bg-[#08100f] px-3 py-2 text-[#d4dfdd]"
      />
      <button
        type="submit"
        disabled={saving}
        className="h-10 rounded bg-[#32c7aa] px-3 py-2 font-bold text-[#041311] disabled:opacity-60"
      >
        {saving
          ? "Saving..."
          : initialEvent
            ? "Update transaction"
            : "Save transaction"}
      </button>
      {initialEvent && (
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded border border-[#a94f58] bg-linear-to-br from-[#a94f58] to-[#7f303a] px-3 py-2 text-white hover:from-[#bd626b] hover:to-[#913b46] disabled:opacity-60"
        >
          Cancel
        </button>
      )}
      {message && <p className="col-span-2 text-[#e57b7b]">{message}</p>}
    </form>
  );
}
