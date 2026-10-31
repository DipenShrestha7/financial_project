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
  price?: number | null;
  purchasePriceIsWacc?: boolean;
  fees?: number;
  amount?: number;
  eventDate?: string;
  notes?: string;
  deadline?: string;
  status?: string;
  isHidden?: boolean;
  ownerName?: string;
  events?: Array<{
    symbol?: string;
    eventType?: string;
    quantity?: number;
    price?: number | null;
    purchasePriceIsWacc?: boolean;
    eventDate?: string;
    notes?: string;
  }>;
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

function brokerRate(tradeAmount: number) {
  if (tradeAmount <= 50000) return 0.0036;
  if (tradeAmount <= 500000) return 0.0033;
  if (tradeAmount <= 2000000) return 0.0031;
  if (tradeAmount <= 10000000) return 0.0027;
  return 0.0024;
}

function tradeCharges(grossAmount: number) {
  const brokerFee = Number(
    Math.max(grossAmount * brokerRate(grossAmount), 10).toFixed(2),
  );
  const sebonFee = Number((grossAmount * 0.00015).toFixed(2));
  return Number((brokerFee + sebonFee + 25).toFixed(2));
}

function eventFees(
  eventType: string,
  price: number | null,
  quantity: number,
  purchasePriceIsWacc = false,
) {
  if (
    price === null ||
    !["BUY", "SELL", "MUTUAL_FUND_BUY", "MUTUAL_FUND_SELL"].includes(eventType)
  )
    return 0;
  if (["BUY", "MUTUAL_FUND_BUY"].includes(eventType) && purchasePriceIsWacc)
    return 0;
  return tradeCharges(quantity * price);
}

function portfolioIdFrom(request: { query?: unknown; body?: unknown }) {
  const query = request.query as { portfolioId?: string } | undefined;
  const body = request.body as StockBody | undefined;
  return body?.portfolioId || query?.portfolioId;
}

async function rebuildPortfolioLots(
  client: { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> },
  userId: string,
  portfolioId: string,
) {
  await client.query(
    `DELETE FROM stock_lots WHERE user_id=$1 AND portfolio_id=$2`,
    [userId, portfolioId],
  );
  const events = await client.query(
    `SELECT * FROM stock_events WHERE user_id=$1 AND portfolio_id=$2 AND event_type IN ('BUY','SELL','IPO','RIGHT','BONUS','MUTUAL_FUND_BUY','MUTUAL_FUND_SELL') ORDER BY event_date ASC, created_at ASC, id ASC`,
    [userId, portfolioId],
  );
  const openLots: Array<{ id: string; symbol: string; remaining: number; cost: number | null }> = [];
  for (const event of events.rows) {
    const quantity = Number(event.quantity);
    const price = event.price === null ? null : Number(event.price);
    if (
      ["BUY", "IPO", "RIGHT", "BONUS", "MUTUAL_FUND_BUY"].includes(
        event.event_type,
      )
    ) {
      const inserted = await client.query(
        `INSERT INTO stock_lots (user_id,portfolio_id,event_id,symbol,acquired_date,quantity,remaining_quantity,cost_per_share) VALUES ($1,$2,$3,$4,$5,$6,$6,$7) RETURNING id`,
        [
          userId,
          portfolioId,
          event.id,
          event.symbol,
          event.event_date,
          quantity,
          event.event_type === "BONUS"
            ? 0
            : price === null
              ? null
              : (quantity * price + (event.purchase_price_is_wacc ? 0 : Number(event.fees))) / quantity,
        ],
      );
      openLots.push({
        id: inserted.rows[0].id,
        symbol: event.symbol,
        remaining: quantity,
        cost:
          event.event_type === "BONUS"
            ? 0
            : price === null
              ? null
              : (quantity * price + (event.purchase_price_is_wacc ? 0 : Number(event.fees))) / quantity,
      });
    } else {
      let remaining = quantity;
      let costBasisSold: number | null = 0;
      for (const lot of openLots.filter((item) => item.symbol === event.symbol)) {
        if (remaining <= 0) break;
        const used = Math.min(remaining, lot.remaining);
        if (lot.cost === null) costBasisSold = null;
        else if (costBasisSold !== null) costBasisSold += used * lot.cost;
        lot.remaining -= used;
        await client.query(
          `UPDATE stock_lots SET remaining_quantity=$1 WHERE id=$2`,
          [lot.remaining, lot.id],
        );
        remaining -= used;
      }

      if (remaining > 0) throw new Error(`Not enough open shares for ${event.symbol} sale.`);
      await client.query(
        `UPDATE stock_events SET cost_basis_sold=$1, realized_pl=$2 WHERE id=$3`,
        [
          costBasisSold,
          costBasisSold === null
            ? null
            : Number(event.amount) - Number(event.fees) - costBasisSold,
          event.id,
        ],
      );
    }
  }

}

async function refreshLivePrices(userId: string, portfolioId: string) {
  const apiUrl = process.env.NEPSE_API_URL || "http://127.0.0.1:8000";
  const response = await fetch(`${apiUrl}/PriceVolume`);
  if (!response.ok) {
    throw new Error(`NEPSE price service returned ${response.status}.`);
  }
  const values = (await response.json()) as Array<{
    symbol?: string;
    ltp?: number | string;
    lastTradedPrice?: number | string;
  }>;
  for (const value of values) {
    const symbol = value.symbol?.trim().toUpperCase();
    const price = Number(value.ltp ?? value.lastTradedPrice);
    if (symbol && Number.isFinite(price) && price > 0) {
      await pool.query(
        `INSERT INTO stock_prices (user_id,portfolio_id,symbol,price) VALUES ($1,$2,$3,$4)`,
        [userId, portfolioId, symbol, price],
      );
    }
  }
}

async function nepseRequest(path: string) {
  const apiUrl = process.env.NEPSE_API_URL || "http://127.0.0.1:8000";
  const response = await fetch(`${apiUrl}${path}`);
  if (!response.ok) {
    throw new Error(`NEPSE data service returned ${response.status}.`);
  }
  return response.json();
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

  app.get("/api/stocks/scrips", async (_request, reply) => {
    try {
      const data = (await nepseRequest("/CompanyList")) as Array<{
        symbol?: string;
        securityName?: string;
        security_name?: string;
        companyName?: string;
        company_name?: string;
        name?: string;
        instrumentType?: string;
        instrument_type?: string;
      }>;
      const scrips = data
        .map((item) => {
          const symbol = item.symbol?.trim().toUpperCase();
          const companyName =
            item.companyName?.trim() ||
            item.company_name?.trim() ||
            item.name?.trim() ||
            symbol;
          const securityName =
            item.securityName?.trim() || item.security_name?.trim();
          const instrumentType =
            item.instrumentType?.trim() || item.instrument_type?.trim() || "";
          const normalizedCompany = companyName?.toLowerCase();
          const hasSpecificSecurityName =
            Boolean(securityName) &&
            securityName?.toLowerCase() !== normalizedCompany;
          const name =
            (hasSpecificSecurityName ? securityName : null) ||
            (instrumentType.toLowerCase().includes("debenture")
              ? `${companyName} Debenture (${symbol})`
              : instrumentType.toLowerCase().includes("mutual fund")
                ? `${companyName} Mutual Fund (${symbol})`
                : securityName || companyName || symbol);
          return symbol ? { symbol, name } : null;
        })
        .filter((scrip): scrip is { symbol: string; name: string } =>
          Boolean(scrip),
        )
        .sort((a, b) => a.symbol.localeCompare(b.symbol));
      return {
        scrips: scrips.filter(
          (scrip, index, all) =>
            all.findIndex((item) => item.symbol === scrip.symbol) === index,
        ),
      };
    } catch (error) {
      return reply.code(502).send({
        message:
          error instanceof Error
            ? error.message
            : "Could not load NEPSE scrips.",
      });
    }
  });

  app.post("/api/stocks/portfolios", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as StockBody;
    if (!body.name?.trim())
      return reply.code(400).send({ message: "Portfolio name is required." });
    const ownerName = body.ownerName?.trim() || "Self";
    try {
      const result = await pool.query(
        `INSERT INTO stock_portfolios (user_id,name,description,owner_name) VALUES ($1,$2,$3,$4) RETURNING *`,
        [userId, body.name.trim(), body.description?.trim() || null, ownerName],
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

  app.patch("/api/stocks/portfolios/:id", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as StockBody & { isActive?: boolean };
    const result = await pool.query(
      `UPDATE stock_portfolios SET name=COALESCE($1,name), description=COALESCE($2,description), is_active=COALESCE($3,is_active), owner_name=COALESCE($4,owner_name) WHERE id=$5 AND user_id=$6 RETURNING *`,
      [
        body.name?.trim() || null,
        body.description?.trim() || null,
        body.isActive,
        body.ownerName?.trim() || null,
        (request.params as { id: string }).id,
        userId,
      ],
    );
    if (!result.rowCount)
      return reply.code(404).send({ message: "Portfolio not found." });
    return { portfolio: result.rows[0] };
  });

  app.get("/api/stocks/portfolio", async (request) => {
    const userId = userIdFrom(request);
    const portfolioId = portfolioIdFrom(request);
    if (!portfolioId) return { holdings: [] };
    try {
      await refreshLivePrices(userId, portfolioId);
    } catch (error) {
      request.log.warn(
        error instanceof Error
          ? error.message
          : "Could not refresh local NEPSE prices.",
      );
    }
    const result = await pool.query(
      `SELECT l.symbol, SUM(l.remaining_quantity) AS quantity, SUM(l.remaining_quantity * l.cost_per_share) AS total_purchase_price, SUM(l.remaining_quantity) FILTER (WHERE l.cost_per_share IS NOT NULL) AS priced_quantity, COUNT(*) FILTER (WHERE l.cost_per_share IS NULL) AS unpriced_lots, (SELECT p.price FROM stock_prices p WHERE p.portfolio_id = l.portfolio_id AND p.symbol = l.symbol ORDER BY p.recorded_at DESC LIMIT 1) AS current_price FROM stock_lots l WHERE l.user_id = $1 AND l.portfolio_id = $2 AND l.remaining_quantity > 0 GROUP BY l.portfolio_id, l.symbol HAVING SUM(l.remaining_quantity) > 0 ORDER BY l.symbol;`,
      [userId, portfolioId],
    );
    return {
      holdings: result.rows.map((row) => {
        const quantity = Number(row.quantity);
        const pricedQuantity = Number(row.priced_quantity);
        const pricedTotal = Number(row.total_purchase_price);
        const averageCost =
          pricedQuantity > 0 && Number.isFinite(pricedTotal)
            ? pricedTotal / pricedQuantity
            : null;
        const totalPurchasePrice =
          averageCost === null ? null : averageCost * quantity;
        return {
          ...row,
          total_purchase_price: totalPurchasePrice,
          average_cost: averageCost,
          total_cost: totalPurchasePrice,
          market_value:
            row.current_price === null
              ? null
              : quantity * Number(row.current_price),
          unrealized_pl:
            row.current_price === null || totalPurchasePrice === null
              ? null
              : quantity * Number(row.current_price) - totalPurchasePrice,
        };
      }),
    };
  });

  app.get("/api/stocks/transactions", async (request) => {
    const userId = userIdFrom(request);
    const result = await pool.query(
      `SELECT * FROM stock_events WHERE user_id = $1 AND ($2::uuid IS NULL OR portfolio_id = $2) AND event_type IN ('BUY','SELL','IPO','RIGHT','BONUS','MUTUAL_FUND_BUY','MUTUAL_FUND_SELL') ORDER BY event_date DESC, created_at DESC`,
      [userId, portfolioIdFrom(request)],
    );
    return { transactions: result.rows };
  });
  app.get("/api/stocks/history", async (request) => {
    const userId = userIdFrom(request);
    const portfolioId = portfolioIdFrom(request);
    const result = await pool.query(
      `SELECT * FROM stock_events WHERE user_id = $1 AND ($2::uuid IS NULL OR portfolio_id = $2) AND event_type IN ('BONUS','DIVIDEND','VALUATION','SELL','MUTUAL_FUND_SELL') ORDER BY event_date DESC, created_at DESC`,
      [userId, portfolioId],
    );
    const summary = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN event_type IN ('SELL','MUTUAL_FUND_SELL') AND realized_pl > 0 THEN realized_pl ELSE 0 END),0) AS total_profit, COALESCE(SUM(CASE WHEN event_type IN ('SELL','MUTUAL_FUND_SELL') AND realized_pl < 0 THEN ABS(realized_pl) ELSE 0 END),0) AS total_loss, COALESCE(SUM(CASE WHEN event_type IN ('SELL','MUTUAL_FUND_SELL') THEN realized_pl ELSE 0 END),0) AS net_realized_pl, COALESCE(SUM(CASE WHEN event_type='DIVIDEND' THEN amount ELSE 0 END),0) AS total_dividends, COUNT(*) FILTER (WHERE event_type IN ('SELL','MUTUAL_FUND_SELL')) AS sell_count, COUNT(*) FILTER (WHERE event_type='BONUS') AS bonus_count FROM stock_events WHERE user_id=$1 AND ($2::uuid IS NULL OR portfolio_id=$2)`,
      [userId, portfolioId],
    );
    const stocks = await pool.query(
      `SELECT symbol, COALESCE(SUM(CASE WHEN event_type IN ('BUY','IPO','RIGHT','BONUS','MUTUAL_FUND_BUY') THEN quantity ELSE 0 END),0) AS total_acquired, COALESCE(SUM(CASE WHEN event_type IN ('SELL','MUTUAL_FUND_SELL') THEN quantity ELSE 0 END),0) AS total_sold, COALESCE(SUM(CASE WHEN event_type IN ('SELL','MUTUAL_FUND_SELL') THEN realized_pl ELSE 0 END),0) AS realized_pl, COALESCE(SUM(CASE WHEN event_type='DIVIDEND' THEN amount ELSE 0 END),0) AS dividends, COUNT(*) AS event_count FROM stock_events WHERE user_id=$1 AND ($2::uuid IS NULL OR portfolio_id=$2) GROUP BY symbol ORDER BY symbol`,
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
    const price =
      body.eventType?.toUpperCase() === "IPO"
        ? 100
        : body.eventType?.toUpperCase() === "MUTUAL_FUND_BUY" &&
            body.price == null
          ? 10
        : body.price == null
          ? null
          : Number(body.price);
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
        "MUTUAL_FUND_BUY",
        "MUTUAL_FUND_SELL",
        "DIVIDEND",
        "VALUATION",
      ].includes(eventType)
    )
      return reply
        .code(400)
        .send({ message: "A valid symbol and event type are required." });
    if (
      ([
        "BUY",
        "SELL",
        "IPO",
        "RIGHT",
        "BONUS",
        "MUTUAL_FUND_BUY",
        "MUTUAL_FUND_SELL",
      ].includes(eventType) &&
        quantity <= 0) ||
      ([
        "BUY",
        "SELL",
        "IPO",
        "RIGHT",
        "MUTUAL_FUND_BUY",
        "MUTUAL_FUND_SELL",
      ].includes(eventType) &&
        price !== null &&
        price < 0)
    )
      return reply
        .code(400)
        .send({ message: "Quantity and price must be valid." });
    const purchasePriceIsWacc =
      ["BUY", "MUTUAL_FUND_BUY"].includes(eventType) &&
      body.purchasePriceIsWacc === true;
    const fees = eventFees(eventType || "", price, quantity, purchasePriceIsWacc);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const amount =
        body.amount == null
          ? price === null
            ? 0
            : quantity * price
          : Number(body.amount);
      const event = await client.query(
        `INSERT INTO stock_events (user_id, portfolio_id, symbol, event_type, quantity, price, purchase_price_is_wacc, fees, amount, event_date, notes) SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11 WHERE EXISTS (SELECT 1 FROM stock_portfolios WHERE id=$2 AND user_id=$1) RETURNING *`,
        [
          userId,
          portfolioId,
          symbol,
          eventType,
          quantity,
          price,
          purchasePriceIsWacc,
          fees,
          amount,
          dateOrToday(body.eventDate),
          body.notes || null,
        ],
      );
      if (!event.rowCount) throw new Error("Portfolio not found.");
      if (
        ["BUY", "IPO", "RIGHT", "BONUS", "MUTUAL_FUND_BUY"].includes(eventType)
      )
        await client.query(
          `INSERT INTO stock_lots (user_id,portfolio_id,event_id,symbol,acquired_date,quantity,remaining_quantity,cost_per_share) VALUES ($1,$2,$3,$4,$5,$6,$6,$7)`,
          [
            userId,
            portfolioId,
            event.rows[0].id,
            symbol,
            dateOrToday(body.eventDate),
            quantity,
            eventType === "BONUS"
              ? 0
              : price === null
                ? null
                : (quantity * price + (purchasePriceIsWacc ? 0 : fees)) / quantity,
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
      if (["SELL", "MUTUAL_FUND_SELL"].includes(eventType)) {
        let remaining = quantity;
        let costBasisSold: number | null = 0;
        const lots = await client.query(
          `SELECT id, remaining_quantity, cost_per_share FROM stock_lots WHERE user_id=$1 AND portfolio_id=$2 AND symbol=$3 AND remaining_quantity > 0 ORDER BY acquired_date ASC, id ASC FOR UPDATE`,
          [userId, portfolioId, symbol],
        );
        for (const lot of lots.rows) {
          if (remaining <= 0) break;
          const used = Math.min(remaining, Number(lot.remaining_quantity));
          if (lot.cost_per_share === null) costBasisSold = null;
          else if (costBasisSold !== null)
            costBasisSold += used * Number(lot.cost_per_share);
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
          [
            costBasisSold,
            costBasisSold === null ? null : amount - fees - costBasisSold,
            event.rows[0].id,
          ],
        );
        const deadline =
          body.deadline ||
          new Date(Date.parse(dateOrToday(body.eventDate)) + 7 * 86400000)
            .toISOString()
            .slice(0, 10);
        if (eventType === "SELL") {
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

  app.post("/api/stocks/events/import", async (request, reply) => {
        const userId = userIdFrom(request);
        const body = request.body as StockBody;
        const portfolioId = portfolioIdFrom(request);
        const events = body.events || [];
        if (!portfolioId || events.length === 0)
          return reply.code(400).send({ message: "Portfolio and transactions are required." });
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const portfolio = await client.query(
            `SELECT id FROM stock_portfolios WHERE id=$1 AND user_id=$2`,
            [portfolioId, userId],
          );
          if (!portfolio.rowCount) throw new Error("Portfolio not found.");
          const ordered = [...events].sort((a, b) =>
            String(a.eventDate).localeCompare(String(b.eventDate)),
          );
          for (const item of ordered) {
            const symbol = item.symbol?.trim().toUpperCase();
            const eventType = item.eventType?.toUpperCase() || "";
            const quantity = Number(item.quantity || 0);
            const price =
              eventType === "IPO"
                ? 100
                : eventType === "MUTUAL_FUND_BUY" && item.price == null
                  ? 10
                : item.price == null
                  ? null
                  : Number(item.price);
            const purchasePriceIsWacc =
              ["BUY", "MUTUAL_FUND_BUY"].includes(eventType) &&
              item.purchasePriceIsWacc === true;
            const fees = eventFees(
              eventType || "",
              price,
              quantity,
              purchasePriceIsWacc,
            );
            if (
              !symbol ||
              !eventType ||
              ![
                "BUY",
                "SELL",
                "IPO",
                "RIGHT",
                "BONUS",
                "MUTUAL_FUND_BUY",
                "MUTUAL_FUND_SELL",
              ].includes(eventType) ||
              quantity <= 0 ||
              !item.eventDate ||
              ([
                "BUY",
                "SELL",
                "IPO",
                "RIGHT",
                "MUTUAL_FUND_BUY",
                "MUTUAL_FUND_SELL",
              ].includes(eventType) &&
                price !== null &&
                price < 0)
            ) {
              throw new Error("Imported transactions contain invalid data.");
            }
            const inserted = await client.query(
              `INSERT INTO stock_events (user_id,portfolio_id,symbol,event_type,quantity,price,purchase_price_is_wacc,fees,amount,event_date,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
              [
                userId,
                portfolioId,
                symbol,
                eventType,
                quantity,
                price,
                purchasePriceIsWacc,
                fees,
                price === null ? 0 : quantity * price,
                item.eventDate,
                item.notes || null,
              ],
            );
            if (eventType === "SELL") {
              const deadline = new Date(
                Date.parse(item.eventDate) + 7 * 86400000,
              )
                .toISOString()
                .slice(0, 10);
              await client.query(
                `INSERT INTO share_transfers (user_id,portfolio_id,event_id,symbol,quantity,amount,deadline) VALUES ($1,$2,$3,$4,$5,0,$6)`,
                [userId, portfolioId, inserted.rows[0].id, symbol, quantity, deadline],
              );
            }
          }
          await rebuildPortfolioLots(client, userId, portfolioId);
          await client.query("COMMIT");
          return { imported: ordered.length };
        } catch (error) {
          await client.query("ROLLBACK");
          return reply.code(400).send({
            message:
              error instanceof Error ? error.message : "Could not import transactions.",
          });
        } finally {
          client.release();
        }
  });

  app.patch("/api/stocks/events/:id", async (request, reply) => {
        const userId = userIdFrom(request);
        const body = request.body as StockBody;
        const eventId = (request.params as { id: string }).id;
        const symbol = body.symbol?.trim().toUpperCase();
        const eventType = body.eventType?.toUpperCase() || "";
        const quantity = Number(body.quantity || 0);
        const price =
          eventType === "IPO"
            ? 100
            : eventType === "MUTUAL_FUND_BUY" && body.price == null
              ? 10
            : body.price == null
              ? null
              : Number(body.price);
        const purchasePriceIsWacc =
          ["BUY", "MUTUAL_FUND_BUY"].includes(eventType) &&
          body.purchasePriceIsWacc === true;
        const fees = eventFees(
          eventType || "",
          price,
          quantity,
          purchasePriceIsWacc,
        );
        const amount =
          body.amount == null
            ? price === null
              ? 0
              : quantity * price
            : Number(body.amount);
        if (
          !symbol ||
          !eventType ||
          ![
            "BUY",
            "SELL",
            "IPO",
            "RIGHT",
            "BONUS",
            "MUTUAL_FUND_BUY",
            "MUTUAL_FUND_SELL",
            "DIVIDEND",
          ].includes(eventType)
        )
          return reply.code(400).send({ message: "A valid symbol and event type are required." });
        if (
          ([
            "BUY",
            "SELL",
            "IPO",
            "RIGHT",
            "BONUS",
            "MUTUAL_FUND_BUY",
            "MUTUAL_FUND_SELL",
          ].includes(eventType) &&
            quantity <= 0) ||
          ([
            "BUY",
            "SELL",
            "IPO",
            "RIGHT",
            "MUTUAL_FUND_BUY",
            "MUTUAL_FUND_SELL",
          ].includes(eventType) &&
            price !== null &&
            price < 0)
        )
          return reply.code(400).send({ message: "Quantity and price must be valid." });
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const existing = await client.query(
            `SELECT * FROM stock_events WHERE id=$1 AND user_id=$2 FOR UPDATE`,
            [eventId, userId],
          );
          if (!existing.rowCount) throw new Error("Transaction not found.");
          const portfolioId = existing.rows[0].portfolio_id;
          await client.query(
            `DELETE FROM share_transfers WHERE event_id=$1`,
            [eventId],
          );
          const updated = await client.query(
            `UPDATE stock_events SET symbol=$1,event_type=$2,quantity=$3,price=$4,purchase_price_is_wacc=$5,fees=$6,amount=$7,event_date=$8,notes=$9,cost_basis_sold=NULL,realized_pl=NULL WHERE id=$10 AND user_id=$11 RETURNING *`,
            [
              symbol,
              eventType,
              eventType === "DIVIDEND" ? 0 : quantity,
              eventType === "DIVIDEND" ? 0 : price,
              purchasePriceIsWacc,
              eventType === "DIVIDEND" ? 0 : fees,
              eventType === "DIVIDEND"
                ? amount
                : price === null
                  ? 0
                  : quantity * price,
              dateOrToday(body.eventDate),
              body.notes || null,
              eventId,
              userId,
            ],
          );
          await rebuildPortfolioLots(client, userId, portfolioId);
          if (eventType === "SELL") {
            await client.query(
              `INSERT INTO share_transfers (user_id,portfolio_id,event_id,symbol,quantity,amount,deadline) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [userId, portfolioId, eventId, symbol, quantity, amount, new Date(Date.parse(dateOrToday(body.eventDate)) + 7 * 86400000).toISOString().slice(0, 10)],
            );
          }
          await client.query("COMMIT");
          return { event: updated.rows[0] };
        } catch (error) {
          await client.query("ROLLBACK");
          return reply.code(400).send({ message: error instanceof Error ? error.message : "Could not update transaction." });
        } finally {
          client.release();
        }
  });

  app.delete("/api/stocks/events/:id", async (request, reply) => {
        const userId = userIdFrom(request);
        const eventId = (request.params as { id: string }).id;
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const existing = await client.query(
            `SELECT portfolio_id FROM stock_events WHERE id=$1 AND user_id=$2 FOR UPDATE`,
            [eventId, userId],
          );
          if (!existing.rowCount) {
            await client.query("ROLLBACK");
            return reply.code(404).send({ message: "Transaction not found."             });

          }
          const portfolioId = existing.rows[0].portfolio_id;
          await client.query(
            `DELETE FROM share_transfers WHERE event_id=$1`,
            [eventId],
          );
          await client.query(`DELETE FROM stock_lots WHERE event_id=$1`, [eventId]);
          await client.query(`DELETE FROM stock_events WHERE id=$1 AND user_id=$2`, [eventId, userId]);
          await rebuildPortfolioLots(client, userId, portfolioId);
          await client.query("COMMIT");
          return { success: true };
        } catch (error) {
          await client.query("ROLLBACK");
          return reply.code(400).send({ message: error instanceof Error ? error.message : "Could not delete transaction." });
        } finally {
          client.release();
        }
  });

  app.patch("/api/stocks/events/aggregate", async (request, reply) => {
    const userId = userIdFrom(request);
    const body = request.body as StockBody;
    const portfolioId = body.portfolioId;
    const symbol = body.symbol?.trim().toUpperCase();
    const targetRemainingQuantity = Number(body.quantity);
    const price = body.price == null ? null : Number(body.price);
    const purchasePriceIsWacc = body.purchasePriceIsWacc === true;
    if (
      !portfolioId ||
      !symbol ||
      !Number.isFinite(targetRemainingQuantity) ||
      targetRemainingQuantity <= 0 ||
      price === null ||
      !Number.isFinite(price) ||
      price < 0
    )
      return reply
        .code(400)
        .send({ message: "A valid portfolio, symbol, and price are required." });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const events = await client.query(
        `SELECT id, quantity, event_type FROM stock_events WHERE user_id=$1 AND portfolio_id=$2 AND symbol=$3 AND event_type IN ('BUY','MUTUAL_FUND_BUY') FOR UPDATE`,
        [userId, portfolioId, symbol],
      );
      if (!events.rowCount) throw new Error("No purchase transactions found.");
      const sold = await client.query(
        `SELECT COALESCE(SUM(quantity), 0) AS quantity FROM stock_events WHERE user_id=$1 AND portfolio_id=$2 AND symbol=$3 AND event_type IN ('SELL','MUTUAL_FUND_SELL')`,
        [userId, portfolioId, symbol],
      );
      const currentPurchasedQuantity = events.rows.reduce(
        (total, event) => total + Number(event.quantity),
        0,
      );
      const targetPurchasedQuantity =
        targetRemainingQuantity + Number(sold.rows[0].quantity);
      if (currentPurchasedQuantity <= 0)
        throw new Error("Purchase quantity must be greater than zero.");
      const quantityRatio =
        targetPurchasedQuantity / currentPurchasedQuantity;
      for (const event of events.rows) {
        const quantity = Number(event.quantity) * quantityRatio;
        const eventType = event.event_type === "MUTUAL_FUND_BUY"
          ? "MUTUAL_FUND_BUY"
          : "BUY";
        const fees = eventFees(eventType, price, quantity, purchasePriceIsWacc);
        await client.query(
          `UPDATE stock_events SET price=$1,purchase_price_is_wacc=$2,fees=$3,amount=$4,cost_basis_sold=NULL,realized_pl=NULL WHERE id=$5 AND user_id=$6`,
          [price, purchasePriceIsWacc, fees, quantity * price, event.id, userId],
        );
      }
      await rebuildPortfolioLots(client, userId, portfolioId);
      await client.query("COMMIT");
      return { updated: events.rowCount };
    } catch (error) {
      await client.query("ROLLBACK");
      return reply.code(400).send({
        message:
          error instanceof Error
            ? error.message
            : "Could not update purchase transactions.",
      });
    } finally {
      client.release();
    }
  });

  app.delete("/api/stocks/scrip/:portfolioId/:symbol", async (request, reply) => {
    const userId = userIdFrom(request);
    const { portfolioId, symbol: rawSymbol } = request.params as {
      portfolioId: string;
      symbol: string;
    };
    const symbol = decodeURIComponent(rawSymbol).trim().toUpperCase();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const portfolio = await client.query(
        `SELECT id FROM stock_portfolios WHERE id=$1 AND user_id=$2`,
        [portfolioId, userId],
      );
      if (!portfolio.rowCount) {
        await client.query("ROLLBACK");
        return reply.code(404).send({ message: "Portfolio not found." });
      }
      const events = await client.query(
        `SELECT id FROM stock_events WHERE portfolio_id=$1 AND user_id=$2 AND symbol=$3`,
        [portfolioId, userId, symbol],
      );
      if (!events.rowCount) {
        await client.query("ROLLBACK");
        return reply.code(404).send({ message: "Scrip not found." });
      }
      await client.query(
        `DELETE FROM share_transfers WHERE portfolio_id=$1 AND user_id=$2 AND symbol=$3`,
        [portfolioId, userId, symbol],
      );
      await client.query(
        `DELETE FROM stock_lots WHERE portfolio_id=$1 AND user_id=$2 AND symbol=$3`,
        [portfolioId, userId, symbol],
      );
      await client.query(
        `DELETE FROM stock_events WHERE portfolio_id=$1 AND user_id=$2 AND symbol=$3`,
        [portfolioId, userId, symbol],
      );
      await client.query(
        `DELETE FROM stock_prices WHERE portfolio_id=$1 AND user_id=$2 AND symbol=$3`,
        [portfolioId, userId, symbol],
      );
      await rebuildPortfolioLots(client, userId, portfolioId);
      await client.query("COMMIT");
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      return reply.code(400).send({
        message:
          error instanceof Error ? error.message : "Could not delete scrip.",
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
