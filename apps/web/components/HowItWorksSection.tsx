'use client'

import { useLanguage } from '@/components/LanguageContext'

export default function HowItWorksSection() {
  const { t } = useLanguage()

  return (
    <section className="how-bg" id="howSection">
      <div className="container">
        <p className="section-label reveal">{t.how.label}</p>
        <h2 className="section-title reveal">{t.how.title}</h2>
        <div className="steps">
          {t.how.steps.map((step, i) => (
            <div
              key={i}
              className="step reveal"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
