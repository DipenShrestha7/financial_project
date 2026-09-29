import SectionPage from "../SectionPage";

export default function Transfers() {
  return (
    <SectionPage
      activePage="transfers"
      breadcrumb="Share transfers"
      eyebrow="Stocks / MeroShare"
      title="Share transfers"
      description="Match sold shares with the cash movement in your ledger."
      action="Add transfer"
      columns={["Transfer", "Shares", "Amount", "Status"]}
      rows={[
        {
          title: "CHDC · 10 shares",
          detail: "Sold 17 Sep 2026",
          value: "Rs. 6,900",
          status: "Pending",
          tone: "amber",
        },
        {
          title: "NICA · 50 shares",
          detail: "Sold 25 Sep 2026",
          value: "Rs. 38,750",
          status: "Pending",
          tone: "amber",
        },
        {
          title: "NABIL · 20 shares",
          detail: "Sold 12 Sep 2026",
          value: "Rs. 12,200",
          status: "Transferred",
          tone: "green",
        },
      ]}
    />
  );
}
