import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
const connectionString = process.env.NEON_DB_URL;
if (!connectionString) {
    throw new Error("Missing NEON_DB_URL in environment variables");
}
export const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});
export async function initializeDatabase() {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      balance NUMERIC(14,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount NUMERIC(14,2) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    ALTER TABLE bank_accounts
      ADD COLUMN IF NOT EXISTS bank_name TEXT,
      ADD COLUMN IF NOT EXISTS account_number_masked TEXT,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS opening_balance_date DATE NOT NULL DEFAULT CURRENT_DATE;
    ALTER TABLE ledger_entries
      ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bank_accounts(id) ON DELETE RESTRICT,
      ADD COLUMN IF NOT EXISTS transaction_type TEXT,
      ADD COLUMN IF NOT EXISTS transfer_pair_id UUID,
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'RECEIVED',
      ADD COLUMN IF NOT EXISTS is_void BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
      ADD COLUMN IF NOT EXISTS subcategory TEXT;
    CREATE INDEX IF NOT EXISTS ledger_entries_user_date_idx ON ledger_entries(user_id, transaction_date DESC);
    CREATE INDEX IF NOT EXISTS ledger_entries_account_idx ON ledger_entries(account_id, transaction_date DESC);
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_holdings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      quantity NUMERIC(12,4) NOT NULL,
      average_price NUMERIC(12,2) NOT NULL,
      current_price NUMERIC(12,2) NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_portfolios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS stock_portfolios_user_name_idx ON stock_portfolios(user_id, name);
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      portfolio_id UUID REFERENCES stock_portfolios(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('BUY', 'SELL', 'IPO', 'RIGHT', 'BONUS', 'DIVIDEND', 'VALUATION')),
      quantity NUMERIC(14,4) NOT NULL DEFAULT 0,
      price NUMERIC(14,4) NOT NULL DEFAULT 0,
      fees NUMERIC(14,2) NOT NULL DEFAULT 0,
      amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      event_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS stock_events_user_date_idx ON stock_events(user_id, event_date DESC);
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_lots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      portfolio_id UUID REFERENCES stock_portfolios(id) ON DELETE CASCADE,
      event_id UUID NOT NULL REFERENCES stock_events(id) ON DELETE RESTRICT,
      symbol TEXT NOT NULL,
      acquired_date DATE NOT NULL,
      quantity NUMERIC(14,4) NOT NULL,
      remaining_quantity NUMERIC(14,4) NOT NULL,
      cost_per_share NUMERIC(14,6) NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS stock_lots_fifo_idx ON stock_lots(user_id, symbol, acquired_date, id);
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_prices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      portfolio_id UUID REFERENCES stock_portfolios(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      price NUMERIC(14,4) NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS stock_prices_latest_idx ON stock_prices(user_id, symbol, recorded_at DESC);

    CREATE TABLE IF NOT EXISTS share_transfers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      portfolio_id UUID REFERENCES stock_portfolios(id) ON DELETE CASCADE,
      event_id UUID NOT NULL REFERENCES stock_events(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      quantity NUMERIC(14,4) NOT NULL,
      amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      deadline DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'TRANSFERRED', 'PROBLEM', 'CANCELLED')),
      notes TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    ALTER TABLE stock_events ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES stock_portfolios(id) ON DELETE CASCADE;
    ALTER TABLE stock_lots ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES stock_portfolios(id) ON DELETE CASCADE;
    ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES stock_portfolios(id) ON DELETE CASCADE;
    ALTER TABLE share_transfers ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES stock_portfolios(id) ON DELETE CASCADE;
    INSERT INTO stock_portfolios (user_id, name)
      SELECT id, 'My portfolio' FROM users u
      WHERE NOT EXISTS (SELECT 1 FROM stock_portfolios p WHERE p.user_id = u.id);
    UPDATE stock_events e SET portfolio_id = p.id FROM stock_portfolios p WHERE e.user_id = p.user_id AND e.portfolio_id IS NULL;
    UPDATE stock_lots l SET portfolio_id = p.id FROM stock_portfolios p WHERE l.user_id = p.user_id AND l.portfolio_id IS NULL;
    UPDATE stock_prices s SET portfolio_id = p.id FROM stock_portfolios p WHERE s.user_id = p.user_id AND s.portfolio_id IS NULL;
    UPDATE share_transfers t SET portfolio_id = p.id FROM stock_portfolios p WHERE t.user_id = p.user_id AND t.portfolio_id IS NULL;
    CREATE INDEX IF NOT EXISTS stock_events_portfolio_idx ON stock_events(portfolio_id, event_date DESC);
    CREATE INDEX IF NOT EXISTS stock_lots_portfolio_idx ON stock_lots(portfolio_id, symbol, acquired_date);
    CREATE INDEX IF NOT EXISTS stock_prices_portfolio_idx ON stock_prices(portfolio_id, symbol, recorded_at DESC);
  `);
}
