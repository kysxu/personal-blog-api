import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === "your-supabase-anon-key-here") {
  console.warn("⚠️ Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing or unconfigured in .env");
}

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

export default supabase;
