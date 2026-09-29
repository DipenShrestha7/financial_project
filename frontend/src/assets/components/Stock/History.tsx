import SectionPage from "../SectionPage";

export default function StockHistory() {
  return (
    <SectionPage
      activePage="stock-history"
      breadcrumb="Stock history"
      eyebrow="Stocks / history"
      title="Portfolio history"
      description="Review how your portfolio and cost basis have changed over time."
      action="Export history"
      columns={["Event", "Holding", "Value", "Status"]}
      rows={[
        {
          title: "Monthly valuation",
          detail: "30 Sep 2026",
          value: "Rs. 2,850,500",
          status: "+8.4%",
          tone: "green",
        },
        {
          title: "Bonus shares credited",
          detail: "CHDC · 21 Sep 2026",
          value: "+20 shares",
          status: "Completed",
          tone: "green",
        },
        {
          title: "Dividend declared",
          detail: "NICA · 18 Sep 2026",
          value: "Rs. 4,800",
          status: "Recorded",
          tone: "amber",
        },
      ]}
    />
  );
}
