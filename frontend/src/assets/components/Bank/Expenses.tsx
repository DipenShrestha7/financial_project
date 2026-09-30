import BankSectionPage from "./BankSectionPage";

export default function Expenses() {
  return (
    <BankSectionPage
      mode="expenses"
      activePage="expenses"
      breadcrumb="Expenses"
      eyebrow="Banks / expenses"
      title="Expense records"
      description="Categorize cash outflows and preserve every correction for reporting and audit history."
    />
  );
}
