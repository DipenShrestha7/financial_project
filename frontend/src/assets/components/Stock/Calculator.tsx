import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "../Sidebar";
import {
  NepseTradeCalculator,
  type TradeOutput,
} from "../../services/calculate";

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function StockCalculator() {
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [basisType, setBasisType] = useState<"WACC" | "MARKET">("WACC");
  const [holdingPeriod, setHoldingPeriod] = useState<"SHORT" | "LONG">("SHORT");
  const [investorType, setInvestorType] = useState("Individual");

  const quantityValue = Number(quantity);
  const priceValue = Number(price);
  const output: TradeOutput | null =
    quantityValue > 0 && priceValue > 0
      ? NepseTradeCalculator.calculate({
          type,
          quantity: quantityValue,
          pricePerShare: priceValue,
          costBasisPerShare: Number(costBasis) || 0,
          holdingDays: holdingPeriod === "SHORT" ? 365 : 366,
          isInstitutional: investorType === "Corporate",
        })
      : null;

  return (
    <DashboardLayout
      activePage="stock-calculator"
      breadcrumb="Stock calculator"
    >
      <div className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7">
        <div className="mb-8">
          <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
            Stocks / calculator
          </p>
          <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
            Trade estimator &amp; P/L calculator
          </h1>
          <p className="text-[12px] text-[#758183]">
            Calculate statutory fees, taxes, and take-home totals before
            recording trades.
          </p>
        </div>
        <div className="grid grid-cols-[.9fr_1.1fr] gap-3.5 max-[900px]:grid-cols-1">
          <form
            className="rounded-lg border border-[#1d3937] bg-linear-to-br from-[#0b1716] to-[#0a1112] p-5.5"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-md bg-[#182323] p-1">
              {(["BUY", "SELL"] as const).map((tradeType) => (
                <button
                  key={tradeType}
                  type="button"
                  onClick={() => setType(tradeType)}
                  className={`rounded px-3 py-2 text-[11px] font-semibold ${type === tradeType ? "bg-[#102c26] text-[#57d1ae]" : "text-[#8b9b9a]"}`}
                >
                  {tradeType}{" "}
                  <span className="font-normal opacity-70">
                    {tradeType === "BUY"
                      ? "(Estimate Total Cost)"
                      : "(Estimate Proceeds & CGT)"}
                  </span>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <Field
                label="Stock symbol (optional)"
                placeholder="e.g., CHDC"
                value={symbol}
                onChange={setSymbol}
              />
              <Field
                label="Quantity"
                type="number"
                min="0"
                placeholder="e.g., 100"
                value={quantity}
                onChange={setQuantity}
              />
              {type === "SELL" ? (
                <>
                  <Field
                    label={
                      basisType === "WACC"
                        ? "WACC price per share"
                        : "Market purchase price per share"
                    }
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Purchase price per share"
                    value={costBasis}
                    onChange={setCostBasis}
                  />
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#b2c0be]">
                    {(["WACC", "MARKET"] as const).map((basis) => (
                      <label
                        key={basis}
                        className={`flex cursor-pointer items-center gap-2 ${basisType === basis ? "text-[#57d1ae]" : "text-[#819091]"}`}
                      >
                        <input
                          type="radio"
                          name="purchase-basis"
                          checked={basisType === basis}
                          onChange={() => setBasisType(basis)}
                          className="accent-[#32c7aa]"
                        />
                        {basis === "WACC"
                          ? "WACC price"
                          : "Market purchase price"}
                      </label>
                    ))}
                  </div>
                  <Field
                    label="Selling price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Selling price per share"
                    value={price}
                    onChange={setPrice}
                  />
                  <label className="block text-[11px] text-[#b2c0be]">
                    Holding period
                    <select
                      value={holdingPeriod}
                      onChange={(event) =>
                        setHoldingPeriod(event.target.value as "SHORT" | "LONG")
                      }
                      className="mt-1.5 h-10 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[12px] text-[#d4dfdd] outline-none focus:border-[#32c7aa]"
                    >
                      <option value="SHORT">1 year or less (≤ 365 days)</option>
                      <option value="LONG">
                        More than 1 year (&gt; 365 days)
                      </option>
                    </select>
                  </label>
                </>
              ) : (
                <Field
                  label="Purchase price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Purchase price per share"
                  value={price}
                  onChange={setPrice}
                />
              )}
              <label className="block text-[11px] text-[#b2c0be]">
                Investor type
                <select
                  value={investorType}
                  onChange={(event) => setInvestorType(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[12px] text-[#d4dfdd] outline-none focus:border-[#32c7aa]"
                >
                  <option>Individual</option>
                  <option>Corporate</option>
                </select>
              </label>
            </div>
          </form>
          <Breakdown type={type} output={output} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-[11px] text-[#b2c0be]">
      {label}
      <input
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-10 w-full rounded-md border border-[#294340] bg-[#08100f] px-3 text-[12px] text-[#d4dfdd] outline-none placeholder:text-[#718582] focus:border-[#32c7aa] focus:ring-2 focus:ring-[#32c7aa]/20"
      />
    </label>
  );
}

function Breakdown({
  type,
  output,
}: {
  type: "BUY" | "SELL";
  output: TradeOutput | null;
}) {
  const rows = output
    ? [
        ["Share amount (Gross)", money(output.grossAmount)],
        ["NEPSE broker commission", money(output.brokerFee)],
        ["SEBON regulatory fee", money(output.sebonFee)],
        ["DP charge", money(output.dpFee)],
      ]
    : [];
  return (
    <section className="rounded-lg border border-[#203640] bg-[#0b151a] p-5.5">
      <div className="flex items-start justify-between">
        <div>
          <span className="mb-2.25 block text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
            Estimated {type === "BUY" ? "cost" : "proceeds"} breakdown
          </span>
          <h2 className="text-[17px] font-semibold text-[#eef3f1]">
            {type === "BUY"
              ? "Estimated Cost Breakdown (BUY)"
              : "Estimated Sale Breakdown (SELL)"}
          </h2>
        </div>
        {output && (
          <span className="flex items-center gap-1 text-[10px] text-[#57d1ae]">
            <CheckCircle2 size={13} /> Calculated
          </span>
        )}
      </div>
      {output ? (
        <>
          <div className="mt-5 divide-y divide-[#203234]">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 py-3 text-[11px] text-[#aab8b6]"
              >
                <span>{label}</span>
                <strong className="text-[#e5edeb]">{value}</strong>
              </div>
            ))}
            {type === "SELL" && (
              <>
                <div className="flex justify-between py-3 text-[11px] text-[#aab8b6]">
                  <span>Gross realized profit / loss</span>
                  <strong
                    className={
                      output.grossProfit && output.grossProfit >= 0
                        ? "text-[#57d1ae]"
                        : "text-[#e57b7b]"
                    }
                  >
                    {money(output.grossProfit || 0)}
                  </strong>
                </div>
                <div className="flex justify-between py-3 text-[11px] text-[#aab8b6]">
                  <span>Capital gains tax</span>
                  <strong className="text-[#e5edeb]">
                    {money(output.cgtAmount || 0)}
                  </strong>
                </div>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#294340] pt-4">
            <strong className="text-[15px] text-[#eef3f1]">
              {type === "BUY" ? "Paying Total" : "Net cash in bank"}
            </strong>
            <strong className="text-[21px] text-[#57d1ae]">
              {money(
                type === "BUY"
                  ? output.totalPayable || 0
                  : output.netCashInBank || 0,
              )}
            </strong>
          </div>
          <p className="mt-3 text-[10px] text-[#718582]">
            {type === "BUY"
              ? `Effective cost per share: ${money(output.effectiveCostPerShare || 0)}`
              : `CGT rate applied: ${((output.cgtRateApplied || 0) * 100).toFixed(1)}%`}
          </p>
        </>
      ) : (
        <p className="mt-8 text-center text-[12px] text-[#718582]">
          Enter a quantity and price to calculate the statutory charges.
        </p>
      )}
    </section>
  );
}
