import BankSectionPage from "./BankSectionPage";

export default function BankTransactions() {
  return (
    <BankSectionPage
      mode="transactions"
      activePage="bank-transactions"
      breadcrumb="Bank transactions"
      eyebrow="Banks / transactions"
      title="Bank transactions"
      description="Review every cash movement, including paired internal transfers and audit-safe voids."
    />
  );
}
