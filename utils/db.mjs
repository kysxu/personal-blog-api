import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

let pool = null;

function getPool() {
  if (!pool) {
    let poolConfig = {};
    const connStr = process.env.CONNECTION_STRING || process.env.DATABASE_URL || "postgresql://postgres:.Ff0929919462@db.jiffdjjmkairgunokkvm.supabase.co:5432/postgres";

    try {
      const parsedUrl = new URL(connStr);
      poolConfig = {
        host: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : 5432,
        user: decodeURIComponent(parsedUrl.username),
        password: decodeURIComponent(parsedUrl.password),
        database: parsedUrl.pathname.replace(/^\//, ""),
        ssl: connStr.includes("supabase") ? { rejectUnauthorized: false } : undefined,
      };
    } catch (e) {
      poolConfig = {
        connectionString: connStr,
        ssl: connStr.includes("supabase") ? { rejectUnauthorized: false } : undefined,
      };
    }

    pool = new Pool(poolConfig);
  }
  return pool;
}

const connectionPool = {
  query: (...args) => getPool().query(...args),
};

export default connectionPool;
