import type { FastifyInstance } from "fastify";
import { pool } from "../config/db.js";
import { extractBearerToken, verifyToken } from "../config/jwt.js";

type StockBody = {
  portfolioId?: string;
  name?: string;
  description?: string;
  symbol?: string;
  eventType?: string;
  quantity?: number;
  price?: number;
  fees?: number;
  amount?: number;
  eventDate?: string;
  notes?: string;
  deadline?: string;
  status?: string;
  isHidden?: boolean;
};

function userIdFrom(request: { headers: { authorization?: string } }) {
  const token = extractBearerToken(request.headers.authorization);
  if (!token) throw new Error("Unauthorized");
  const payload = verifyToken(token) as { sub?: string };
  if (!payload.sub) throw new Error("Unauthorized");
  return payload.sub;
}

function dateOrToday(value?: string) {
  return value || new Date().toISOString().slice(0, 10);
}

function portfolioIdFrom(request: { query?: unknown; body?: unknown }) {
  const query = request.query as { portfolioId?: string } | undefined;
  const body = request.body as StockBody | undefined;
  return body?.portfolioId || query?.portfolioId;
}

export default async function stockRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    try {
      userIdFrom(request);
    } catch {
      return reply.code(401).send({ message: "Unauthorized" });
    }
  });

  app.get("/api/stocks/portfolios", async (request) => {
    const userId = userIdFrom(request);
    const result = await pool.query(
      `SELECT * FROM stock_portfolios WHERE user_id=$1 AND is_active=TRUE ORDER BY created_at ASC`,
      [userId],
    );
    return { portfolios: result.rows };
  });

  app.post("/api/stocks/portfolios", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as StockBody;
    if (!body.name?.trim())
      return reply.code(400).send({ message: "Portfolio name is required." });
    try {
      const result = await pool.query(
        `INSERT INTO stock_portfolios (user_id,name,description) VALUES ($1,$2,$3) RETURNING *`,
        [userId, body.name.trim(), body.description?.trim() || null],
      );
      return { portfolio: result.rows[0] };
    } catch (error) {
      return reply.code(409).send({
        message:
          error instanceof Error &&
          error.message.includes("stock_portfolios_user_name_idx")
            ? "A portfolio with this name already exists."
            : "Could not create portfolio.",
      });
    }
  });

  app.get("/api/stocks/portfolio", async (request) => {
    const userId = userIdFrom(request);
    const portfolioId = portfolioIdFrom(request);
    if (!portfolioId) return { holdings: [] };
    const result = await pool.query(
      `SELECT l.symbol, SUM(l.remaining_quantity) AS quantity, SUM(l.remaining_quantity * l.cost_per_share) AS total_cost, (SELECT p.price FROM stock_prices p WHERE p.portfolio_id = l.portfolio_id AND p.symbol = l.symbol ORDER BY p.recorded_at DESC LIMIT 1) AS current_price FROM stock_lots l WHERE l.user_id = $1 AND l.portfolio_id = $2 AND l.remaining_quantity > 0 GROUP BY l.portfolio_id, l.symbol HAVING SUM(l.remaining_quantity) > 0 ORDER BY l.symbol;`,
      [userId, portfolioId],
    );
    return {
      holdings: result.rows.map((row) => ({
        ...row,
        average_cost: Number(row.total_cost) / Number(row.quantity),
        market_value:
          row.current_price === null
            ? null
            : Number(row.quantity) * Number(row.current_price),
        unrealized_pl:
          row.current_price === null
            ? null
            : Number(row.quantity) * Number(row.current_price) -
              Number(row.total_cost),
      })),
    };
  });

  app.get("/api/stocks/transactions", async (request) => {
    const userId = userIdFrom(request);
    const result = await pool.query(
      `SELECT * FROM stock_events WHERE user_id = $1 AND ($2::uuid IS NULL OR portfolio_id = $2) AND event_type IN ('BUY','SELL','IPO','RIGHT') ORDER BY event_date DESC, created_at DESC`,
      [userId, portfolioIdFrom(request)],
    );
    return { transactions: result.rows };
  });
  app.get("/api/stocks/history", async (request) => {
    const userId = userIdFrom(request);
    const portfolioId = portfolioIdFrom(request);
    const result = await pool.query(
      `SELECT * FROM stock_events WHERE user_id = $1 AND ($2::uuid IS NULL OR portfolio_id = $2) AND event_type IN ('BONUS','DIVIDEND','VALUATION','SELL') ORDER BY event_date DESC, created_at DESC`,
      [userId, portfolioId],
    );
    const summary = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN event_type='SELL' AND realized_pl > 0 THEN realized_pl ELSE 0 END),0) AS total_profit, COALESCE(SUM(CASE WHEN event_type='SELL' AND realized_pl < 0 THEN ABS(realized_pl) ELSE 0 END),0) AS total_loss, COALESCE(SUM(CASE WHEN event_type='SELL' THEN realized_pl ELSE 0 END),0) AS net_realized_pl, COALESCE(SUM(CASE WHEN event_type='DIVIDEND' THEN amount ELSE 0 END),0) AS total_dividends, COUNT(*) FILTER (WHERE event_type='SELL') AS sell_count, COUNT(*) FILTER (WHERE event_type='BONUS') AS bonus_count FROM stock_events WHERE user_id=$1 AND ($2::uuid IS NULL OR portfolio_id=$2)`,
      [userId, portfolioId],
    );
    const stocks = await pool.query(
      `SELECT symbol, COALESCE(SUM(CASE WHEN event_type IN ('BUY','IPO','RIGHT','BONUS') THEN quantity ELSE 0 END),0) AS total_acquired, COALESCE(SUM(CASE WHEN event_type='SELL' THEN quantity ELSE 0 END),0) AS total_sold, COALESCE(SUM(CASE WHEN event_type='SELL' THEN realized_pl ELSE 0 END),0) AS realized_pl, COALESCE(SUM(CASE WHEN event_type='DIVIDEND' THEN amount ELSE 0 END),0) AS dividends, COUNT(*) AS event_count FROM stock_events WHERE user_id=$1 AND ($2::uuid IS NULL OR portfolio_id=$2) GROUP BY symbol ORDER BY symbol`,
      [userId, portfolioId],
    );
    return {
      history: result.rows,
      summary: summary.rows[0],
      stocks: stocks.rows,
    };
  });
  app.get("/api/stocks/transfers", async (request) => {
    const userId = userIdFrom(request);
    const includeHidden =
      (request.query as { includeHidden?: string }).includeHidden === "true";
    const result = await pool.query(
      `SELECT * FROM share_transfers WHERE user_id = $1 AND ($2::uuid IS NULL OR portfolio_id = $2) AND ($3::boolean OR is_hidden=FALSE) ORDER BY deadline ASC, updated_at DESC`,
      [userId, portfolioIdFrom(request), includeHidden],
    );
    return { transfers: result.rows };
  });

  app.post("/api/stocks/events", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as StockBody;
    const portfolioId = portfolioIdFrom(request);
    const symbol = body.symbol?.trim().toUpperCase();
    const eventType = body.eventType?.toUpperCase();
    const quantity = Number(body.quantity || 0);
    const price = Number(body.price || 0);
    const fees = Number(body.fees || 0);
    if (
      !portfolioId ||
      !symbol ||
      !eventType ||
      ![
        "BUY",
        "SELL",
        "IPO",
        "RIGHT",
        "BONUS",
        "DIVIDEND",
        "VALUATION",
      ].includes(eventType)
    )
      return reply
        .code(400)
        .send({ message: "A valid symbol and event type are required." });
    if (
      (["BUY", "SELL", "IPO", "RIGHT", "BONUS"].includes(eventType) &&
        quantity <= 0) ||
      (["BUY", "IPO", "RIGHT"].includes(eventType) && price < 0)
    )
      return reply
        .code(400)
        .send({ message: "Quantity and price must be valid." });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const amount = Number(body.amount || quantity * price);
      const event = await client.query(
        `INSERT INTO stock_events (user_id, portfolio_id, symbol, event_type, quantity, price, fees, amount, event_date, notes) SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10 WHERE EXISTS (SELECT 1 FROM stock_portfolios WHERE id=$2 AND user_id=$1) RETURNING *`,
        [
          userId,
          portfolioId,
          symbol,
          eventType,
          quantity,
          price,
          fees,
          amount,
          dateOrToday(body.eventDate),
          body.notes || null,
        ],
      );
      if (!event.rowCount) throw new Error("Portfolio not found.");
      if (["BUY", "IPO", "RIGHT", "BONUS"].includes(eventType))
        await client.query(
          `INSERT INTO stock_lots (user_id,portfolio_id,event_id,symbol,acquired_date,quantity,remaining_quantity,cost_per_share) VALUES ($1,$2,$3,$4,$5,$6,$6,$7)`,
          [
            userId,
            portfolioId,
            event.rows[0].id,
            symbol,
            dateOrToday(body.eventDate),
            quantity,
            eventType === "BONUS" ? 0 : (quantity * price + fees) / quantity,
          ],
        );
      if (eventType === "DIVIDEND" && amount > 0) {
        const account = await client.query(
          `SELECT id FROM bank_accounts WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [userId],
        );
        if (account.rowCount) {
          await client.query(
            `UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2`,
            [amount, account.rows[0].id],
          );
          await client.query(
            `INSERT INTO ledger_entries (user_id, type, category, amount, description) VALUES ($1, 'income', 'dividend', $2, $3)`,
            [userId, amount, `${symbol} dividend`],
          );
        }
      }
      if (eventType === "SELL") {
        let remaining = quantity;
        let costBasisSold = 0;
        const lots = await client.query(
          `SELECT id, remaining_quantity FROM stock_lots WHERE user_id=$1 AND portfolio_id=$2 AND symbol=$3 AND remaining_quantity > 0 ORDER BY acquired_date ASC, id ASC FOR UPDATE`,
          [userId, portfolioId, symbol],
        );
        for (const lot of lots.rows) {
          if (remaining <= 0) break;
          const used = Math.min(remaining, Number(lot.remaining_quantity));
          costBasisSold += used * Number(lot.cost_per_share || 0);
          await client.query(
            `UPDATE stock_lots SET remaining_quantity = remaining_quantity - $1 WHERE id = $2`,
            [used, lot.id],
          );
          remaining -= used;
        }
        if (remaining > 0)
          throw new Error("Not enough open shares for this sale.");
        await client.query(
          `UPDATE stock_events SET cost_basis_sold=$1, realized_pl=$2 WHERE id=$3`,
          [costBasisSold, amount - fees - costBasisSold, event.rows[0].id],
        );
        const deadline =
          body.deadline ||
          new Date(Date.parse(dateOrToday(body.eventDate)) + 7 * 86400000)
            .toISOString()
            .slice(0, 10);
        await client.query(
          `INSERT INTO share_transfers (user_id,portfolio_id,event_id,symbol,quantity,amount,deadline) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            userId,
            portfolioId,
            event.rows[0].id,
            symbol,
            quantity,
            amount,
            deadline,
          ],
        );
      }
      await client.query("COMMIT");
      return { event: event.rows[0] };
    } catch (error) {
      await client.query("ROLLBACK");
      return reply.code(400).send({
        message:
          error instanceof Error
            ? error.message
            : "Could not record stock event.",
      });
    } finally {
      client.release();
    }
  });

  app.post("/api/stocks/prices", async (request) => {
    const userId = userIdFrom(request);
    const body = request.body as StockBody;
    const portfolioId = portfolioIdFrom(request);
    const result = await pool.query(
      `INSERT INTO stock_prices (user_id,portfolio_id,symbol,price) SELECT $1,$2,$3,$4 WHERE EXISTS (SELECT 1 FROM stock_portfolios WHERE id=$2 AND user_id=$1) RETURNING *`,
      [
        userId,
        portfolioId,
        body.symbol?.trim().toUpperCase(),
        Number(body.price),
      ],
    );
    return { price: result.rows[0] };
  });
  app.delete("/api/stocks/transfers/:id", async (request, reply) => {
    const userId = userIdFrom(request);
    const result = await pool.query(
      `DELETE FROM share_transfers WHERE id=$1 AND user_id=$2 RETURNING id`,
      [(request.params as { id: string }).id, userId],
    );
    if (!result.rowCount)
      return reply.code(404).send({ message: "Transfer not found." });
    return { success: true };
  });
  app.patch("/api/stocks/transfers/:id", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as StockBody;
    if (
      body.status &&
      !["PENDING", "TRANSFERRED", "MISSED", "CANCELLED"].includes(body.status)
    )
      return reply.code(400).send({ message: "Invalid transfer status." });
    const result = await pool.query(
      `UPDATE share_transfers SET status=COALESCE($1,status), notes=COALESCE($2,notes), is_hidden=COALESCE($3,is_hidden), updated_at=NOW() WHERE id=$4 AND user_id=$5 RETURNING *`,
      [
        body.status,
        body.notes || null,
        body.isHidden,
        (request.params as { id: string }).id,
        userId,
      ],
    );
    return { transfer: result.rows[0] };
  });
}
