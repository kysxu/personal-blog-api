import pg from "pg";
const { Pool } = pg;

const connectionPool = new Pool({
  connectionString: process.env.CONNECTION_STRING || process.env.DATABASE_URL,
  ssl: process.env.CONNECTION_STRING?.includes("supabase") || process.env.DATABASE_URL?.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined,
});

export default connectionPool;
