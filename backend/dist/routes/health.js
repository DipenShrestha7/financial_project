import { pool } from "../config/db.js";
export default async function healthRoutes(app) {
    app.get("/health", async () => ({
        status: "ok",
        service: "hisabkitab-backend",
        time: new Date().toISOString(),
    }));
    app.get("/api/overview", async () => {
        const result = await pool.query(`SELECT current_database() AS database_name, now() AS current_time, (SELECT COUNT(*) FROM users) AS user_count;`);
        return {
            status: "ok",
            database: result.rows[0],
        };
    });
}
