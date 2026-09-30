import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { pool } from "../config/db.js";
import { extractBearerToken, verifyToken } from "../config/jwt.js";

type BankBody = {
  name?: string;
  bankName?: string;
  accountType?: string;
  accountNumberMasked?: string;
  openingBalance?: number;
  openingBalanceDate?: string;
  accountId?: string;
  toAccountId?: string;
  type?: string;
  category?: string;
  subcategory?: string;
  amount?: number;
  description?: string;
  transactionDate?: string;
  status?: string;
};

function userIdFrom(request: { headers: { authorization?: string } }) {
  const token = extractBearerToken(request.headers.authorization);
  if (!token) throw new Error("Unauthorized");
  const payload = verifyToken(token) as { sub?: string };
  if (!payload.sub) throw new Error("Unauthorized");
  return payload.sub;
}

const dateOrToday = (value?: string) =>
  value || new Date().toISOString().slice(0, 10);

export default async function bankRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    try {
      userIdFrom(request);
    } catch {
      return reply.code(401).send({ message: "Unauthorized" });
    }
  });

  app.get("/api/banks/accounts", async (request) => {
    const userId = userIdFrom(request);
    const result = await pool.query(
      `
      SELECT a.*, a.opening_balance + COALESCE(SUM(CASE WHEN l.is_void OR l.status = 'PENDING' THEN 0 WHEN l.transaction_type IN ('INCOME','TRANSFER_IN') THEN l.amount WHEN l.transaction_type IN ('EXPENSE','TRANSFER_OUT') THEN -l.amount ELSE l.amount END), 0) AS current_balance
      FROM bank_accounts a LEFT JOIN ledger_entries l ON l.account_id = a.id AND l.user_id = a.user_id
      WHERE a.user_id = $1 GROUP BY a.id ORDER BY a.is_active DESC, a.created_at ASC`,
      [userId],
    );
    return { accounts: result.rows };
  });

  app.post("/api/banks/accounts", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as BankBody;
    if (!body.name?.trim() || !body.accountType)
      return reply
        .code(400)
        .send({ message: "Account name and type are required." });
    const result = await pool.query(
      `INSERT INTO bank_accounts (user_id,name,bank_name,account_type,account_number_masked,opening_balance,opening_balance_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        userId,
        body.name.trim(),
        body.bankName?.trim() || null,
        body.accountType,
        body.accountNumberMasked || null,
        Number(body.openingBalance || 0),
        dateOrToday(body.openingBalanceDate),
      ],
    );
    return { account: result.rows[0] };
  });

  app.patch("/api/banks/accounts/:id", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as BankBody & { isActive?: boolean };
    const result = await pool.query(
      `UPDATE bank_accounts SET name=COALESCE($1,name), bank_name=COALESCE($2,bank_name), account_type=COALESCE($3,account_type), account_number_masked=COALESCE($4,account_number_masked), is_active=COALESCE($5,is_active) WHERE id=$6 AND user_id=$7 RETURNING *`,
      [
        body.name,
        body.bankName,
        body.accountType,
        body.accountNumberMasked,
        body.isActive,
        (request.params as { id: string }).id,
        userId,
      ],
    );
    if (!result.rowCount)
      return reply.code(404).send({ message: "Account not found." });
    return { account: result.rows[0] };
  });

  app.get("/api/banks/transactions", async (request) => {
    const userId = userIdFrom(request);
    const result = await pool.query(
      `SELECT l.*, a.name AS account_name FROM ledger_entries l LEFT JOIN bank_accounts a ON a.id=l.account_id WHERE l.user_id=$1 ORDER BY l.transaction_date DESC, l.created_at DESC`,
      [userId],
    );
    return { transactions: result.rows };
  });

  app.post("/api/banks/transactions", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as BankBody;
    const type = body.type?.toUpperCase();
    const amount = Number(body.amount || 0);
    if (
      !body.accountId ||
      !type ||
      (type === "ADJUSTMENT" ? amount === 0 : amount <= 0) ||
      !["INCOME", "EXPENSE", "ADJUSTMENT"].includes(type)
    )
      return reply.code(400).send({
        message: "Account, type, and a positive amount are required.",
      });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `SELECT id FROM bank_accounts WHERE id=$1 AND user_id=$2 FOR UPDATE`,
        [body.accountId, userId],
      );
      await client.query(
        `INSERT INTO ledger_entries (user_id,account_id,type,transaction_type,category,subcategory,amount,description,transaction_date,status) VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9)`,
        [
          userId,
          body.accountId,
          type,
          body.category || "Other",
          body.subcategory || null,
          amount,
          body.description || null,
          dateOrToday(body.transactionDate),
          body.status === "PENDING" ? "PENDING" : "RECEIVED",
        ],
      );
      await client.query("COMMIT");
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      return reply.code(400).send({
        message:
          error instanceof Error
            ? error.message
            : "Could not record transaction.",
      });
    } finally {
      client.release();
    }
  });

  app.post("/api/banks/transfers", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as BankBody;
    const amount = Number(body.amount || 0);
    if (
      !body.accountId ||
      !body.toAccountId ||
      body.accountId === body.toAccountId ||
      amount <= 0
    )
      return reply.code(400).send({
        message: "Choose two different accounts and a positive amount.",
      });
    const pairId = randomUUID();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const accounts = await client.query(
        `SELECT id FROM bank_accounts WHERE id = ANY($1::uuid[]) AND user_id=$2 FOR UPDATE`,
        [[body.accountId, body.toAccountId], userId],
      );
      if (accounts.rowCount !== 2) throw new Error("Account not found.");
      const values = [
        userId,
        body.accountId,
        body.toAccountId,
        amount,
        body.category || "Internal transfer",
        body.description || null,
        dateOrToday(body.transactionDate),
        pairId,
      ];
      await client.query(
        `INSERT INTO ledger_entries (user_id,account_id,type,transaction_type,category,amount,description,transaction_date,transfer_pair_id) VALUES ($1,$2,'TRANSFER_OUT','TRANSFER_OUT',$5,$4,$6,$7,$8),($1,$3,'TRANSFER_IN','TRANSFER_IN',$5,$4,$6,$7,$8)`,
        values,
      );
      await client.query("COMMIT");
      return { success: true, transferPairId: pairId };
    } catch (error) {
      await client.query("ROLLBACK");
      return reply.code(400).send({
        message:
          error instanceof Error ? error.message : "Could not record transfer.",
      });
    } finally {
      client.release();
    }
  });

  app.patch("/api/banks/transactions/:id/void", async (request, reply) => {
    const userId = userIdFrom(request);
    const result = await pool.query(
      `UPDATE ledger_entries SET is_void=TRUE WHERE user_id=$2 AND is_void=FALSE AND (id=$1 OR transfer_pair_id=(SELECT transfer_pair_id FROM ledger_entries WHERE id=$1 AND user_id=$2)) RETURNING *`,
      [(request.params as { id: string }).id, userId],
    );
    if (!result.rowCount)
      return reply
        .code(404)
        .send({ message: "Transaction not found or already voided." });
    return { transaction: result.rows[0] };
  });
}
