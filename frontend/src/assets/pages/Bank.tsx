import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Download,
  Plus,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

const transactions = [
  {
    name: "Salary Â· September",
    account: "Nabil Bank",
    date: "30 Sep 2026",
    amount: "+ Rs. 85,000",
    type: "Income",
    tone: "green",
  },
  {
    name: "Electricity bill",
    account: "Sanima Bank",
    date: "28 Sep 2026",
    amount: "- Rs. 4,200",
    type: "Expense",
    tone: "red",
  },
  {
    name: "Transfer to wallet",
    account: "Nabil Bank",
    date: "26 Sep 2026",
    amount: "- Rs. 12,000",
    type: "Transfer",
    tone: "amber",
  },
  {
    name: "Freelance payment",
    account: "Cash wallet",
    date: "24 Sep 2026",
    amount: "+ Rs. 32,500",
    type: "Income",
    tone: "green",
  },
];

const toneClasses = {
  green: "bg-[#102c26] text-[#57d1ae]",
  red: "bg-[#321a1c] text-[#e57b7b]",
  amber: "bg-[#302612] text-[#dcb66a]",
};

function AccountCard({
  name,
  detail,
  balance,
  color,
  letter,
}: {
  name: string;
  detail: string;
  balance: string;
  color: string;
  letter: string;
}) {
  return (
    <article className="rounded-lg border border-[#1b2d30] bg-[#0b1112] p-4.5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold text-[#071011] ${color}`}
          >
            {letter}
          </span>
          <div>
            <h3 className="text-[12px] font-semibold text-[#d8e3e1]">{name}</h3>
            <p className="mt-0.5 text-[9px] text-[#657577]">{detail}</p>
          </div>
        </div>
        <button className="text-[#718081]" aria-label={`${name} options`}>
          â€¢â€¢â€¢
        </button>
      </div>
      <p className="mt-6 text-[9px] uppercase tracking-[1px] text-[#647374]">
        Available balance
      </p>
      <strong className="mt-1 block text-[20px] font-semibold tracking-[-.5px] text-[#eff4f2]">
        {balance}
      </strong>
      <div className="mt-4 flex items-center justify-between border-t border-[#182426] pt-3 text-[9px]">
        <span className="text-[#657577]">Updated just now</span>
        <span className="text-[#54cfb2]">Active</span>
      </div>
    </article>
  );
}

function Bank() {
  return (
    <Sidebar activePage="bank" breadcrumb="Bank manager">
      <div className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7">
        <div className="mb-8 flex items-end justify-between max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-4.5">
          <div>
            <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              Bank &amp; fund manager
            </p>
            <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
              Your money, in one place
            </h1>
            <p className="text-[12px] text-[#758183]">
              Track balances, income, expenses, and transfers across every
              account.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311] hover:bg-[#5bdec8] max-[680px]:w-full">
            <Plus size={16} />
            Add transaction
          </button>
        </div>
        <section className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
          <Metric
            label="Total balance"
            value="Rs. 1,400,300"
            detail="Across 3 accounts"
            icon={WalletCards}
            tone="mint"
          />
          <Metric
            label="Income this month"
            value="Rs. 117,500"
            detail="+12.8% from August"
            icon={ArrowDownLeft}
            tone="sky"
          />
          <Metric
            label="Expenses this month"
            value="Rs. 34,200"
            detail="18.4% of income"
            icon={ArrowUpRight}
            tone="gold"
          />
        </section>
        <section className="mb-3.5 grid grid-cols-[1.2fr_.8fr] gap-3.5 max-[900px]:grid-cols-1">
          <article className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                  Cash flow
                </span>
                <h2 className="text-[15px] font-semibold text-[#eef3f1]">
                  Income vs expenses
                </h2>
              </div>
              <button className="flex items-center gap-1.5 rounded border border-[#25383a] px-2.5 py-1.5 text-[9px] text-[#8da0a0]">
                This month <ChevronDown size={13} />
              </button>
            </div>
            <div className="mt-6 flex items-end gap-8">
              <div>
                <p className="text-[9px] text-[#667676]">Net cash flow</p>
                <strong className="mt-1 block text-[23px] font-semibold text-[#eff4f2]">
                  + Rs. 83,300
                </strong>
              </div>
              <div className="flex gap-3 text-[9px]">
                <span className="flex items-center gap-1.5 text-[#59d2b3]">
                  <i className="h-2 w-2 rounded-full bg-[#59d2b3]" />
                  Income
                </span>
                <span className="flex items-center gap-1.5 text-[#e07d7d]">
                  <i className="h-2 w-2 rounded-full bg-[#e07d7d]" />
                  Expenses
                </span>
              </div>
            </div>
            <div className="mt-5 h-28 border-b border-l border-[#203234] px-3 pb-2">
              <svg
                viewBox="0 0 600 100"
                preserveAspectRatio="none"
                className="h-full w-full text-[#42c8aa]"
                aria-label="Income and expense chart"
              >
                <path
                  d="M0 78 C50 72 58 50 105 60 S165 70 205 39 S260 50 300 42 S350 57 390 25 S450 35 490 20 S550 29 600 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  d="M0 89 C50 86 75 79 110 82 S170 80 210 70 S260 78 300 67 S350 76 390 60 S450 68 490 55 S550 61 600 50"
                  fill="none"
                  stroke="#d26f70"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                />
              </svg>
            </div>
            <div className="mt-2 flex justify-between px-1 text-[8px] text-[#536263]">
              <span>01 Sep</span>
              <span>08 Sep</span>
              <span>15 Sep</span>
              <span>22 Sep</span>
              <span>30 Sep</span>
            </div>
          </article>
          <article className="rounded-lg border border-[#203640] bg-[#0b151a] p-5.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                  Breakdown
                </span>
                <h2 className="text-[15px] font-semibold text-[#eef3f1]">
                  Monthly allocation
                </h2>
              </div>
              <SlidersHorizontal size={17} className="text-[#71888d]" />
            </div>
            <div className="mx-auto mt-6 grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#32c7aa_0_64%,#dca957_64%_82%,#466675_82%_92%,#263438_92%_100%)]">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-[#0b151a] text-center">
                <strong className="block text-[18px] text-[#edf3f1]">
                  Rs. 117k
                </strong>
                <span className="text-[9px] text-[#657577]">inflow</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-[9px]">
              <span className="flex items-center gap-1.5 text-[#9eb1b0]">
                <i className="h-2 w-2 rounded-full bg-[#32c7aa]" />
                Salary <b className="ml-auto text-[#dbe8e5]">64%</b>
              </span>
              <span className="flex items-center gap-1.5 text-[#9eb1b0]">
                <i className="h-2 w-2 rounded-full bg-[#dca957]" />
                Freelance <b className="ml-auto text-[#dbe8e5]">18%</b>
              </span>
              <span className="flex items-center gap-1.5 text-[#9eb1b0]">
                <i className="h-2 w-2 rounded-full bg-[#466675]" />
                Other <b className="ml-auto text-[#dbe8e5]">10%</b>
              </span>
              <span className="flex items-center gap-1.5 text-[#9eb1b0]">
                <i className="h-2 w-2 rounded-full bg-[#263438]" />
                Pending <b className="ml-auto text-[#dbe8e5]">8%</b>
              </span>
            </div>
          </article>
        </section>
        <section className="mb-8.25">
          <div className="mb-3.25 flex items-end justify-between">
            <div>
              <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                Linked accounts
              </span>
              <h2 className="text-[17px] font-semibold text-[#eef3f1]">
                Your accounts
              </h2>
            </div>
            <button className="flex items-center gap-1.5 text-[10px] text-[#5ecdb7]">
              <Plus size={14} />
              Link account
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-1">
            <AccountCard
              name="Nabil Bank"
              detail="Primary account Â· â€¢â€¢â€¢â€¢ 3021"
              balance="Rs. 960,300"
              color="bg-[#6bb5cf]"
              letter="N"
            />
            <AccountCard
              name="Sanima Bank"
              detail="Savings account Â· â€¢â€¢â€¢â€¢ 8834"
              balance="Rs. 300,000"
              color="bg-[#e4915d]"
              letter="S"
            />
            <AccountCard
              name="Cash wallet"
              detail="Available balance"
              balance="Rs. 140,000"
              color="bg-[#5bc59e]"
              letter="W"
            />
          </div>
        </section>
        <section>
          <div className="mb-3.25 flex items-end justify-between">
            <div>
              <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                Activity log
              </span>
              <h2 className="text-[17px] font-semibold text-[#eef3f1]">
                Recent transactions
              </h2>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 rounded border border-[#25383a] px-2.5 py-1.5 text-[9px] text-[#8da0a0]">
                <CalendarDays size={13} />
                September <ChevronDown size={12} />
              </button>
              <button
                className="grid h-7 place-items-center rounded border border-[#25383a] px-2 text-[#8da0a0]"
                aria-label="Export transactions"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
          <div className="border-t border-[#1b2222]">
            <div className="grid grid-cols-[2fr_1.1fr_1fr_1fr_0.8fr] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
              <span>Transaction</span>
              <span>Account</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Type</span>
            </div>
            {transactions.map((item) => (
              <div
                className="grid grid-cols-[2fr_1.1fr_1fr_1fr_0.8fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px] hover:bg-[#0b1010] max-[680px]:grid-cols-[1.7fr_1fr] max-[680px]:gap-2 max-[680px]:px-1"
                key={item.name}
              >
                <div className="flex items-center gap-2.25">
                  <span
                    className={`grid h-6.25 w-6.25 shrink-0 place-items-center rounded-md ${item.tone === "green" ? "bg-[#102c26] text-[#57d1ae]" : item.tone === "red" ? "bg-[#321a1c] text-[#e57b7b]" : "bg-[#302612] text-[#dcb66a]"}`}
                  >
                    {item.tone === "green" ? (
                      <ArrowDownLeft size={14} />
                    ) : (
                      <ArrowUpRight size={14} />
                    )}
                  </span>
                  <div>
                    <strong className="block text-[10px] text-[#c4d2d0]">
                      {item.name}
                    </strong>
                    <small className="mt-0.75 block text-[9px] text-[#647374] max-[680px]:hidden">
                      {item.account}
                    </small>
                  </div>
                </div>
                <span className="text-[#819091] max-[680px]:text-right">
                  {item.account}
                </span>
                <span className="text-[#819091] max-[680px]:hidden">
                  {item.date}
                </span>
                <span
                  className={`text-right font-medium ${item.tone === "green" ? "text-[#57d1ae]" : "text-[#e57b7b]"}`}
                >
                  {item.amount}
                </span>
                <span
                  className={`justify-self-end rounded-sm px-1.75 py-1 text-[8px] ${toneClasses[item.tone as keyof typeof toneClasses]}`}
                >
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Sidebar>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
  detail: string;
  tone: "mint" | "sky" | "gold";
}) {
  const style =
    tone === "mint"
      ? "border-[#196658] bg-[#0c1715] text-[#69d6c0]"
      : tone === "sky"
        ? "border-[#234454] bg-[#0c151a] text-[#8dc1e0]"
        : "border-[#524525] bg-[#151209] text-[#e6c781]";
  return (
    <article className={`rounded-lg border p-4.5 ${style}`}>
      <div className="flex items-center justify-between text-[10px] text-[#aab6b6]">
        <span>{label}</span>
        <Icon size={16} />
      </div>
      <strong className="mt-3 block text-[22px] font-semibold text-[#eff4f2]">
        {value}
      </strong>
      <p className="mt-1 text-[9px] text-[#728080]">{detail}</p>
    </article>
  );
}

export default Bank;
