'use client'

import { useLanguage } from '@/components/LanguageContext'

interface PricingSectionProps {
  onCheckout: () => void
}

export default function PricingSection({ onCheckout }: PricingSectionProps) {
  const { t } = useLanguage()

  return (
    <section className="pricing-section">
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="section-label reveal">{t.pricing.label}</p>
        <h2 className="section-title reveal" style={{ maxWidth: 'none', whiteSpace: 'pre-line' }}>
          {t.pricing.title}
        </h2>
        <p className="section-sub reveal" style={{ margin: '0 auto' }}>
          {t.pricing.sub}
        </p>

        {/* 앵커링 비교 */}
        <div className="pricing-compare reveal">
          <div className="compare-item compare-old">
            <div className="compare-label">스타일리스트</div>
            <div className="compare-price"><del>$200</del><span>/hr</span></div>
          </div>
          <div className="compare-arrow">vs</div>
          <div className="compare-item compare-new">
            <div className="compare-label">Travel Capsule AI</div>
            <div className="compare-price highlight">$5<span>/trip</span></div>
          </div>
        </div>

        <div className="pricing-card reveal">
          {/* 소셜 프루프 배지 */}
          <div className="pricing-social-badge">
            <span className="pulse-dot" />
            이번 달 2,400+ 여행자가 사용 중
          </div>

          <div className="pricing-badge">{t.pricing.badge}</div>
          <div className="pricing-price">
            <sup>$</sup>5
          </div>
          <div className="pricing-per">{t.pricing.period}</div>

          <div className="pricing-features">
            {t.pricing.features.map((feat, i) => (
              <div key={i} className="pricing-feat">{feat}</div>
            ))}
          </div>

          <button className="checkout-btn" onClick={onCheckout}>
            {t.pricing.cta}
          </button>

          <p className="pricing-guarantee">{t.pricing.guarantee}</p>

          {/* 긴급성 soft nudge */}
          <div className="pricing-urgency">
            ⏰ 여행 출발 전에 준비하세요 — 나중에 하면 잊어요
          </div>
        </div>
      </div>

      <style jsx>{`
        .pricing-compare {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          margin: 2rem auto;
          max-width: 420px;
        }
        .compare-item {
          text-align: center;
          padding: 1.2rem 1.8rem;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: white;
          flex: 1;
        }
        .compare-item.compare-new {
          border-color: var(--terracotta);
          background: rgba(196, 97, 58, 0.04);
        }
        .compare-label { font-size: 0.75rem; color: var(--muted); margin-bottom: 0.3rem; }
        .compare-price { font-size: 1.5rem; font-weight: 700; color: var(--ink); }
        .compare-price del { color: var(--muted); }
        .compare-price.highlight { color: var(--terracotta); }
        .compare-price span { font-size: 0.8rem; font-weight: 400; }
        .compare-arrow { font-size: 0.8rem; color: var(--muted); font-weight: 600; }

        .pricing-social-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(91, 140, 90, 0.1);
          border: 1px solid rgba(91, 140, 90, 0.25);
          color: #3d7a3c;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 0.4rem 0.9rem;
          border-radius: 50px;
          margin-bottom: 1.5rem;
        }
        .pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5B8C5A;
          animation: pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        .pricing-urgency {
          margin-top: 1rem;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.45);
          font-style: italic;
        }

        @media (max-width: 480px) {
          .pricing-compare { gap: 0.8rem; margin: 1.5rem auto; }
          .compare-item { padding: 0.8rem 1rem; }
          .compare-price { font-size: 1.2rem; }
        }
      `}</style>
    </section>
  )
}
