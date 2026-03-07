const SITE_KEY = '0x4AAAAAACj5TNMi2k0b77UT';

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
 * Execute an invisible Turnstile challenge and return the token.
 * Creates a temporary container, runs the challenge, then cleans up.
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
      size: 'invisible',
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
