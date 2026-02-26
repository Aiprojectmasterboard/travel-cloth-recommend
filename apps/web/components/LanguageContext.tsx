'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type Locale, type Translations, detectLocale, saveLocale, getTranslations } from '@/lib/i18n'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('ko')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Detect locale on client mount to avoid SSR mismatch
    const detected = detectLocale()
    setLocaleState(detected)
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    saveLocale(newLocale)
  }, [])

  const t = getTranslations(locale)

  // Provide a stable context value
  const value: LanguageContextValue = { locale, setLocale, t }

  // During SSR and before mount, render with default 'ko' locale
  // After mount, render with detected locale
  // We always render children to avoid layout shift
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
