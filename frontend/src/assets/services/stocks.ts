import { getSessionCookie } from "./auth";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const session = getSessionCookie();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${session?.token || ""}`,
      ...options?.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Stock request failed.");
  return body as T;
}

export type StockEvent = {
  id: string;
  symbol: string;
  event_type: string;
  quantity: string;
  price: string;
  fees: string;
  amount: string;
  event_date: string;
  notes?: string;
  cost_basis_sold?: string;
  realized_pl?: string;
};
export type HistorySummary = {
  total_profit: string;
  total_loss: string;
  net_realized_pl: string;
  total_dividends: string;
  sell_count: string;
  bonus_count: string;
};
export type StockHistoryAggregate = {
  symbol: string;
  total_acquired: string;
  total_sold: string;
  realized_pl: string;
  dividends: string;
  event_count: string;
};
export type StockPortfolio = {
  id: string;
  name: string;
  description?: string;
  owner_name?: string;
  created_at: string;
};
export type Holding = {
  symbol: string;
  quantity: string;
  total_cost: string;
  average_cost: number;
  current_price: string | null;
  market_value: number | null;
  unrealized_pl: number | null;
};
export type Transfer = {
  id: string;
  event_id: string;
  symbol: string;
  quantity: string;
  amount: string;
  deadline: string;
  status: "PENDING" | "TRANSFERRED" | "MISSED" | "CANCELLED";
  is_hidden?: boolean;
  notes?: string;
};

export const stockApi = {
  scrips: () => request<{ symbols: string[] }>("/stocks/scrips"),
  portfolios: () =>
    request<{ portfolios: StockPortfolio[] }>("/stocks/portfolios"),
  createPortfolio: (data: Record<string, unknown>) =>
    request<{ portfolio: StockPortfolio }>("/stocks/portfolios", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePortfolio: (id: string, data: Record<string, unknown>) =>
    request<{ portfolio: StockPortfolio }>(`/stocks/portfolios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  portfolio: (portfolioId: string) =>
    request<{ holdings: Holding[] }>(
      `/stocks/portfolio?portfolioId=${encodeURIComponent(portfolioId)}`,
    ),
  transactions: (portfolioId?: string) =>
    request<{ transactions: StockEvent[] }>(
      `/stocks/transactions${portfolioId ? `?portfolioId=${encodeURIComponent(portfolioId)}` : ""}`,
    ),
  history: (portfolioId?: string) =>
    request<{
      history: StockEvent[];
      summary: HistorySummary;
      stocks: StockHistoryAggregate[];
    }>(
      `/stocks/history${portfolioId ? `?portfolioId=${encodeURIComponent(portfolioId)}` : ""}`,
    ),
  transfers: (portfolioId?: string, includeHidden = false) =>
    request<{ transfers: Transfer[] }>(
      `/stocks/transfers${portfolioId ? `?portfolioId=${encodeURIComponent(portfolioId)}&includeHidden=${includeHidden}` : `?includeHidden=${includeHidden}`}`,
    ),
  event: (data: Record<string, unknown>) =>
    request<{ event: StockEvent }>("/stocks/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  importEvents: (
    portfolioId: string,
    events: Array<Record<string, unknown>>,
  ) =>
    request<{ imported: number }>("/stocks/events/import", {
      method: "POST",
      body: JSON.stringify({ portfolioId, events }),
    }),
  updateEvent: (id: string, data: Record<string, unknown>) =>
    request<{ event: StockEvent }>(`/stocks/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  removeEvent: (id: string) =>
    request<{ success: boolean }>(`/stocks/events/${id}`, {
      method: "DELETE",
    }),
  removeScrip: (portfolioId: string, symbol: string) =>
    request<{ success: boolean }>(
      `/stocks/scrip/${encodeURIComponent(portfolioId)}/${encodeURIComponent(symbol)}`,
      { method: "DELETE" },
    ),
  price: (data: Record<string, unknown>) =>
    request("/stocks/prices", { method: "POST", body: JSON.stringify(data) }),
  transfer: (id: string, status: Transfer["status"]) =>
    request(`/stocks/transfers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  removeTransfer: (id: string) =>
    request(`/stocks/transfers/${id}`, {
      method: "DELETE",
      body: JSON.stringify({}),
    }),
  hideTransfer: (id: string) =>
    request(`/stocks/transfers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isHidden: true }),
    }),
  updateTransferVisibility: (id: string, isHidden: boolean) =>
    request(`/stocks/transfers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isHidden }),
    }),
};
