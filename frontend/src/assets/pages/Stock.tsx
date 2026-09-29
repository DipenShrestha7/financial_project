import { ArrowDownLeft, ArrowUpRight, ChevronDown, Plus } from "lucide-react";
import DashboardLayout from "../components/Sidebar";

const holdings = [
  ["CHDC", "Chandragiri Hills", "120", "Rs. 86,400", "+ Rs. 12,600", "green"],
  ["NICA", "NIC Asia Bank", "250", "Rs. 192,500", "+ Rs. 28,750", "green"],
  ["NABIL", "Nabil Bank", "80", "Rs. 48,800", "- Rs. 2,400", "red"],
];

function Stock() {
  return (
    <DashboardLayout activePage="stock" breadcrumb="Stock manager">
      <div className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7">
        <div className="mb-8 flex items-end justify-between max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-4.5">
          <div>
            <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              Stocks &amp; investments
            </p>
            <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
              Your portfolio
            </h1>
            <p className="text-[12px] text-[#758183]">
              Track holdings, cost basis, and performance across your
              investments.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311] hover:bg-[#5bdec8] max-[680px]:w-full">
            <Plus size={16} />
            Record transaction
          </button>
        </div>
        <section className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
          <Stat
            label="Portfolio value"
            value="Rs. 2,850,500"
            detail="+8.4% this month"
            tone="mint"
          />
          <Stat
            label="Cost basis"
            value="Rs. 2,430,350"
            detail="Across 3 holdings"
            tone="sky"
          />
          <Stat
            label="Unrealized P/L"
            value="+ Rs. 420,150"
            detail="17.3% return"
            tone="gold"
          />
        </section>
        <section className="mb-3.5 grid grid-cols-[1.3fr_.7fr] gap-3.5 max-[900px]:grid-cols-1">
          <article className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                  Portfolio performance
                </span>
                <h2 className="text-[15px] font-semibold text-[#eef3f1]">
                  30 day overview
                </h2>
              </div>
              <button className="flex items-center gap-1.5 rounded border border-[#25383a] px-2.5 py-1.5 text-[9px] text-[#8da0a0]">
                30 days <ChevronDown size={13} />
              </button>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <strong className="text-[23px] font-semibold text-[#eff4f2]">
                + Rs. 420,150
              </strong>
              <span className="flex items-center gap-1 text-[10px] text-[#57d1ae]">
                <ArrowUpRight size={14} />
                8.4%
              </span>
            </div>
            <div className="mt-5 h-28 border-b border-l border-[#203234] px-3 pb-2">
              <svg
                viewBox="0 0 600 100"
                preserveAspectRatio="none"
                className="h-full w-full text-[#42c8aa]"
                aria-label="Portfolio performance chart"
              >
                <path
                  d="M0 82 C42 75 65 65 105 72 S165 78 208 45 S260 54 305 39 S365 54 400 30 S460 38 500 21 S555 27 600 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  d="M0 82 C42 75 65 65 105 72 S165 78 208 45 S260 54 305 39 S365 54 400 30 S460 38 500 21 S555 27 600 6 V100 H0Z"
                  fill="currentColor"
                  opacity=".08"
                />
              </svg>
            </div>
          </article>
          <article className="rounded-lg border border-[#203640] bg-[#0b151a] p-5.5">
            <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              Allocation
            </span>
            <h2 className="text-[15px] font-semibold text-[#eef3f1]">
              By holding
            </h2>
            <div className="mt-6 space-y-4">
              <Allocation
                label="NICA"
                value="46%"
                width="46%"
                color="bg-[#32c7aa]"
              />
              <Allocation
                label="CHDC"
                value="31%"
                width="31%"
                color="bg-[#dca957]"
              />
              <Allocation
                label="NABIL"
                value="23%"
                width="23%"
                color="bg-[#466675]"
              />
            </div>
          </article>
        </section>
        <section>
          <div className="mb-3.25 flex items-end justify-between">
            <div>
              <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                Holdings
              </span>
              <h2 className="text-[17px] font-semibold text-[#eef3f1]">
                Your portfolio
              </h2>
            </div>
            <button className="flex items-center gap-1.5 text-[10px] text-[#5ecdb7]">
              View transactions <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="border-t border-[#1b2222]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
              <span>Holding</span>
              <span>Quantity</span>
              <span>Market value</span>
              <span>Unrealized P/L</span>
              <span className="text-right">Status</span>
            </div>
            {holdings.map(([symbol, name, quantity, value, profit, tone]) => (
              <div
                className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px] hover:bg-[#0b1010] max-[680px]:grid-cols-[1.5fr_1fr_1fr] max-[680px]:gap-2 max-[680px]:px-1"
                key={symbol}
              >
                <div className="flex items-center gap-2.25">
                  <span
                    className={`grid h-6.25 w-6.25 place-items-center rounded-md ${tone === "green" ? "bg-[#102c26] text-[#57d1ae]" : "bg-[#321a1c] text-[#e57b7b]"}`}
                  >
                    {tone === "green" ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownLeft size={14} />
                    )}
                  </span>
                  <span>
                    <strong className="block text-[10px] text-[#c4d2d0]">
                      {symbol}
                    </strong>
                    <small className="mt-0.75 block text-[9px] text-[#647374]">
                      {name}
                    </small>
                  </span>
                </div>
                <span className="text-[#a5b4b3]">{quantity} shares</span>
                <span className="text-[#d4dfdd]">{value}</span>
                <span
                  className={
                    tone === "green" ? "text-[#57d1ae]" : "text-[#e57b7b]"
                  }
                >
                  {profit}
                </span>
                <span className="justify-self-end rounded-sm bg-[#102c26] px-1.75 py-1 text-[8px] text-[#57d1ae] max-[680px]:col-start-3 max-[680px]:row-start-1">
                  Held
                </span>
              </div>
            ))}
          </div>
        </section>
        <footer className="mt-8.75 flex justify-between border-t border-[#171d1d] pt-3.5 text-[9px] text-[#4e5b5c]">
          <span>Ledger Vault v1.0</span>
          <span>Last synced 2 minutes ago</span>
        </footer>
      </div>
    </DashboardLayout>
  );
}

function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "mint" | "sky" | "gold";
}) {
  const style =
    tone === "mint"
      ? "border-[#196658] bg-[#0c1715]"
      : tone === "sky"
        ? "border-[#234454] bg-[#0c151a]"
        : "border-[#524525] bg-[#151209]";
  return (
    <article className={`rounded-lg border p-4.5 ${style}`}>
      <span className="text-[10px] text-[#aab6b6]">{label}</span>
      <strong className="mt-3 block text-[22px] font-semibold text-[#eff4f2]">
        {value}
      </strong>
      <p className="mt-1 text-[9px] text-[#57d1ae]">{detail}</p>
    </article>
  );
}
function Allocation({
  label,
  value,
  width,
  color,
}: {
  label: string;
  value: string;
  width: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[10px] text-[#9aabaa]">
        <span>{label}</span>
        <b className="text-[#d7e2e0]">{value}</b>
      </div>
      <div className="h-1.5 rounded-full bg-[#1d292b]">
        <div className={`h-full rounded-full ${color}`} style={{ width }} />
      </div>
    </div>
  );
}

export default Stock;
