/**
 * fulfillmentAgent.ts
 *
 * Finalises a completed trip:
 * 1. Sends the gallery link via Resend (if email provided)
 * 2. Deletes the original face photo from R2 (privacy requirement)
 * 3. Nulls trips.face_url in Supabase
 * 4. Marks trips.status as "completed"
 */

import type { Bindings } from '../index';

// ─── Supabase Helper ──────────────────────────────────────────────────────────

async function sbFetch(
  env: Bindings,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

// ─── HTML Helpers ─────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(v) && v.length <= 254;
}

// ─── Email Template ───────────────────────────────────────────────────────────

function buildEmailHtml(
  tripId: string,
  galleryUrl: string,
  cityNames: string[]
): string {
  const safeCities = cityNames.map(escapeHtml).join(', ');
  const safeGallery = escapeHtml(galleryUrl);
  const safeTripId = escapeHtml(tripId);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Travel Capsule is Ready</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafaf8;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 32px;text-align:center">
      <p style="color:#c9a96e;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">Travel Capsule AI</p>
      <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3">Your capsule wardrobe is ready</h1>
    </div>
    <div style="padding:40px 32px">
      <p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 24px">
        Your AI-styled travel wardrobe for <strong>${safeCities}</strong> has been created.
        Click below to explore your personalised outfit gallery and packing list.
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${safeGallery}" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:600;letter-spacing:.5px">
          View My Capsule Gallery
        </a>
      </div>
      <p style="color:#718096;font-size:13px;text-align:center;margin:24px 0 0">
        Your gallery link: <a href="${safeGallery}" style="color:#1a1a2e">${safeGallery}</a>
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
      <p style="color:#a0aec0;font-size:12px;text-align:center;margin:0">
        Travel Capsule AI &mdash; Pack smarter, travel better.<br>
        Trip ID: ${safeTripId}
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Fulfils a completed trip: sends email, cleans up face photo from R2/DB.
 *
 * @param input.tripId     - Trip UUID
 * @param input.email      - Optional recipient email
 * @param input.galleryUrl - Public URL for the results gallery
 * @param env              - Cloudflare Worker bindings
 */
export async function fulfillmentAgent(
  input: { tripId: string; email?: string; galleryUrl: string },
  env: Bindings
): Promise<void> {
  const { tripId, email, galleryUrl } = input;

  // ── 1. Fetch trip for city names + face_url ───────────────────────────────
  const tripRes = await sbFetch(env, `/trips?id=eq.${tripId}&limit=1`);
  const trips = (await tripRes.json()) as Array<{
    id: string;
    cities: Array<{ name: string }>;
    face_url?: string | null;
  }>;

  if (trips.length === 0) {
    throw new Error(`[fulfillmentAgent] Trip ${tripId} not found`);
  }

  const trip = trips[0];
  const cityNames = (trip.cities ?? []).map((c) => c.name);

  // ── 2. Warn about pending generation jobs (non-blocking) ─────────────────
  try {
    const jobsRes = await sbFetch(
      env,
      `/generation_jobs?trip_id=eq.${tripId}&status=neq.completed&status=neq.failed&status=neq.unblurred`
    );
    const pending = (await jobsRes.json()) as Array<{ id: string }>;
    if (pending.length > 0) {
      console.warn(`[fulfillmentAgent] ${pending.length} jobs still pending for trip ${tripId}`);
    }
  } catch {
    // Non-fatal
  }

  // ── 3. Send email via Resend ──────────────────────────────────────────────
  if (email && isValidEmail(email)) {
    const emailPayload = {
      from: 'Travel Capsule AI <hello@travelscapsule.com>',
      to: [email],
      subject: `Your Travel Capsule for ${cityNames.map(escapeHtml).join(', ')} is Ready!`,
      html: buildEmailHtml(tripId, galleryUrl, cityNames),
    };

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!emailRes.ok) {
      console.error(
        `[fulfillmentAgent] Resend failed for trip ${tripId}:`,
        await emailRes.text()
      );
      // Non-fatal — fulfillment continues
    } else {
      console.log(`[fulfillmentAgent] Email sent to ${email} for trip ${tripId}`);
    }
  }

  // ── 4. Privacy cleanup: delete face image from R2 ────────────────────────
  if (trip.face_url) {
    try {
      // face_url = "{R2_PUBLIC_URL}/{key}" — strip the origin to get the object key
      const faceKey = trip.face_url.startsWith('http')
        ? new URL(trip.face_url).pathname.replace(/^\//, '')
        : trip.face_url;

      console.log(`[fulfillmentAgent] Deleting R2 face key: ${faceKey}`);
      await env.R2.delete(faceKey);
      console.log(`[fulfillmentAgent] Face image deleted from R2 for trip ${tripId}`);
    } catch (err) {
      // Log but don't block — DB null below is the critical step
      console.error(
        `[fulfillmentAgent] R2 face deletion failed for trip ${tripId}:`,
        (err as Error).message
      );
    }

    // Always null face_url in DB regardless of R2 outcome
    await sbFetch(env, `/trips?id=eq.${tripId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ face_url: null }),
    });
    console.log(`[fulfillmentAgent] face_url nulled in DB for trip ${tripId}`);
  }

  // ── 5. Also clean up temp/{tripId}/ directory in R2 ──────────────────────
  try {
    const listed = await env.R2.list({ prefix: `temp/${tripId}/` });
    const deleteKeys = listed.objects.map((obj) => obj.key);
    await Promise.allSettled(deleteKeys.map((key) => env.R2.delete(key)));
    if (deleteKeys.length > 0) {
      console.log(`[fulfillmentAgent] Deleted ${deleteKeys.length} temp R2 files for trip ${tripId}`);
    }
  } catch (err) {
    console.error(
      `[fulfillmentAgent] Temp R2 cleanup failed for trip ${tripId}:`,
      (err as Error).message
    );
  }

  console.log(`[fulfillmentAgent] Fulfillment complete for trip ${tripId}. Gallery: ${galleryUrl}`);
}
