import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { pool } from "../config/db.js";
import { extractBearerToken, signToken, verifyToken } from "../config/jwt.js";

type AuthBody = {
  name?: string;
  email?: string;
  password?: string;
};

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export default async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/signup", async (request, reply) => {
    const { name, email, password } = request.body as AuthBody;

    if (!name || !email || !password) {
      return reply.code(400).send({
        message: "Name, email, and password are required.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || password.length < 6) {
      return reply.code(400).send({
        message: "Please provide valid signup details.",
      });
    }

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1;`,
      [normalizedEmail],
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return reply.code(409).send({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = hashPassword(password);

    const created = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'owner')
       RETURNING id, name, email, role;`,
      [normalizedName, normalizedEmail, passwordHash],
    );

    const user = created.rows[0];

    return {
      token: signToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  });

  app.post("/api/auth/login", async (request, reply) => {
    const { email, password } = request.body as AuthBody;

    if (!email || !password) {
      return reply.code(400).send({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = hashPassword(password);

    const userResult = await pool.query(
      `SELECT id, name, email, role, password_hash FROM users WHERE email = $1 LIMIT 1;`,
      [normalizedEmail],
    );

    const userRecord = userResult.rows[0];

    if (!userRecord || userRecord.password_hash !== passwordHash) {
      return reply.code(401).send({ message: "Invalid email or password." });
    }

    return {
      token: signToken({
        sub: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
      }),
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
      },
    };
  });

  app.get("/api/users", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    try {
      verifyToken(token);
    } catch {
      return reply.code(401).send({ message: "Invalid or expired token" });
    }

    const result = await pool.query(
      `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 20;`,
    );

    return { users: result.rows };
  });
}
