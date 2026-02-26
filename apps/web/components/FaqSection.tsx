'use client'

import { useState } from 'react'
import { useLanguage } from '@/components/LanguageContext'

export default function FaqSection() {
  const { t } = useLanguage()
  const [openIdx, setOpenIdx] = useState<number>(0)

  function toggle(i: number) {
    setOpenIdx(prev => (prev === i ? -1 : i))
  }

  return (
    <section className="faq-section" id="faqSection">
      <div className="container">
        <p className="section-label reveal">{t.faq.label}</p>
        <h2 className="section-title reveal">{t.faq.title}</h2>
        <div className="faq-list reveal">
          {t.faq.items.map((faq, i) => (
            <div key={i} className={`faq-item-acc${openIdx === i ? ' open' : ''}`}>
              <button
                className="faq-q-btn"
                onClick={() => toggle(i)}
                aria-expanded={openIdx === i}
                aria-controls={`faq-answer-${i}`}
                id={`faq-question-${i}`}
              >
                <span className="faq-q-text">{faq.q}</span>
                <span className="faq-icon" aria-hidden="true">
                  {openIdx === i ? '−' : '+'}
                </span>
              </button>
              <div
                className="faq-a-wrap"
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
              >
                <div className="faq-a-inner">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .faq-list {
          max-width: 720px;
          margin: 2.5rem auto 0;
        }
        .faq-item-acc {
          border-bottom: 1px solid var(--border);
        }
        .faq-item-acc:first-child {
          border-top: 1px solid var(--border);
        }
        .faq-q-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 1.1rem 0.5rem;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: var(--ink);
          min-height: 44px;
          transition: color 0.2s;
        }
        .faq-q-btn:hover {
          color: var(--terracotta);
        }
        .faq-q-btn:focus-visible {
          outline: 2px solid var(--terracotta);
          outline-offset: 2px;
          border-radius: 4px;
        }
        .faq-q-text {
          flex: 1;
          line-height: 1.4;
        }
        .faq-icon {
          font-size: 1.3rem;
          color: var(--terracotta);
          font-weight: 400;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
          transition: transform 0.2s;
        }
        .faq-a-wrap {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.32s ease;
        }
        .faq-item-acc.open .faq-a-wrap {
          max-height: 600px;
        }
        .faq-a-inner {
          padding: 0 0.5rem 1.1rem;
          font-size: 0.95rem;
          color: var(--muted);
          line-height: 1.75;
        }
        @media (max-width: 640px) {
          .faq-q-btn {
            font-size: 0.93rem;
          }
          .faq-a-inner {
            font-size: 0.88rem;
          }
        }
      `}</style>
    </section>
  )
}
