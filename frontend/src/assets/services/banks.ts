import { getSessionCookie } from "./auth";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const session = getSessionCookie();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.token || ""}`,
      ...options?.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Bank request failed.");
  return body as T;
}

export type BankAccount = {
  id: string;
  name: string;
  bank_name?: string;
  account_type: string;
  account_number_masked?: string;
  opening_balance: string;
  opening_balance_date?: string;
  current_balance: string;
  is_active: boolean;
  created_at?: string;
};
export type BankTransaction = {
  id: string;
  account_id: string;
  account_name?: string;
  type: string;
  transaction_type: string;
  category: string;
  subcategory?: string;
  amount: string;
  description?: string;
  transaction_date: string;
  status: string;
  is_void: boolean;
  transfer_pair_id?: string;
};
export const bankApi = {
  accounts: () => request<{ accounts: BankAccount[] }>("/banks/accounts"),
  addAccount: (data: Record<string, unknown>) =>
    request("/banks/accounts", { method: "POST", body: JSON.stringify(data) }),
  updateAccount: (id: string, data: Record<string, unknown>) =>
    request(`/banks/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  transactions: () =>
    request<{ transactions: BankTransaction[] }>("/banks/transactions"),
  addTransaction: (data: Record<string, unknown>) =>
    request("/banks/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  transfer: (data: Record<string, unknown>) =>
    request("/banks/transfers", { method: "POST", body: JSON.stringify(data) }),
  voidTransaction: (id: string) =>
    request(`/banks/transactions/${id}/void`, { method: "PATCH" }),
};
