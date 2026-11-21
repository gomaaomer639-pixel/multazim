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

function normalizeOrderNumber(value: string) {
  const compact = value.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!/^MLT[A-HJ-NP-Z2-9]{12}$/.test(compact)) return "";
  const code = compact.slice(3);
  return `MLT-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function safeDeliveryUrl(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);
  try {
    const body = await request.json();
    const suppliedOrderNumber = typeof body?.orderNumber === "string" ? body.orderNumber : "";
    const orderNumber = normalizeOrderNumber(suppliedOrderNumber);
    const token = typeof body?.trackingToken === "string" ? body.trackingToken.trim() : "";
    const isOrderNumberLookup = Boolean(suppliedOrderNumber);
    if (isOrderNumberLookup && !orderNumber) return response({ error: "Invalid order number" }, 400);
    if (!isOrderNumberLookup && !/^[A-Za-z0-9_-]{40,50}$/.test(token)) {
      return response({ error: "Invalid tracking credential" }, 400);
    }
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return response({ error: "Tracking is not configured" }, 503);
    const lookupValue = isOrderNumberLookup ? orderNumber : token;
    const lookupColumn = isOrderNumberLookup ? "order_number_hash" : "tracking_token_hash";
    const hash = await sha256(lookupValue);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.from("orders")
      .select("product_name,status,delivery_url,updated_at")
      .eq(lookupColumn, hash)
      .maybeSingle();
    if (error) return response({ error: "Tracking is temporarily unavailable" }, 503);
    if (!data) return response({ error: "Tracking credential not found" }, 404);
    return response({
      order: {
        product_name: data.product_name,
        status: data.status,
        delivery_url: data.status === "delivered" ? safeDeliveryUrl(data.delivery_url) : null,
        updated_at: data.updated_at,
      },
    });
  } catch {
    return response({ error: "Invalid request" }, 400);
  }
});
