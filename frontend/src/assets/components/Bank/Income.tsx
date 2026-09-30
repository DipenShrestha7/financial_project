import BankSectionPage from "./BankSectionPage";

export default function Income() {
  return (
    <BankSectionPage
      mode="income"
      activePage="income"
      breadcrumb="Income"
      eyebrow="Banks / income"
      title="Income records"
      description="Track salary, freelance work, dividends, interest, and other inflows by source and status."
    />
  );
}
