import SectionPage from "../SectionPage";

export default function Expenses() {
  return (
    <SectionPage
      activePage="expenses"
      breadcrumb="Expenses"
      eyebrow="Banks / expenses"
      title="Expense records"
      description="See where money is going and keep recurring costs visible."
      action="Record expense"
      columns={["Expense", "Account", "Amount", "Category"]}
      rows={[
        {
          title: "Electricity bill",
          detail: "Sanima Bank · 28 Sep 2026",
          value: "- Rs. 4,200",
          status: "Utilities",
          tone: "red",
        },
        {
          title: "Groceries",
          detail: "Cash wallet · 25 Sep 2026",
          value: "- Rs. 8,450",
          status: "Living",
          tone: "red",
        },
        {
          title: "Internet subscription",
          detail: "Nabil Bank · 20 Sep 2026",
          value: "- Rs. 1,800",
          status: "Utilities",
          tone: "red",
        },
      ]}
    />
  );
}
