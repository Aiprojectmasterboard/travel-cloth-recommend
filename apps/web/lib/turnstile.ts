// turnstile.ts — Cloudflare Turnstile 클라이언트 헬퍼
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? ''

/** Turnstile 위젯이 발급한 토큰을 Workers /api/preview로 함께 전송 */
export function getTurnstileToken(): string | null {
  if (typeof window === 'undefined') return null
  // window.turnstile.getResponse() — Turnstile 위젯이 렌더된 후 호출
  return (window as unknown as { turnstile?: { getResponse: () => string } })
    .turnstile?.getResponse() ?? null
}
