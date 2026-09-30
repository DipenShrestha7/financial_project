import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import DashboardLayout, { type PageKey } from "./Sidebar";

type SectionRow = {
  title: string;
  detail: string;
  value: string;
  status: string;
  tone?: "green" | "red" | "amber";
};
type SectionPageProps = {
  activePage: PageKey;
  breadcrumb: string;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  rows: SectionRow[];
  columns: [string, string, string, string];
};
const tones = {
  green: "bg-[#102c26] text-[#57d1ae]",
  red: "bg-[#321a1c] text-[#e57b7b]",
  amber: "bg-[#302612] text-[#dcb66a]",
};

export default function SectionPage({
  activePage,
  breadcrumb,
  eyebrow,
  title,
  description,
  action,
  rows,
  columns,
}: SectionPageProps) {
  return (
    <DashboardLayout activePage={activePage} breadcrumb={breadcrumb}>
      <div className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7">
        <div className="mb-8 flex items-end justify-between max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-4.5">
          <div>
            <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              {eyebrow}
            </p>
            <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
              {title}
            </h1>
            <p className="text-[12px] text-[#758183]">{description}</p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-md bg-[#32c7aa] px-3.75 py-2.75 text-[11px] font-bold text-[#041311] hover:bg-[#5bdec8] max-[680px]:w-full">
            <Plus size={16} />
            {action}
          </button>
        </div>
        <section className="mb-3.5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
          <Summary
            label="Records"
            value={String(rows.length).padStart(2, "0")}
            detail="Tracked this period"
          />
          <Summary
            label="Positive movement"
            value={rows
              .filter((row) => row.tone === "green")
              .length.toString()
              .padStart(2, "0")}
            detail="Improving records"
          />
          <Summary
            label="Needs review"
            value={rows
              .filter((row) => row.tone !== "green")
              .length.toString()
              .padStart(2, "0")}
            detail="Keep an eye on these"
          />
        </section>
        <section className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5">
          <div className="border-t border-[#1b2222]">
            <div className="grid grid-cols-[1.5fr_1.2fr_1fr_1fr] gap-3 px-3.75 py-2.75 text-[8px] uppercase tracking-[.8px] text-[#627071] max-[680px]:hidden">
              {columns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
            {rows.map((row) => (
              <div
                className="grid grid-cols-[1.5fr_1.2fr_1fr_1fr] items-center gap-3 border-t border-[#171d1d] px-3.75 py-3 text-[10px] hover:bg-[#0b1010] max-[680px]:grid-cols-[minmax(0,1fr)_auto] max-[680px]:gap-2 max-[680px]:px-1"
                key={row.title}
              >
                <div className="flex min-w-0 items-center gap-2.25">
                  <span
                    className={`grid h-6.25 w-6.25 shrink-0 place-items-center rounded-md ${row.tone ? tones[row.tone] : "bg-[#112631] text-[#6ebfe1]"}`}
                  >
                    {row.tone === "red" ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownLeft size={14} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <strong className="block wrap-break-words text-[10px] text-[#c4d2d0]">
                      {row.title}
                    </strong>
                    <small className="mt-0.75 block text-[9px] text-[#647374]">
                      {row.detail}
                    </small>
                  </span>
                </div>
                <span className="text-[#9aabaa] max-[680px]:hidden">
                  {row.detail}
                </span>
                <span className="text-[#d4dfdd] max-[680px]:col-start-2 max-[680px]:row-start-1 max-[680px]:whitespace-nowrap">
                  {row.value}
                </span>
                <span
                  className={`justify-self-end rounded-sm px-1.75 py-1 text-[8px] max-[680px]:col-start-2 max-[680px]:row-start-2 ${row.tone ? tones[row.tone] : "bg-[#112631] text-[#6ebfe1]"}`}
                >
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function Summary({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-[#203034] bg-[#0b1112] p-4.5">
      <span className="text-[10px] text-[#aab6b6]">{label}</span>
      <strong className="mt-3 block text-[22px] font-semibold text-[#eff4f2]">
        {value}
      </strong>
      <p className="mt-1 text-[9px] text-[#57d1ae]">{detail}</p>
    </article>
  );
}
