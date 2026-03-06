/**
 * ─────────────────────────────────────────────────────────────
 *  Travel Capsule AI — Polar Checkout Integration
 * ─────────────────────────────────────────────────────────────
 *
 *  COMPLIANCE NOTES (per Polar API rules):
 *
 *  1. OAT (Organization Access Token) is NEVER exposed client-side.
 *     All server-side calls use Authorization: Bearer polar_oat_xxx.
 *     This module defines the CLIENT-SIDE interface only.
 *
 *  2. In-app checkout uses Checkout Sessions API (POST /v1/checkouts/),
 *     NOT Checkout Links. Per Polar docs:
 *     "If you want to start a checkout for one of your user INSIDE
 *      your product, you should use the Checkout Sessions API."
 *
 *  3. Customer Portal uses Customer Access Tokens created via
 *     POST /v1/customer-sessions/ (server-side).
 *     NOT organization-level OATs.
 *
 *  4. Product structure:
 *     - Standard (Free): one-time product → creates an Order
 *     - Pro ($4.99): one-time product → creates an Order
 *     - Annual ($9.99/yr): subscription product → creates a Subscription
 *
 *  ARCHITECTURE:
 *     Client → POST /api/checkout/create (your backend)
 *                → POST https://api.polar.sh/v1/checkouts/ (server-to-server, with OAT)
 *                ← { id, url, client_secret }
 *     Client → redirect to checkout URL or embed with client_secret
 *     Polar  → webhook order.paid / subscription.active → your backend
 *     Client → redirected to success_url with checkout_id
 *
 * ─────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════ */
/*  PRODUCT CONFIGURATION                                      */
/* ═══════════════════════════════════════════════════════════ */

/**
 * These IDs map to Products created in your Polar dashboard.
 *
 * To set up:
 * 1. Go to Polar Dashboard → Products
 * 2. Create three products with the prices below
 * 3. Copy the product IDs here
 *
 * For sandbox testing, use sandbox-api.polar.sh product IDs.
 */
import { WORKER_URL } from '../lib/api'

export const POLAR_PRODUCTS = {
  standard: {
    /** Replace with your Polar product ID */
    productId: "YOUR_STANDARD_PRODUCT_ID",
    name: "Standard Capsule",
    type: "one_time" as const,
    price: 0,         // cents (Free)
    currency: "usd",
  },
  pro: {
    /** Replace with your Polar product ID */
    productId: "YOUR_PRO_PRODUCT_ID",
    name: "Pro Capsule",
    type: "one_time" as const,
    price: 499,       // cents ($4.99)
    currency: "usd",
  },
  annual: {
    /** Replace with your Polar product ID */
    productId: "YOUR_ANNUAL_PRODUCT_ID",
    name: "Annual Membership",
    type: "recurring" as const,
    price: 999,       // cents ($9.99/year)
    currency: "usd",
    interval: "year",
  },
} as const;

export type PlanKey = keyof typeof POLAR_PRODUCTS;

/* ═══════════════════════════════════════════════════════════ */
/*  ENVIRONMENT CONFIGURATION                                  */
/* ═══════════════════════════════════════════════════════════ */

/**
 * IMPORTANT: Set to "sandbox" during development, "production" for live.
 *
 * Base URLs per Polar docs:
 *   Production: https://api.polar.sh/v1
 *   Sandbox:    https://sandbox-api.polar.sh/v1
 */
const POLAR_ENV = "sandbox" as "sandbox" | "production";

const POLAR_API_BASE = POLAR_ENV === "production"
  ? "https://api.polar.sh/v1"
  : "https://sandbox-api.polar.sh/v1";

/* ═══════════════════════════════════════════════════════════ */
/*  CHECKOUT SESSION — Client-side interface                   */
/* ═══════════════════════════════════════════════════════════ */

export interface CheckoutSessionRequest {
  plan: PlanKey;
  /** Optional: link to existing Polar customer */
  customerEmail?: string;
  /** Your app's user ID (maps to Polar external_customer_id) */
  externalCustomerId?: string;
  /** URL to return to after successful checkout */
  successUrl: string;
  /** Optional trip ID for metadata tracking */
  tripId?: string;
}

export interface CheckoutSessionResponse {
  /** Polar checkout session ID */
  id: string;
  /** Full URL to redirect user to for payment */
  url: string;
  /** Client secret for embedded checkout (optional) */
  clientSecret: string;
  /** Status of the checkout */
  status: "open" | "expired" | "confirmed";
}

/**
 * Create a Polar Checkout Session.
 *
 * PRODUCTION IMPLEMENTATION:
 * This should call YOUR backend, which in turn calls Polar's API
 * with the OAT (server-to-server). Never call Polar directly from client.
 *
 * Your backend endpoint: POST /api/checkout/create
 * Your backend then calls: POST https://api.polar.sh/v1/checkouts/
 *   Headers: { Authorization: "Bearer polar_oat_xxx" }
 *   Body: {
 *     product_id: POLAR_PRODUCTS[plan].productId,
 *     success_url: successUrl,
 *     customer_email: customerEmail,           // optional
 *     external_customer_id: externalCustomerId // optional
 *   }
 *
 * @see https://polar.sh/docs/api-reference/checkouts/create-session
 */
export async function createCheckoutSession(
  request: CheckoutSessionRequest,
): Promise<CheckoutSessionResponse> {
  const product = POLAR_PRODUCTS[request.plan];

  /**
   * ┌─────────────────────────────────────────────────────┐
   * │  PRODUCTION: Replace this mock with a real API call │
   * │                                                     │
   * │  const res = await fetch("/api/checkout/create", {  │
   * │    method: "POST",                                  │
   * │    headers: { "Content-Type": "application/json" }, │
   * │    body: JSON.stringify({                           │
   * │      product_id: product.productId,                 │
   * │      success_url: request.successUrl,               │
   * │      customer_email: request.customerEmail,         │
   * │      external_customer_id:                          │
   * │        request.externalCustomerId,                  │
   * │    }),                                              │
   * │  });                                                │
   * │  return await res.json();                           │
   * └─────────────────────────────────────────────────────┘
   */

  const isLocalDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  const res = await fetch(`${WORKER_URL}/api/payment/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: request.plan,
      product_id: product.productId,
      success_url: request.successUrl,
      customer_email: request.customerEmail,
      trip_id: request.tripId,
    }),
  })
  if (!res.ok) {
    if (isLocalDev) {
      // Mock response for local development only
      const mockId = `chk_demo_${Date.now()}_${request.plan}`
      return { id: mockId, url: ``, clientSecret: `cs_demo_${mockId}`, status: 'open' as const }
    }
    // In production, surface the error so the UI can handle it
    let errMsg = `Checkout failed (${res.status})`;
    try {
      const errData = await res.json() as { error?: string; message?: string };
      errMsg = errData.error || errData.message || errMsg;
    } catch { /* ignore parse errors */ }
    throw new Error(errMsg);
  }
  // Worker returns { checkout_url, checkout_id, trip_id } — map to CheckoutSessionResponse shape
  const data = await res.json() as { checkout_url?: string; checkout_id?: string; url?: string; id?: string }
  return {
    id: data.checkout_id ?? data.id ?? '',
    url: data.checkout_url ?? data.url ?? '',
    clientSecret: data.checkout_id ?? '',
    status: 'open' as const,
  }
}

/* ═══════════════════════════════════════════════════════════ */
/*  CHECKOUT SESSION — Client-side confirmation                */
/* ═══════════════════════════════════════════════════════════ */

/**
 * Confirm a checkout session from the client side.
 * Called after user completes the Polar checkout form.
 *
 * Uses the client_secret (no OAT needed — safe for client-side).
 *
 * POST /v1/checkouts/client/{client_secret}/confirm
 * @see https://polar.sh/docs/api-reference/checkouts/confirm-session-from-client
 */
export async function confirmCheckoutSession(
  clientSecret: string,
): Promise<{ status: "confirmed" | "failed"; orderId?: string }> {
  /**
   * PRODUCTION:
   *   const res = await fetch(
   *     `${POLAR_API_BASE}/checkouts/client/${clientSecret}/confirm`,
   *     { method: "POST" }
   *   );
   *   return await res.json();
   */

  return { status: "confirmed", orderId: `ord_mock_${Date.now()}` };
}

/**
 * Get checkout session status by client secret.
 * This endpoint doesn't require authentication.
 *
 * GET /v1/checkouts/client/{client_secret}
 * @see https://polar.sh/docs/api-reference/checkouts/get-session-from-client
 */
export async function getCheckoutStatus(
  clientSecret: string,
): Promise<CheckoutSessionResponse & { orderId?: string }> {
  /**
   * PRODUCTION:
   *   const res = await fetch(
   *     `${POLAR_API_BASE}/checkouts/client/${clientSecret}`
   *   );
   *   return await res.json();
   */

  return {
    id: `chk_mock_${clientSecret}`,
    url: "",
    clientSecret,
    status: "confirmed",
    orderId: `ord_mock_${Date.now()}`,
  };
}

/* ═══════════════════════════════════════════════════════════ */
/*  CUSTOMER SESSION — for Customer Portal API                 */
/* ═══════════════════════════════════════════════════════════ */

/**
 * Create a customer session (server-side only).
 *
 * This generates a Customer Access Token that can be safely
 * used in the browser for the Customer Portal API.
 *
 * MUST be called from your backend, NOT from client code.
 *
 * POST /v1/customer-sessions/
 * Headers: { Authorization: "Bearer polar_oat_xxx" }
 * Body: { customer_id: "..." }
 *
 * @see https://polar.sh/docs/api-reference/customer-portal/sessions/create
 *
 * Returns a customer_access_token (polar_cat_xxx) that can be
 * used client-side with the Customer Portal API.
 */
export async function createCustomerSession(
  customerId: string,
): Promise<{ token: string; expiresAt: string }> {
  /**
   * PRODUCTION (server-side only):
   *   const res = await fetch(`${POLAR_API_BASE}/customer-sessions/`, {
   *     method: "POST",
   *     headers: {
   *       "Authorization": `Bearer ${process.env.POLAR_OAT}`,
   *       "Content-Type": "application/json",
   *     },
   *     body: JSON.stringify({ customer_id: customerId }),
   *   });
   *   return await res.json();
   */

  return {
    token: `polar_cat_mock_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════ */
/*  CUSTOMER PORTAL — Client-side subscription management      */
/* ═══════════════════════════════════════════════════════════ */

/**
 * Cancel a subscription (Annual plan only).
 * Uses Customer Access Token (NOT OAT).
 *
 * DELETE /v1/customer-portal/subscriptions/{id}
 * Headers: { Authorization: "Bearer polar_cat_xxx" }
 *
 * @see https://polar.sh/docs/api-reference/customer-portal/subscriptions/cancel
 */
export async function cancelSubscription(
  customerToken: string,
  subscriptionId: string,
): Promise<{ success: boolean }> {
  /**
   * PRODUCTION:
   *   const res = await fetch(
   *     `${POLAR_API_BASE}/customer-portal/subscriptions/${subscriptionId}`,
   *     {
   *       method: "DELETE",
   *       headers: { Authorization: `Bearer ${customerToken}` },
   *     }
   *   );
   *   return { success: res.ok };
   */

  return { success: true };
}

/**
 * List customer's orders (Standard/Pro purchases).
 * Uses Customer Access Token (NOT OAT).
 *
 * GET /v1/customer-portal/orders/
 * @see https://polar.sh/docs/api-reference/customer-portal/orders/list
 */
export async function listCustomerOrders(
  customerToken: string,
): Promise<{ items: Array<{ id: string; productName: string; amount: number; status: string }> }> {
  /**
   * PRODUCTION:
   *   const res = await fetch(
   *     `${POLAR_API_BASE}/customer-portal/orders/`,
   *     { headers: { Authorization: `Bearer ${customerToken}` } }
   *   );
   *   return await res.json();
   */

  return { items: [] };
}

/* ═══════════════════════════════════════════════════════════ */
/*  WEBHOOK HANDLERS — Server-side only                        */
/* ═══════════════════════════════════════════════════════════ */

/**
 * PRODUCTION: Set up webhook endpoints in your Polar dashboard
 * to receive these events on your backend:
 *
 * 1. order.paid → Grant Standard/Pro access
 *    - Verify order.product_id matches POLAR_PRODUCTS.standard/pro
 *    - Create/update user record with plan access
 *    - Redirect to appropriate dashboard
 *
 * 2. subscription.active → Grant Annual access
 *    - Verify subscription product matches POLAR_PRODUCTS.annual
 *    - Create/update user record with annual membership
 *    - Enable VIP concierge, priority AI, etc.
 *
 * 3. subscription.canceled → Handle Annual cancellation
 *    - Mark membership as expiring at period end
 *    - Show downgrade notice in UI
 *
 * 4. subscription.revoked → Immediately revoke Annual access
 *    - Downgrade user to free tier
 *    - Revoke VIP benefits
 *
 * 5. order.refunded → Revoke Standard/Pro access
 *    - Remove plan access
 *    - Redirect to pricing page
 *
 * Webhook endpoint registration:
 *   POST /v1/webhooks/endpoints
 *   Body: { url: "https://yourapp.com/api/webhooks/polar", events: [...] }
 *
 * @see https://polar.sh/docs/api-reference/webhooks/endpoints/create
 */

/* ═══════════════════════════════════════════════════════════ */
/*  HELPER — Plan resolution from URL/checkout                 */
/* ═══════════════════════════════════════════════════════════ */

/**
 * Resolve the dashboard route from a completed checkout.
 */
export function getDashboardRoute(plan: PlanKey): string {
  switch (plan) {
    case "standard": return "/dashboard/standard";
    case "pro": return "/dashboard/pro";
    case "annual": return "/dashboard/annual";
  }
}

/**
 * Format price for display (cents → dollars).
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}
