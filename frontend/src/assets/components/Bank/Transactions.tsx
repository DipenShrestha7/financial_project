import SectionPage from "../SectionPage";

export default function BankTransactions() {
  return (
    <SectionPage
      activePage="bank-transactions"
      breadcrumb="Bank transactions"
      eyebrow="Banks / transactions"
      title="Bank transactions"
      description="Review every deposit, payment, and internal transfer."
      action="Add transaction"
      columns={["Transaction", "Account", "Amount", "Type"]}
      rows={[
        {
          title: "Salary · September",
          detail: "Nabil Bank · 30 Sep 2026",
          value: "+ Rs. 85,000",
          status: "Income",
          tone: "green",
        },
        {
          title: "Electricity bill",
          detail: "Sanima Bank · 28 Sep 2026",
          value: "- Rs. 4,200",
          status: "Expense",
          tone: "red",
        },
        {
          title: "Transfer to wallet",
          detail: "Nabil Bank · 26 Sep 2026",
          value: "- Rs. 12,000",
          status: "Transfer",
          tone: "amber",
        },
      ]}
    />
  );
}
