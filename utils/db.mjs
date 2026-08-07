import pg from "pg";
const { Pool } = pg;

let pool = null;

function getPool() {
  if (!pool) {
    let poolConfig = {};
    let connStr = process.env.CONNECTION_STRING || process.env.DATABASE_URL || "postgresql://postgres.jiffdjjmkairgunokkvm:.Ff0929919462@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

    // Auto-convert IPv6-only Supabase direct host to IPv4 Pooler host for Vercel compatibility
    if (connStr.includes("db.jiffdjjmkairgunokkvm.supabase.co") || connStr.includes("db.") && connStr.includes(".supabase.co")) {
      connStr = connStr
        .replace(/:5432\//, ":6543/")
        .replace(/db\.jiffdjjmkairgunokkvm\.supabase\.co/, "aws-0-ap-southeast-1.pooler.supabase.com")
        .replace(/postgres:/, "postgres.jiffdjjmkairgunokkvm:");
    }

    try {
      const parsedUrl = new URL(connStr);
      poolConfig = {
        host: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : 6543,
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
