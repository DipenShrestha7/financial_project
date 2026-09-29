import { Bell, LockKeyhole, Palette, UserRound } from "lucide-react";
import DashboardLayout from "../components/Sidebar";

function SettingsPage() {
  return (
    <DashboardLayout activePage="settings">
      <div className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7">
        <div className="mb-8">
          <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
            Account preferences
          </p>
          <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
            Settings
          </h1>
          <p className="text-[12px] text-[#758183]">
            Manage your profile, notifications, and ledger preferences.
          </p>
        </div>
        <section className="grid max-w-3xl gap-3.5">
          <SettingRow
            icon={UserRound}
            title="Profile"
            detail="Alex Sharma · alex@hisabkitab.app"
            action="Edit profile"
          />
          <SettingRow
            icon={Bell}
            title="Notifications"
            detail="Ledger reminders and transfer updates"
            action="Manage"
          />
          <SettingRow
            icon={Palette}
            title="Appearance"
            detail="Black theme · Compact dashboard"
            action="Customize"
          />
          <SettingRow
            icon={LockKeyhole}
            title="Security"
            detail="Password and account access"
            action="Review"
          />
        </section>
      </div>
    </DashboardLayout>
  );
}

function SettingRow({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: typeof UserRound;
  title: string;
  detail: string;
  action: string;
}) {
  return (
    <article className="flex items-center gap-3.5 rounded-lg border border-[#202f31] bg-[#0b1112] p-4.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#12342f] text-[#5bd2b6]">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[12px] font-semibold text-[#dbe5e3]">{title}</h2>
        <p className="mt-1 truncate text-[10px] text-[#6f7e7e]">{detail}</p>
      </div>
      <button className="rounded border border-[#2a4241] px-2.5 py-1.5 text-[9px] text-[#72d8c0] hover:bg-[#14312d]">
        {action}
      </button>
    </article>
  );
}

export default SettingsPage;
