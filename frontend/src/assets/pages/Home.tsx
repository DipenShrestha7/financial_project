import {
  ArrowRight,
  BarChart3,
  Building2,
  CircleCheckBig,
  ShieldCheck,
  TrendingUp,
  Wallet2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import LoginModal from "../components/LoginModal";
import { getSessionCookie } from "../services/auth";

const benefits = [
  {
    icon: Wallet2,
    title: "Unified cash flow",
    text: "Track income, expenses, internal transfers, and linked accounts in one place.",
  },
  {
    icon: BarChart3,
    title: "Stock portfolio overview",
    text: "Monitor holdings, portfolio value, transaction history, and market-driven movements.",
  },
  {
    icon: Building2,
    title: "Bank-level visibility",
    text: "Keep balances, cash positions, and account activity synced across your financial records.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);

  useEffect(() => {
    if (getSessionCookie()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#050606] text-[#edf1f2]">
      <header className="sticky top-0 z-40 border-b border-[#121819] bg-[#050606]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="flex items-center text-xl font-bold tracking-[-0.04em]">
            <span className="text-white">Hisab</span>
            <span className="text-[#32c7aa]">Kitab</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-[#9ca9a9] md:flex">
            <a href="#platform" className="transition hover:text-white">
              Platform
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#security" className="transition hover:text-white">
              Security
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className="rounded-full border border-[#23463e] bg-[#0e2724] px-4 py-2 text-sm font-medium text-[#6fe9d0] transition hover:border-[#3fc9ae] hover:bg-[#123a34]"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className="rounded-full bg-[#32c7aa] px-4 py-2 text-sm font-semibold text-[#051613] transition hover:bg-[#4cdac0]"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
        <section className="grid items-center gap-9 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
              Manage your money, stocks, and accounts from one smart ledger.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-[#a6b3b3] sm:mt-6 sm:text-lg sm:leading-8">
              HisabKitab helps individuals and growing businesses track bank
              balances, stock activity, income and expenses, and daily cash
              movements in a single, easy-to-read workspace.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#32c7aa] px-6 py-3.5 text-sm font-semibold text-[#051613] transition hover:bg-[#4cdac0] sm:w-auto"
              >
                Open dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[#1a2124] bg-[radial-gradient(circle_at_top,rgba(50,199,170,0.18),transparent_45%),linear-gradient(160deg,#0a0f10_0%,#050606_72%)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:rounded-[28px] sm:p-6">
            <div className="rounded-2xl border border-[#1a2a2d] bg-[#070b0c] p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-[#182123] pb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#7d8e8c]">
                    Overview
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Portfolio health
                  </h2>
                </div>
                <div className="rounded-full bg-[#102e2b] px-2.5 py-1 text-[10px] font-medium text-[#67d9bf]">
                  +12.4%
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#1a2d2b] bg-[#0b1617] px-4 py-3">
                  <div className="flex items-center justify-between text-[11px] text-[#95a3a4]">
                    <span>Net cash flow</span>
                    <TrendingUp size={16} className="text-[#4cd4b6]" />
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                    Rs. 1,36,800
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#1a2d2b] bg-[#0b1617] p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-[#7d8e8c]">
                      Savings
                    </div>
                    <div className="mt-3 text-base font-semibold text-white sm:text-lg">
                      Rs. 4,80,000
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#1a2d2b] bg-[#0b1617] p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-[#7d8e8c]">
                      Stocks
                    </div>
                    <div className="mt-3 text-base font-semibold text-white sm:text-lg">
                      Rs. 8,40,500
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#1a2d2b] bg-[#0b1617] p-3">
                  <div className="mb-3 flex items-center justify-between text-[11px] text-[#95a3a4]">
                    <span>Recent movement</span>
                    <span className="text-[#5fe0bb]">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#dfe9e8]">Salary</span>
                    <span className="text-sm font-medium text-[#7be1c7]">
                      + Rs. 85,000
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-[#dfe9e8]">Rent</span>
                    <span className="text-sm font-medium text-[#ff8d7a]">
                      - Rs. 36,000
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-16 sm:mt-24">
          <div className="mb-8 flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#60d8ba]">
                Features
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.06em] text-white sm:text-3xl">
                Built for complete financial visibility
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-[#1a2122] bg-[#0a0d0e] p-5"
              >
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[#102c29] text-[#64e0c0]">
                  <Icon size={19} />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#9aa9a9]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="security"
          className="mt-16 rounded-3xl border border-[#1e3031] bg-[#0a0f10] p-4 sm:mt-24 sm:rounded-[28px] sm:p-8"
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#60d8ba]">
              Security
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white mb-4">
              All of your data is safe and protected
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="rounded-2xl border border-[#1a2d2b] bg-[#0d1718] p-5">
              <div className="mb-4 inline-flex rounded-full bg-[#102b29] p-2 text-[#61d7bf]">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-xl font-semibold text-white sm:text-2xl">
                Protected and session-aware
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#a5b3b3]">
                Secure login flow with a session token stored in a cookie so the
                dashboard remembers your sign-in without exposing the token in
                plain view.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Bank and cash controls",
                "Stock transaction monitoring",
                "Income and expense tracking",
                "Protected session handling",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-[#1b2a2d] bg-[#0a1214] px-4 py-3 text-sm text-[#dfeae9]"
                >
                  <CircleCheckBig size={16} className="text-[#5ce2be]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {authMode && (
        <LoginModal
          key={authMode}
          initialMode={authMode}
          isOpen
          onClose={() => setAuthMode(null)}
        />
      )}
    </div>
  );
}
