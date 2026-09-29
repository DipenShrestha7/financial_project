import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  FileText,
  PieChart,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "../components/Sidebar";

function Reports() {
  return (
    <DashboardLayout activePage="reports" breadcrumb="Reports">
      <div className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7">
        <div className="mb-8 flex items-end justify-between max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-4.5">
          <div>
            <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              Ledger intelligence
            </p>
            <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
              Reports
            </h1>
            <p className="text-[12px] text-[#758183]">
              Understand your money with a clear view of performance and
              movement.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-md border border-[#2a4442] bg-[#10211f] px-3.75 py-2.75 text-[11px] font-semibold text-[#70d9bf] hover:bg-[#15312d] max-[680px]:w-full">
            <Download size={15} />
            Export report
          </button>
        </div>
        <section className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
          <ReportCard
            icon={TrendingUp}
            label="Net worth growth"
            value="+2.4%"
            detail="Compared with last month"
            tone="green"
          />
          <ReportCard
            icon={ArrowDownLeft}
            label="Total income"
            value="Rs. 117,500"
            detail="September 2026"
            tone="blue"
          />
          <ReportCard
            icon={ArrowUpRight}
            label="Total expenses"
            value="Rs. 34,200"
            detail="18.4% of income"
            tone="amber"
          />
        </section>
        <section className="mb-3.5 grid grid-cols-[1.25fr_.75fr] gap-3.5 max-[900px]:grid-cols-1">
          <article className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                  Monthly overview
                </span>
                <h2 className="text-[15px] font-semibold text-[#eef3f1]">
                  Cash flow report
                </h2>
              </div>
              <button className="flex items-center gap-1.5 rounded border border-[#25383a] px-2.5 py-1.5 text-[9px] text-[#8da0a0]">
                <CalendarDays size={13} />
                September 2026
              </button>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-[9px] text-[#667676]">Net movement</p>
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
            <div className="mt-5 h-32 border-b border-l border-[#203234] px-3 pb-2">
              <svg
                viewBox="0 0 600 100"
                preserveAspectRatio="none"
                className="h-full w-full"
                aria-label="Cash flow report chart"
              >
                <path
                  d="M0 75 C45 70 70 48 110 58 S170 69 210 38 S260 49 305 40 S360 55 400 25 S450 36 500 19 S555 29 600 7"
                  fill="none"
                  stroke="#42c8aa"
                  strokeWidth="2.5"
                />
                <path
                  d="M0 88 C45 85 75 77 110 80 S170 78 210 69 S260 76 305 65 S360 75 400 59 S450 68 500 54 S555 61 600 48"
                  fill="none"
                  stroke="#d26f70"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                />
              </svg>
            </div>
          </article>
          <article className="rounded-lg border border-[#203640] bg-[#0b151a] p-5.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                  Portfolio report
                </span>
                <h2 className="text-[15px] font-semibold text-[#eef3f1]">
                  Asset split
                </h2>
              </div>
              <PieChart size={17} className="text-[#71888d]" />
            </div>
            <div className="mx-auto mt-6 grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#32c7aa_0_67%,#dca957_67%_88%,#466675_88%_100%)]">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-[#0b151a] text-center">
                <strong className="block text-[18px] text-[#edf3f1]">
                  Rs. 4.25m
                </strong>
                <span className="text-[9px] text-[#657577]">net worth</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-[9px]">
              <span className="flex items-center gap-1.5 text-[#9eb1b0]">
                <i className="h-2 w-2 rounded-full bg-[#32c7aa]" />
                Stocks <b className="ml-auto text-[#dbe8e5]">67%</b>
              </span>
              <span className="flex items-center gap-1.5 text-[#9eb1b0]">
                <i className="h-2 w-2 rounded-full bg-[#dca957]" />
                Banks <b className="ml-auto text-[#dbe8e5]">21%</b>
              </span>
              <span className="flex items-center gap-1.5 text-[#9eb1b0]">
                <i className="h-2 w-2 rounded-full bg-[#466675]" />
                Wallet <b className="ml-auto text-[#dbe8e5]">12%</b>
              </span>
            </div>
          </article>
        </section>
        <section className="rounded-lg border border-[#202d2f] bg-[#0a1011] p-5.5">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
                Quick reports
              </span>
              <h2 className="text-[17px] font-semibold text-[#eef3f1]">
                Available views
              </h2>
            </div>
            <BarChart3 size={18} className="text-[#71888d]" />
          </div>
          <div className="grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
            <QuickReport
              title="Income & expenses"
              detail="Compare cash movement by month"
            />
            <QuickReport
              title="Portfolio performance"
              detail="Review returns and cost basis"
            />
            <QuickReport
              title="Account balances"
              detail="See every linked account"
            />
          </div>
        </section>
        <footer className="mt-8.75 flex justify-between border-t border-[#171d1d] pt-3.5 text-[9px] text-[#4e5b5c]">
          <span>HisabKitab v1.0</span>
          <span>Last synced 2 minutes ago</span>
        </footer>
      </div>
    </DashboardLayout>
  );
}

function ReportCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  detail: string;
  tone: "green" | "blue" | "amber";
}) {
  const style =
    tone === "green"
      ? "border-[#196658] bg-[#0c1715] text-[#69d6c0]"
      : tone === "blue"
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
function QuickReport({ title, detail }: { title: string; detail: string }) {
  return (
    <button className="flex items-center justify-between rounded-md border border-[#202f31] bg-[#0d1516] p-4 text-left hover:border-[#2c6a61]">
      <span>
        <strong className="block text-[11px] text-[#d6e1df]">{title}</strong>
        <small className="mt-1 block text-[9px] text-[#6e7e7e]">{detail}</small>
      </span>
      <FileText size={17} className="text-[#51cdb1]" />
    </button>
  );
}

export default Reports;
