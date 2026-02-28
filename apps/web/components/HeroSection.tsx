'use client'

import { useLanguage } from '@/components/LanguageContext'

// Staggered card data — editorial floating grid on desktop, horizontal strip on mobile
const heroCards = [
  {
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80',
    alt: 'Travel outfit and luggage',
    city: 'Paris',
    weather: '18°C',
    icon: '🌤️',
    size: 'main', // large card
  },
  {
    url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80',
    alt: 'Travel fashion style',
    city: 'London',
    weather: '12°C',
    icon: '🌧️',
    size: 'secondary',
  },
  {
    url: 'https://images.unsplash.com/photo-1487744480471-9ca1bca6fb7d?w=400&q=80',
    alt: 'City travel',
    city: 'Barcelona',
    weather: '26°C',
    icon: '☀️',
    size: 'secondary',
  },
]

interface HeroSectionProps {
  onScrollToForm: () => void
  onScrollToSample: () => void
}

export default function HeroSection({ onScrollToForm, onScrollToSample }: HeroSectionProps) {
  const { t } = useLanguage()

  return (
    <section className="hero">
      {/* ─── LEFT COLUMN ─── */}
      <div className="hero-left">
        <div className="hero-tag">{t.hero.tag}</div>

        <h1>
          {t.hero.headline1}<br />
          <em>{t.hero.headline2}</em><br />
          {t.hero.headline3}
        </h1>

        <p className="hero-sub">
          <strong className="hero-highlight">{t.hero.highlight}</strong>{' '}
          {t.hero.sub}
        </p>

        <div className="hero-social-proof">
          <span className="social-proof-dot" aria-hidden="true" />
          {t.hero.socialProof}
        </div>

        <div className="hero-cta">
          <button
            className="btn-primary btn-primary--hero"
            onClick={onScrollToForm}
            aria-label={t.hero.ctaPrimary}
          >
            {t.hero.ctaPrimary}
          </button>
          <button
            className="btn-ghost"
            onClick={onScrollToSample}
            aria-label={t.hero.ctaSecondary}
          >
            {t.hero.ctaSecondary}
          </button>
        </div>

        <div className="hero-trust" role="list" aria-label="서비스 주요 수치">
          <div className="trust-item" role="listitem">
            <div className="trust-num">3–4장</div>
            <div className="trust-label">{t.hero.trust.outfitImages}</div>
          </div>
          <div className="trust-divider" aria-hidden="true" />
          <div className="trust-item" role="listitem">
            <div className="trust-num">8–12개</div>
            <div className="trust-label">{t.hero.trust.capsuleWardrobe}</div>
          </div>
          <div className="trust-divider" aria-hidden="true" />
          <div className="trust-item" role="listitem">
            <div className="trust-num">2–4분</div>
            <div className="trust-label">{t.hero.trust.generationTime}</div>
          </div>
          <div className="trust-divider" aria-hidden="true" />
          <div className="trust-item" role="listitem">
            <div className="trust-num">$5</div>
            <div className="trust-label">{t.hero.trust.price}</div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN — Desktop staggered card grid ─── */}
      <div className="hero-right" aria-hidden="true">
        <div className="hero-cards">
          {/* Main large card */}
          <div className="hero-card hero-card--main">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroCards[0].url}
              alt={heroCards[0].alt}
              loading="eager"
              decoding="async"
            />
            <div className="weather-badge">
              <span className="weather-icon" aria-hidden="true">{heroCards[0].icon}</span>
              <span className="weather-city">{heroCards[0].city}</span>
              <span className="weather-temp">{heroCards[0].weather}</span>
            </div>
          </div>

          {/* Secondary cards column */}
          <div className="hero-cards-secondary">
            {heroCards.slice(1).map((card, i) => (
              <div key={i} className="hero-card hero-card--secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.url}
                  alt={card.alt}
                  loading="eager"
                  decoding="async"
                />
                <div className="weather-badge">
                  <span className="weather-icon" aria-hidden="true">{card.icon}</span>
                  <span className="weather-city">{card.city}</span>
                  <span className="weather-temp">{card.weather}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MOBILE HORIZONTAL STRIP — shown only on mobile ─── */}
      <div className="hero-strip" aria-hidden="true">
        <div className="hero-strip-inner">
          {heroCards.map((card, i) => (
            <div key={i} className="hero-strip-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.url} alt={card.alt} loading="eager" decoding="async" />
              <div className="weather-badge weather-badge--strip">
                <span aria-hidden="true">{card.icon}</span>
                <span>{card.city}</span>
                <span>{card.weather}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* ─── Hero layout ─── */
        .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr auto;
          position: relative;
          padding-top: 70px;
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
          background: var(--sand);
        }

        /* ─── LEFT ─── */
        .hero-left {
          grid-column: 1;
          grid-row: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 5rem 3rem 5rem 6rem;
          position: relative;
          z-index: 2;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--terracotta);
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .hero-tag::before {
          content: '';
          width: 22px;
          height: 1px;
          background: var(--terracotta);
          display: block;
        }

        .hero-left h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.8rem, 5vw, 5rem);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: var(--ink);
          margin-bottom: 1.5rem;
        }
        .hero-left h1 em {
          font-style: italic;
          color: var(--terracotta);
        }

        .hero-sub {
          font-size: 1.02rem;
          color: var(--muted);
          line-height: 1.68;
          max-width: 420px;
          margin-bottom: 2rem;
        }
        .hero-highlight {
          color: var(--terracotta);
          font-weight: 600;
        }

        /* Social proof */
        .hero-social-proof {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.6rem;
          font-size: 0.84rem;
          color: var(--muted);
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
        }
        .social-proof-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5B8C5A;
          display: inline-block;
          animation: heroBlink 2.2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes heroBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* CTA group */
        .hero-cta {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          flex-wrap: wrap;
          margin-bottom: 0;
        }
        .btn-primary--hero {
          padding: 1rem 2.2rem;
          font-size: 0.95rem;
          box-shadow: 0 6px 24px rgba(196, 97, 58, 0.38);
        }

        /* Trust row */
        .hero-trust {
          margin-top: 2.8rem;
          display: flex;
          align-items: center;
          gap: 1.6rem;
          flex-wrap: wrap;
        }
        .trust-item { text-align: left; }
        .trust-num {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1;
        }
        .trust-label {
          font-size: 0.76rem;
          color: var(--muted);
          margin-top: 0.18rem;
          white-space: nowrap;
        }
        .trust-divider {
          width: 1px;
          height: 28px;
          background: var(--border);
          flex-shrink: 0;
        }

        /* ─── RIGHT — desktop card grid ─── */
        .hero-right {
          grid-column: 2;
          grid-row: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5rem 4rem 5rem 2rem;
          position: relative;
        }

        .hero-cards {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          width: 100%;
          max-width: 460px;
        }

        /* Main large card */
        .hero-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(26, 20, 16, 0.18);
          flex-shrink: 0;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .hero-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(26, 20, 16, 0.24);
        }
        .hero-card img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-card--main {
          width: 230px;
          height: 320px;
          margin-top: 2rem; /* stagger down slightly */
        }
        .hero-card--main img {
          width: 230px;
          height: 320px;
        }

        /* Secondary cards column */
        .hero-cards-secondary {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
          margin-top: 0;
        }
        .hero-card--secondary {
          width: 100%;
          height: 150px;
        }
        .hero-card--secondary:first-child {
          margin-top: 0;
        }
        .hero-card--secondary:last-child {
          margin-top: 0;
        }
        .hero-card--secondary img {
          width: 100%;
          height: 150px;
        }

        /* Weather badge */
        .weather-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          border-radius: 8px;
          padding: 4px 9px;
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--ink);
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          white-space: nowrap;
        }
        .weather-icon { font-size: 0.85rem; }
        .weather-city { font-weight: 600; }
        .weather-temp { color: var(--muted); }

        /* Mobile horizontal strip — hidden on desktop */
        .hero-strip { display: none; }

        /* ─── RESPONSIVE: strip — hidden on desktop ─── */

        /* Tablet (≤ 1024px) */
        @media (max-width: 1024px) {
          .hero {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
          }
          .hero-left {
            grid-column: 1;
            grid-row: 1;
            padding: 4.5rem 2.5rem 2rem;
          }
          .hero-right { display: none; }
          .hero-strip {
            display: block;
            grid-column: 1;
            grid-row: 2;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding: 0 1.5rem 2rem;
          }
          .hero-strip::-webkit-scrollbar { display: none; }
          .hero-strip-inner {
            display: flex;
            gap: 0.75rem;
            width: max-content;
          }
          .hero-strip-card {
            position: relative;
            width: 160px;
            height: 110px;
            border-radius: 12px;
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: 0 4px 16px rgba(26, 20, 16, 0.14);
          }
          .hero-strip-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .weather-badge--strip {
            bottom: 7px;
            left: 7px;
            font-size: 0.65rem;
            padding: 3px 7px;
          }
        }

        /* Mobile (≤ 640px) */
        @media (max-width: 640px) {
          .hero-left {
            padding: 4.5rem 1.4rem 1.8rem;
            min-height: auto;
          }
          .hero-left h1 {
            font-size: clamp(2.2rem, 10vw, 2.8rem);
          }
          .hero-sub { font-size: 0.93rem; max-width: 100%; }
          .hero-trust { gap: 1rem; margin-top: 2.2rem; }
          .trust-num { font-size: 1.4rem; font-weight: 700; }
          .trust-label { font-size: 0.71rem; }
          .trust-divider { display: none; }
          .trust-item { min-width: 50px; text-align: center; }

          .hero-strip { padding: 0 1.2rem 1.8rem; }
          .hero-strip-card { width: 140px; height: 100px; }
          .btn-primary--hero { width: 100%; justify-content: center; }
          .hero-cta { flex-direction: column; align-items: flex-start; gap: 0.8rem; width: 100%; }
        }

        /* Small mobile (≤ 480px) */
        @media (max-width: 480px) {
          .hero-left { padding: 4.2rem 1.1rem 1.5rem; }
          .hero-left h1 { font-size: 2rem; }
          .hero-trust { gap: 0.7rem; }
          .trust-num { font-size: 1.3rem; }
          .hero-strip-card { width: 120px; height: 90px; border-radius: 10px; }
        }

        /* Very small (≤ 380px) */
        @media (max-width: 380px) {
          .hero-left h1 { font-size: 1.9rem; }
          .trust-item { min-width: 44px; }
        }
      `}</style>
    </section>
  )
}
