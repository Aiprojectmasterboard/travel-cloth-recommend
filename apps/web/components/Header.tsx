'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Header() {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('.mobile-menu') && !target.closest('.hamburger-btn')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpen])

  function scrollTo(id: string) {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <header
        className="site-header"
        style={{ boxShadow: scrolled ? '0 2px 24px rgba(26,20,16,0.08)' : 'none' }}
      >
        <a href="#" className="logo" aria-label="Travel Capsule AI 홈">
          Travel <span>Capsule</span> AI
        </a>

        {/* Desktop nav */}
        <nav className="desktop-nav" aria-label="주요 메뉴">
          <button onClick={() => scrollTo('howSection')} className="nav-link">{t.nav.howItWorks}</button>
          <button onClick={() => scrollTo('formSection')} className="nav-link">{t.nav.pricing}</button>
          <button onClick={() => scrollTo('faqSection')} className="nav-link">{t.nav.faq}</button>
        </nav>

        {/* Desktop right group: language switcher + CTA */}
        <div className="header-right">
          <LanguageSwitcher />
          <button
            className="header-cta"
            onClick={() => scrollTo('formSection')}
            aria-label={`${t.nav.cta} $5`}
          >
            {t.nav.cta} <strong>$5</strong>
          </button>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="hamburger-btn"
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(prev => !prev)}
        >
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
        </button>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="mobile-menu" aria-label="모바일 메뉴">
          <button onClick={() => scrollTo('howSection')} className="mobile-nav-link">{t.nav.howItWorks}</button>
          <button onClick={() => scrollTo('formSection')} className="mobile-nav-link">{t.nav.pricing}</button>
          <button onClick={() => scrollTo('faqSection')} className="mobile-nav-link">{t.nav.faq}</button>
          <div className="mobile-lang-wrap">
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Language
            </span>
            <LanguageSwitcher variant="inline" />
          </div>
          <button
            className="mobile-cta-btn"
            onClick={() => scrollTo('formSection')}
          >
            {t.nav.cta} — $5
          </button>
        </nav>
      )}

      <style jsx>{`
        .site-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.1rem 2.5rem;
          background: rgba(253,250,246,0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
          transition: box-shadow 0.3s ease;
          gap: 1rem;
        }
        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem; font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--ink);
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .logo :global(span) { color: var(--terracotta); font-style: italic; }

        .desktop-nav {
          display: flex; align-items: center; gap: 0.5rem;
          flex: 1; justify-content: center;
        }
        .nav-link {
          background: none; border: none; cursor: pointer;
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem; color: var(--muted);
          padding: 0.4rem 0.75rem; border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }
        .nav-link:hover { color: var(--ink); background: rgba(26,20,16,0.05); }
        .nav-link:focus-visible {
          outline: 2px solid var(--terracotta); outline-offset: 2px;
        }

        .header-right {
          display: flex; align-items: center; gap: 0.6rem;
          flex-shrink: 0;
        }

        .header-cta {
          display: flex; align-items: center; gap: 0.4rem;
          background: var(--terracotta); color: white;
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          font-size: 0.85rem; font-weight: 500;
          padding: 0.55rem 1.2rem; border-radius: 50px;
          border: none; cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .header-cta :global(strong) { font-weight: 700; }
        .header-cta:hover { background: #b3582f; transform: translateY(-1px); }
        .header-cta:focus-visible { outline: 2px solid var(--terracotta); outline-offset: 3px; }

        .hamburger-btn {
          display: none;
          flex-direction: column; gap: 5px; justify-content: center;
          background: none; border: none; cursor: pointer;
          padding: 0.4rem; border-radius: 6px;
          transition: background 0.2s;
        }
        .hamburger-btn:hover { background: rgba(26,20,16,0.06); }
        .hamburger-btn:focus-visible { outline: 2px solid var(--terracotta); outline-offset: 2px; }
        .ham-line {
          display: block; width: 22px; height: 2px;
          background: var(--ink); border-radius: 2px;
          transition: all 0.25s ease;
          transform-origin: center;
        }
        .ham-line:nth-child(1).open { transform: translateY(7px) rotate(45deg); }
        .ham-line:nth-child(2).open { opacity: 0; transform: scaleX(0); }
        .ham-line:nth-child(3).open { transform: translateY(-7px) rotate(-45deg); }

        .mobile-menu {
          position: fixed; top: 61px; left: 0; right: 0; z-index: 190;
          background: rgba(253,250,246,0.98);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          display: flex; flex-direction: column;
          padding: 1rem 1.4rem 1.4rem;
          gap: 0.3rem;
          box-shadow: 0 8px 30px rgba(26,20,16,0.1);
          animation: slideDown 0.2s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mobile-nav-link {
          background: none; border: none; cursor: pointer;
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          font-size: 1rem; color: var(--ink); font-weight: 500;
          padding: 0.75rem 0.5rem;
          text-align: left; border-radius: 8px;
          transition: color 0.2s, background 0.2s;
          border-bottom: 1px solid var(--border);
        }
        .mobile-nav-link:hover { color: var(--terracotta); background: rgba(196,97,58,0.04); }
        .mobile-nav-link:last-of-type { border-bottom: none; }

        .mobile-lang-wrap {
          padding: 0.75rem 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          border-bottom: 1px solid var(--border);
        }

        .mobile-cta-btn {
          margin-top: 0.8rem;
          background: var(--terracotta); color: white;
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          font-size: 1rem; font-weight: 500;
          padding: 0.85rem; border-radius: 12px;
          border: none; cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .mobile-cta-btn:hover { background: #b3582f; }
        .mobile-cta-btn:active { transform: scale(0.98); }

        @media (max-width: 767px) {
          .site-header { padding: 0.9rem 1.2rem; }
          .desktop-nav { display: none; }
          .header-right { display: none; }
          .hamburger-btn { display: flex; }
        }
        @media (min-width: 768px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </>
  )
}
