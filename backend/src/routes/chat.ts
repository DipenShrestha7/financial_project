import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { pool } from "../config/db.js";
import { extractBearerToken, verifyToken } from "../config/jwt.js";

type ChatBody = {
  session_id?: string;
  message?: string;
};

type ChatbotResponse = {
  answer: string;
  sources: Array<{ title: string; url: string }>;
};

type StoredMessage = {
  role: "user" | "assistant";
  content: string;
};

function requireUser(request: { headers: { authorization?: string } }) {
  const token = extractBearerToken(request.headers.authorization);
  if (!token) throw new Error("Unauthorized");
  const payload = verifyToken(token);
  if (
    !payload ||
    typeof payload === "string" ||
    typeof payload !== "object" ||
    !("sub" in payload) ||
    typeof payload.sub !== "string"
  ) {
    throw new Error("Unauthorized");
  }
  return payload.sub;
}

export default async function chatRoutes(app: FastifyInstance) {
  app.get("/api/chat/sessions", async (request, reply) => {
    let userId: string;
    try {
      userId = requireUser(request);
    } catch {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, title, created_at, updated_at
       FROM chatbot_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 50`,
      [userId],
    );
    return { sessions: result.rows };
  });

  app.get("/api/chat/sessions/:sessionId", async (request, reply) => {
    let userId: string;
    try {
      userId = requireUser(request);
    } catch {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { sessionId } = request.params as { sessionId: string };
    const result = await pool.query(
      `SELECT role, content, sources, created_at
       FROM chatbot_messages m
       INNER JOIN chatbot_sessions s ON s.id = m.session_id
       WHERE m.session_id = $1 AND s.user_id = $2
       ORDER BY m.created_at ASC`,
      [sessionId, userId],
    );
    return { session_id: sessionId, messages: result.rows };
  });

  app.post("/api/chat/messages", async (request, reply) => {
    let userId: string;
    try {
      userId = requireUser(request);
    } catch {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const body = request.body as ChatBody;
    const message = body.message?.trim();
    if (!message || message.length > 2000) {
      return reply.code(400).send({ message: "A message between 2 and 2000 characters is required." });
    }

    let sessionId = body.session_id ?? randomUUID();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      return reply.code(400).send({ message: "Invalid chat session." });
    }
    if (body.session_id) {
      const ownedSession = await pool.query(
        "SELECT id FROM chatbot_sessions WHERE id = $1 AND user_id = $2",
        [sessionId, userId],
      );
      if (ownedSession.rowCount === 0) sessionId = randomUUID();
    }
    const historyResult = await pool.query<StoredMessage>(
      `SELECT m.role, m.content
       FROM chatbot_messages m
       INNER JOIN chatbot_sessions s ON s.id = m.session_id
       WHERE m.session_id = $1 AND s.user_id = $2
       ORDER BY m.created_at DESC
       LIMIT 12`,
      [sessionId, userId],
    );
    let response: ChatbotResponse;
    try {
      const chatbotResponse = await fetch(
        `${process.env.CHATBOT_API_URL ?? "http://127.0.0.1:8002"}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            message,
            history: historyResult.rows.reverse(),
          }),
        },
      );
      if (!chatbotResponse.ok) {
        const detail = await chatbotResponse.text();
        throw new Error(`Chatbot returned ${chatbotResponse.status}: ${detail}`);
      }
      response = (await chatbotResponse.json()) as ChatbotResponse;
    } catch (error) {
      request.log.error(error, "Chatbot service request failed");
      return reply.code(502).send({
        message:
          error instanceof Error && error.message.includes("ECONNREFUSED")
            ? "The chatbot service is not running. Start chatbot/main.py on port 8001."
            : error instanceof Error && error.message.includes("OPENROUTER_API_KEY")
              ? "OPENROUTER_API_KEY is missing from the root .env file."
              : "The chatbot service could not process this request. Check the chatbot service logs.",
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO chatbot_sessions (id, user_id, title) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
        [sessionId, userId, message.slice(0, 80)],
      );
      await client.query(
        `INSERT INTO chatbot_messages (session_id, role, content, sources)
         VALUES ($1, 'user', $2, '[]'::jsonb), ($1, 'assistant', $3, $4::jsonb)`,
        [sessionId, message, response.answer, JSON.stringify(response.sources ?? [])],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      request.log.error(error, "Chat history transaction failed");
      return reply.code(500).send({ message: "The chat response could not be saved." });
    } finally {
      client.release();
    }

    return { session_id: sessionId, answer: response.answer, sources: response.sources ?? [] };
  });
}
