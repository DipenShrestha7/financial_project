import {
  ArrowUp,
  Bot,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Sidebar from "../components/Sidebar";
import {
  fetchChatHistory,
  fetchChatSessions,
  getChatbotErrorMessage,
  sendChatMessage,
  type ChatMessage,
  type ChatSession,
} from "../services/chatbot";

const SESSION_KEY = "nepal-finance-chat-session";

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem(SESSION_KEY) ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }

    let active = true;
    async function loadHistory() {
      try {
        const history = await fetchChatHistory(sessionId);
        if (active) setMessages(history);
      } catch {
        if (active) setError("Unable to load this chat session.");
      }
    }

    void loadHistory();
    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    async function loadSessions() {
      try {
        const savedSessions = await fetchChatSessions();
        if (active) setSessions(savedSessions);
      } catch {
        if (active) setError("Unable to load saved chat sessions.");
      }
    }

    void loadSessions();
    return () => {
      active = false;
    };
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || loading) return;
    setDraft("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setLoading(true);
    try {
      const response = await sendChatMessage(question, sessionId || undefined);
      if (!sessionId) {
        localStorage.setItem(SESSION_KEY, response.session_id);
        setSessionId(response.session_id);
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ]);
      setSessions(await fetchChatSessions());
    } catch (submitError) {
      setError(getChatbotErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    localStorage.removeItem(SESSION_KEY);
    setSessionId("");
    setMessages([]);
    setError("");
  }

  return (
    <Sidebar activePage="chatbot" breadcrumb="Finance assistant">
      <div className="mx-auto flex h-full min-h-0 max-w-none gap-5 p-10.5 max-[900px]:flex-col max-[680px]:px-4.25 max-[680px]:py-7">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mb-5">
            <h1 className="text-[28px] font-bold tracking-[-.8px] text-[#f1f4f3]">
              Finance Assistant
            </h1>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-lg border border-[#1d3937] bg-[#0b1112] p-5">
            {messages.length === 0 && (
              <div className="flex min-h-60 flex-col items-center justify-center text-center">
                <Bot size={28} className="mb-3 text-[#55d4b8]" />
                <p className="text-[13px] font-semibold text-[#dce8e5]">
                  What would you like to know?
                </p>
                <p className="mt-2 max-w-md text-[11px] leading-5 text-[#748684]">
                  Try “What moved NEPSE today?” or “Explain Nepal Rastra Bank’s
                  latest policy rate.”
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[80%] rounded-lg bg-[#16473e] p-3 text-[12px] text-[#e2f5ef]"
                    : "max-w-[90%] rounded-lg border border-[#243735] bg-[#101a1a] p-4 text-[12px] leading-6 text-[#cbd8d5]"
                }
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 border-t border-[#263b38] pt-2">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[#718783]">
                      Sources
                    </p>
                    {message.sources.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] text-[#55d4b8] hover:underline"
                      >
                        <ExternalLink size={10} />
                        {source.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-[#748684]">
                <LoaderCircle size={14} className="animate-spin" /> Searching
                public sources…
              </div>
            )}
            <div ref={endRef} />
          </div>
          {error && <p className="mt-3 text-[11px] text-[#ecaaa0]">{error}</p>}
          <form
            onSubmit={submit}
            className="mt-4 flex gap-2 rounded-lg border border-[#2a4442] bg-[#101a1a] p-2"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              placeholder="Ask a NEPSE or banking question…"
              className="min-w-0 flex-1 bg-transparent px-2 text-[12px] text-[#e9f1ef] outline-none placeholder:text-[#627271]"
            />
            <button
              type="submit"
              disabled={!draft.trim() || loading}
              aria-label="Send message"
              className="rounded-md bg-[#32c7aa] p-2.5 text-[#041311] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp size={16} />
            </button>
          </form>
        </section>
        <aside className="flex min-h-0 w-65 shrink-0 flex-col rounded-lg border border-[#1d3937] bg-[#0b1112] p-4 max-[900px]:w-full">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#9baead]">
              Chats
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={newChat}
                className="flex items-center gap-1.5 rounded-md border border-[#2a4442] px-2 py-1.5 text-[9px] text-[#70d9bf] hover:bg-[#15312d]"
              >
                <RotateCcw size={11} /> New chat
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {sessions.length === 0 && (
              <p className="text-[10px] leading-5 text-[#687977]">
                Your conversations will appear here.
              </p>
            )}
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => {
                  localStorage.setItem(SESSION_KEY, session.id);
                  setSessionId(session.id);
                  setError("");
                }}
                className={`w-full rounded-md px-2.5 py-2 text-left text-[10px] ${session.id === sessionId ? "bg-[#16473e] text-[#dff8ef]" : "text-[#91a19f] hover:bg-[#132421] hover:text-[#dce8e5]"}`}
              >
                <span className="block truncate">{session.title}</span>
                <span className="mt-1 block text-[9px] text-[#627c77]">
                  {new Date(session.updated_at).toLocaleDateString("en-NP")}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </Sidebar>
  );
}
