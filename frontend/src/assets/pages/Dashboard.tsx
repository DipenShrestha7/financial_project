import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  MoreHorizontal,
  Plus,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { getSessionCookie } from "../services/auth";
import { bankApi } from "../services/banks";
import { useEffect, useState } from "react";

const feed = [
  ["BUY", "MeroShare Â· CHDC", "Rs. 1,000", "10", "blue", "Transferred"],
  ["INCOME", "Salary Â· September", "Rs. 85,000", "1", "green", "Income"],
  ["EXPENSE", "Utilities Â· Electricity", "Rs. 4,200", "1", "red", "Expense"],
  ["TRANSFER", "Bank to Wallet", "Rs. 12,000", "1", "amber", "Transferred"],
];

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  badge,
  tone,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
  detail: string;
  badge: string;
  tone: "mint" | "sky" | "gold";
}) {
  const iconStyle =
    tone === "mint"
      ? "bg-[#113d35] text-[#69d6c0]"
      : tone === "sky"
        ? "bg-[#16313b] text-[#8dc1e0]"
        : "bg-[#332d1b] text-[#e6c781]";
  const badgeStyle =
    tone === "mint"
      ? "text-[#51d3b5]"
      : tone === "sky"
        ? "text-[#75bce2]"
        : "text-[#d6b568]";
  const borderStyle =
    tone === "mint"
      ? "border-[#196658] after:bg-[#1bcea9]"
      : tone === "sky"
        ? "after:bg-[#48a6d8]"
        : "after:bg-[#d7aa51]";
  return (
    <article
      className={`relative min-h-31.75 overflow-hidden rounded-md border bg-[#0c1010] pt-4.5 px-4.75 pb-4 after:absolute after:-bottom-18.75 after:-right-16.25 after:h-30 after:w-30 after:rounded-full after:opacity-[.12] ${borderStyle}`}
    >
      <div className="flex items-center justify-between text-[11px] text-[#aab6b6]">
        <span>{label}</span>
        <span
          className={`grid h-6 w-6 place-items-center rounded-md ${iconStyle}`}
        >
          <Icon size={14} />
        </span>
      </div>
      <strong className="mt-3 block text-[23px] font-semibold tracking-[-.8px] text-[#eff4f2]">
        {value}
      </strong>
      <div className="flex text-[10px] text-[#6d7a7c]">
        {detail}
        <span className={`ml-0.75 ${badgeStyle}`}>{badge}</span>
      </div>
    </article>
  );
}

function MiniStat({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="min-w-31.25 rounded border border-[#1b302e] bg-[#030a0aa6] px-2.75 py-2.25">
      <span className="mb-1 block text-[9px] text-[#697777]">{label}</span>
      <strong
        className={
          positive ? "text-[11px] text-[#5ad1b5]" : "text-[11px] text-[#dbe8e5]"
        }
      >
        {value}
      </strong>
    </div>
  );
}
function Account({
  color,
  letter,
  name,
  detail,
  value,
}: {
  color: string;
  letter: string;
  name: string;
  detail: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[19px_1fr_auto] items-center gap-1.75 border-t border-[#182b30] py-1.5">
      <span
        className={`grid h-4.5 w-4.5 place-items-center rounded-full text-[9px] font-bold text-[#071011] ${color}`}
      >
        {letter}
      </span>
      <span>
        <strong className="block text-[8px] font-medium text-[#d1dfe0]">
          {name}
        </strong>
        <small className="mt-0.5 block text-[8px] text-[#637679]">
          {detail}
        </small>
      </span>
      <b className="text-[8px] font-medium text-[#b9cbcd]">{value}</b>
    </div>
  );
}

function ManagerPanel({ stock = false }: { stock?: boolean }) {
  return (
    <article
      className={`relative min-h-72.5 overflow-hidden rounded-lg border px-5.5 py-5.25 ${stock ? "border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112]" : "border-[#1f3947] bg-linear-to-br from-[#0b151a] to-[#0a1113]"}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
            {stock ? "Portfolio snapshot" : "Cash flow overview"}
          </span>
          <h2 className="text-[14px] font-semibold uppercase text-[#eef3f1]">
            {stock ? "Stock manager" : "Bank / fund & account manager"}
          </h2>
        </div>
        <button className="p-1.25 text-[#8a999a]" aria-label="Panel options">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <p className="mt-3 max-w-68.75 text-[11px] leading-[1.55] text-[#a0adae]">
        {stock
          ? "Record transactions, track IPOs, lots, cost basis, bonus/right shares, and track MeroShare transfers."
          : "Manually track incomes, expenses, adjust balances, and record internal bank-to-bank transfers without affecting net cash flow."}
      </p>
      {stock ? (
        <>
          <div className="relative flex gap-2.5">
            <MiniStat label="Portfolio value" value="Rs. 2,850,500" />
            <MiniStat label="Unrealized P/L" value="+ Rs. 420,150" positive />
          </div>
          <div className="absolute right-5.75 top-11.25 w-[42%] text-[#39c5a8] max-[680px]:relative max-[680px]:right-auto max-[680px]:top-auto max-[680px]:mt-5.5 max-[680px]:w-full">
            <span className="flex justify-between text-[9px] text-[#6b7d7b]">
              30D performance <strong className="text-[#57ceb2]">+8.4%</strong>
            </span>
            <svg
              viewBox="0 0 260 60"
              preserveAspectRatio="none"
              className="h-15 w-full"
              aria-label="Portfolio performance chart"
            >
              <path
                d="M0 50 C22 49 27 36 48 41 S72 49 91 31 S117 43 134 30 S154 22 171 26 S192 8 211 18 S235 12 260 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                d="M0 50 C22 49 27 36 48 41 S72 49 91 31 S117 43 134 30 S154 22 171 26 S192 8 211 18 S235 12 260 3 V60 H0Z"
                fill="currentColor"
                opacity=".08"
              />
            </svg>
          </div>
        </>
      ) : (
        <div className="absolute right-5.25 top-12 w-[40%] rounded-md border border-[#203640] bg-[#03090bad] p-2.5 max-[680px]:relative max-[680px]:right-auto max-[680px]:top-auto max-[680px]:mt-5 max-[680px]:w-full">
          <div className="mb-2 flex justify-between text-[8px] uppercase tracking-[.7px] text-[#7d9ba2]">
            Linked accounts{" "}
            <span className="normal-case tracking-normal text-[#4f7881]">
              3 active
            </span>
          </div>
          <Account
            color="bg-[#6bb5cf]"
            letter="N"
            name="Nabil Bank"
            detail="Primary account"
            value="Rs. 960,300"
          />
          <Account
            color="bg-[#e4915d]"
            letter="S"
            name="Sanima Bank"
            detail="Savings account"
            value="Rs. 300,000"
          />
          <Account
            color="bg-[#5bc59e]"
            letter="W"
            name="Cash wallet"
            detail="Available balance"
            value="Rs. 140,000"
          />
        </div>
      )}
      <button className="absolute bottom-5 left-5.5 flex items-center gap-2 rounded-md bg-[#dce9e7] px-3.25 py-2.5 text-[11px] font-semibold text-[#0b1716] hover:bg-white max-[680px]:left-4.75">
        Go to {stock ? "stock" : "bank"} manager <ArrowUpRight size={15} />
      </button>
    </article>
  );
}

function Dashboard() {
  const session = getSessionCookie();
  const [bankTotal, setBankTotal] = useState(0);
  const [activeAccountCount, setActiveAccountCount] = useState(0);
  useEffect(() => {
    void bankApi
      .accounts()
      .then(({ accounts }) => {
        const activeAccounts = accounts.filter((account) => account.is_active);
        setActiveAccountCount(activeAccounts.length);
        setBankTotal(
          activeAccounts.reduce(
            (total, account) => total + Number(account.current_balance),
            0,
          ),
        );
      })
      .catch(() => undefined);
  }, []);
  const firstName = session?.user.name.trim().split(/\s+/)[0] || "there";
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <Sidebar activePage="dashboard">
      <div
        className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7"
        id="dashboard"
      >
        <div className="mb-8 flex items-end justify-between max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-4.5">
          <div>
            <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              {today}
            </p>
            <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
              Good morning, {firstName}
            </h1>
            <p className="text-[12px] text-[#758183]">
              Here is what is happening with your money today.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311] hover:bg-[#5bdec8] max-[680px]:w-full">
            <Plus size={16} />
            Add transaction
          </button>
        </div>
        <section
          className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1"
          aria-label="Financial overview"
        >
          <MetricCard
            icon={WalletCards}
            label="Net worth"
            value="Rs. 4,250,800.00"
            detail="Trend: "
            badge="+2.4%"
            tone="mint"
          />
          <MetricCard
            icon={BarChart3}
            label="Current stock value"
            value="Rs. 2,850,500.00"
            detail="Unrealized P/L: "
            badge="Rs. +420,150.00"
            tone="sky"
          />
          <MetricCard
            icon={Building2}
            label="Total bank balance"
            value={`Rs. ${bankTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            detail={`Across ${activeAccountCount} active accounts`}
            badge="Updated now"
            tone="gold"
          />
        </section>
        <section className="mb-3.5 grid grid-cols-[1.03fr_.97fr] gap-3.5 max-[900px]:grid-cols-1">
          <ManagerPanel stock />
          <ManagerPanel />
        </section>
        <section className="mb-8.25 flex items-start gap-3 rounded-md border border-[#735627] bg-[#17130a] px-4 py-3.25 text-[#d9bd78]">
          <Sparkles className="mt-px shrink-0" size={16} />
          <div>
            <strong className="text-[11px] text-[#ebd29a]">
              Pending MeroShare transfers{" "}
              <em className="ml-1 rounded-full bg-[#75592c] px-1.5 py-0.5 text-[9px] not-italic">
                2
              </em>
            </strong>
            <p className="mt-1.5 text-[10px] text-[#a79470]">
              CHDC <span className="text-[#d5c08c]">10 shares</span> sold 17 Sep
              Â·{" "}
              <button className="border-b border-dashed border-[#826b3b] text-[#e5c87d]">
                Mark as transferred
              </button>
            </p>
            <p className="mt-1 text-[10px] text-[#a79470]">
              NICA <span className="text-[#d5c08c]">50 shares</span> sold 25 Sep
              Â·{" "}
              <button className="border-b border-dashed border-[#826b3b] text-[#e5c87d]">
                Mark as transferred
              </button>
            </p>
          </div>
          <button
            className="ml-auto text-[19px] leading-3.5 text-[#8d7546]"
            aria-label="Dismiss"
          >
            Ã—
          </button>
        </section>
        <section>
          <div className="mb-3.25 flex items-end justify-between">
            <div>
              <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                Activity log
              </span>
              <h2 className="text-[17px] font-semibold text-[#eef3f1]">
                Recent ledger feed
              </h2>
            </div>
            <button className="flex items-center gap-1 text-[10px] text-[#5ecdb7]">
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="border-t border-[#1b2222]">
            <div className="grid grid-cols-[2fr_.7fr_1fr_1fr] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
              <span>Type / description</span>
              <span className="text-right">Quantity</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Status</span>
            </div>
            {feed.map(([type, note, amount, quantity, tone, status]) => (
              <div
                className="grid grid-cols-[2fr_.7fr_1fr_1fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[11px] text-[#d6dfdd] hover:bg-[#0b1010] max-[680px]:grid-cols-[minmax(0,1fr)_auto] max-[680px]:gap-x-2 max-[680px]:gap-y-1.5 max-[680px]:px-1"
                key={type}
              >
                <div className="flex min-w-0 items-center gap-2.25">
                  <span
                    className={`grid h-6.25 w-6.25 place-items-center rounded-md ${tone === "blue" ? "bg-[#112631] text-[#6ebfe1]" : tone === "green" ? "bg-[#102c26] text-[#57d1ae]" : tone === "red" ? "bg-[#321a1c] text-[#e57b7b]" : "bg-[#302612] text-[#dcb66a]"}`}
                  >
                    {type === "INCOME" ? (
                      <ArrowDownLeft size={14} />
                    ) : (
                      <ArrowUpRight size={14} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-[10px] text-[#b7cbc8]">
                      {type}
                    </strong>
                    <small className="mt-0.75 block text-[9px] text-[#647374]">
                      {note} Â· 13:38:07
                    </small>
                  </span>
                </div>
                <span className="text-right max-[680px]:hidden">
                  {quantity}
                </span>
                <span className="text-right max-[680px]:col-start-2 max-[680px]:row-start-2 max-[680px]:whitespace-nowrap">
                  {amount}
                </span>
                <span
                  className={`justify-self-end rounded-sm px-1.75 py-1 text-[8px] max-[680px]:col-start-2 max-[680px]:row-start-1 ${tone === "blue" ? "bg-[#112631] text-[#6ebfe1]" : tone === "green" ? "bg-[#102c26] text-[#57d1ae]" : tone === "red" ? "bg-[#321a1c] text-[#e57b7b]" : "bg-[#302612] text-[#dcb66a]"}`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Sidebar>
  );
}

export default Dashboard;
