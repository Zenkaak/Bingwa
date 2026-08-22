import { Router } from "express";
import { pool } from "../db.js";
import {
  ListDealsResponse,
  GetStoreSettingsResponse,
  StartCheckoutBody,
  StartCheckoutResponse,
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminSummaryResponse,
  ListCustomersResponse,
  ListCustomersQueryParams,
  ListOrdersQueryParams,
  ListOrdersResponse,
  UpdateStoreSettingsBody,
  UpdateStoreSettingsResponse,
  ListAdminDealsResponse,
  UpdateDealBody,
  UpdateDealResponse,
} from "../schemas.js";
import crypto from "node:crypto";
import { deals as defaultDeals } from "../catalog.js";

const router = Router();

type JsonResponse = {
  status: (status: number) => JsonResponse;
  json: (body: unknown) => unknown;
};
type RequestLike = any;
type ResponseLike = any;

const json = (res: JsonResponse, data: unknown, schema: { parse: (value: unknown) => unknown }, status = 200) =>
  res.status(status).json(schema.parse(data));

const isAdmin = (
  req: { headers: { cookie?: string } },
  res: JsonResponse,
  next: () => unknown,
) => {
  const token = req.headers.cookie?.match(/bh_admin=([^;]+)/)?.[1];
  if (!token || !isValidAdminToken(token)) return res.status(401).json({ error: "Admin authentication required" });
  return next();
};

function sessionSecret() {
  return process.env.SESSION_SECRET ?? process.env.BINGWA_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "black-hole-admin-session";
}

function signAdminToken(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function isValidAdminToken(token: string) {
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature || !/^\d+$/.test(issuedAt)) return false;
  if (Date.now() - Number(issuedAt) > 8 * 60 * 60 * 1000) return false;
  const expected = signAdminToken(issuedAt);
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function ensureDatabase() {
  await pool.query(`CREATE TABLE IF NOT EXISTS store_settings (id serial primary key, till_number text not null default '6950412', customer_care text not null default '0769252572', contact_name text not null default 'EDWIN ONDERI', mpesa_passkey text, mpesa_consumer_secret text, mpesa_shortcode text, mpesa_consumer_key text, mpesa_party_b text)`);
  await pool.query("ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS mpesa_passkey text, ADD COLUMN IF NOT EXISTS mpesa_consumer_secret text, ADD COLUMN IF NOT EXISTS mpesa_shortcode text, ADD COLUMN IF NOT EXISTS mpesa_consumer_key text, ADD COLUMN IF NOT EXISTS mpesa_party_b text");
  await pool.query(`CREATE TABLE IF NOT EXISTS customers (id serial primary key, phone_number text unique not null, name text, created_at timestamptz not null default now())`);
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS name text");
  await pool.query(`CREATE TABLE IF NOT EXISTS orders (id serial primary key, phone_number text not null, deal_id text not null, amount integer not null, status text not null default 'pending', mpesa_receipt text, failure_reason text, checkout_request_id text, created_at timestamptz not null default now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS admin_users (id integer primary key, password_hash text not null, updated_at timestamptz not null default now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS deals (id text primary key, category text not null, price integer not null, quantity text not null, validity text not null, repeatable boolean not null default false)`);
  for (const deal of defaultDeals) {
    await pool.query(
      "INSERT INTO deals (id, category, price, quantity, validity, repeatable) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING",
      [deal.id, deal.category, deal.price, deal.quantity, deal.validity, deal.repeatable],
    );
  }
  await pool.query(`INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
  await pool.query(
    "UPDATE store_settings SET mpesa_passkey = COALESCE($1, mpesa_passkey), mpesa_consumer_secret = COALESCE($2, mpesa_consumer_secret), mpesa_shortcode = COALESCE($3, mpesa_shortcode), mpesa_consumer_key = COALESCE($4, mpesa_consumer_key), mpesa_party_b = COALESCE($5, mpesa_party_b) WHERE id = 1",
    [process.env.MPESA_PASSKEY ?? null, process.env.MPESA_CONSUMER_SECRET ?? null, process.env.MPESA_SHORTCODE ?? null, process.env.MPESA_CONSUMER_KEY ?? null, process.env.MPESA_PARTY_B ?? null],
  );
  const adminPassword = process.env.BINGWA_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (adminPassword) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(adminPassword, salt, 64).toString("hex");
    await pool.query(
      "INSERT INTO admin_users (id, password_hash) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()",
      [`${salt}:${hash}`],
    );
  }
}

const databaseReady = ensureDatabase().catch(() => undefined);

async function readDeals() {
  const result = await pool.query("SELECT id, category, price, quantity, validity, repeatable FROM deals ORDER BY id");
  return result.rows.map((deal) => ({ ...deal, price: Number(deal.price), repeatable: Boolean(deal.repeatable) }));
}

router.get("/deals", async (_req: RequestLike, res: ResponseLike) => {
  await databaseReady;
  return json(res, await readDeals(), ListDealsResponse);
});

router.get("/store-settings", async (_req: RequestLike, res: ResponseLike) => {
  const result = await pool.query("SELECT till_number as \"tillNumber\", customer_care as \"customerCare\", contact_name as \"contactName\" FROM store_settings WHERE id = 1");
  json(res, result.rows[0] ?? { tillNumber: "6950412", customerCare: "0769252572", contactName: "EDWIN ONDERI" }, GetStoreSettingsResponse);
});

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7")) return `254${digits}`;
  return digits;
}

function mapOrder(row: Record<string, unknown>) {
  return {
    ...row,
    id: Number(row.id),
    amount: Number(row.amount),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

function getMpesaCallbackUrl(req: { get: (name: string) => string | undefined }) {
  const configuredUrl = process.env.MPESA_CALLBACK_URL?.trim();
  if (configuredUrl) return configuredUrl;

  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    req.get("host");
  const protocol = process.env.VERCEL_URL
    ? "https"
    : req.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";

  if (!host) throw new Error("M-Pesa callback URL is not configured");
  return `${protocol}://${host}/api/mpesa/callback`;
}

async function getMpesaToken() {
  const settings = await pool.query("SELECT mpesa_consumer_key as \"consumerKey\", mpesa_consumer_secret as \"consumerSecret\" FROM store_settings WHERE id = 1");
  const consumerKey = settings.rows[0]?.consumerKey ?? process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = settings.rows[0]?.consumerSecret ?? process.env.MPESA_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) throw new Error("M-Pesa credentials are not configured");
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await fetch("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: `Basic ${auth}` },
  }) as unknown as { ok: boolean; json: () => Promise<{ access_token: string }> };
  if (!response.ok) throw new Error("Could not authenticate with M-Pesa");
  return (await response.json() as { access_token: string }).access_token;
}

router.post("/checkout", async (req: RequestLike, res: ResponseLike) => {
  const parsed = StartCheckoutBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid phone number and choose a deal." });
  await databaseReady;
  const dealResult = await pool.query("SELECT id, category, price, quantity, validity, repeatable FROM deals WHERE id = $1", [parsed.data.dealId]);
  const deal = dealResult.rows[0] ? { ...dealResult.rows[0], price: Number(dealResult.rows[0].price), repeatable: Boolean(dealResult.rows[0].repeatable) } : undefined;
  if (!deal) return res.status(400).json({ error: "That deal is no longer available." });
  const phone = normalizePhone(parsed.data.phoneNumber);
  const order = await pool.query("INSERT INTO orders (phone_number, deal_id, amount) VALUES ($1, $2, $3) RETURNING id", [phone, deal.id, deal.price]);
  await pool.query(
    "INSERT INTO customers (phone_number, name) VALUES ($1, $2) ON CONFLICT (phone_number) DO UPDATE SET name = COALESCE(EXCLUDED.name, customers.name)",
    [phone, parsed.data.customerName ?? null],
  );
  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const settings = await pool.query("SELECT till_number, mpesa_shortcode, mpesa_passkey, mpesa_party_b FROM store_settings WHERE id = 1");
    const shortcode = settings.rows[0]?.mpesa_shortcode ?? settings.rows[0]?.till_number ?? process.env.MPESA_SHORTCODE;
    const passkey = settings.rows[0]?.mpesa_passkey ?? process.env.MPESA_PASSKEY;
    const partyB = settings.rows[0]?.mpesa_party_b ?? process.env.MPESA_PARTY_B ?? shortcode;
    if (!shortcode || !passkey || !partyB) throw new Error("M-Pesa payment settings are not configured");
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
     const mpesa = await fetch("https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
       method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
       body: JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, TransactionType: process.env.MPESA_TRANSACTION_TYPE ?? "CustomerBuyGoodsOnline", Amount: deal.price, PartyA: phone, PartyB: partyB, PhoneNumber: phone, CallBackURL: getMpesaCallbackUrl(req), AccountReference: `BINGWA-${order.rows[0].id}`, TransactionDesc: `${deal.quantity} Bingwa deal` }),
    });
    const response = await (mpesa as unknown as { ok: boolean; json: () => Promise<{ ResponseCode?: string; CheckoutRequestID?: string; ResponseDescription?: string }> }).json();
    if (!(mpesa as unknown as { ok: boolean }).ok || response.ResponseCode !== "0") throw new Error(response.ResponseDescription ?? "M-Pesa could not start the prompt");
    await pool.query("UPDATE orders SET checkout_request_id = $1 WHERE id = $2", [response.CheckoutRequestID, order.rows[0].id]);
    return json(res, { orderId: order.rows[0].id, message: "Check your phone and enter your M-Pesa PIN to complete payment." }, StartCheckoutResponse, 201);
  } catch (error) {
    await pool.query("UPDATE orders SET status = 'failed', failure_reason = $1 WHERE id = $2", [error instanceof Error ? error.message : "M-Pesa request failed", order.rows[0].id]);
    return res.status(400).json({ error: "We could not start the M-Pesa prompt. Please try again." });
  }
});

router.post("/mpesa/callback", async (req: RequestLike, res: ResponseLike) => {
  const callback = req.body?.Body?.stkCallback;
  const checkoutId = callback?.CheckoutRequestID;
  if (checkoutId) {
    const receipt = callback.CallbackMetadata?.Item?.find((item: { Name: string }) => item.Name === "MpesaReceiptNumber")?.Value;
    const success = callback.ResultCode === 0 && Boolean(receipt);
    const failureReason = success ? null : callback.ResultCode === 0 ? "Payment completed without an M-Pesa receipt reference" : callback.ResultDesc ?? "Payment was not completed";
    await pool.query("UPDATE orders SET status = $1, mpesa_receipt = $2, failure_reason = $3 WHERE checkout_request_id = $4", [success ? "completed" : "failed", receipt ?? null, failureReason, checkoutId]);
  }
  return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

router.post("/admin/login", async (req: RequestLike, res: ResponseLike) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  await databaseReady;
  if (!parsed.success) return res.status(401).json({ error: "Incorrect admin password." });
  const result = await pool.query("SELECT password_hash FROM admin_users WHERE id = 1");
  const stored = result.rows[0]?.password_hash as string | undefined;
  const [salt, expected] = stored?.split(":") ?? [];
  let valid = false;
  if (salt && expected) {
    const actual = crypto.scryptSync(parsed.data.password, salt, 64);
    const expectedBuffer = Buffer.from(expected, "hex");
    valid = actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
  }
  if (!valid) return res.status(401).json({ error: "Incorrect admin password." });
  const issuedAt = String(Date.now());
  const token = `${issuedAt}.${signAdminToken(issuedAt)}`;
  const secure = req.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
  res.setHeader("Set-Cookie", `bh_admin=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax${secure ? "; Secure" : ""}`);
  return json(res, { success: true }, AdminLoginResponse);
});

router.get("/admin/summary", isAdmin, async (_req: RequestLike, res: ResponseLike) => {
  await databaseReady;
  const counts = await pool.query("SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = 'completed')::int as completed, COUNT(*) FILTER (WHERE status = 'failed')::int as failed, COUNT(*) FILTER (WHERE status = 'pending')::int as pending, COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::int as revenue, COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int as today_orders, COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= date_trunc('day', now())), 0)::int as today_revenue FROM orders");
  const recent = await pool.query("SELECT id, phone_number as \"phoneNumber\", deal_id as \"dealId\", amount, status, mpesa_receipt as \"mpesaReceipt\", failure_reason as \"failureReason\", created_at as \"createdAt\" FROM orders ORDER BY created_at DESC LIMIT 8");
  const c = counts.rows[0];
  const completionRate = c.total ? Math.round((c.completed / c.total) * 1000) / 10 : 0;
  json(res, { totalOrders: c.total, completedOrders: c.completed, failedOrders: c.failed, pendingOrders: c.pending, totalRevenue: c.revenue, todayOrders: c.today_orders, todayRevenue: c.today_revenue, completionRate, recentOrders: recent.rows.map(mapOrder) }, GetAdminSummaryResponse);
});

router.get("/admin/customers", isAdmin, async (req: RequestLike, res: ResponseLike) => {
  await databaseReady;
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  const query = parsed.success ? parsed.data.q?.trim() ?? "" : "";
  const result = await pool.query(
    "SELECT c.id, c.phone_number as \"phoneNumber\", c.name, COUNT(o.id)::int as \"orderCount\", COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'completed'), 0)::int as \"totalSpent\", MAX(o.created_at) as \"lastOrderAt\", (ARRAY_AGG(o.mpesa_receipt ORDER BY o.created_at DESC) FILTER (WHERE o.mpesa_receipt IS NOT NULL))[1] as \"lastMpesaReference\" FROM customers c LEFT JOIN orders o ON o.phone_number = c.phone_number WHERE ($1::text = '' OR c.name ILIKE '%' || $1 || '%' OR c.phone_number ILIKE '%' || $1 || '%' OR EXISTS (SELECT 1 FROM orders so WHERE so.phone_number = c.phone_number AND so.mpesa_receipt ILIKE '%' || $1 || '%')) GROUP BY c.id ORDER BY MAX(o.created_at) DESC NULLS LAST",
    [query],
  );
  json(res, result.rows.map((row) => ({ ...row, lastOrderAt: row.lastOrderAt instanceof Date ? row.lastOrderAt.toISOString() : row.lastOrderAt })), ListCustomersResponse);
});

router.get("/admin/orders", isAdmin, async (req: RequestLike, res: ResponseLike) => {
  await databaseReady;
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  const status = parsed.success && parsed.data.status && parsed.data.status !== "all" ? parsed.data.status : null;
  const result = await pool.query("SELECT id, phone_number as \"phoneNumber\", deal_id as \"dealId\", amount, status, mpesa_receipt as \"mpesaReceipt\", failure_reason as \"failureReason\", created_at as \"createdAt\" FROM orders WHERE ($1::text IS NULL OR status = $1) ORDER BY created_at DESC", [status]);
  return json(res, result.rows.map(mapOrder), ListOrdersResponse);
});

router.get("/admin/deals", isAdmin, async (_req: RequestLike, res: ResponseLike) => {
  await databaseReady;
  return json(res, await readDeals(), ListAdminDealsResponse);
});

router.patch("/admin/deals/:id", isAdmin, async (req: RequestLike, res: ResponseLike) => {
  await databaseReady;
  const parsed = UpdateDealBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the deal values." });
  const fields = Object.entries(parsed.data);
  if (!fields.length) return res.status(400).json({ error: "Add at least one value to update." });
  const allowed = new Set(["category", "price", "quantity", "validity", "repeatable"]);
  if (fields.some(([key]) => !allowed.has(key))) return res.status(400).json({ error: "Invalid deal field." });
  const assignments = fields.map(([key], index) => `"${key}" = $${index + 1}`).join(", ");
  const result = await pool.query(`UPDATE deals SET ${assignments} WHERE id = $${fields.length + 1} RETURNING id, category, price, quantity, validity, repeatable`, [...fields.map(([, value]) => value), req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: "Deal not found." });
  const deal = { ...result.rows[0], price: Number(result.rows[0].price), repeatable: Boolean(result.rows[0].repeatable) };
  return json(res, deal, UpdateDealResponse);
});

router.patch("/admin/settings", isAdmin, async (req: RequestLike, res: ResponseLike) => {
  const parsed = UpdateStoreSettingsBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the settings values." });
  const current = await pool.query("SELECT till_number as \"tillNumber\", customer_care as \"customerCare\", contact_name as \"contactName\" FROM store_settings WHERE id = 1");
  const next = { ...current.rows[0], ...parsed.data };
  const result = await pool.query("UPDATE store_settings SET till_number = $1, customer_care = $2, contact_name = $3 WHERE id = 1 RETURNING till_number as \"tillNumber\", customer_care as \"customerCare\", contact_name as \"contactName\"", [next.tillNumber, next.customerCare, next.contactName]);
  return json(res, result.rows[0], UpdateStoreSettingsResponse);
});

export default router;