export type AllTimeEventType =
  | "BUY"
  | "SELL"
  | "IPO"
  | "MUTUAL_FUND"
  | "RIGHT"
  | "BONUS";

export type AllTimeEvent = {
  id: string;
  symbol: string;
  eventType: AllTimeEventType;
  quantity: number;
  eventDate: string;
  purchasePrice: number | null;
  sellPrice: number | null;
  currentPrice: number | null;
  purchasePriceIsWacc: boolean;
  notes: string;
};

export type AllTimeStockResult = {
  symbol: string;
  acquired: number;
  sold: number;
  remaining: number;
  invested: number;
  realizedPl: number;
  unrealizedPl: number | null;
  totalPl: number | null;
  currentValue: number | null;
  fees: number;
  capitalGainsTax: number;
};

export type AllTimeResult = {
  stocks: AllTimeStockResult[];
  invested: number;
  realizedPl: number;
  unrealizedPl: number | null;
  totalPl: number | null;
  currentValue: number | null;
  fees: number;
  capitalGainsTax: number;
};

function brokerRate(tradeAmount: number) {
  if (tradeAmount <= 50000) return 0.0036;
  if (tradeAmount <= 500000) return 0.0033;
  if (tradeAmount <= 2000000) return 0.0031;
  if (tradeAmount <= 10000000) return 0.0027;
  return 0.0024;
}

function tradeCharges(grossAmount: number) {
  const brokerFee = Math.max(grossAmount * brokerRate(grossAmount), 10);
  const sebonFee = grossAmount * 0.00015;
  return Number((brokerFee + sebonFee + 25).toFixed(2));
}

export function calculateAllTimePl(events: AllTimeEvent[]): AllTimeResult {
  const states = new Map<
    string,
    {
      acquired: number;
      sold: number;
      shares: number;
      cost: number;
      realizedPl: number;
      currentPrice: number | null;
      fees: number;
      capitalGainsTax: number;
      averageAcquiredTime: number | null;
    }
  >();

  const ordered = [...events].sort(
    (left, right) =>
      left.eventDate.localeCompare(right.eventDate) ||
      left.id.localeCompare(right.id),
  );

  for (const event of ordered) {
    const state = states.get(event.symbol) || {
      acquired: 0,
      sold: 0,
      shares: 0,
      cost: 0,
      realizedPl: 0,
      currentPrice: event.currentPrice,
      fees: 0,
      capitalGainsTax: 0,
      averageAcquiredTime: null,
    };
    if (event.currentPrice !== null) state.currentPrice = event.currentPrice;

    if (["BUY", "IPO", "MUTUAL_FUND", "RIGHT", "BONUS"].includes(event.eventType)) {
      const price = event.eventType === "IPO" ? 100 : event.purchasePrice || 0;
      const charges =
        event.eventType === "BUY" && !event.purchasePriceIsWacc
          ? tradeCharges(event.quantity * price)
          : 0;
      state.acquired += event.quantity;
      state.shares += event.quantity;
      state.cost += event.quantity * price + charges;
      state.fees += charges;
      const eventTime = Date.parse(event.eventDate);
      if (Number.isFinite(eventTime)) {
        const previousShares = state.shares - event.quantity;
        state.averageAcquiredTime =
          previousShares > 0 && state.averageAcquiredTime !== null
            ? (state.averageAcquiredTime * previousShares +
                eventTime * event.quantity) /
              state.shares
            : eventTime;
      }
    } else {
      const calculatedWacc = state.shares > 0 ? state.cost / state.shares : 0;
      const basis = event.purchasePriceIsWacc
        ? event.purchasePrice || 0
        : calculatedWacc;
      const grossProceeds = event.quantity * (event.sellPrice || 0);
      const charges = tradeCharges(grossProceeds);
      const netProceeds = grossProceeds - charges;
      const preTaxPl = netProceeds - event.quantity * basis;
      const holdingDays =
        state.averageAcquiredTime === null
          ? 0
          : Math.max(
              0,
              (Date.parse(event.eventDate) - state.averageAcquiredTime) /
                86400000,
            );
      const cgtRate = holdingDays <= 365 ? 0.05 : 0.0375;
      const capitalGainsTax = preTaxPl > 0 ? preTaxPl * cgtRate : 0;
      state.realizedPl += preTaxPl - capitalGainsTax;
      state.sold += event.quantity;
      state.fees += charges;
      state.capitalGainsTax += capitalGainsTax;
      if (state.shares > 0) {
        const used = Math.min(event.quantity, state.shares);
        state.shares -= used;
        state.cost -= used * calculatedWacc;
      }
    }
    states.set(event.symbol, state);
  }

  const stocks = [...states.entries()].map(([symbol, state]) => {
    const currentValue =
      state.currentPrice === null ? null : state.shares * state.currentPrice;
    const unrealizedPl =
      currentValue === null ? null : currentValue - state.cost;
    return {
      symbol,
      acquired: state.acquired,
      sold: state.sold,
      remaining: state.shares,
      invested: state.cost,
      realizedPl: state.realizedPl,
      unrealizedPl,
      totalPl: unrealizedPl === null ? null : state.realizedPl + unrealizedPl,
      currentValue,
      fees: state.fees,
      capitalGainsTax: state.capitalGainsTax,
    };
  });
  const hasMissingCurrentPrice = stocks.some(
    (stock) => stock.remaining > 0 && stock.unrealizedPl === null,
  );
  const currentValue = hasMissingCurrentPrice
    ? null
    : stocks.reduce((sum, stock) => sum + (stock.currentValue || 0), 0);
  const unrealizedPl = hasMissingCurrentPrice
    ? null
    : stocks.reduce((sum, stock) => sum + (stock.unrealizedPl || 0), 0);

  return {
    stocks,
    invested: stocks.reduce((sum, stock) => sum + stock.invested, 0),
    realizedPl: stocks.reduce((sum, stock) => sum + stock.realizedPl, 0),
    unrealizedPl,
    totalPl: unrealizedPl === null
      ? null
      : stocks.reduce((sum, stock) => sum + stock.realizedPl, 0) + unrealizedPl,
    currentValue,
    fees: stocks.reduce((sum, stock) => sum + stock.fees, 0),
    capitalGainsTax: stocks.reduce(
      (sum, stock) => sum + stock.capitalGainsTax,
      0,
    ),
  };
}

function csvLine(line: string) {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field.trim());
      field = "";
    } else {
      field += character;
    }
  }
  fields.push(field.trim());
  return fields;
}

const numberFrom = (value: string | undefined) => {
  if (!value) return null;
  const number = Number(value.replace(/,/g, "").replace(/%$/, ""));
  return Number.isFinite(number) ? number : null;
};

export function parseAllTimeCsv(text: string): AllTimeEvent[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("The CSV file has no transactions.");
  const headers = csvLine(lines[0]).map((header) =>
    header.toLowerCase().replace(/[_-]/g, " ").trim(),
  );
  const indexOf = (...names: string[]) =>
    names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const symbolIndex = indexOf("scrip", "symbol");
  const dateIndex = indexOf("transaction date", "date");
  const creditIndex = indexOf("credit quantity", "buy quantity", "quantity");
  const debitIndex = indexOf("debit quantity", "sell quantity");
  const descriptionIndex = indexOf("history description", "description", "notes");
  const waccIndex = indexOf("wacc", "wacc price");
  const purchaseIndex = indexOf(
    "wacc",
    "wacc price",
    "purchase price",
    "buy price",
    "average cost",
  );
  const sellIndex = indexOf("sell price", "selling price", "sale price");
  const currentIndex = indexOf("current price", "ltp", "market price");
  if ([symbolIndex, dateIndex, creditIndex, debitIndex].some((index) => index < 0)) {
    throw new Error(
      "CSV must include Scrip, Transaction Date, Credit Quantity, and Debit Quantity (or Quantity).",
    );
  }

  return lines.slice(1).flatMap((line, rowIndex) => {
    const values = csvLine(line);
    const credit = numberFrom(values[creditIndex]) || 0;
    const debit = numberFrom(values[debitIndex]) || 0;
    const symbol = values[symbolIndex]?.toUpperCase();
    const notes = values[descriptionIndex] || "";
    const eventType: AllTimeEventType = credit > 0
      ? /mutual fund|mutualfund/i.test(notes)
        ? "MUTUAL_FUND"
        : /bonus/i.test(notes)
        ? "BONUS"
        : /right/i.test(notes)
          ? "RIGHT"
          : /ipo|initial public offering/i.test(notes)
            ? "IPO"
            : "BUY"
      : "SELL";
    const quantity = credit > 0 ? credit : debit;
    if (!symbol || quantity <= 0) return [];
    return [{
      id: `${rowIndex}-${symbol}-${values[dateIndex]}`,
      symbol,
      eventType,
      quantity,
      eventDate: values[dateIndex],
      purchasePrice:
        eventType === "IPO"
          ? 100
          : numberFrom(values[purchaseIndex]),
      sellPrice: eventType === "SELL"
        ? numberFrom(values[sellIndex]) || numberFrom(values[purchaseIndex])
        : null,
      currentPrice: numberFrom(values[currentIndex]),
      purchasePriceIsWacc:
        !["IPO", "MUTUAL_FUND"].includes(eventType) && waccIndex >= 0,
      notes,
    }];
  });
}
