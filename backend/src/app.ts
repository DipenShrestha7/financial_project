import Fastify from "fastify";
import cors from "@fastify/cors";
import { initializeDatabase } from "./config/db.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import stockRoutes from "./routes/stocks.js";
import bankRoutes from "./routes/banks.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  await initializeDatabase();

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(stockRoutes);
  await app.register(bankRoutes);

  return app;
}
