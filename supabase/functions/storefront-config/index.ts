import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadActivePaymentMethods } from "../_shared/payment-methods.js";

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
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return response({ error: "Storefront is not configured" }, 503);

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [paymentResult, catalogResult] = await Promise.all([
      loadActivePaymentMethods(admin),
      admin.from("product_catalog").select("id,name,price,old_price,active").eq("active", true),
    ]);
    const { rows, error } = paymentResult;
    if (error) {
      console.error("Storefront payment configuration unavailable:", error.code || "unknown");
      return response({ error: "Payment methods are temporarily unavailable" }, 503);
    }

    const products = catalogResult.error
      ? []
      : (catalogResult.data || [])
        .filter(product => product.active === true && product.price != null && Number.isFinite(Number(product.price)) && Number(product.price) >= 0)
        .map(product => ({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          old_price: product.old_price == null || !Number.isFinite(Number(product.old_price))
            ? null
            : Number(product.old_price),
          active: product.active,
        }));

    return response({ products, paymentMethods: rows });
  } catch {
    return response({ error: "Storefront configuration is temporarily unavailable" }, 503);
  }
});
