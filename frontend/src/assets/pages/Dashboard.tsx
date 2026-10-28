import {
  ArrowUpRight,
  BarChart3,
  Building2,
  ChevronDown,
  Plus,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { getSessionCookie } from "../services/auth";
import { bankApi } from "../services/banks";
import { stockApi } from "../services/stocks";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";

const fmtMoney = (v: number) =>
  `Rs. ${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  badge,
  tone,
  loading = false,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
  detail: string;
  badge: string;
  tone: "mint" | "sky" | "gold";
  loading?: boolean;
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
        ? "border-[#1a4050] after:bg-[#48a6d8]"
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
      <strong
        className={`mt-3 block text-[23px] font-semibold tracking-[-.8px] ${loading ? "text-[#5a6868] animate-pulse" : "text-[#eff4f2]"}`}
      >
        {loading ? "Loading…" : value}
      </strong>
      <div className="flex text-[10px] text-[#6d7a7c]">
        {detail}
        <span className={`ml-0.75 ${badgeStyle}`}>{badge}</span>
      </div>
    </article>
  );
}

function OwnerScopeSelector({
  owners,
  selected,
  onChange,
}: {
  owners: string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-[#233d3a] bg-[#0b1615] px-3 py-2 text-[11px] font-medium text-[#a8c5c0] hover:border-[#32c7aa] hover:text-[#48d2b0] transition-all"
      >
        <Users size={13} />
        <span>{selected === "" ? "All Owners" : selected}</span>
        <ChevronDown
          size={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 min-w-44 rounded-md border border-[#1e3532] bg-[#0b1615] py-1 shadow-2xl">
          {["ALL", ...owners].map((owner) => (
            <button
              key={owner}
              type="button"
              onClick={() => {
                onChange(owner === "ALL" ? "" : owner);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors ${(selected === "" && owner === "ALL") || selected === owner ? "bg-[#162e2b] font-semibold text-[#48d2b0]" : "text-[#a8c5c0] hover:bg-[#111f1d] hover:text-[#d4efea]"}`}
            >
              {owner === "ALL" ? (
                <>
                  <Users size={12} /> All Owners (Combined)
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-[#32c7aa]" />
                  {owner}
                </>
              )}
            </button>
          ))}
          {owners.length === 0 && (
            <p className="px-3 py-2 text-[10px] text-[#596f6e]">
              No owners yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const session = getSessionCookie();
  const navigate = useNavigate();
  const [owners, setOwners] = useState<string[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [bankAccounts, setBankAccounts] = useState<
    {
      name: string;
      current_balance: string;
      owner_name?: string;
      is_active: boolean;
    }[]
  >([]);
  const [portfolios, setPortfolios] = useState<
    { id: string; name: string; owner_name?: string }[]
  >([]);
  const [stockTotals, setStockTotals] = useState<
    { portfolioId: string; value: number; pl: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [bankRes, ownersRes, portfolioRes] = await Promise.all([
          bankApi.accounts(),
          bankApi.owners(),
          stockApi.portfolios(),
        ]);
        setBankAccounts(bankRes.accounts);
        setOwners(ownersRes.owners.filter(Boolean));
        setPortfolios(portfolioRes.portfolios);
        const totals = await Promise.all(
          portfolioRes.portfolios.map(async (p) => {
            try {
              const res = await stockApi.portfolio(p.id);
              const value = res.holdings.reduce(
                (s, h) => s + (h.market_value || 0),
                0,
              );
              const cost = res.holdings.reduce(
                (s, h) => s + Number(h.total_cost),
                0,
              );
              return { portfolioId: p.id, value, pl: value - cost };
            } catch {
              return { portfolioId: p.id, value: 0, pl: 0 };
            }
          }),
        );
        setStockTotals(totals);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filteredBankAccounts = bankAccounts.filter(
    (a) =>
      a.is_active &&
      (selectedOwner === "" || (a.owner_name || "Self") === selectedOwner),
  );
  const bankTotal = filteredBankAccounts.reduce(
    (s, a) => s + Number(a.current_balance),
    0,
  );
  const filteredPortfolioIds = portfolios
    .filter(
      (p) => selectedOwner === "" || (p.owner_name || "Self") === selectedOwner,
    )
    .map((p) => p.id);
  const filteredStockTotals = stockTotals.filter((t) =>
    filteredPortfolioIds.includes(t.portfolioId),
  );
  const stockValue = filteredStockTotals.reduce((s, t) => s + t.value, 0);
  const stockPl = filteredStockTotals.reduce((s, t) => s + t.pl, 0);
  const netWorth = bankTotal + stockValue;

  const ownerBreakdown = owners
    .map((owner) => {
      const b = bankAccounts
        .filter((a) => a.is_active && (a.owner_name || "Self") === owner)
        .reduce((s, a) => s + Number(a.current_balance), 0);
      const pIds = portfolios
        .filter((p) => (p.owner_name || "Self") === owner)
        .map((p) => p.id);
      const sv = stockTotals
        .filter((t) => pIds.includes(t.portfolioId))
        .reduce((s, t) => s + t.value, 0);
      return { owner, total: b + sv };
    })
    .filter((o) => o.total > 0);

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
        {/* Header */}
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
          <div className="flex items-center gap-3 max-[680px]:w-full max-[680px]:flex-col max-[680px]:items-stretch">
            <OwnerScopeSelector
              owners={owners}
              selected={selectedOwner}
              onChange={setSelectedOwner}
            />
            <button
              onClick={() => navigate("/banks/transactions")}
              className="flex items-center justify-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311] hover:bg-[#5bdec8] max-[680px]:w-full"
            >
              <Plus size={16} /> Add transaction
            </button>
          </div>
        </div>

        {/* Scope filter banner */}
        {selectedOwner !== "" && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-[#1e3532] bg-[#0c1e1c] px-3.5 py-2.5 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-[#32c7aa]" />
            <span className="text-[#86b5af]">
              Viewing:{" "}
              <strong className="text-[#48d2b0]">{selectedOwner}</strong>'s
              finances only
            </span>
            <button
              onClick={() => setSelectedOwner("")}
              className="ml-auto text-[#496e6a] hover:text-[#91c8c2] transition-colors text-[10px]"
            >
              Clear ×
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <section
          className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1"
          aria-label="Financial overview"
        >
          <MetricCard
            icon={WalletCards}
            label={
              selectedOwner === ""
                ? "Net worth (all)"
                : `${selectedOwner}'s net worth`
            }
            value={fmtMoney(netWorth)}
            detail="Bank + stock · "
            badge={
              selectedOwner === "" && owners.length > 1
                ? `${owners.length} owners`
                : `${filteredBankAccounts.length} accts + ${filteredPortfolioIds.length} portfolios`
            }
            tone="mint"
            loading={loading}
          />
          <MetricCard
            icon={BarChart3}
            label={
              selectedOwner === ""
                ? "Total stock value"
                : `${selectedOwner}'s stocks`
            }
            value={
              filteredPortfolioIds.length === 0
                ? "No portfolios"
                : stockValue > 0
                  ? fmtMoney(stockValue)
                  : "Not priced"
            }
            detail="Unrealized P/L: "
            badge={
              stockValue > 0
                ? `${stockPl >= 0 ? "+" : ""}${fmtMoney(stockPl)}`
                : "—"
            }
            tone="sky"
            loading={loading}
          />
          <MetricCard
            icon={Building2}
            label={
              selectedOwner === ""
                ? "Total bank balance"
                : `${selectedOwner}'s bank balance`
            }
            value={fmtMoney(bankTotal)}
            detail={`Across ${filteredBankAccounts.length} active account${filteredBankAccounts.length !== 1 ? "s" : ""}`}
            badge="Updated now"
            tone="gold"
            loading={loading}
          />
        </section>

        {/* Owner breakdown grid */}
        {selectedOwner === "" && ownerBreakdown.length > 1 && !loading && (
          <section className="mb-4 rounded-lg border border-[#1b2d2a] bg-[#09100f] px-5 py-4">
            <p className="mb-3 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              Breakdown by owner
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {ownerBreakdown.map(({ owner, total }) => (
                <button
                  key={owner}
                  type="button"
                  onClick={() => setSelectedOwner(owner)}
                  className="rounded-md border border-[#1e3330] bg-[#0b1715] p-3 text-left transition-all hover:border-[#32c7aa]/40 hover:bg-[#0f1f1d]"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#32c7aa]" />
                    <span className="text-[10px] font-medium text-[#87b3ae]">
                      {owner}
                    </span>
                  </div>
                  <strong className="block text-[13px] font-semibold text-[#d8efeb]">
                    {fmtMoney(total)}
                  </strong>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* MeroShare alert */}
        <section className="mb-8.25 flex items-start gap-3 rounded-md border border-[#735627] bg-[#17130a] px-4 py-3.25 text-[#d9bd78]">
          <Sparkles className="mt-px shrink-0" size={16} />
          <div>
            <strong className="text-[11px] text-[#ebd29a]">
              MeroShare transfers pending review
            </strong>
            <p className="mt-1 text-[10px] text-[#a79470]">
              Check stock transfers section for pending settlements.{" "}
              <button
                onClick={() => navigate("/stocks/transfers")}
                className="cursor-pointer border-b border-dashed border-[#826b3b] text-[#e5c87d]"
              >
                View transfers →
              </button>
            </p>
          </div>
        </section>

        {/* Quick nav panels */}
        <section className="mb-3.5 grid grid-cols-[1.03fr_.97fr] gap-3.5 max-[900px]:grid-cols-1">
          {/* Stock panel */}
          <article className="relative min-h-72.5 overflow-hidden rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] px-5.5 py-5.25">
            <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              Portfolio snapshot
            </span>
            <h2 className="text-[14px] font-semibold uppercase text-[#eef3f1]">
              Stock manager
            </h2>
            <p className="mt-3 max-w-68.75 text-[11px] leading-[1.55] text-[#a0adae]">
              Record transactions, track IPOs, lots, cost basis, bonus/right
              shares, and track MeroShare transfers.
            </p>
            <div className="relative mt-4 flex gap-2.5">
              <div className="min-w-31.25 rounded border border-[#1b302e] bg-[#030a0aa6] px-2.75 py-2.25">
                <span className="mb-1 block text-[9px] text-[#697777]">
                  Portfolio value
                </span>
                <strong className="text-[11px] text-[#dbe8e5]">
                  {loading
                    ? "…"
                    : stockValue > 0
                      ? fmtMoney(stockValue)
                      : "Not priced"}
                </strong>
              </div>
              <div className="min-w-31.25 rounded border border-[#1b302e] bg-[#030a0aa6] px-2.75 py-2.25">
                <span className="mb-1 block text-[9px] text-[#697777]">
                  Unrealized P/L
                </span>
                <strong
                  className={`text-[11px] ${stockPl >= 0 ? "text-[#5ad1b5]" : "text-[#e57b7b]"}`}
                >
                  {loading
                    ? "…"
                    : stockValue > 0
                      ? `${stockPl >= 0 ? "+" : ""}${fmtMoney(stockPl)}`
                      : "—"}
                </strong>
              </div>
            </div>
            <button
              onClick={() => navigate("/stocks/portfolio")}
              className="absolute bottom-5 left-5.5 flex cursor-pointer items-center gap-2 rounded-md bg-[#dce9e7] px-3.25 py-2.5 text-[11px] font-semibold text-[#0b1716] hover:bg-white max-[680px]:left-4.75"
            >
              Go to stock manager <ArrowUpRight size={15} />
            </button>
          </article>

          {/* Bank panel */}
          <article className="relative min-h-72.5 overflow-hidden rounded-lg border border-[#1f3947] bg-linear-to-br from-[#0b151a] to-[#0a1113] px-5.5 py-5.25">
            <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              Cash flow overview
            </span>
            <h2 className="text-[14px] font-semibold uppercase text-[#eef3f1]">
              Bank / fund & account manager
            </h2>
            <p className="mt-3 max-w-68.75 text-[11px] leading-[1.55] text-[#a0adae]">
              Manually track incomes, expenses, adjust balances, and record
              internal bank-to-bank transfers without affecting net cash flow.
            </p>
            <div className="absolute right-5.25 top-12 w-[40%] rounded-md border border-[#203640] bg-[#03090bad] p-2.5 max-[680px]:relative max-[680px]:right-auto max-[680px]:top-auto max-[680px]:mt-5 max-[680px]:w-full">
              <div className="mb-2 flex justify-between text-[8px] uppercase tracking-[.7px] text-[#7d9ba2]">
                Accounts{" "}
                <span className="normal-case tracking-normal text-[#4f7881]">
                  {filteredBankAccounts.length} active
                </span>
              </div>
              {filteredBankAccounts.slice(0, 3).map((acct) => (
                <div
                  key={acct.name}
                  className="grid grid-cols-[19px_1fr_auto] items-center gap-1.75 border-t border-[#182b30] py-1.5"
                >
                  <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-[#5bc59e] text-[9px] font-bold text-[#071011]">
                    {acct.name[0]}
                  </span>
                  <span>
                    <strong className="block text-[8px] font-medium text-[#d1dfe0] truncate">
                      {acct.name}
                    </strong>
                    {acct.owner_name && (
                      <small className="mt-0.5 block text-[8px] text-[#5a8a85]">
                        {acct.owner_name}
                      </small>
                    )}
                  </span>
                  <b className="text-[8px] font-medium text-[#b9cbcd] whitespace-nowrap">
                    {fmtMoney(Number(acct.current_balance))}
                  </b>
                </div>
              ))}
              {filteredBankAccounts.length === 0 && (
                <p className="py-2 text-center text-[8px] text-[#4f7881]">
                  No accounts found.
                </p>
              )}
              {filteredBankAccounts.length > 3 && (
                <p className="mt-1 text-center text-[8px] text-[#4f7881]">
                  +{filteredBankAccounts.length - 3} more
                </p>
              )}
            </div>
            <button
              onClick={() => navigate("/banks/accounts")}
              className="absolute bottom-5 left-5.5 flex cursor-pointer items-center gap-2 rounded-md bg-[#dce9e7] px-3.25 py-2.5 text-[11px] font-semibold text-[#0b1716] hover:bg-white max-[680px]:left-4.75"
            >
              Go to bank manager <ArrowUpRight size={15} />
            </button>
          </article>
        </section>
      </div>
    </Sidebar>
  );
}

export default Dashboard;
