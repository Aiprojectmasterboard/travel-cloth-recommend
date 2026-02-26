'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/components/LanguageContext'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleSelect(l: Locale) {
    setLocale(l)
    setOpen(false)
  }

  const current = LOCALE_LABELS[locale]

  return (
    <div ref={containerRef} className="lang-switcher" style={{ position: 'relative' }}>
      <button
        className="lang-btn"
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.nativeLabel}`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="lang-current">{current.nativeLabel}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          style={{ flexShrink: 0, opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && (
        <ul
          className="lang-dropdown"
          role="listbox"
          aria-label="Select language"
        >
          {LOCALES.map(l => {
            const info = LOCALE_LABELS[l]
            return (
              <li
                key={l}
                role="option"
                aria-selected={l === locale}
                className={`lang-option${l === locale ? ' lang-option-active' : ''}`}
                onMouseDown={() => handleSelect(l)}
              >
                <span className="lang-flag">{info.flag}</span>
                <span className="lang-native">{info.nativeLabel}</span>
              </li>
            )
          })}
        </ul>
      )}

      <style jsx>{`
        .lang-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: none;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 0.35rem 0.75rem;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          color: var(--ink);
          transition: border-color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .lang-btn:hover {
          border-color: var(--terracotta);
          background: rgba(196,97,58,0.04);
        }
        .lang-btn:focus-visible {
          outline: 2px solid var(--terracotta);
          outline-offset: 2px;
        }
        .lang-current {
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .lang-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          z-index: 300;
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(26,20,16,0.12);
          list-style: none;
          margin: 0;
          padding: 0.3rem;
          min-width: 140px;
          animation: dropIn 0.15s ease-out;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lang-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: var(--ink);
          transition: background 0.15s;
          user-select: none;
        }
        .lang-option:hover { background: rgba(196,97,58,0.07); }
        .lang-option-active {
          background: rgba(196,97,58,0.1);
          color: var(--terracotta);
          font-weight: 500;
        }
        .lang-flag { font-size: 1rem; line-height: 1; }
        .lang-native { flex: 1; }
      `}</style>
    </div>
  )
}
