import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);
  try {
    const body = await request.json();
    const token = typeof body?.trackingToken === "string" ? body.trackingToken.trim() : "";
    if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) return response({ error: "Invalid tracking token" }, 400);
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return response({ error: "Tracking is not configured" }, 503);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.from("orders")
      .select("product_name,status,delivery_url,updated_at")
      .eq("tracking_token_hash", hash)
      .maybeSingle();
    if (error) return response({ error: "Tracking is temporarily unavailable" }, 503);
    if (!data) return response({ error: "Tracking token not found" }, 404);
    return response({ order: data });
  } catch {
    return response({ error: "Invalid request" }, 400);
  }
});
