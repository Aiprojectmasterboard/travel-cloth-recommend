'use client'

import { useLanguage } from '@/components/LanguageContext'

interface LocalizedText {
  ko: string
  en: string
}

interface Stat {
  value: string
  label: LocalizedText
}

interface Review {
  text: LocalizedText
  author: string
  trip: string
  stars: number
}

const STATS: Stat[] = [
  {
    value: '2,400+',
    label: { ko: '이번 달 스타일링 완료', en: 'trips styled this month' },
  },
  {
    value: '4.9★',
    label: { ko: '평균 만족도', en: 'average satisfaction' },
  },
  {
    value: '2–4분',
    label: { ko: '평균 생성 시간', en: 'avg generation time' },
  },
  {
    value: '$5',
    label: { ko: '단 한 번 결제', en: 'one-time payment' },
  },
]

const REVIEWS: Review[] = [
  {
    text: {
      ko: '"도쿄 날씨를 몰라서 걱정했는데 AI가 딱 맞게 골라줬어요. 진짜 썼어요 💯"',
      en: '"Didn\'t know Tokyo weather at all — AI nailed it. Actually used every item. 💯"',
    },
    author: 'Kim J.',
    trip: 'Tokyo · March',
    stars: 5,
  },
  {
    text: {
      ko: '"파리+로마 멀티시티였는데 캐리어 하나로 해결됐어요 🙌"',
      en: '"Paris + Rome multi-city trip — one carry-on was enough 🙌"',
    },
    author: 'Sarah M.',
    trip: 'Paris · Rome · May',
    stars: 5,
  },
  {
    text: {
      ko: '"$5에 이게 된다고? 여행 전 필수앱이 됐어요."',
      en: '"For $5? This is now my pre-trip must-do."',
    },
    author: 'Yuki T.',
    trip: 'Barcelona · July',
    stars: 5,
  },
]

function StarRow({ count }: { count: number }) {
  return (
    <div className="star-row" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} aria-hidden="true" className="star">★</span>
      ))}
    </div>
  )
}

export default function SocialProof() {
  const { locale } = useLanguage()

  // Resolve localized text: fall back to 'en' for non-ko/en locales
  function localize(text: LocalizedText): string {
    if (locale === 'ko') return text.ko
    return text.en
  }

  return (
    <section className="social-proof-section" aria-label="Social proof">

      {/* ── Stats band ── */}
      <div className="stats-band">
        <div className="stats-grid">
          {STATS.map((stat, idx) => (
            <div key={idx} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{localize(stat.label)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Review cards ── */}
      <div className="reviews-wrap">
        <div className="reviews-grid">
          {REVIEWS.map((review, idx) => (
            <article key={idx} className="review-card" aria-label={`Review by ${review.author}`}>
              <StarRow count={review.stars} />
              <blockquote className="review-text">
                {localize(review.text)}
              </blockquote>
              <footer className="review-footer">
                <span className="review-author">{review.author}</span>
                <span className="review-trip">{review.trip}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .social-proof-section {
          width: 100%;
        }

        /* ── Stats band ── */
        .stats-band {
          background: var(--sand, #f5f0e8);
          border-top: 1px solid var(--border, #e8e0d5);
          border-bottom: 1px solid var(--border, #e8e0d5);
          padding: 2rem 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          max-width: 860px;
          margin: 0 auto;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          text-align: center;
        }

        .stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--terracotta);
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          font-size: 0.78rem;
          color: var(--muted, #9c8c7e);
          font-weight: 500;
          line-height: 1.3;
          text-align: center;
        }

        /* ── Reviews section ── */
        .reviews-wrap {
          padding: 2.5rem 1.5rem;
          background: white;
        }

        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Individual review card ── */
        .review-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          padding: 1.25rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border: 1px solid var(--border, #e8e0d5);
        }

        .star-row {
          display: flex;
          gap: 0.1rem;
        }

        .star {
          color: var(--gold, #c8a96e);
          font-size: 0.9rem;
          line-height: 1;
        }

        .review-text {
          margin: 0;
          padding: 0;
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9rem;
          color: var(--ink, #1a1410);
          line-height: 1.55;
          font-style: italic;
          flex: 1;
        }

        .review-footer {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          margin-top: auto;
        }

        .review-author {
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--ink, #1a1410);
        }

        .review-trip {
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          font-size: 0.75rem;
          color: var(--muted, #9c8c7e);
        }

        /* ── Mobile: 2×2 stats grid, single-column reviews ── */
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem 1rem;
          }

          .stat-value {
            font-size: 1.35rem;
          }

          .reviews-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Tablet: 2-column reviews ── */
        @media (min-width: 641px) and (max-width: 900px) {
          .reviews-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </section>
  )
}
