import SectionPage from "../SectionPage";

export default function Income() {
  return (
    <SectionPage
      activePage="income"
      breadcrumb="Income"
      eyebrow="Banks / income"
      title="Income records"
      description="Keep salary, freelance, dividends, and other inflows organized."
      action="Record income"
      columns={["Source", "Account", "Amount", "Status"]}
      rows={[
        {
          title: "Salary · September",
          detail: "Nabil Bank · 30 Sep 2026",
          value: "+ Rs. 85,000",
          status: "Received",
          tone: "green",
        },
        {
          title: "Freelance payment",
          detail: "Cash wallet · 24 Sep 2026",
          value: "+ Rs. 32,500",
          status: "Received",
          tone: "green",
        },
        {
          title: "Dividend payout",
          detail: "Nabil Bank · 18 Sep 2026",
          value: "+ Rs. 4,800",
          status: "Pending",
          tone: "amber",
        },
      ]}
    />
  );
}
