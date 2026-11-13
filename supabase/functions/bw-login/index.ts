// BrainWhim: bw-login (Nov 13, 2026)
// Sign in with a username + password, for email AND phone accounts,
// without ever sending anyone's email or phone number to the browser.
// The lookup runs here, inside Supabase, using the built-in service key
// (Supabase sets SUPABASE_SERVICE_ROLE_KEY for every Edge Function; it is never in the site).
// Returns only { access_token, refresh_token } or { error }.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (o: unknown) =>
  new Response(JSON.stringify(o), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "bad_request" });
  let body: { username?: string; password?: string } = {};
  try { body = await req.json(); } catch { return reply({ error: "bad_request" }); }
  const name = String(body.username || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  const password = String(body.password || "");
  if (name.length < 3 || !password) return reply({ error: "invalid" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const who = await admin.rpc("bw_login_ident", { n: name });
  const row = Array.isArray(who.data) ? who.data[0] : who.data;
  if (who.error || !row || (!row.email && !row.phone)) return reply({ error: "invalid" });

  const pub = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
  const creds = row.email
    ? { email: String(row.email), password }
    : { phone: "+" + String(row.phone).replace(/^\+/, ""), password };
  const r = await pub.auth.signInWithPassword(creds);
  if (r.error || !r.data.session) {
    const m = String(r.error?.message || "").toLowerCase();
    if (r.error?.status === 429 || m.includes("rate limit")) return reply({ error: "rate" });
    if (m.includes("not confirmed")) return reply({ error: "unconfirmed" });
    return reply({ error: "invalid" });
  }
  return reply({ access_token: r.data.session.access_token, refresh_token: r.data.session.refresh_token });
});
