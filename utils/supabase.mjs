import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || "https://jiffdjjmkairgunokkvm.supabase.co";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZmZkampta2Fpcmd1bm9ra3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDQ3NzcsImV4cCI6MjEwMDIyMDc3N30.2srKEqLv12HHaiSt4BfSwO0NUSYTqbkW7vN4K4-QBD4";
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabase();
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  }
});

export default supabase;
