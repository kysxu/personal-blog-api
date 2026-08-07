import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

let poolConfig = {};

const connStr = process.env.CONNECTION_STRING || process.env.DATABASE_URL;

if (connStr) {
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
}

const connectionPool = new Pool(poolConfig);

export default connectionPool;
