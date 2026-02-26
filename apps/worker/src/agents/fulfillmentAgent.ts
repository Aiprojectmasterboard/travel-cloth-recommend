import type { Env } from '../index';

// ─── Supabase Helper ──────────────────────────────────────────────────────────

async function supabaseRequest(
  env: Env,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${env.SUPABASE_URL}/rest/v1${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: 'return=representation',
    ...(options.headers as Record<string, string>),
  };
  return fetch(url, { ...options, headers });
}

// ─── HTML Escaping ────────────────────────────────────────────────────────────

/** Escapes user-controlled strings before embedding them in HTML email bodies. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── Email Validation ─────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function buildEmailHtml(tripId: string, galleryUrl: string, cityNames: string[]): string {
  // Escape all user-supplied values before embedding in HTML.
  const safeCitiesText = cityNames.map(escapeHtml).join(', ');
  const safeGalleryUrl = escapeHtml(galleryUrl);
  const safeTripId = escapeHtml(tripId);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Travel Capsule is Ready!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafaf8; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 32px; text-align: center;">
      <p style="color: #c9a96e; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px;">Travel Capsule AI</p>
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; line-height: 1.3;">Your capsule wardrobe is ready</h1>
    </div>
    <div style="padding: 40px 32px;">
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Your AI-styled travel wardrobe for <strong>${safeCitiesText}</strong> has been created. Click below to explore your personalized outfit gallery and packing list.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${safeGalleryUrl}" style="display: inline-block; background: #1a1a2e; color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">
          View My Capsule Gallery
        </a>
      </div>
      <p style="color: #718096; font-size: 13px; text-align: center; margin: 24px 0 0;">
        Your gallery link: <a href="${safeGalleryUrl}" style="color: #1a1a2e;">${safeGalleryUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
      <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
        Travel Capsule AI &mdash; Pack smarter, travel better.<br>
        Trip ID: ${safeTripId}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Finalizes a completed trip:
 * 1. Verifies all generation_jobs are complete
 * 2. Sends gallery link email via Resend
 * 3. Deletes original face_url (privacy) and nulls trips.face_url
 */
export async function fulfillTrip(
  tripId: string,
  userEmail: string,
  env: Env
): Promise<void> {
  // 1. Fetch trip details
  const tripRes = await supabaseRequest(env, `/trips?id=eq.${tripId}&limit=1`);
  const trips = (await tripRes.json()) as Array<{
    id: string;
    cities: Array<{ name: string }>;
    face_url?: string;
    status: string;
  }>;

  if (trips.length === 0) {
    throw new Error(`Trip ${tripId} not found during fulfillment`);
  }

  const trip = trips[0];
  const cityNames = (trip.cities ?? []).map((c) => c.name);

  // 2. Verify all generation_jobs for this trip are completed or failed
  const jobsRes = await supabaseRequest(
    env,
    `/generation_jobs?trip_id=eq.${tripId}&status=neq.completed&status=neq.failed`
  );
  const pendingJobs = (await jobsRes.json()) as Array<{ id: string; status: string }>;

  if (pendingJobs.length > 0) {
    console.warn(
      `Trip ${tripId} fulfillment: ${pendingJobs.length} jobs still not completed/failed`
    );
  }

  // 3. Build gallery URL
  const galleryUrl = `https://travelcapsule.ai/result/${tripId}`;

  // 4. Send email via Resend (if email provided and passes validation)
  if (userEmail && isValidEmail(userEmail)) {
    const emailPayload = {
      from: 'Travel Capsule AI <hello@travelcapsule.ai>',
      to: [userEmail],
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
      const errText = await emailRes.text();
      console.error(`Resend email failed for trip ${tripId}: ${errText}`);
      // Non-fatal: log but continue
    } else {
      console.log(`Email sent to ${userEmail} for trip ${tripId}`);
    }
  }

  // 5. Privacy cleanup: delete original face image from R2 and null face_url
  if (trip.face_url) {
    try {
      // Derive the R2 object key from the public URL.
      // face_url is stored as `${R2_PUBLIC_URL}/${key}`, so we strip the origin.
      const faceKey = trip.face_url.startsWith('http')
        ? new URL(trip.face_url).pathname.replace(/^\//, '')
        : trip.face_url;

      console.log(`[Fulfillment] Deleting face image at R2 key: ${faceKey} for trip ${tripId}`);

      // Use the native R2 binding to delete the object — no credentials needed.
      await env.R2_BUCKET.delete(faceKey);

      console.log(`[Fulfillment] Face image deleted from R2 for trip ${tripId}`);
    } catch (err) {
      // Non-fatal: log the error but always null the DB field below.
      console.error(`[Fulfillment] Failed to delete face image from R2 for trip ${tripId}:`, (err as Error).message);
    }

    // Always null out face_url in DB regardless of R2 deletion success.
    await supabaseRequest(env, `/trips?id=eq.${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify({ face_url: null }),
    });

    console.log(`[Fulfillment] face_url nulled in DB for trip ${tripId}`);
  }

  console.log(`Fulfillment complete for trip ${tripId}. Gallery: ${galleryUrl}`);
}
