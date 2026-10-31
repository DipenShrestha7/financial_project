import axios from "axios";
import { getSessionCookie } from "./auth";

const chatbotApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

chatbotApi.interceptors.request.use((config) => {
  const session = getSessionCookie();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; url: string }>;
  created_at?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export async function fetchChatSessions() {
  const response = await chatbotApi.get<{ sessions: ChatSession[] }>("/chat/sessions");
  return response.data.sessions;
}

export async function fetchChatHistory(sessionId: string) {
  const response = await chatbotApi.get<{ messages: ChatMessage[] }>(
    `/chat/sessions/${sessionId}`,
  );
  return response.data.messages;
}

export async function sendChatMessage(message: string, sessionId?: string) {
  const response = await chatbotApi.post<{
    session_id: string;
    answer: string;
    sources: Array<{ title: string; url: string }>;
  }>("/chat/messages", { message, session_id: sessionId });
  return response.data;
}

export function getChatbotErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "The chatbot service is unavailable.";
  }
  return error instanceof Error ? error.message : "The chatbot service is unavailable.";
}
