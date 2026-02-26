'use client'

import { useLanguage } from '@/components/LanguageContext'

export default function PreviewExplainer() {
  const { locale } = useLanguage()
  const isKo = locale === 'ko'

  const content = {
    label: isKo ? '무료 미리보기' : 'Free Preview',
    title: isKo ? '결제 전에 먼저 확인하세요' : 'See before you pay',
    sub: isKo
      ? '1장은 완전 무료. 퀄리티를 직접 확인한 뒤 마음에 들면 $5로 전체를 받아가세요.'
      : '1 image is completely free. Check the quality yourself — then unlock everything for just $5.',
    freeItems: isKo
      ? [
          '🖼 코디 이미지 1장 (무료)',
          '🌤️ 날씨·분위기 분석 요약 (무료)',
          '👗 캡슐 아이템 힌트 (미리보기)',
        ]
      : [
          '🖼 1 outfit image (free)',
          '🌤️ Weather & vibe analysis summary (free)',
          '👗 Capsule item hints (preview)',
        ],
    paidItems: isKo
      ? [
          '🖼 코디 이미지 전체 (도시당 3–4장)',
          '👗 캡슐 워드로브 8–12개 (상세 설명)',
          '📅 데일리 아웃핏 플랜',
          '🔗 공유 가능한 갤러리 링크',
        ]
      : [
          '🖼 Full outfit images (3–4 per city)',
          '👗 Capsule wardrobe 8–12 items (with details)',
          '📅 Daily outfit plan',
          '🔗 Shareable gallery link',
        ],
    paidLabel: isKo ? '$5 언락 시' : 'Unlock for $5',
    freeLabel: isKo ? '무료 포함' : 'Free included',
    ctaText: isKo ? '지금 미리보기 시작 →' : 'Start Free Preview →',
    ctaNote: isKo
      ? '신용카드 불필요 · 이메일 불필요 · 즉시 시작'
      : 'No credit card · No email · Start instantly',
  }

  function scrollToForm() {
    document.getElementById('formSection')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="preview-explainer">
      <div className="container">
        <p className="section-label reveal">{content.label}</p>
        <h2 className="section-title reveal">{content.title}</h2>
        <p className="section-sub preview-sub reveal">{content.sub}</p>

        <div className="preview-split reveal">
          <div className="preview-col preview-col-free">
            <div className="preview-col-badge free-badge">{content.freeLabel}</div>
            <ul className="preview-col-list">
              {content.freeItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="preview-arrow" aria-hidden="true">→</div>

          <div className="preview-col preview-col-paid">
            <div className="preview-col-badge paid-badge">{content.paidLabel}</div>
            <ul className="preview-col-list">
              {content.paidItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="preview-cta-wrap reveal">
          <button
            className="btn-primary"
            onClick={scrollToForm}
            aria-label={content.ctaText}
            style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}
          >
            {content.ctaText}
          </button>
          <p className="preview-cta-note">{content.ctaNote}</p>
        </div>
      </div>

      <style jsx>{`
        .preview-explainer {
          padding: 5rem 0;
          background: var(--cream);
        }
        .preview-sub {
          margin: 0 auto;
        }
        .preview-split {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1.5rem;
          max-width: 700px;
          margin: 2.5rem auto 0;
        }
        .preview-col {
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .preview-col:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(26, 20, 16, 0.08);
        }
        .preview-col-paid {
          border-color: var(--terracotta);
          box-shadow: 0 4px 20px rgba(196, 97, 58, 0.1);
        }
        .preview-col-paid:hover {
          box-shadow: 0 8px 36px rgba(196, 97, 58, 0.2);
        }
        .preview-col-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 50px;
          margin-bottom: 0.9rem;
        }
        .free-badge {
          background: rgba(26, 20, 16, 0.06);
          color: var(--muted);
        }
        .paid-badge {
          background: rgba(196, 97, 58, 0.1);
          color: var(--terracotta);
        }
        .preview-col-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .preview-arrow {
          font-size: 1.5rem;
          color: var(--terracotta);
          font-weight: 700;
          text-align: center;
          flex-shrink: 0;
        }
        .preview-cta-wrap {
          text-align: center;
          margin-top: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
        }
        .preview-cta-note {
          font-size: 0.8rem;
          color: var(--muted);
        }
        @media (max-width: 640px) {
          .preview-split {
            grid-template-columns: 1fr;
          }
          .preview-arrow {
            transform: rotate(90deg);
            margin: 0 auto;
          }
        }
      `}</style>
    </section>
  )
}
