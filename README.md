# Daily Planner Store (working title)

A fresh React + Vite + Supabase starter for the Arabic daily-planner storefront.

## Included in this foundation
- RTL Arabic landing page in a dark emerald / gold visual direction inspired by the supplied screenshots.
- Product cards for PDF, interactive and printed editions.
- Order form with Vodafone Cash / InstaPay selection and proof-of-payment upload.
- Pending-order workflow (approval is manual; upload is not payment confirmation).
- Feedback form and FAQ.
- Admin sign-in and starter order review screen.
- Supabase SQL schema and private payment-proof bucket setup.

## Run locally
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Keep this local-only file out of Git; never add a service-role key to it.
3. Run `npm install`.
4. Run `npm run dev`.

## Supabase setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor.
3. Create the first admin user in Supabase Authentication.
4. Set the environment variables locally and on your hosting provider.
5. Replace the placeholder payment instructions with the real Vodafone Cash number and InstaPay details through a protected settings feature before launch.

## Secure order submission and tracking

Storefront configuration, order creation, and tracking run through the Edge Functions in `supabase/functions/`. The browser only uses the public anon key. Never add a service-role key to any `.env*` file, `VITE_*` variable, frontend code, or deployable file.

Before deploying the functions:

1. Run `supabase/order-security-diagnostics.sql` in the SQL Editor and review the policy output. Check for any broad `storage.objects` read policy that could include `payment-proofs`.
2. For a new project, after reviewing the output, run `supabase/order-security.sql` to disable direct public order inserts and proof uploads, preserve admin order access, and make the proof bucket private. For the existing Multazim project where this security setup is already applied, do not rerun that script. Apply only the additive `supabase/order-number-tracking.sql` migration; it adds the nullable hash column and unique index without changing RLS or grants.
3. From the project folder, link the Supabase CLI to the intended project if needed, then deploy the functions with `supabase functions deploy storefront-config --project-ref qbcubpktpwxdkoxplcqh`, `supabase functions deploy create-order --project-ref qbcubpktpwxdkoxplcqh`, and `supabase functions deploy track-order --project-ref qbcubpktpwxdkoxplcqh`. In Supabase Edge Function secrets, confirm `SUPABASE_SERVICE_ROLE_KEY` is available to the functions; if it is not, set it there only. Never share or paste the value into the frontend or this repository.
4. In the Supabase function settings, keep JWT verification enabled. The storefront calls the functions using its anon client.
5. Re-run the diagnostics and verify there is no public/anon read policy for `payment-proofs`. Then test a new order and its generated tracking link in a non-production or explicitly approved production test flow.

New orders receive a short `MLT-XXXX-XXXX-XXXX` order number containing 12 cryptographically random characters. Only its SHA-256 hash is stored, and the tracking function returns only that order's product, status, and (after delivery) delivery URL. Existing private tracking-token links remain supported. Existing orders cannot be assigned a recoverable order number after creation, so customers should keep using their previous private tracking link. Customers cannot retrieve an order by UUID and phone number.

## Important production work still required
This is a project foundation, not a live payment or delivery system. Before accepting real orders:
- Add a proper admin-role allowlist/role table. The included authenticated policies are a development starting point and must be tightened so ordinary authenticated users cannot access admin data.
- Add server-side/Edge Functions for admin-only status transitions, signed download links, and email/WhatsApp notifications.
- Add protected admin settings for prices, product content, payment details, and Google Drive delivery URLs.
- Add an admin-only way to view proof files through short-lived signed URLs. The bucket is private.
- Add rate limiting, spam protection, file validation, backups, and end-to-end tests.
- Verify all planner contents, page numbers, product prices, and marketing claims before publication.

## Working title and editable content
The displayed brand is intentionally temporary. Product prices and section content are starter data in `src/App.jsx` and should move into protected database-backed settings/CMS before launch.
