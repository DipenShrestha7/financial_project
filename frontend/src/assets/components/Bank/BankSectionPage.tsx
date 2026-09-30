import { ArrowDownLeft, ArrowUpRight, Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardLayout, { type PageKey } from "../Sidebar";
import {
  bankApi,
  type BankAccount,
  type BankTransaction,
} from "../../services/banks";

type Mode = "accounts" | "transactions" | "income" | "expenses";
const fieldClass =
  "bank-field h-11 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[13px] text-[#d4dfdd] outline-none placeholder:text-[#718582] focus:border-[#32c7aa] focus:ring-2 focus:ring-[#32c7aa]/20";
const selectClass = `${fieldClass} bank-select cursor-pointer`;
const money = (value: number | string) =>
  `Rs. ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function BankSectionPage({
  mode,
  activePage,
  breadcrumb,
  eyebrow,
  title,
  description,
}: {
  mode: Mode;
  activePage: PageKey;
  breadcrumb: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const accountResult = await bankApi.accounts();
      setAccounts(accountResult.accounts);
      if (mode !== "accounts")
        setTransactions((await bankApi.transactions()).transactions);
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
  }, [mode]);
  const visible = transactions.filter(
    (item) =>
      !item.is_void &&
      (mode === "income"
        ? item.transaction_type === "INCOME"
        : mode === "expenses"
          ? item.transaction_type === "EXPENSE"
          : true),
  );
  const total = accounts
    .filter((item) => item.is_active)
    .reduce((sum, item) => sum + Number(item.current_balance), 0);
  return (
    <DashboardLayout activePage={activePage} breadcrumb={breadcrumb}>
      <div className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7">
        <div className="mb-8 flex items-end justify-between max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-4.5">
          <div>
            <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              {eyebrow}
            </p>
            <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
              {title}
            </h1>
            <p className="text-[12px] text-[#758183]">{description}</p>
          </div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center justify-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311] hover:bg-[#5bdec8] max-[680px]:w-full"
          >
            <Plus size={16} />
            {mode === "accounts" ? "Add account" : "Record transaction"}
          </button>
        </div>
        {formOpen && (
          <BankForm
            mode={mode}
            accounts={accounts}
            onDone={() => {
              setFormOpen(false);
              void load();
            }}
          />
        )}
        <section className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
          <Summary
            label={
              mode === "accounts"
                ? "Total liquidity"
                : mode === "income"
                  ? "Income records"
                  : mode === "expenses"
                    ? "Expense records"
                    : "Active accounts"
            }
            value={mode === "accounts" ? money(total) : String(visible.length)}
            detail={
              mode === "accounts"
                ? `${accounts.filter((item) => item.is_active).length} active sources`
                : "Derived from the ledger"
            }
          />
          <Summary
            label="Pending"
            value={String(
              visible.filter((item) => item.status === "PENDING").length,
            )}
            detail="Awaiting settlement"
          />
          <Summary
            label="Audit trail"
            value={String(visible.filter((item) => item.is_void).length)}
            detail="Voids preserve history"
          />
        </section>
        <section className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
          <div className="border-t border-[#1b2222]">
            {error && (
              <p className="border-b border-[#402326] px-3.75 py-4 text-xs text-[#e57b7b]">
                {error}
              </p>
            )}
            {loading ? (
              <p className="px-3.75 py-8 text-xs text-[#758183]">
                Loading bank records...
              </p>
            ) : mode === "accounts" ? (
              <AccountRows
                accounts={accounts}
                onToggle={async (id, isActive) => {
                  await bankApi.updateAccount(id, { isActive: !isActive });
                  await load();
                }}
              />
            ) : (
              <TransactionRows
                transactions={visible}
                onVoid={async (id) => {
                  await bankApi.voidTransaction(id);
                  await load();
                }}
              />
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function BankForm({
  mode,
  accounts,
  onDone,
}: {
  mode: Mode;
  accounts: BankAccount[];
  onDone: () => void;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [toAccountId, setToAccountId] = useState("");
  const [type, setType] = useState(
    mode === "income" ? "INCOME" : mode === "expenses" ? "EXPENSE" : "INCOME",
  );
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("SAVINGS");
  const [masked, setMasked] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dateValue, setDateValue] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [message, setMessage] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "accounts")
        await bankApi.addAccount({
          name,
          bankName,
          accountType,
          accountNumberMasked: masked,
          openingBalance: Number(amount),
          openingBalanceDate: dateValue,
        });
      else if (type === "TRANSFER")
        await bankApi.transfer({
          accountId,
          toAccountId,
          amount: Number(amount),
          category,
          transactionDate: dateValue,
        });
      else
        await bankApi.addTransaction({
          accountId,
          type,
          amount: Number(amount),
          category,
          transactionDate: dateValue,
          status: type === "INCOME" ? "RECEIVED" : "PAID",
        });
      onDone();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not save bank record.",
      );
    }
  };
  return (
    <form
      onSubmit={submit}
      className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-[#203a38] bg-[#0b1514] p-5 text-[13px] max-[680px]:grid-cols-1"
    >
      {mode === "accounts" ? (
        <>
          <input
            required
            placeholder="Account name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
          <input
            placeholder="Bank / provider"
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            className={fieldClass}
          />
          <select
            value={accountType}
            onChange={(event) => setAccountType(event.target.value)}
            className={selectClass}
          >
            <option>SAVINGS</option>
            <option>CURRENT</option>
            <option>WALLET</option>
            <option>CASH</option>
          </select>
          <input
            placeholder="Masked number, e.g. •••• 3021"
            value={masked}
            onChange={(event) => setMasked(event.target.value)}
            className={fieldClass}
          />
          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Opening balance"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={fieldClass}
          />
        </>
      ) : (
        <>
          <select
            required
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className={selectClass}
          >
            <option value="">Choose account</option>
            {accounts
              .filter((item) => item.is_active)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {mode === "transactions" && (
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className={selectClass}
            >
              <option>INCOME</option>
              <option>EXPENSE</option>
              <option>TRANSFER</option>
              <option>ADJUSTMENT</option>
            </select>
          )}
          {type === "TRANSFER" && (
            <select
              required
              value={toAccountId}
              onChange={(event) => setToAccountId(event.target.value)}
              className={selectClass}
            >
              <option value="">Transfer to...</option>
              {accounts
                .filter((item) => item.is_active && item.id !== accountId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
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
            onChange={(event) => setAmount(event.target.value)}
            className={fieldClass}
          />
          <input
            required
            placeholder="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={fieldClass}
          />
        </>
      )}
      <input
        required
        type="date"
        value={dateValue}
        onChange={(event) => setDateValue(event.target.value)}
        className={fieldClass}
      />
      <button className="rounded bg-[#32c7aa] px-3 py-2 font-bold text-[#041311]">
        Save
      </button>
      {message && <p className="col-span-2 text-[#e57b7b]">{message}</p>}
    </form>
  );
}

function Header({ columns }: { columns: string[] }) {
  return (
    <div className="grid grid-cols-[1.5fr_1.1fr_1fr_1fr] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
      {columns.map((column) => (
        <span key={column}>{column}</span>
      ))}
    </div>
  );
}
function AccountRows({
  accounts,
  onToggle,
}: {
  accounts: BankAccount[];
  onToggle: (id: string, isActive: boolean) => Promise<void>;
}) {
  return (
    <>
      <Header columns={["Account", "Type", "Balance", "Status"]} />
      {accounts.length === 0 ? (
        <Empty text="No accounts yet. Add a bank, wallet, or cash source." />
      ) : (
        accounts.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1.5fr_1.1fr_1fr_1fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px]"
          >
            <div>
              <strong className="block text-[#c4d2d0]">{item.name}</strong>
              <small className="text-[#647374]">
                {item.bank_name || "Personal source"}{" "}
                {item.account_number_masked || ""}
              </small>
            </div>
            <span className="text-[#a5b4b3]">{item.account_type}</span>
            <span className="text-[#d4dfdd]">
              {money(item.current_balance)}
            </span>
            <button
              onClick={() => void onToggle(item.id, item.is_active)}
              className={item.is_active ? "text-[#57d1ae]" : "text-[#758183]"}
            >
              {item.is_active ? "Active" : "Inactive"}
            </button>
          </div>
        ))
      )}
    </>
  );
}
function TransactionRows({
  transactions,
  onVoid,
}: {
  transactions: BankTransaction[];
  onVoid: (id: string) => Promise<void>;
}) {
  return (
    <>
      <Header columns={["Transaction", "Account", "Amount", "Type"]} />
      {transactions.length === 0 ? (
        <Empty text="No transactions recorded yet." />
      ) : (
        transactions.map((item) => {
          const inflow =
            item.transaction_type === "INCOME" ||
            item.transaction_type === "TRANSFER_IN";
          return (
            <div
              key={item.id}
              className="grid grid-cols-[1.5fr_1.1fr_1fr_1fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${inflow ? "bg-[#102c26] text-[#57d1ae]" : "bg-[#321a1c] text-[#e57b7b]"}`}
                >
                  {inflow ? (
                    <ArrowDownLeft size={14} />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                </span>
                <div>
                  <strong className="block text-[#c4d2d0]">
                    {item.category}
                  </strong>
                  <small className="text-[#647374]">
                    {date(item.transaction_date)} ·{" "}
                    {item.description || item.transaction_type}
                  </small>
                </div>
              </div>
              <span className="text-[#9aabaa]">
                {item.account_name || "Account"}
              </span>
              <span className={inflow ? "text-[#57d1ae]" : "text-[#e57b7b]"}>
                {inflow ? "+" : "-"}
                {money(item.amount)}
              </span>
              <span className="flex items-center justify-end gap-2">
                <span className="rounded-sm bg-[#112631] px-1.75 py-1 text-[8px] text-[#6ebfe1]">
                  {item.status === "PENDING"
                    ? "Pending"
                    : item.transaction_type}
                </span>
                {!item.is_void && (
                  <button
                    onClick={() => void onVoid(item.id)}
                    aria-label="Void transaction"
                    className="text-[#758183] hover:text-[#e57b7b]"
                  >
                    <Check size={13} />
                  </button>
                )}
              </span>
            </div>
          );
        })
      )}
    </>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="px-3.75 py-10 text-center text-xs text-[#758183]">{text}</p>
  );
}
function Summary({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-[#203034] bg-[#0b1112] p-4.5">
      <span className="text-[10px] text-[#aab6b6]">{label}</span>
      <strong className="mt-3 block text-[22px] font-semibold text-[#eff4f2]">
        {value}
      </strong>
      <p className="mt-1 text-[9px] text-[#57d1ae]">{detail}</p>
    </article>
  );
}
