import { Check, Eye, EyeOff, RefreshCw, Trash2, X } from "lucide-react";
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
  const [confirmingTransfer, setConfirmingTransfer] = useState<Transfer | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const result = await stockApi.portfolios();
      setPortfolios(result.portfolios);
      const id = result.portfolios.some((item) => item.id === portfolioId)
        ? portfolioId
        : result.portfolios[0]?.id || "";
      setPortfolioId(id);
      setTransfers(
        id ? (await stockApi.transfers(id, showHidden)).transfers : [],
      );
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
  }, [portfolioId, showHidden]);
  const updateStatus = async (id: string, status: Transfer["status"]) => {
    await stockApi.transfer(id, status);
    await load();
  };
  const removeTransfer = async (id: string) => {
    setDeleting(true);
    setDeleteError("");
    try {
      await stockApi.removeTransfer(id);
      setConfirmingTransfer(null);
      await load();
    } catch (caught) {
      setDeleteError(
        caught instanceof Error ? caught.message : "Could not remove transfer.",
      );
    } finally {
      setDeleting(false);
    }
  };
  const hideTransfer = async (id: string) => {
    try {
      await stockApi.hideTransfer(id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not hide transfer.",
      );
    }
  };
  const restoreTransfer = async (id: string) => {
    try {
      await stockApi.updateTransferVisibility(id, false);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not restore transfer.",
      );
    }
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
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-md border border-[#294340] px-3.75 py-2.75 text-[11px] text-[#b7c4c2]">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(event) => setShowHidden(event.target.checked)}
              className="accent-[#32c7aa]"
            />
            Show hidden
          </label>
          <button
            onClick={() => void load()}
            className="flex items-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311]"
          >
            <RefreshCw size={16} />
            Refresh transfers
          </button>
        </div>
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
              (item) =>
                item.status === "PENDING" ||
                item.status === "MISSED" ||
                item.status === "CANCELLED",
            ).length,
          )}
          detail="Unsettled transfers"
        />
        <Summary
          label="Resolved"
          value={String(
            transfers.filter((item) => item.status === "TRANSFERRED").length,
          )}
          detail="Transferred successfully"
        />
      </section>
      <section className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
        {error && <p className="p-4 text-xs text-[#e57b7b]">{error}</p>}
        {loading ? (
          <p className="p-8 text-xs text-[#758183]">Loading transfers...</p>
        ) : (
          <TransferTable
            transfers={transfers}
            onUpdate={updateStatus}
            onHide={hideTransfer}
            onRestore={restoreTransfer}
            onRemove={(id) =>
              setConfirmingTransfer(
                transfers.find((item) => item.id === id) || null,
              )
            }
          />
        )}
      </section>
      {confirmingTransfer && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-transfer-title"
        >
          <div className="w-full max-w-md rounded-lg border border-[#294340] bg-[#0b1514] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2
                  id="remove-transfer-title"
                  className="text-[16px] font-semibold text-[#eef3f1]"
                >
                  Remove share transfer?
                </h2>
                <p className="mt-2 text-[11px] leading-5 text-[#9aabaa]">
                  This will permanently remove the {confirmingTransfer.symbol}{" "}
                  transfer for {Number(confirmingTransfer.quantity)} shares.
                  This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingTransfer(null)}
                aria-label="Close confirmation"
                className="text-[#819091] hover:text-white"
              >
                <X size={17} />
              </button>
            </div>
            {deleteError && (
              <p className="mt-3 rounded border border-[#402326] px-3 py-2 text-[11px] text-[#e57b7b]">
                {deleteError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmingTransfer(null)}
                className="rounded border border-[#294340] px-3 py-2 text-[11px] text-[#b7c4c2]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void removeTransfer(confirmingTransfer.id)}
                className="flex items-center gap-1.5 rounded bg-[#a94f58] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
              >
                <Trash2 size={14} />
                {deleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </StockPageChrome>
  );
}

function TransferTable({
  transfers,
  onUpdate,
  onHide,
  onRestore,
  onRemove,
}: {
  transfers: Transfer[];
  onUpdate: (id: string, status: Transfer["status"]) => Promise<void>;
  onHide: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
}) {
  return (
    <>
      <div className="grid grid-cols-[1.5fr_1.1fr_1fr_1fr_auto_auto] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
        <span>Transfer</span>
        <span>Deadline</span>
        <span>Amount</span>
        <span>Status</span>
        <span />
        <span />
      </div>
      {transfers.length === 0 ? (
        <p className="p-8 text-center text-xs text-[#758183]">
          No share transfers are pending.
        </p>
      ) : (
        transfers.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1.5fr_1.1fr_1fr_1fr_auto_auto] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px]"
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
                <option>MISSED</option>
                <option>CANCELLED</option>
              </select>
              {item.status === "TRANSFERRED" && (
                <Check size={13} className="text-[#57d1ae]" />
              )}
            </span>
            <button
              type="button"
              disabled={
                item.status !== "TRANSFERRED" &&
                item.status !== "MISSED" &&
                item.status !== "CANCELLED"
              }
              onClick={() =>
                void (item.is_hidden ? onRestore(item.id) : onHide(item.id))
              }
              aria-label={
                item.is_hidden
                  ? `Restore ${item.symbol} transfer`
                  : `Hide ${item.symbol} transfer`
              }
              title={
                item.is_hidden
                  ? "Show transfer"
                  : item.status === "TRANSFERRED" ||
                      item.status === "MISSED" ||
                      item.status === "CANCELLED"
                    ? "Hide transfer from this list"
                    : "Only transferred or missed requests can be hidden"
              }
              className="text-[#718582] hover:text-[#dcb66a] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {item.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              onClick={() => void onRemove(item.id)}
              aria-label={`Remove ${item.symbol} transfer`}
              title="Remove transfer"
              className="text-[#718582] hover:text-[#e57b7b]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </>
  );
}
