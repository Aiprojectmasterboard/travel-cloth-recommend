'use client'

// turnstile.ts — Cloudflare Turnstile hook
import { useEffect, useRef, useState, useCallback } from 'react'

export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? '0x4AAAAAACj5TNMi2k0b77UT'

// Augment the window type for Turnstile global
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      getResponse: (widgetId?: string) => string | undefined
    }
    onTurnstileLoad?: () => void
  }
}

interface TurnstileOptions {
  sitekey: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'invisible'
  action?: string
  appearance?: 'always' | 'execute' | 'interaction-only'
}

interface UseTurnstileReturn {
  token: string | null
  widgetId: string | null
  reset: () => void
  containerRef: React.RefObject<HTMLDivElement>
}

let scriptLoaded = false

function loadTurnstileScript(): Promise<void> {
  if (scriptLoaded || typeof window === 'undefined') return Promise.resolve()
  if (document.querySelector('script[src*="turnstile"]')) {
    scriptLoaded = true
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    window.onTurnstileLoad = () => {
      scriptLoaded = true
      resolve()
    }
    const script = document.createElement('script')
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })
}

export function useTurnstile(): UseTurnstileReturn {
  const [token, setToken] = useState<string | null>(null)
  const [widgetId, setWidgetId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
    setToken(null)
  }, [])

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return

    const initWidget = async () => {
      await loadTurnstileScript()

      if (!containerRef.current || !window.turnstile) return

      // Remove existing widget if present
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Widget may already be removed
        }
      }

      const id = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (newToken: string) => {
          setToken(newToken)
        },
        'expired-callback': () => {
          setToken(null)
        },
        'error-callback': () => {
          setToken(null)
        },
        size: 'invisible',
        // NOTE: do NOT set appearance for invisible widgets —
        // 'interaction-only' causes the widget to wait for user interaction
        // which never fires when the widget is hidden, so the token is never generated.
      })

      widgetIdRef.current = id
      setWidgetId(id)
    }

    initWidget()

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Widget may already be removed
        }
      }
    }
  }, [])

  // Retry initialization if widget wasn't set up (container was null initially)
  useEffect(() => {
    if (token || !TURNSTILE_SITE_KEY) return
    if (widgetIdRef.current) return

    const retryInterval = setInterval(() => {
      if (containerRef.current && window.turnstile && !widgetIdRef.current) {
        clearInterval(retryInterval)
        const id = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (newToken: string) => setToken(newToken),
          'expired-callback': () => setToken(null),
          'error-callback': () => setToken(null),
          size: 'invisible',
        })
        widgetIdRef.current = id
        setWidgetId(id)
      }
    }, 200)

    return () => clearInterval(retryInterval)
  }, [token])

  return { token, widgetId, reset, containerRef }
}

/** Legacy helper — reads Turnstile response directly from global */
export function getTurnstileToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.turnstile?.getResponse() ?? null
}
