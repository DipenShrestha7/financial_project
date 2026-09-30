import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { getSessionCookie, logout } from "../services/auth";

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
  | "stock-calculator"
  | "stock-history"
  | "transfers"
  | "reports"
  | "settings";

type SidebarProps = {
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
      ["Calculator", "stock-calculator"],
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

const pagePaths: Record<string, string> = {
  "stock-portfolio": "/stocks/portfolio",
  "stock-transactions": "/stocks/transactions",
  "stock-history": "/stocks/history",
  "stock-calculator": "/stocks/calculator",
  transfers: "/stocks/transfers",
  "bank-accounts": "/banks/accounts",
  "bank-transactions": "/banks/transactions",
  income: "/banks/income",
  expenses: "/banks/expenses",
};

function NavSection({
  icon: Icon,
  title,
  links,
  activePage,
  onNavigate,
}: {
  icon: typeof BarChart3;
  title: string;
  links: string[][];
  activePage: PageKey;
  onNavigate: () => void;
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
            href={pagePaths[id] ?? `/${id}`}
            key={id}
            onClick={onNavigate}
          >
            {label}
          </a>
        ))}
    </div>
  );
}

export default function Sidebar({
  children,
  activePage = "dashboard",
}: SidebarProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const session = useMemo(() => getSessionCookie(), []);
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const userName = session?.user.name ?? "User";
  const userEmail = session?.user.email ?? "user@example.com";
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  return (
    <div className="flex h-screen overflow-hidden bg-[#050606] text-[#e8edf2]">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 min-[681px]:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`flex h-screen w-61 shrink-0 flex-col overflow-hidden border-r border-[#171b1c] bg-[#080a0b] px-3.5 pb-4.5 pt-6.75 max-[900px]:w-51.25 max-[680px]:fixed max-[680px]:inset-y-0 max-[680px]:left-0 max-[680px]:z-50 max-[680px]:w-72 max-[680px]:shadow-2xl max-[680px]:transition-transform ${mobileNavOpen ? "max-[680px]:visible max-[680px]:translate-x-0" : "max-[680px]:invisible max-[680px]:-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-3 pb-6.5">
          <a
            className="flex items-center gap-1.5 text-[17px] font-bold tracking-[-.4px]"
            href="/"
          >
            <img src="/logo.png" className="w-6" alt="HisabKitab logo" />
            <span>
              <span className="text-white">Hisab</span>
              <span className="text-[#32c7aa]">Kitab</span>
            </span>
          </a>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="relative rounded p-1.5 text-[#8a999a] hover:bg-[#111819] hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <i className="absolute right-1 top-1 h-1.25 w-1.25 rounded-full bg-[#ed8a60]" />
            </button>
            <button
              type="button"
              className="hidden rounded p-1 text-[#8a999a] hover:bg-[#111819] max-[680px]:inline-flex"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <nav className="flex flex-col gap-1.25" aria-label="Primary navigation">
          <a
            className={`flex items-center gap-2.75 rounded-md px-2.75 py-2.25 text-[12px] ${activePage === "dashboard" ? "bg-[#10332f] text-[#53d7bc]" : "text-[#849094] hover:bg-[#111819] hover:text-[#e5eeee]"}`}
            href="/dashboard"
            onClick={() => setMobileNavOpen(false)}
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
              onNavigate={() => setMobileNavOpen(false)}
            />
          ))}
          <a
            className="flex items-center gap-2.75 rounded-md px-2.75 py-2.25 text-[12px] text-[#849094] hover:bg-[#111819] hover:text-[#e5eeee]"
            href="/reports"
            onClick={() => setMobileNavOpen(false)}
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
                  {userName}
                </strong>
                <small className="mt-1 block text-[9px] text-[#748281]">
                  {userEmail}
                </small>
              </div>
              <a
                className="mt-1 flex items-center gap-2 rounded px-2.5 py-2 text-[10px] text-[#b8c5c3] hover:bg-[#182322] hover:text-white"
                href="/settings"
                onClick={() => setMobileNavOpen(false)}
              >
                <Settings size={14} />
                Settings
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-[10px] text-[#e58a82] hover:bg-[#291b1b]"
              >
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
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-[10px] text-[#d6e0de]">
                {userName}
              </strong>
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
        <header className="hidden h-17.5 items-center border-b border-[#171b1c] px-3.5 max-[680px]:flex max-[680px]:h-15">
          <button
            type="button"
            className="p-1"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
