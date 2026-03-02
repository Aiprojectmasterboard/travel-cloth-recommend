'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  type Locale,
  detectLocale,
  saveLocale,
  getTranslations,
  getDisplayFont,
  getBodyFont,
} from '@/lib/i18n'

// ─── Context shape ─────────────────────────────────────────────────────────────

interface LanguageContextValue {
  locale: Locale
  /** Alias for locale — used by Figma v15 components */
  lang: Locale
  setLocale: (locale: Locale) => void
  /** v15: function-based lookup — t("hero.cta") */
  t: (key: string) => string
  /** CSS font-family for display/heading text */
  displayFont: string
  /** CSS font-family for body/UI text */
  bodyFont: string
}

// Alias type export for Figma-generated component compatibility
export type { Locale as Lang }

const LanguageContext = createContext<LanguageContextValue | null>(null)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('ko')

  useEffect(() => {
    // Detect locale on client mount to avoid SSR mismatch
    const detected = detectLocale()
    setLocaleState(detected)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    saveLocale(newLocale)
  }, [])

  const t = getTranslations(locale)
  const displayFont = getDisplayFont(locale)
  const bodyFont = getBodyFont(locale)

  const value: LanguageContextValue = {
    locale,
    lang: locale,
    setLocale,
    t,
    displayFont,
    bodyFont,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return ctx
}

/** Alias for Figma v15 components that use useLang() */
export function useLang(): LanguageContextValue {
  return useLanguage()
}
