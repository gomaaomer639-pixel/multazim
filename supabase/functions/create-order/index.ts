import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  canonicalPaymentMethodLabel,
  findPaymentMethod,
  loadActivePaymentMethods,
} from "../_shared/payment-methods.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const maxProofBytes = 5 * 1024 * 1024;
const allowedTypes: Record<string, { extension: string; signature: (bytes: Uint8Array) => boolean }> = {
  "image/jpeg": { extension: "jpg", signature: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extension: "png", signature: b => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  "image/webp": { extension: "webp", signature: b => b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
  "application/pdf": { extension: "pdf", signature: b => String.fromCharCode(...b.slice(0, 5)) === "%PDF-" },
};
const staticProducts: Record<string, { name: string; price: number }> = {
  pdf: { name: "نسخة PDF للطباعة", price: 59 },
  interactive: { name: "النسخة التفاعلية", price: 49 },
  printed: { name: "النسخة المطبوعة", price: 89 },
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const orderNumberAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeOrderNumber() {
  const random = crypto.getRandomValues(new Uint8Array(12));
  const code = Array.from(random, byte => orderNumberAlphabet[byte & 31]).join("");
  return `MLT-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function normalizePhone(value: string) {
  return value.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, digit =>
    String(digit.codePointAt(0)! - (digit >= "\u06f0" ? 0x06f0 : 0x0660))
  );
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > maxProofBytes + 64 * 1024) return response({ error: "Request too large" }, 413);

  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = normalizePhone(String(form.get("phone") || "").trim());
    const productId = String(form.get("productId") || "").trim();
    const paymentMethod = String(form.get("paymentMethod") || "").trim();
    const note = String(form.get("note") || "").trim().slice(0, 1000);
    const proof = form.get("proof");
    if (!name || name.length > 160 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 ||
        !/^[+\d()\s-]{7,24}$/.test(phone) || !productId || !paymentMethod || !(proof instanceof File)) {
      return response({ error: "Invalid order details" }, 400);
    }
    if (proof.size < 1 || proof.size > maxProofBytes) return response({ error: "Invalid proof size" }, 400);
    const fileType = allowedTypes[proof.type];
    if (!fileType) return response({ error: "Unsupported proof type" }, 400);
    const proofBytes = new Uint8Array(await proof.arrayBuffer());
    if (!fileType.signature(proofBytes)) return response({ error: "Invalid proof file" }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return response({ error: "Order service is not configured" }, 503);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    let product = staticProducts[productId];
    const catalog = await admin.from("product_catalog").select("id,name,price,active").eq("id", productId).maybeSingle();
    if (!catalog.error) {
      if (!catalog.data || catalog.data.active !== true || catalog.data.price == null ||
          !Number.isFinite(Number(catalog.data.price)) || Number(catalog.data.price) < 0) {
        return response({ error: "Product unavailable" }, 400);
      }
      product = { name: catalog.data.name, price: Number(catalog.data.price) };
    } else if (catalog.error.code !== "42P01" && catalog.error.code !== "PGRST205") {
      return response({ error: "Order service is temporarily unavailable" }, 503);
    }
    if (!product) return response({ error: "Product unavailable" }, 400);

  
const methodQuery = await loadActivePaymentMethods(admin);
if (methodQuery.error) {
  console.error("Payment methods are unavailable:", methodQuery.error.code || "unknown");
  return response({ error: "Payment method unavailable" }, 503);
}

const selectedMethod = findPaymentMethod(methodQuery.rows, paymentMethod);

if (!selectedMethod) {
  return response({ error: "Payment method unavailable" }, 400);
}

const orderPaymentName = canonicalPaymentMethodLabel(selectedMethod);

if (!orderPaymentName) {
  return response({ error: "Unsupported payment method" }, 400);
}

    const proofPath = `${crypto.randomUUID()}.${fileType.extension}`;
    const upload = await admin.storage.from("payment-proofs").upload(proofPath, proofBytes, {
      contentType: proof.type,
      cacheControl: "0",
      upsert: false,
    });
    if (upload.error) return response({ error: "Proof upload failed" }, 503);

    let orderNumber = "";
    let insertedOrder: { id: string } | null = null;
    let insertError: { code?: string; message?: string; details?: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      orderNumber = makeOrderNumber();
      const orderNumberHash = await sha256(orderNumber);
      const inserted = await admin.from("orders").insert({
        customer_name: name,
        email,
        phone,
        product_id: productId,
        product_name: product.name,
        amount: product.price,
        payment_method: orderPaymentName,
        proof_path: proofPath,
        note: note || null,
        status: "pending",
        order_number_hash: orderNumberHash,
      }).select("id").single();

      if (!inserted.error && inserted.data) {
        insertedOrder = inserted.data;
        insertError = null;
        break;
      }

      insertError = inserted.error;
      const duplicateOrderNumber = inserted.error?.code === "23505" &&
        `${inserted.error.message} ${inserted.error.details || ""}`.includes("order_number_hash");
      if (!duplicateOrderNumber) break;
    }

    if (!insertedOrder) {
      await admin.storage.from("payment-proofs").remove([proofPath]);
      if (insertError?.code === "42703" || insertError?.code === "PGRST204") {
        return response({ error: "Order database setup is incomplete; apply supabase/order-number-tracking.sql" }, 503);
      }
      if (insertError?.code === "23514") {
        return response({ error: "Order payment constraint does not match the supported payment names" }, 503);
      }
      return response({ error: "Order could not be saved" }, 503);
    }
    return response({ orderNumber });
  } catch {
    return response({ error: "Invalid request" }, 400);
  }
});
