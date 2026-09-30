import type { ReactNode } from "react";
import Dashboard from "./assets/pages/Dashboard.tsx";
import Home from "./assets/pages/Home.tsx";
import Bank from "./assets/pages/Bank.tsx";
import Stock from "./assets/pages/Stock.tsx";
import BankAccounts from "./assets/components/Bank/Accounts.tsx";
import BankTransactions from "./assets/components/Bank/Transactions.tsx";
import Income from "./assets/components/Bank/Income.tsx";
import Expenses from "./assets/components/Bank/Expenses.tsx";
import StockPortfolio from "./assets/components/Stock/Portfolio.tsx";
import StockTransactions from "./assets/components/Stock/Transactions.tsx";
import StockHistory from "./assets/components/Stock/History.tsx";
import Transfers from "./assets/components/Stock/Transfers.tsx";
import Calculator from "./assets/components/Stock/Calculator.tsx";
import Reports from "./assets/pages/Reports.tsx";
import Settings from "./assets/pages/Settings.tsx";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { getSessionCookie } from "./assets/services/auth";

function RequireAuth({ children }: { children: ReactNode }) {
  const session = getSessionCookie();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/bank"
          element={
            <RequireAuth>
              <Bank />
            </RequireAuth>
          }
        />
        <Route
          path="/stock"
          element={
            <RequireAuth>
              <Stock />
            </RequireAuth>
          }
        />
        <Route
          path="/banks/accounts"
          element={
            <RequireAuth>
              <BankAccounts />
            </RequireAuth>
          }
        />
        <Route
          path="/banks/transactions"
          element={
            <RequireAuth>
              <BankTransactions />
            </RequireAuth>
          }
        />
        <Route
          path="/banks/income"
          element={
            <RequireAuth>
              <Income />
            </RequireAuth>
          }
        />
        <Route
          path="/banks/expenses"
          element={
            <RequireAuth>
              <Expenses />
            </RequireAuth>
          }
        />
        <Route
          path="/stocks/portfolio"
          element={
            <RequireAuth>
              <StockPortfolio />
            </RequireAuth>
          }
        />
        <Route
          path="/stocks/transactions"
          element={
            <RequireAuth>
              <StockTransactions />
            </RequireAuth>
          }
        />
        <Route
          path="/stocks/history"
          element={
            <RequireAuth>
              <StockHistory />
            </RequireAuth>
          }
        />
        <Route
          path="/stocks/transfers"
          element={
            <RequireAuth>
              <Transfers />
            </RequireAuth>
          }
        />
        <Route
          path="/stocks/calculator"
          element={
            <RequireAuth>
              <Calculator />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <Reports />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
