'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type Locale, type Translations, detectLocale, saveLocale, getTranslations } from '@/lib/i18n'

// ─── Font helper functions (Figma design system) ─────────────────────────────

/**
 * Returns the CSS font-family string for display/heading text based on locale.
 * CJK locales use system serif stacks; others use Playfair Display.
 */
export function getDisplayFont(lang: Locale): string {
  if (lang === 'ja') return "'Noto Serif JP', serif"
  if (lang === 'zh') return "'Noto Serif SC', serif"
  if (lang === 'ko') return "'Noto Serif KR', 'Playfair Display', serif"
  return "var(--font-playfair), 'Playfair Display', serif"
}

/**
 * Returns the CSS font-family string for body/UI text based on locale.
 * CJK locales use system sans stacks; others use DM Sans.
 */
export function getBodyFont(lang: Locale): string {
  if (lang === 'ja') return "'Noto Sans JP', sans-serif"
  if (lang === 'zh') return "'Noto Sans SC', sans-serif"
  if (lang === 'ko') return "'Noto Sans KR', 'DM Sans', sans-serif"
  return "var(--font-dm-sans), 'DM Sans', sans-serif"
}

/**
 * Returns a Tailwind text-size class token for hero headings based on locale.
 * CJK languages tend to be more compact; English needs larger sizing.
 */
export function getHeroSize(lang: Locale): string {
  if (lang === 'ja' || lang === 'zh') return 'text-4xl md:text-5xl'
  if (lang === 'ko') return 'text-4xl md:text-6xl'
  return 'text-5xl md:text-7xl'
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
  /** CSS font-family for display/heading text */
  displayFont: string
  /** CSS font-family for body/UI text */
  bodyFont: string
}

// Alias for Figma-generated component compatibility
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

  const value: LanguageContextValue = { locale, setLocale, t, displayFont, bodyFont }

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

/** Alias for Figma-generated components that use useLang() */
export function useLang(): LanguageContextValue {
  return useLanguage()
}
