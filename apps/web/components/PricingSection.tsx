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
        <h2 className="section-title reveal" style={{ maxWidth: 'none' }}>
          {t.pricing.title}
        </h2>
        <p className="section-sub reveal" style={{ margin: '0 auto' }}>
          {t.pricing.sub}
        </p>

        <div className="pricing-card reveal" style={{ marginTop: '2.5rem' }}>
          <div className="pricing-badge">{t.pricing.badge}</div>
          <div className="pricing-price">
            <sup>$</sup>5
          </div>
          <div className="pricing-per">{t.pricing.period}</div>
          <div className="pricing-features">
            {t.pricing.features.map((feat, i) => (
              <div key={i} className="pricing-feat">
                {feat}
              </div>
            ))}
          </div>
          <button
            className="checkout-btn"
            onClick={onCheckout}
            style={{ marginTop: 0 }}
          >
            {t.pricing.cta}
          </button>
          <p className="pricing-guarantee">
            {t.pricing.guarantee}
          </p>
        </div>
      </div>
    </section>
  )
}
