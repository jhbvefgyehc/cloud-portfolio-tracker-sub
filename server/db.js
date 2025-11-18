import pkg from "pg";
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || null;

let pool = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  pool.on("error", (err) => {
    console.error("DB pool error", err);
  });

  console.log("DB: Pool created (will connect on first query).");
} else {
  console.warn("DB: No DATABASE_URL set. DB queries will fail until you set DATABASE_URL in server/.env or environment.");
}

export async function query(text, params) {
  if (!pool) {
    throw new Error("No database pool. Set DATABASE_URL in server/.env or hosting environment.");
  }
  return pool.query(text, params);
}

export default pool;