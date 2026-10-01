import type { ReactNode } from "react";
import DashboardLayout, { type PageKey } from "../Sidebar";
import type { BankAccount } from "../../services/banks";

export function BankPageChrome({
  activePage,
  breadcrumb,
  eyebrow,
  title,
  description,
  accounts,
  selectedAccountId,
  onAccountChange,
  showAllOption = false,
  allOptionLabel = "All accounts",
  action,
  accountSelectorExtra,
  children,
}: {
  activePage: PageKey;
  breadcrumb: string;
  eyebrow: string;
  title: string;
  description: string;
  accounts: BankAccount[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  showAllOption?: boolean;
  allOptionLabel?: string;
  action?: ReactNode;
  accountSelectorExtra?: ReactNode;
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
            {accounts.length > 0 && (
              <div className="mt-4 flex flex-wrap items-end gap-2.5">
                <label className="block min-w-[240px] max-w-80 text-[10px] text-[#819091]">
                  Active account
                  <select
                    value={selectedAccountId}
                    onChange={(event) => onAccountChange(event.target.value)}
                    className="bank-field bank-select mt-1.5 h-10 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[12px] text-[#d4dfdd] outline-none focus:border-[#32c7aa]"
                  >
                    {showAllOption && (
                      <option value="ALL">{allOptionLabel}</option>
                    )}
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}{" "}
                        {account.account_number_masked
                          ? `(${account.account_number_masked})`
                          : account.bank_name
                            ? `(${account.bank_name})`
                            : ""}
                      </option>
                    ))}
                  </select>
                </label>
                {accountSelectorExtra}
              </div>
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
  detailTone = "positive",
}: {
  label: string;
  value: string;
  detail: string;
  detailTone?: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    detailTone === "negative"
      ? "text-[#e57b7b]"
      : detailTone === "neutral"
        ? "text-[#879998]"
        : "text-[#57d1ae]";

  return (
    <article className="rounded-lg border border-[#203034] bg-[#0b1112] p-4.5">
      <span className="text-[10px] text-[#aab6b6]">{label}</span>
      <strong className="mt-3 block text-[22px] font-semibold text-[#eff4f2]">
        {value}
      </strong>
      <p className={`mt-1 text-[9px] ${toneClass}`}>{detail}</p>
    </article>
  );
}

export const money = (value: number | string) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
