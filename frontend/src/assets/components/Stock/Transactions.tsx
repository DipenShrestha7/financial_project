import SectionPage from "../SectionPage";

export default function StockTransactions() {
  return (
    <SectionPage
      activePage="stock-transactions"
      breadcrumb="Stock transactions"
      eyebrow="Stocks / transactions"
      title="Trade history"
      description="Record buys, sells, IPOs, and share adjustments."
      action="Record trade"
      columns={["Trade", "Holding", "Amount", "Status"]}
      rows={[
        {
          title: "Buy · NICA",
          detail: "25 Sep 2026 · 50 shares",
          value: "- Rs. 38,750",
          status: "Settled",
          tone: "green",
        },
        {
          title: "Sell · CHDC",
          detail: "17 Sep 2026 · 10 shares",
          value: "+ Rs. 6,900",
          status: "Transferred",
          tone: "green",
        },
        {
          title: "Buy · NABIL",
          detail: "12 Sep 2026 · 20 shares",
          value: "- Rs. 12,200",
          status: "Settled",
          tone: "green",
        },
      ]}
    />
  );
}
