'use client'

import { useLanguage } from '@/components/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  const currentYear = 2026

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <a href="/" className="footer-logo" aria-label="Travel Capsule AI Home">
            Travel <span>Capsule</span> AI
          </a>
          <p className="footer-tagline">{t.footer.tagline}</p>

          {/* Social links */}
          <div className="footer-social">
            <a
              href="https://twitter.com/travelcapsuleai"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="Twitter / X"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com/travelcapsuleai"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="Instagram"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="footer-links-group">
          <h4 className="footer-group-title">{t.footer.serviceTitle}</h4>
          <a href="#howSection" className="footer-link" onClick={e => { e.preventDefault(); document.getElementById('howSection')?.scrollIntoView({ behavior: 'smooth' }) }}>
            {t.footer.howItWorks}
          </a>
          <a href="#formSection" className="footer-link" onClick={e => { e.preventDefault(); document.getElementById('formSection')?.scrollIntoView({ behavior: 'smooth' }) }}>
            {t.footer.startNow}
          </a>
          <a href="#sampleSection" className="footer-link" onClick={e => { e.preventDefault(); document.getElementById('sampleSection')?.scrollIntoView({ behavior: 'smooth' }) }}>
            {t.footer.sampleView}
          </a>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-group-title">{t.footer.supportTitle}</h4>
          <a href="#faqSection" className="footer-link" onClick={e => { e.preventDefault(); document.getElementById('faqSection')?.scrollIntoView({ behavior: 'smooth' }) }}>
            {t.footer.faq}
          </a>
          <a href="#faq" className="footer-link" onClick={e => { e.preventDefault(); document.getElementById('faqSection')?.scrollIntoView({ behavior: 'smooth' }) }}>
            {t.footer.refund}
          </a>
          <a href="mailto:hello@travelcapsule.ai" className="footer-link">
            {t.footer.contact}
          </a>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-group-title">{t.footer.legalTitle}</h4>
          <a href="/legal/terms" className="footer-link">{t.footer.terms}</a>
          <a href="/legal/privacy" className="footer-link">{t.footer.privacy}</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">
          {t.footer.copyright.replace('2026', String(currentYear))}
        </p>
        <div className="footer-trust-badges">
          {t.footer.trustBadges.map((badge, i) => (
            <span key={i} className="trust-badge">{badge}</span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .site-footer {
          background: var(--ink);
          color: rgba(255,255,255,0.4);
          padding: 3.5rem 0 0;
          font-size: 0.85rem;
        }
        .footer-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 0 2rem 3rem;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 2.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .footer-brand { display: flex; flex-direction: column; gap: 0.6rem; }
        .footer-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem; font-weight: 700;
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .footer-logo :global(span) { color: var(--terracotta); font-style: italic; }
        .footer-tagline {
          font-size: 0.82rem; color: rgba(255,255,255,0.35);
          line-height: 1.5;
          max-width: 200px;
        }
        .footer-social {
          display: flex; gap: 0.6rem; margin-top: 0.5rem;
        }
        .social-link {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: all 0.2s;
        }
        .social-link:hover {
          background: rgba(200,169,110,0.15);
          border-color: rgba(200,169,110,0.4);
          color: var(--gold);
        }

        .footer-links-group {
          display: flex; flex-direction: column; gap: 0.6rem;
        }
        .footer-group-title {
          font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.25); font-weight: 500;
          margin-bottom: 0.3rem;
        }
        .footer-link {
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.2s;
          cursor: pointer;
          background: none; border: none; padding: 0; text-align: left;
        }
        .footer-link:hover { color: var(--gold); }

        .footer-bottom {
          max-width: 1100px; margin: 0 auto;
          padding: 1.5rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .footer-copy {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.25);
        }
        .footer-trust-badges {
          display: flex; gap: 1rem; flex-wrap: wrap;
        }
        .trust-badge {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.02em;
        }

        @media (max-width: 768px) {
          .footer-inner {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
          .footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          .footer-inner {
            grid-template-columns: 1fr;
            padding: 0 1.4rem 2.5rem;
          }
          .footer-brand { grid-column: auto; }
          .footer-bottom {
            flex-direction: column; align-items: flex-start;
            padding: 1.2rem 1.4rem;
          }
          .footer-trust-badges { gap: 0.7rem; }
        }
      `}</style>
    </footer>
  )
}
