'use client'

import { useLanguage } from '@/components/LanguageContext'

// Step icon + weather visual data — tied to each of the 4 steps
const stepMeta = [
  {
    icon: '📍',
    accentColor: '#C4613A', // terracotta
    visual: (
      <div className="step-visual step-visual--1" aria-hidden="true">
        <div className="mini-badge mini-badge--city">🗺️ Paris · 7 nights</div>
        <div className="mini-badge mini-badge--city mini-badge--offset">✈️ Rome · 4 nights</div>
        <div className="mini-badge mini-badge--weather">🌤️ May · 18–24°C</div>
      </div>
    ),
  },
  {
    icon: '🤳',
    accentColor: '#C8A96E', // gold
    visual: (
      <div className="step-visual step-visual--2" aria-hidden="true">
        <div className="photo-ring">
          <div className="photo-placeholder">
            <span>👤</span>
          </div>
        </div>
        <div className="mini-badge mini-badge--face">내 얼굴로 생성</div>
      </div>
    ),
  },
  {
    icon: '👁',
    accentColor: '#C4613A',
    visual: (
      <div className="step-visual step-visual--3" aria-hidden="true">
        <div className="preview-thumb preview-thumb--unlocked">
          <span>🖼️</span>
          <div className="preview-badge preview-badge--free">FREE</div>
        </div>
        <div className="preview-thumb preview-thumb--blurred">
          <span>🔒</span>
          <div className="preview-badge preview-badge--locked">$5 언락</div>
        </div>
        <div className="preview-thumb preview-thumb--blurred">
          <span>🔒</span>
        </div>
      </div>
    ),
  },
  {
    icon: '🎉',
    accentColor: '#5B8C5A', // green — positive completion
    visual: (
      <div className="step-visual step-visual--4" aria-hidden="true">
        <div className="mini-badge mini-badge--done">✓ 갤러리 완성</div>
        <div className="mini-badge mini-badge--done mini-badge--offset2">📤 링크 공유</div>
        <div className="mini-tag">약 2–4분</div>
      </div>
    ),
  },
]

export default function HowItWorksSection() {
  const { t } = useLanguage()

  return (
    <section className="how-bg" id="howSection">
      <div className="container">
        <p className="section-label reveal">{t.how.label}</p>
        <h2 className="section-title reveal">{t.how.title}</h2>
        <p className="section-sub reveal how-sub">
          도시명과 여행 월만 입력하면 — AI가 날씨·분위기를 분석해 완벽한 캡슐 워드로브를 완성합니다
        </p>

        {/* Steps grid — desktop: 4-col with connector line; mobile: 1-col timeline */}
        <div className="how-steps" role="list">
          {t.how.steps.map((step, i) => {
            const meta = stepMeta[i]
            return (
              <div
                key={i}
                className="how-step reveal"
                role="listitem"
                style={{ transitionDelay: `${i * 0.1}s` }}
                aria-label={`Step ${step.num}: ${step.title}`}
              >
                {/* Timeline connector — mobile vertical line (pseudo-element via CSS) */}
                <div className="step-connector" aria-hidden="true" />

                {/* Number badge */}
                <div className="step-num-wrap">
                  <div
                    className="step-num-circle"
                    style={{ background: meta.accentColor } as React.CSSProperties}
                    aria-hidden="true"
                  >
                    {step.num}
                  </div>
                  <div className="step-icon" aria-hidden="true">{meta.icon}</div>
                </div>

                {/* Visual teaser */}
                {meta.visual}

                {/* Text */}
                <div className="step-body">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop connector line rendered via CSS on .how-steps::before */}
      </div>

      <style jsx>{`
        /* ─── Section sub ─── */
        .how-sub {
          margin-top: 0.75rem;
          margin-bottom: 0;
        }

        /* ─── Steps grid ─── */
        .how-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
          position: relative;
        }

        /* Horizontal connector line between steps — desktop */
        .how-steps::before {
          content: '';
          position: absolute;
          top: 26px; /* align with centre of step-num-circle */
          left: calc(12.5% + 22px);
          right: calc(12.5% + 22px);
          height: 1px;
          background: repeating-linear-gradient(
            90deg,
            var(--border) 0px,
            var(--border) 6px,
            transparent 6px,
            transparent 12px
          );
          pointer-events: none;
          z-index: 0;
        }

        /* ─── Individual step card ─── */
        .how-step {
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem 1.2rem 1.4rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0;
          position: relative;
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }
        .how-step:hover {
          box-shadow: 0 8px 32px rgba(26, 20, 16, 0.08);
          transform: translateY(-3px);
        }

        /* Mobile connector dot — hidden on desktop */
        .step-connector { display: none; }

        /* ─── Step number + icon row ─── */
        .step-num-wrap {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.1rem;
          position: relative;
          z-index: 1;
        }
        .step-num-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: 'Playfair Display', serif;
          font-size: 0.9rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .step-icon {
          font-size: 1.1rem;
          line-height: 1;
        }

        /* ─── Visual teasers ─── */
        :global(.step-visual) {
          width: 100%;
          min-height: 72px;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
          margin-bottom: 1.1rem;
        }
        :global(.mini-badge) {
          background: var(--sand);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px 9px;
          font-size: 0.68rem;
          font-weight: 500;
          color: var(--ink);
          white-space: nowrap;
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
        }
        :global(.mini-badge--weather) {
          background: rgba(200, 169, 110, 0.15);
          border-color: rgba(200, 169, 110, 0.4);
          color: #7a5c2a;
        }
        :global(.mini-badge--done) {
          background: rgba(91, 140, 90, 0.12);
          border-color: rgba(91, 140, 90, 0.35);
          color: #3a6e39;
        }
        :global(.mini-badge--offset) { margin-top: 0.3rem; }
        :global(.mini-badge--offset2) { margin-top: 0.25rem; }
        :global(.mini-tag) {
          font-size: 0.65rem;
          color: var(--muted);
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          margin-top: 0.2rem;
        }

        /* Step 2 — photo ring */
        :global(.photo-ring) {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 2px solid var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--sand);
          flex-shrink: 0;
        }
        :global(.photo-placeholder) {
          font-size: 1.6rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        :global(.mini-badge--face) {
          background: rgba(196, 97, 58, 0.1);
          border-color: rgba(196, 97, 58, 0.3);
          color: var(--terracotta);
        }

        /* Step 3 — preview thumbs */
        :global(.step-visual--3) {
          gap: 0.4rem;
        }
        :global(.preview-thumb) {
          width: 44px;
          height: 56px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          position: relative;
          border: 1px solid var(--border);
          background: var(--sand);
          overflow: hidden;
          flex-shrink: 0;
        }
        :global(.preview-thumb--unlocked) {
          border-color: var(--terracotta);
          background: rgba(196, 97, 58, 0.06);
        }
        :global(.preview-thumb--blurred) {
          filter: blur(0);
          opacity: 0.6;
        }
        :global(.preview-badge) {
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 0.52rem;
          font-weight: 700;
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          letter-spacing: 0.04em;
          border-radius: 4px;
          padding: 1px 5px;
        }
        :global(.preview-badge--free) {
          background: var(--terracotta);
          color: white;
        }
        :global(.preview-badge--locked) {
          background: var(--ink);
          color: white;
        }

        /* ─── Step text ─── */
        .step-body { width: 100%; }
        .step-title {
          font-family: var(--font-sans), 'Plus Jakarta Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 0.45rem;
          line-height: 1.3;
        }
        .step-desc {
          font-size: 0.82rem;
          color: var(--muted);
          line-height: 1.6;
        }

        /* ─── RESPONSIVE: Tablet (≤ 1024px) ─── */
        @media (max-width: 1024px) {
          .how-steps {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.2rem;
          }
          .how-steps::before { display: none; }
        }

        /* ─── RESPONSIVE: Mobile (≤ 640px) ─── */
        @media (max-width: 640px) {
          .how-steps {
            grid-template-columns: 1fr;
            gap: 0;
            position: relative;
            padding-left: 2.5rem;
          }
          /* Vertical timeline line */
          .how-steps::before {
            display: block;
            top: 26px;
            left: 16px;
            right: auto;
            width: 1px;
            height: calc(100% - 52px);
            background: var(--border);
          }

          .how-step {
            border-radius: 12px;
            padding: 1.2rem 1rem 1.2rem;
            margin-bottom: 1rem;
            flex-direction: column;
          }
          /* Timeline dot on mobile */
          .step-connector {
            display: block;
            position: absolute;
            left: -2.1rem;
            top: 1.4rem;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--terracotta);
            border: 2px solid var(--warm-white);
            z-index: 2;
          }

          :global(.step-visual) {
            min-height: 56px;
          }
        }

        /* ─── RESPONSIVE: Small mobile (≤ 480px) ─── */
        @media (max-width: 480px) {
          .how-steps { padding-left: 2rem; }
          .step-connector { left: -1.65rem; }
          .how-step { padding: 1rem 0.9rem; margin-bottom: 0.8rem; }
          .step-title { font-size: 0.88rem; }
          .step-desc { font-size: 0.8rem; }
        }
      `}</style>
    </section>
  )
}
