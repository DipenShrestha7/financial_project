import type { ReactNode } from "react";
import DashboardLayout, { type PageKey } from "../Sidebar";
import type { StockPortfolio } from "../../services/stocks";

export function StockPageChrome({
  activePage,
  breadcrumb,
  eyebrow,
  title,
  description,
  portfolios,
  selectedPortfolioId,
  onPortfolioChange,
  action,
  children,
}: {
  activePage: PageKey;
  breadcrumb: string;
  eyebrow: string;
  title: string;
  description: string;
  portfolios: StockPortfolio[];
  selectedPortfolioId: string;
  onPortfolioChange: (id: string) => void;
  action?: ReactNode;
  children: ReactNode;
}) {
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
            {portfolios.length > 0 && (
              <label className="mt-4 block max-w-80 text-[10px] text-[#819091]">
                Active portfolio
                <select
                  value={selectedPortfolioId}
                  onChange={(event) => onPortfolioChange(event.target.value)}
                  className="bank-field bank-select mt-1.5 h-10 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[12px] text-[#d4dfdd] outline-none focus:border-[#32c7aa]"
                >
                  {portfolios.map((portfolio) => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {action}
        </div>
        {children}
      </div>
    </DashboardLayout>
  );
}

export function Summary({
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

export const money = (value: number | string) =>
  `Rs. ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
