import SectionPage from "../SectionPage.tsx";

export default function StockPortfolio() {
  return (
    <SectionPage
      activePage="stock-portfolio"
      breadcrumb="Stock portfolio"
      eyebrow="Stocks / portfolio"
      title="Your holdings"
      description="Track quantities, market value, and unrealized performance."
      action="Add holding"
      columns={["Holding", "Shares", "Market value", "Performance"]}
      rows={[
        {
          title: "CHDC · Chandragiri Hills",
          detail: "Average cost Rs. 615",
          value: "Rs. 86,400",
          status: "+ Rs. 12,600",
          tone: "green",
        },
        {
          title: "NICA · NIC Asia Bank",
          detail: "Average cost Rs. 655",
          value: "Rs. 192,500",
          status: "+ Rs. 28,750",
          tone: "green",
        },
        {
          title: "NABIL · Nabil Bank",
          detail: "Average cost Rs. 640",
          value: "Rs. 48,800",
          status: "- Rs. 2,400",
          tone: "red",
        },
      ]}
    />
  );
}
