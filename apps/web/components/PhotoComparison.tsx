'use client'

import { useLanguage } from '@/components/LanguageContext'

export default function PhotoComparison() {
  const { locale } = useLanguage()

  const isKo = locale === 'ko'

  const withPhoto = {
    title: isKo ? '📸 사진 업로드 시' : '📸 With Your Photo',
    points: isKo
      ? [
          '내 얼굴이 담긴 코디 이미지',
          '나처럼 보이는 모델로 생성',
          '더 개인화된 스타일링 경험',
          '생성 후 원본 사진 즉시 삭제',
        ]
      : [
          'Outfit images with your face',
          'Generated with a model that looks like you',
          'More personalized styling experience',
          'Original photo deleted immediately after',
        ],
    badge: isKo ? '추천' : 'Recommended',
  }

  const withoutPhoto = {
    title: isKo ? '🤖 사진 없이' : '🤖 Without Photo',
    points: isKo
      ? [
          'AI 표준 모델로 코디 이미지 생성',
          '날씨 · 도시 바이브 분석은 동일',
          '빠른 시작 가능',
          '언제든 나중에 사진 추가 가능',
        ]
      : [
          'Outfit images with AI standard models',
          'Same weather & city vibe analysis',
          'Quick start, no uploads needed',
          'You can always add a photo later',
        ],
    badge: isKo ? '빠른 시작' : 'Quick Start',
  }

  return (
    <section className="photo-comp-section">
      <div className="container">
        <p className="section-label reveal">
          {isKo ? '사진 업로드 옵션' : 'Photo Upload Option'}
        </p>
        <h2 className="section-title reveal">
          {isKo
            ? '사진 없어도 OK — 있으면 더 좋아요'
            : 'No photo needed — but better with one'}
        </h2>
        <p className="section-sub photo-comp-sub reveal">
          {isKo
            ? '두 가지 모두 날씨·분위기 분석은 동일하게 적용됩니다. 사진은 이미지 생성 직후 삭제돼 프라이버시가 완벽하게 보호됩니다.'
            : 'Both options use the same weather & vibe analysis. Your photo is deleted immediately after generation — complete privacy guaranteed.'}
        </p>

        <div className="photo-comp-grid reveal">
          {/* Without photo card — shown second on desktop, first on mobile via order */}
          <div className="photo-comp-card">
            <div className="comp-badge comp-badge-secondary">{withoutPhoto.badge}</div>
            <h3 className="comp-title">{withoutPhoto.title}</h3>
            <ul className="comp-points">
              {withoutPhoto.points.map((p, i) => (
                <li key={i}>
                  <span className="comp-check" aria-hidden="true">✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* With photo card — recommended, terracotta border */}
          <div className="photo-comp-card photo-comp-featured">
            <div className="comp-badge comp-badge-primary">{withPhoto.badge}</div>
            <h3 className="comp-title">{withPhoto.title}</h3>
            <ul className="comp-points">
              {withPhoto.points.map((p, i) => (
                <li key={i}>
                  <span className="comp-check" aria-hidden="true">✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="comp-privacy-note" role="note">
              🔒{' '}
              {isKo
                ? '생성 완료 즉시 서버에서 삭제'
                : 'Deleted from server immediately after generation'}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .photo-comp-section {
          padding: 5rem 0;
          background: var(--warm-white);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .photo-comp-sub {
          margin: 0 auto;
        }
        .photo-comp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
        }
        .photo-comp-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.8rem;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .photo-comp-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(26, 20, 16, 0.08);
        }
        .photo-comp-featured {
          border-color: var(--terracotta);
          box-shadow: 0 4px 24px rgba(196, 97, 58, 0.12);
        }
        .photo-comp-featured:hover {
          box-shadow: 0 8px 36px rgba(196, 97, 58, 0.2);
        }
        .comp-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 50px;
          margin-bottom: 0.9rem;
        }
        .comp-badge-primary {
          background: rgba(196, 97, 58, 0.1);
          color: var(--terracotta);
        }
        .comp-badge-secondary {
          background: rgba(26, 20, 16, 0.06);
          color: var(--muted);
        }
        .comp-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 1.1rem;
        }
        .comp-points {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .comp-points li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .comp-check {
          color: var(--terracotta);
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .comp-privacy-note {
          margin-top: 1.2rem;
          padding: 0.6rem 0.9rem;
          background: rgba(91, 140, 90, 0.08);
          border-radius: 8px;
          font-size: 0.76rem;
          color: #3d7a3c;
          line-height: 1.5;
        }
        @media (max-width: 640px) {
          .photo-comp-grid {
            grid-template-columns: 1fr;
          }
          .photo-comp-card {
            padding: 1.4rem;
          }
          /* Show recommended card first on mobile */
          .photo-comp-featured {
            order: -1;
          }
        }
      `}</style>
    </section>
  )
}
