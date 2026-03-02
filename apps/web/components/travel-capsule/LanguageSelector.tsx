'use client'
import { useState } from 'react'
import { useLanguage } from '@/components/LanguageContext'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n'

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const current = LOCALE_LABELS[locale]
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 text-xs font-medium text-[#57534e] hover:text-[#C4613A] transition-colors"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.nativeLabel}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>expand_more</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-[#E8DDD4] shadow-xl min-w-[140px]">
            {LOCALES.map(loc => {
              const info = LOCALE_LABELS[loc]
              return (
                <button
                  key={loc}
                  onClick={() => { setLocale(loc); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[#F5EFE6] ${loc === locale ? 'text-[#C4613A] font-semibold' : 'text-[#1A1410]'}`}
                >
                  <span>{info.flag}</span>
                  <span>{info.nativeLabel}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
