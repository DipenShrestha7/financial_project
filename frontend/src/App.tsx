import Home from "./assets/pages/Dashboard.tsx";
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
import Reports from "./assets/pages/Reports.tsx";
import SettingsPage from "./assets/pages/SettingsPage.tsx";

function App() {
  if (window.location.pathname === "/bank") return <Bank />;
  if (window.location.pathname === "/stock") return <Stock />;
  if (window.location.pathname === "/bank-accounts") return <BankAccounts />;
  if (window.location.pathname === "/bank-transactions")
    return <BankTransactions />;
  if (window.location.pathname === "/income") return <Income />;
  if (window.location.pathname === "/expenses") return <Expenses />;
  if (window.location.pathname === "/stock-portfolio")
    return <StockPortfolio />;
  if (window.location.pathname === "/stock-transactions")
    return <StockTransactions />;
  if (window.location.pathname === "/stock-history") return <StockHistory />;
  if (window.location.pathname === "/transfers") return <Transfers />;
  if (window.location.pathname === "/reports") return <Reports />;
  if (window.location.pathname === "/settings") return <SettingsPage />;
  return <Home />;
}

export default App;
