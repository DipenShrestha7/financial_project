import { ArrowDownLeft, ArrowRight, ArrowUpRight, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  bankApi,
  type BankAccount,
  type BankTransaction,
} from "../../services/banks";
import { BankPageChrome, Summary, date, money } from "./BankPageChrome";

const fieldClass =
  "bank-field h-10 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[12px] text-[#d4dfdd] outline-none placeholder:text-[#718582] focus:border-[#32c7aa] focus:ring-1 focus:ring-[#32c7aa]/30";
const selectClass = `${fieldClass} bank-select cursor-pointer`;

export default function BankAccounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);

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

      const targetId = accRes.accounts.some((a) => a.id === selectedAccountId)
        ? selectedAccountId
        : accRes.accounts[0]?.id || "";
      setSelectedAccountId(targetId);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load bank data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Transactions for the selected account
  const accountTransactions = transactions.filter(
    (tx) => tx.account_id === selectedAccount?.id && !tx.is_void,
  );

  // Last 5 transactions
  const recentTransactions = accountTransactions.slice(0, 5);

  // Inflow / Outflow calculation and category breakdowns for this account
  const inflowTransactions = accountTransactions.filter(
    (tx) =>
      tx.transaction_type === "INCOME" || tx.transaction_type === "TRANSFER_IN",
  );
  const totalInflow = inflowTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0,
  );

  const outflowTransactions = accountTransactions.filter(
    (tx) =>
      tx.transaction_type === "EXPENSE" ||
      tx.transaction_type === "TRANSFER_OUT",
  );
  const totalOutflow = outflowTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0,
  );

  // Inflow category breakdown
  const inflowCategories: Record<string, { total: number; count: number }> = {};
  for (const tx of inflowTransactions) {
    const cat = tx.category || "General Income";
    if (!inflowCategories[cat]) {
      inflowCategories[cat] = { total: 0, count: 0 };
    }
    inflowCategories[cat].total += Number(tx.amount);
    inflowCategories[cat].count += 1;
  }
  const topInflowCategories = Object.entries(inflowCategories).sort(
    (a, b) => b[1].total - a[1].total,
  );
  const maxInflowSpend = topInflowCategories[0]?.[1]?.total || 1;

  // Outflow category breakdown
  const outflowCategories: Record<string, { total: number; count: number }> =
    {};
  for (const tx of outflowTransactions) {
    const cat = tx.category || "General Expense";
    if (!outflowCategories[cat]) {
      outflowCategories[cat] = { total: 0, count: 0 };
    }
    outflowCategories[cat].total += Number(tx.amount);
    outflowCategories[cat].count += 1;
  }
  const topOutflowCategories = Object.entries(outflowCategories).sort(
    (a, b) => b[1].total - a[1].total,
  );
  const maxOutflowSpend = topOutflowCategories[0]?.[1]?.total || 1;

  const toggleAccountStatus = async (account: BankAccount) => {
    try {
      await bankApi.updateAccount(account.id, { isActive: !account.is_active });
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to update account status.",
      );
    }
  };

  return (
    <BankPageChrome
      activePage="bank-accounts"
      breadcrumb="Bank accounts"
      eyebrow="Banks / accounts"
      title="Accounts"
      description="Manage accounts, track balances, and inspect recent activity."
      accounts={accounts}
      selectedAccountId={selectedAccountId}
      onAccountChange={setSelectedAccountId}
      accountSelectorExtra={
        selectedAccount ? (
          <button
            onClick={() => void toggleAccountStatus(selectedAccount)}
            className={`flex h-10 items-center gap-1.5 rounded-md px-3 text-[11px] font-semibold transition-all ${
              selectedAccount.is_active
                ? "border border-[#265349] bg-[#0f2e27] text-[#50dcb9] hover:bg-[#163f35]"
                : "border border-[#384344] bg-[#141a1a] text-[#869596] hover:bg-[#1c2424]"
            }`}
            title="Click to toggle account status"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                selectedAccount.is_active ? "bg-[#32c7aa]" : "bg-[#718081]"
              }`}
            />
            {selectedAccount.is_active ? "Active" : "Inactive"}
          </button>
        ) : null
      }
      action={
        <button
          onClick={() => setFormOpen((open) => !open)}
          className="flex items-center justify-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311] hover:bg-[#5bdec8] transition-colors max-[680px]:w-full"
        >
          <Plus size={16} />
          {formOpen ? "Close form" : "Add account"}
        </button>
      }
    >
      {/* Create Account Form */}
      {formOpen && (
        <div className="mb-6 rounded-lg border border-[#203a38] bg-[#0b1514] p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between border-b border-[#1b2525] pb-3">
            <h3 className="text-[14px] font-semibold text-[#eef3f1]">
              Add new bank account or wallet
            </h3>
            <button
              onClick={() => setFormOpen(false)}
              className="text-[#728584] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <AccountForm
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

      {/* Upper Metrics / Summaries */}
      <section className="mb-5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
        <Summary
          label="Available Balance"
          value={
            loading
              ? "Loading..."
              : selectedAccount
                ? money(selectedAccount.current_balance)
                : "Rs. 0.00"
          }
          detail={
            selectedAccount
              ? `${selectedAccount.bank_name || "Self-managed"} (${selectedAccount.account_type.toLowerCase()})`
              : "Derived from ledger"
          }
          detailTone="positive"
        />
        <Summary
          label="Total Inflow"
          value={money(totalInflow)}
          detail={`${inflowTransactions.length} credit entries`}
          detailTone="positive"
        />
        <Summary
          label="Total Outflow"
          value={money(totalOutflow)}
          detail={`${outflowTransactions.length} debit entries`}
          detailTone="negative"
        />
      </section>

      {/* Main Content Area */}
      {selectedAccount ? (
        <div className="grid grid-cols-1 gap-5">
          {/* Activity Breakdown (Separated into Inflow and Outflow) */}
          <section className="rounded-xl border border-[#1b2b2b] bg-[#0a1112] p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#152223] pb-4">
              <div>
                <h2 className="text-[14px] font-semibold text-[#e8efed]">
                  Activity Breakdown
                </h2>
              </div>

              {/* Net Cashflow */}
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#718582]">Net Cashflow:</span>
                <span
                  className={`font-semibold ${
                    totalInflow - totalOutflow >= 0
                      ? "text-[#48d2b0]"
                      : "text-[#e8908f]"
                  }`}
                >
                  {totalInflow - totalOutflow >= 0 ? "+" : ""}
                  {money(totalInflow - totalOutflow)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 divide-x divide-[#152223] max-[768px]:grid-cols-1 max-[768px]:divide-x-0 max-[768px]:gap-6">
              {/* Inflow Breakdown Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#32c7aa]" />
                    <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#a4b8b5]">
                      Inflow
                    </h3>
                  </div>
                  <span className="text-[12px] font-bold text-[#48d2b0]">
                    +{money(totalInflow)}
                  </span>
                </div>

                {topInflowCategories.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#5e716e]">
                    No inflow recorded for this account.
                  </p>
                ) : (
                  <div className="space-y-3.5 pt-1">
                    {topInflowCategories.map(([category, info]) => {
                      const percentage = Math.round(
                        (info.total / maxInflowSpend) * 100,
                      );
                      const shareOfTotal =
                        totalInflow > 0
                          ? Math.round((info.total / totalInflow) * 100)
                          : 0;
                      return (
                        <div key={category} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-[#c8d8d5]">
                              {category}
                              <span className="ml-1.5 text-[10px] text-[#637774]">
                                ({info.count} {info.count === 1 ? "tx" : "txs"}{" "}
                                · {shareOfTotal}%)
                              </span>
                            </span>
                            <span className="font-semibold text-[#48d2b0]">
                              +{money(info.total)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#11201e] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#32c7aa] transition-all"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Outflow Breakdown Column */}
              <div className="space-y-4 max-[768px]:pt-2 max-[768px]:border-t max-[768px]:border-[#152223] min-[769px]:pl-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#d76c6d]" />
                    <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#b8a4a6]">
                      Outflow
                    </h3>
                  </div>
                  <span className="text-[12px] font-bold text-[#e8908f]">
                    -{money(totalOutflow)}
                  </span>
                </div>

                {topOutflowCategories.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#715e60]">
                    No outflow recorded for this account.
                  </p>
                ) : (
                  <div className="space-y-3.5 pt-1">
                    {topOutflowCategories.map(([category, info]) => {
                      const percentage = Math.round(
                        (info.total / maxOutflowSpend) * 100,
                      );
                      const shareOfTotal =
                        totalOutflow > 0
                          ? Math.round((info.total / totalOutflow) * 100)
                          : 0;
                      return (
                        <div key={category} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-[#d8c8ca]">
                              {category}
                              <span className="ml-1.5 text-[10px] text-[#776365]">
                                ({info.count} {info.count === 1 ? "tx" : "txs"}{" "}
                                · {shareOfTotal}%)
                              </span>
                            </span>
                            <span className="font-semibold text-[#e8908f]">
                              -{money(info.total)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#201214] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#d76c6d] transition-all"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Recent Transactions Section */}
          <section className="rounded-xl border border-[#1b2b2b] bg-[#0a1112] px-6 pt-5 pb-1 shadow-sm">
            <div className="mb-1 flex items-center justify-between border-b border-[#152223] pb-4">
              <div>
                <h2 className="text-[14px] font-semibold text-[#e8efed]">
                  Recent Transactions
                </h2>
              </div>
              <button
                onClick={() => navigate("/banks/transactions")}
                className="flex items-center gap-1 text-[11px] font-medium text-[#5ecdb7] hover:underline"
              >
                View all transactions <ArrowRight size={13} />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#718582]">
                No recent activity found for this account.
              </p>
            ) : (
              <div className="divide-y divide-[#152223]">
                {recentTransactions.map((tx) => {
                  const isCredit =
                    tx.transaction_type === "INCOME" ||
                    tx.transaction_type === "TRANSFER_IN";
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-md hover:bg-[#0e1718] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center justify-center ${
                            isCredit ? "text-[#48d2b0]" : "text-[#e8908f]"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft size={16} />
                          ) : (
                            <ArrowUpRight size={16} />
                          )}
                        </span>
                        <div>
                          <strong className="block text-[12px] font-medium text-[#d4dfdd]">
                            {tx.category || "General"}
                          </strong>
                          <span className="text-[10px] text-[#6d8280]">
                            {date(tx.transaction_date)}
                            {tx.description ? ` · ${tx.description}` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <strong
                          className={`block text-[12px] font-semibold ${
                            isCredit ? "text-[#48d2b0]" : "text-[#e8908f]"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {money(tx.amount)}
                        </strong>
                        <span className="text-[9px] uppercase tracking-wider text-[#617472]">
                          {tx.transaction_type === "INCOME"
                            ? "Income"
                            : tx.transaction_type === "EXPENSE"
                              ? "Expense"
                              : "Transfer"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-lg border border-[#1e3432] bg-[#0b1413] p-12 text-center text-xs text-[#718582]">
          No bank accounts found. Click "Add account" to create your first
          source.
        </div>
      )}
    </BankPageChrome>
  );
}

function AccountForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("SAVINGS");
  const [masked, setMasked] = useState("");
  const [amount, setAmount] = useState("");
  const [dateValue, setDateValue] = useState(
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
      await bankApi.addAccount({
        name,
        bankName,
        accountType,
        accountNumberMasked: masked,
        openingBalance: Number(amount),
        openingBalanceDate: dateValue,
      });
      onDone();
    } catch (caught) {
      setSaving(false);
      setMessage(
        caught instanceof Error ? caught.message : "Could not save account.",
      );
    }
  };

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-2 gap-3 text-[12px] max-[680px]:grid-cols-1"
    >
      <input
        required
        placeholder="Account name (e.g. Primary Savings)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={fieldClass}
      />
      <input
        placeholder="Bank / provider (e.g. Nabil Bank, eSewa)"
        value={bankName}
        onChange={(e) => setBankName(e.target.value)}
        className={fieldClass}
      />
      <select
        value={accountType}
        onChange={(e) => setAccountType(e.target.value)}
        className={selectClass}
      >
        <option value="SAVINGS">SAVINGS</option>
        <option value="CURRENT">CURRENT</option>
        <option value="WALLET">WALLET</option>
        <option value="CASH">CASH</option>
      </select>
      <input
        placeholder="Masked number, e.g. •••• 3021"
        value={masked}
        onChange={(e) => setMasked(e.target.value)}
        className={fieldClass}
      />
      <input
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Opening balance"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
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
          {saving ? "Saving account..." : "Save Account"}
        </button>
      </div>
      {message && (
        <p className="col-span-2 text-xs text-[#e57b7b]">{message}</p>
      )}
    </form>
  );
}
