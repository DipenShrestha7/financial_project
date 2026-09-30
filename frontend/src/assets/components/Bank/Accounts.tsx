import BankSectionPage from "./BankSectionPage.tsx";

export default function BankAccounts() {
  return (
    <BankSectionPage
      mode="accounts"
      activePage="bank-accounts"
      breadcrumb="Bank accounts"
      eyebrow="Banks / accounts"
      title="Your accounts"
      description="Manage every bank, wallet, and cash source from one derived balance hub."
    />
  );
}
