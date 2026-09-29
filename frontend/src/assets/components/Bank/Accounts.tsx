import SectionPage from "../SectionPage";

export default function BankAccounts() {
  return (
    <SectionPage
      activePage="bank-accounts"
      breadcrumb="Bank accounts"
      eyebrow="Banks / accounts"
      title="Your accounts"
      description="Manage linked balances and keep every account current."
      action="Link account"
      columns={["Account", "Details", "Balance", "Status"]}
      rows={[
        {
          title: "Nabil Bank",
          detail: "Primary account · •••• 3021",
          value: "Rs. 960,300",
          status: "Active",
          tone: "green",
        },
        {
          title: "Sanima Bank",
          detail: "Savings account · •••• 8834",
          value: "Rs. 300,000",
          status: "Active",
          tone: "green",
        },
        {
          title: "Cash wallet",
          detail: "Available balance",
          value: "Rs. 140,000",
          status: "Active",
          tone: "green",
        },
      ]}
    />
  );
}
