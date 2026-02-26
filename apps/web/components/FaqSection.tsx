'use client'

import { useLanguage } from '@/components/LanguageContext'

export default function FaqSection() {
  const { t } = useLanguage()

  return (
    <section className="faq-section" id="faqSection">
      <div className="container">
        <p className="section-label reveal">{t.faq.label}</p>
        <h2 className="section-title reveal">{t.faq.title}</h2>
        <div className="faq-grid">
          {t.faq.items.map((faq, i) => (
            <div
              key={i}
              className="faq-item reveal"
              style={{ transitionDelay: i % 2 === 1 ? '0.05s' : '0s' }}
            >
              <div className="faq-q">{faq.q}</div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
