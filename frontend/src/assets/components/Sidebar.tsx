import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  Search,
  Settings,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

export type PageKey =
  | "dashboard"
  | "bank"
  | "bank-accounts"
  | "bank-transactions"
  | "income"
  | "expenses"
  | "stock"
  | "stock-portfolio"
  | "stock-transactions"
  | "stock-history"
  | "transfers"
  | "reports"
  | "settings";

type DashboardLayoutProps = {
  children: ReactNode;
  activePage?: PageKey;
  breadcrumb?: string;
};

const navSections = [
  {
    icon: BarChart3,
    title: "Stocks",
    links: [
      ["Portfolio", "stock-portfolio"],
      ["Transactions", "stock-transactions"],
      ["History", "stock-history"],
      ["Share Transfers", "transfers"],
    ],
  },
  {
    icon: Building2,
    title: "Banks",
    links: [
      ["Accounts", "bank-accounts"],
      ["Transactions", "bank-transactions"],
      ["Income", "income"],
      ["Expenses", "expenses"],
    ],
  },
];

function NavSection({
  icon: Icon,
  title,
  links,
  activePage,
}: {
  icon: typeof BarChart3;
  title: string;
  links: string[][];
  activePage: PageKey;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-1 border-b border-[#14191a] pb-2">
      <button
        className="flex w-full items-center justify-between rounded-md px-2.75 py-2.25 text-left text-[12px] text-[#bdc7c8] hover:bg-[#111819]"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2.75">
          <Icon size={16} /> {title}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {isOpen &&
        links.map(([label, id]) => (
          <a
            className={`block px-2.75 py-1.75 pl-9.75 text-[12px] ${activePage === id ? "text-[#53d7bc]" : "text-[#778285] hover:text-[#57d4bb]"}`}
            href={`/${id}`}
            key={id}
          >
            {label}
          </a>
        ))}
    </div>
  );
}

export default function DashboardLayout({
  children,
  activePage = "dashboard",
  breadcrumb = "Dashboard",
}: DashboardLayoutProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [breadcrumbGroup, breadcrumbPage] = breadcrumbMap[activePage] ?? [
    breadcrumb,
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#050606] text-[#e8edf2]">
      <aside className="flex h-screen w-61 shrink-0 flex-col overflow-hidden border-r border-[#171b1c] bg-[#080a0b] px-3.5 pb-4.5 pt-6.75 max-[900px]:w-51.25 max-[680px]:hidden">
        <a
          className="flex items-center px-3 pb-6.5 text-[17px] font-bold tracking-[-.4px] gap-1.5"
          href="/"
        >
          <img src="logo.png" className="w-6" alt="" />
          <div>
            <span className="text-white">Hisab</span>
            <span className="text-[#32c7aa]">Kitab</span>
          </div>
        </a>
        <nav className="flex flex-col gap-1.25" aria-label="Primary navigation">
          <a
            className={`flex items-center gap-2.75 rounded-md px-2.75 py-2.25 text-[12px] ${activePage === "dashboard" ? "bg-[#10332f] text-[#53d7bc]" : "text-[#849094] hover:bg-[#111819] hover:text-[#e5eeee]"}`}
            href="/"
          >
            <LayoutDashboard size={17} />
            Dashboard
          </a>
          {navSections.map(({ icon, title, links }) => (
            <NavSection
              key={title}
              icon={icon}
              title={title}
              links={links}
              activePage={activePage}
            />
          ))}
          <a
            className="flex items-center gap-2.75 rounded-md px-2.75 py-2.25 text-[12px] text-[#849094] hover:bg-[#111819] hover:text-[#e5eeee]"
            href="/reports"
          >
            <FileText size={17} />
            Reports
          </a>
        </nav>
        <div className="relative mt-auto border-t border-[#182020] pt-3">
          {accountMenuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 rounded-md border border-[#273334] bg-[#101617] p-1.5 shadow-[0_10px_30px_#0009]">
              <div className="border-b border-[#202a2a] px-2.5 pb-2.5 pt-2">
                <strong className="block text-[11px] text-[#e8efed]">
                  Alex Sharma
                </strong>
                <small className="mt-1 block text-[9px] text-[#748281]">
                  alex@hisabkitab.app
                </small>
              </div>
              <a
                className="mt-1 flex items-center gap-2 rounded px-2.5 py-2 text-[10px] text-[#b8c5c3] hover:bg-[#182322] hover:text-white"
                href="/settings"
              >
                <Settings size={14} />
                Settings
              </a>
              <button className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-[10px] text-[#e58a82] hover:bg-[#291b1b]">
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
          <button
            className="flex w-full items-center gap-2.25 rounded-md px-2.5 py-2 text-left hover:bg-[#111819]"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-expanded={accountMenuOpen}
            aria-label="Open account menu"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d17a59] text-[9px] font-bold text-white">
              AS
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-[10px] text-[#d6e0de]">
                Alex Sharma
              </strong>
              <small className="mt-0.5 block text-[9px] text-[#687777]">
                Ledger synced
              </small>
            </span>
            {accountMenuOpen ? (
              <ChevronDown size={15} className="text-[#8b9b9a]" />
            ) : (
              <ChevronUp size={15} className="text-[#8b9b9a]" />
            )}
          </button>
        </div>
      </aside>
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-17.5 items-center justify-between border-b border-[#171b1c] px-10.5 max-[900px]:px-6 max-[680px]:h-15 max-[680px]:px-4.25">
          <div className="flex items-center gap-2.25 text-[12px] text-[#647072]">
            <button
              className="hidden p-0 max-[680px]:inline-flex"
              aria-label="Open menu"
            >
              <PanelLeftClose size={18} />
            </button>
            <span>{breadcrumbGroup}</span>
            {breadcrumbPage && <ChevronRight size={14} />}
            {breadcrumbPage && (
              <strong className="font-medium text-[#d3dcdd]">
                {breadcrumbPage}
              </strong>
            )}
          </div>
          <div className="flex items-center gap-4.25">
            <div className="flex w-40 items-center gap-2 border-b border-[#2a3131] py-1.5 text-[#667577] max-[680px]:w-28.75">
              <Search size={15} />
              <input
                className="w-full border-0 bg-transparent text-[11px] text-[#d4dede] outline-0 placeholder:text-[#647072]"
                aria-label="Search Hisab"
                placeholder="Search Hisab"
              />
            </div>
            <button
              className="relative p-1.25 text-[#8a999a]"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <i className="absolute right-0.75 top-0.75 h-1.25 w-1.25 rounded-full bg-[#ed8a60]" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

const breadcrumbMap: Partial<Record<PageKey, [string, string?]>> = {
  dashboard: ["Dashboard"],
  stock: ["Stocks"],
  "stock-portfolio": ["Stocks", "Portfolio"],
  "stock-transactions": ["Stocks", "Transactions"],
  "stock-history": ["Stocks", "History"],
  transfers: ["Stocks", "Share Transfers"],
  bank: ["Banks"],
  "bank-accounts": ["Banks", "Accounts"],
  "bank-transactions": ["Banks", "Transactions"],
  income: ["Banks", "Income"],
  expenses: ["Banks", "Expenses"],
  reports: ["Reports"],
  settings: ["Settings"],
};
