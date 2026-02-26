export type { Locale, Translations } from './types'
export { ko } from './translations/ko'
export { en } from './translations/en'
export { ja } from './translations/ja'
export { zh } from './translations/zh'
export { fr } from './translations/fr'
export { es } from './translations/es'

import type { Locale, Translations } from './types'
import { ko } from './translations/ko'
import { en } from './translations/en'
import { ja } from './translations/ja'
import { zh } from './translations/zh'
import { fr } from './translations/fr'
import { es } from './translations/es'

export const LOCALES: Locale[] = ['ko', 'en', 'ja', 'zh', 'fr', 'es']

export const translations: Record<Locale, Translations> = { ko, en, ja, zh, fr, es }

export const LOCALE_LABELS: Record<Locale, { flag: string; label: string; nativeLabel: string }> = {
  ko: { flag: '🇰🇷', label: 'Korean', nativeLabel: '한국어' },
  en: { flag: '🇺🇸', label: 'English', nativeLabel: 'English' },
  ja: { flag: '🇯🇵', label: 'Japanese', nativeLabel: '日本語' },
  zh: { flag: '🇨🇳', label: 'Chinese', nativeLabel: '中文' },
  fr: { flag: '🇫🇷', label: 'French', nativeLabel: 'Français' },
  es: { flag: '🇪🇸', label: 'Spanish', nativeLabel: 'Español' },
}

export function isValidLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale)
}

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'ko'

  // 1. localStorage에 저장된 값 우선
  try {
    const saved = localStorage.getItem('locale')
    if (saved && isValidLocale(saved)) return saved as Locale
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
  }

  // 2. navigator.language로 감지
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('ko')) return 'ko'
  if (lang.startsWith('ja')) return 'ja'
  if (lang.startsWith('zh')) return 'zh'
  if (lang.startsWith('fr')) return 'fr'
  if (lang.startsWith('es')) return 'es'

  return 'en'
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem('locale', locale)
  } catch {
    // localStorage may be unavailable
  }
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] ?? translations.ko
}
