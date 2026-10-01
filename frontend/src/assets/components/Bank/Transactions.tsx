import {
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  bankApi,
  type BankAccount,
  type BankTransaction,
} from "../../services/banks";
import { BankPageChrome, Summary, date, money } from "./BankPageChrome";

const fieldClass =
  "bank-field h-10 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[12px] text-[#d4dfdd] outline-none placeholder:text-[#718582] focus:border-[#32c7aa] focus:ring-1 focus:ring-[#32c7aa]/30";
const selectClass = `${fieldClass} bank-select cursor-pointer`;

export default function BankTransactions() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [voidingId, setVoidingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [accRes, txRes] = await Promise.all([
        bankApi.accounts(),
        bankApi.transactions(),
      ]);
      setAccounts(accRes.accounts);
      setTransactions(txRes.transactions);
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
  }, []);

  const handleVoid = async (id: string) => {
    try {
      setVoidingId(id);
      await bankApi.voidTransaction(id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not void transaction.",
      );
    } finally {
      setVoidingId(null);
    }
  };

  // Filter transactions
  const filtered = transactions.filter((item) => {
    const matchesAccount =
      selectedAccountId === "ALL" || item.account_id === selectedAccountId;
    const matchesType =
      filterType === "ALL"
        ? true
        : filterType === "INCOME"
          ? item.transaction_type === "INCOME" ||
            item.transaction_type === "TRANSFER_IN"
          : filterType === "EXPENSE"
            ? item.transaction_type === "EXPENSE" ||
              item.transaction_type === "TRANSFER_OUT"
            : filterType === "TRANSFER"
              ? item.transaction_type.startsWith("TRANSFER")
              : item.transaction_type === filterType;
    const matchesQuery =
      searchQuery.trim() === "" ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.account_name &&
        item.account_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesAccount && matchesType && matchesQuery;
  });

  const activeNonVoid = filtered.filter((t) => !t.is_void);
  const totalVolumeIn = activeNonVoid
    .filter(
      (t) =>
        t.transaction_type === "INCOME" || t.transaction_type === "TRANSFER_IN",
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalVolumeOut = activeNonVoid
    .filter(
      (t) =>
        t.transaction_type === "EXPENSE" ||
        t.transaction_type === "TRANSFER_OUT",
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingCount = activeNonVoid.filter(
    (t) => t.status === "PENDING",
  ).length;
  const voidCount = filtered.filter((t) => t.is_void).length;

  return (
    <BankPageChrome
      activePage="bank-transactions"
      breadcrumb="Bank transactions"
      eyebrow="Banks / transactions"
      title="Transactions"
      description="Review every cash movement, manage deposits, withdrawals, and paired transfers across all your accounts."
      accounts={accounts}
      selectedAccountId={selectedAccountId}
      onAccountChange={setSelectedAccountId}
      showAllOption={true}
      allOptionLabel="All accounts"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="flex items-center gap-1.5 rounded-md border border-[#264440] bg-[#0c1817] px-3 py-2.5 text-[11px] font-medium text-[#5ecdb7] hover:bg-[#102220]"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setFormOpen((open) => !open)}
            className="flex items-center justify-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311] hover:bg-[#5bdec8] max-[680px]:w-full"
          >
            <Plus size={16} />
            {formOpen ? "Close form" : "Record transaction"}
          </button>
        </div>
      }
    >
      {/* Transaction Form */}
      {formOpen && (
        <div className="mb-6 rounded-lg border border-[#203a38] bg-[#0b1514] p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between border-b border-[#1b2525] pb-3">
            <h3 className="text-[14px] font-semibold text-[#eef3f1]">
              Record new transaction or transfer
            </h3>
            <button
              onClick={() => setFormOpen(false)}
              className="text-[#728584] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <TransactionForm
            accounts={accounts}
            preselectedAccountId={
              selectedAccountId !== "ALL" ? selectedAccountId : accounts[0]?.id
            }
            onDone={() => {
              setFormOpen(false);
              void load();
            }}
          />
        </div>
      )}

      {error && (
        <p className="mb-4 rounded border border-[#402326] bg-[#1a0f10] px-3.5 py-3 text-xs text-[#e57b7b]">
          {error}
        </p>
      )}

      {/* Summary Cards */}
      <section className="mb-5 grid grid-cols-4 gap-3.5 max-[950px]:grid-cols-2 max-[600px]:grid-cols-1">
        <Summary
          label="Total Records"
          value={String(filtered.length)}
          detail={`${activeNonVoid.length} active ledger records`}
          detailTone="neutral"
        />
        <Summary
          label="Total Inflow"
          value={money(totalVolumeIn)}
          detail="Total credits received"
          detailTone="positive"
        />
        <Summary
          label="Total Outflow"
          value={money(totalVolumeOut)}
          detail="Total debits recorded"
          detailTone="negative"
        />
        <Summary
          label="Pending & Voids"
          value={`${pendingCount} / ${voidCount}`}
          detail={`${pendingCount} pending · ${voidCount} voided`}
          detailTone="neutral"
        />
      </section>

      {/* Filters Bar & Ledger Table */}
      <section className="rounded-xl border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5 shadow-lg">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#172524] pb-4">
          {/* Type Pills */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              { id: "ALL", label: "All Types" },
              { id: "INCOME", label: "Income" },
              { id: "EXPENSE", label: "Expenses" },
              { id: "TRANSFER", label: "Transfers" },
              { id: "ADJUSTMENT", label: "Adjustments" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  filterType === tab.id
                    ? "bg-[#183d35] text-[#4dd9b6] border border-[#235b4f]"
                    : "bg-[#0c1415] text-[#869997] hover:bg-[#121e1f] hover:text-[#c4d6d4]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative min-w-55 max-[600px]:w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5e7371]"
            />
            <input
              type="text"
              placeholder="Search category, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-[#223936] bg-[#071110] pl-8.5 pr-3 text-[11px] text-[#d4dfdd] outline-none placeholder:text-[#617472] focus:border-[#32c7aa]"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[1.8fr_1.1fr_1fr_1fr_1.1fr] gap-3 px-3.5 py-2.5 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[750px]:hidden">
            <span>Transaction</span>
            <span>Account</span>
            <span>Date</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status / Action</span>
          </div>

          {loading ? (
            <p className="px-3.5 py-10 text-center text-xs text-[#758183]">
              Loading transactions...
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3.5 py-10 text-center text-xs text-[#758183]">
              No transactions match your current filters.
            </p>
          ) : (
            <div className="divide-y divide-[#151f1f]">
              {filtered.map((item) => {
                const isCredit =
                  item.transaction_type === "INCOME" ||
                  item.transaction_type === "TRANSFER_IN";

                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[1.8fr_1.1fr_1fr_1fr_1.1fr] items-center gap-3 px-3.5 py-3 text-[11px] transition-colors hover:bg-[#0c1414] max-[750px]:grid-cols-2 max-[750px]:gap-2 ${
                      item.is_void ? "opacity-45" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                          item.is_void
                            ? "bg-[#212727] text-[#869595]"
                            : isCredit
                              ? "bg-[#102c26] text-[#57d1ae]"
                              : "bg-[#321a1c] text-[#e57b7b]"
                        }`}
                      >
                        {item.is_void ? (
                          <Ban size={14} />
                        ) : isCredit ? (
                          <ArrowDownLeft size={15} />
                        ) : (
                          <ArrowUpRight size={15} />
                        )}
                      </span>
                      <div>
                        <strong className="block text-[#d0dfdd]">
                          {item.category}
                        </strong>
                        <small className="block text-[10px] text-[#697c7a]">
                          {item.description || item.transaction_type}
                        </small>
                      </div>
                    </div>

                    <span className="text-[#99aba9] max-[750px]:text-right">
                      {item.account_name || "Account"}
                    </span>

                    <span className="text-[#7f9492] max-[750px]:hidden">
                      {date(item.transaction_date)}
                    </span>

                    <span
                      className={`text-right font-medium ${
                        item.is_void
                          ? "text-[#7f8f8e] line-through"
                          : isCredit
                            ? "text-[#57d1ae]"
                            : "text-[#e57b7b]"
                      }`}
                    >
                      {item.is_void ? "" : isCredit ? "+" : "-"}
                      {money(item.amount)}
                    </span>

                    <div className="flex items-center justify-end gap-2 max-[750px]:col-span-2">
                      <span
                        className={`rounded px-1.75 py-0.5 text-[9px] font-medium ${
                          item.is_void
                            ? "bg-[#252a2a] text-[#8a9998]"
                            : item.status === "PENDING"
                              ? "bg-[#2a2412] text-[#e2ba64]"
                              : "bg-[#12282c] text-[#59cad9]"
                        }`}
                      >
                        {item.is_void
                          ? "VOIDED"
                          : item.status === "PENDING"
                            ? "Pending"
                            : item.transaction_type}
                      </span>

                      {!item.is_void && (
                        <button
                          onClick={() => void handleVoid(item.id)}
                          disabled={voidingId === item.id}
                          title="Void transaction"
                          className="rounded border border-[#2c3d3b] p-1 text-[#748785] hover:border-[#a54c50] hover:text-[#e57b7b] transition-colors disabled:opacity-40"
                        >
                          <Ban size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </BankPageChrome>
  );
}

function TransactionForm({
  accounts,
  preselectedAccountId,
  onDone,
}: {
  accounts: BankAccount[];
  preselectedAccountId?: string;
  onDone: () => void;
}) {
  const activeAccounts = accounts.filter((a) => a.is_active);
  const [accountId, setAccountId] = useState(
    preselectedAccountId || activeAccounts[0]?.id || "",
  );
  const [toAccountId, setToAccountId] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [dateValue, setDateValue] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");

    try {
      if (type === "TRANSFER") {
        await bankApi.transfer({
          accountId,
          toAccountId,
          amount: Number(amount),
          category: category || "Internal transfer",
          description: description || undefined,
          transactionDate: dateValue,
        });
      } else {
        await bankApi.addTransaction({
          accountId,
          type,
          amount: Number(amount),
          category: category || "General",
          description: description || undefined,
          transactionDate: dateValue,
          status: type === "INCOME" ? "RECEIVED" : "PAID",
        });
      }
      onDone();
    } catch (caught) {
      setSaving(false);
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not save transaction.",
      );
    }
  };

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-2 gap-3 text-[12px] max-[680px]:grid-cols-1"
    >
      <select
        required
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        className={selectClass}
      >
        <option value="">Choose source account</option>
        {activeAccounts.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.bank_name || "Self"})
          </option>
        ))}
      </select>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={selectClass}
      >
        <option value="EXPENSE">EXPENSE</option>
        <option value="INCOME">INCOME</option>
        <option value="TRANSFER">TRANSFER</option>
        <option value="ADJUSTMENT">ADJUSTMENT</option>
      </select>

      {type === "TRANSFER" && (
        <select
          required
          value={toAccountId}
          onChange={(e) => setToAccountId(e.target.value)}
          className={`col-span-2 ${selectClass} max-[680px]:col-span-1`}
        >
          <option value="">Transfer to destination account...</option>
          {activeAccounts
            .filter((item) => item.id !== accountId)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.bank_name || "Wallet"})
              </option>
            ))}
        </select>
      )}

      <input
        required
        type="number"
        min={type === "ADJUSTMENT" ? undefined : "0.01"}
        step="0.01"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={fieldClass}
      />

      <input
        required
        placeholder="Category (e.g. Salary, Groceries, Utilities)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={fieldClass}
      />

      <input
        placeholder="Description / notes (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={fieldClass}
      />

      <input
        required
        type="date"
        value={dateValue}
        onChange={(e) => setDateValue(e.target.value)}
        className={fieldClass}
      />

      <div className="col-span-2 flex items-center justify-end gap-2 pt-2 max-[680px]:col-span-1">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[#32c7aa] px-4 py-2 font-bold text-[#041311] hover:bg-[#5bdec8] disabled:opacity-60 transition-colors"
        >
          {saving ? "Saving..." : "Record Transaction"}
        </button>
      </div>

      {message && (
        <p className="col-span-2 text-xs text-[#e57b7b]">{message}</p>
      )}
    </form>
  );
}
