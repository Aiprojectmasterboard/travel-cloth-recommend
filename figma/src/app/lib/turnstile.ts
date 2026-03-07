/**
 * Cloudflare Turnstile — 봇 차단 토큰 발급
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ⚠️  CRITICAL: size 파라미터에 대한 영구 경고                    ║
 * ║                                                                ║
 * ║  Turnstile render()의 `size` 파라미터는 반드시 아래 값만 허용:    ║
 * ║    "compact" | "normal" | "flexible"                           ║
 * ║                                                                ║
 * ║  ❌ "invisible"는 유효한 값이 아님!                              ║
 * ║     reCAPTCHA v2에서 사용하던 값으로, Turnstile에서는 지원 안 됨  ║
 * ║     이 값을 쓰면 토큰 발급 실패 → preview API 403 차단 발생      ║
 * ║                                                                ║
 * ║  Turnstile 위젯 타입(managed/non-interactive/invisible)은       ║
 * ║  Cloudflare 대시보드에서 사이트 키 생성 시 결정되며,              ║
 * ║  코드의 size 파라미터와는 무관함.                                ║
 * ║                                                                ║
 * ║  위젯이 보이지 않게 하려면 컨테이너를 display:none 처리하면 됨.   ║
 * ║                                                                ║
 * ║  [2026-03-07] size:'invisible' → size:'compact' 수정 이력       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const SITE_KEY = '0x4AAAAAACj5TNMi2k0b77UT';

// 유효한 Turnstile size 값 — 이 목록 외의 값은 절대 사용 금지
const VALID_SIZES = ['compact', 'normal', 'flexible'] as const;
type TurnstileSize = typeof VALID_SIZES[number];
const WIDGET_SIZE: TurnstileSize = 'compact';

let scriptLoaded = false;

function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (document.querySelector('script[src*="turnstile"]')) {
    scriptLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => { scriptLoaded = true; resolve(); };
    s.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(s);
  });
}

/**
 * Execute a Turnstile challenge and return the token.
 * Creates a hidden container, runs the challenge, then cleans up.
 */
export async function getTurnstileToken(): Promise<string> {
  await loadScript();

  const turnstile = (window as unknown as { turnstile: {
    render: (el: HTMLElement, opts: Record<string, unknown>) => string;
    remove: (id: string) => void;
  } }).turnstile;

  if (!turnstile) throw new Error('Turnstile not available');

  return new Promise<string>((resolve, reject) => {
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    let widgetId: string;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Turnstile challenge timed out'));
    }, 15_000);

    const cleanup = () => {
      clearTimeout(timeout);
      try { turnstile.remove(widgetId); } catch { /* ignore */ }
      container.remove();
    };

    widgetId = turnstile.render(container, {
      sitekey: SITE_KEY,
      size: WIDGET_SIZE, // ⚠️ VALID_SIZES 목록의 값만 사용할 것 — "invisible" 절대 금지
      callback: (token: string) => {
        cleanup();
        resolve(token);
      },
      'error-callback': () => {
        cleanup();
        reject(new Error('Turnstile verification failed'));
      },
    });
  });
}
