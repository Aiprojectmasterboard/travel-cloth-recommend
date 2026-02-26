'use client'

const heroImages = [
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=200&q=60',
  'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=200&q=60',
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=200&q=60',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=60',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&q=60',
  'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=200&q=60',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=200&q=60',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60',
  'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=200&q=60',
  'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=200&q=60',
  'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=200&q=60',
  'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=200&q=60',
]

const cities = ['Paris', 'Rome', 'Tokyo', 'London', 'Barcelona', 'Prague', 'Amsterdam', 'Bali']

interface HeroSectionProps {
  onScrollToForm: () => void
  onScrollToSample: () => void
}

export default function HeroSection({ onScrollToForm, onScrollToSample }: HeroSectionProps) {
  return (
    <section className="hero">
      <div className="hero-left">
        <div className="hero-tag">AI Travel Styling</div>
        <h1>
          짐은 줄이고<br />
          <em>스타일은</em><br />
          채우세요
        </h1>
        <p className="hero-sub">
          <strong className="hero-highlight">파리 · 도쿄 · 로마 · 바르셀로나</strong> 등<br />
          여행지별 날씨·분위기에 맞는 코디 이미지를 내 사진으로 미리 생성합니다.
          캡슐 워드로브 8~12개면 어디든 완벽하게.
        </p>
        <div className="hero-social-proof">
          <span className="social-proof-dot" />
          🌍 1,200+ 여행 스타일이 공유됐어요
        </div>
        <div className="hero-cta">
          <button className="btn-primary" onClick={onScrollToForm} aria-label="무료 미리보기 시작">
            무료 미리보기 시작 →
          </button>
          <button className="btn-ghost" onClick={onScrollToSample} aria-label="샘플 보기">
            샘플 보기
          </button>
        </div>
        <div className="hero-trust">
          <div className="trust-item">
            <div className="trust-num">3–4장</div>
            <div className="trust-label">도시별 코디 이미지</div>
          </div>
          <div className="trust-item">
            <div className="trust-num">8–12개</div>
            <div className="trust-label">캡슐 워드로브</div>
          </div>
          <div className="trust-item">
            <div className="trust-num">2–4분</div>
            <div className="trust-label">생성 완료 시간</div>
          </div>
          <div className="trust-item">
            <div className="trust-num">5도시</div>
            <div className="trust-label">까지 지원</div>
          </div>
          <div className="trust-item">
            <div className="trust-num">$5</div>
            <div className="trust-label">1회 여행 전체</div>
          </div>
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-mosaic">
          {heroImages.map((url, i) => (
            <div key={i} className="mosaic-cell">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`travel ${cities[i % cities.length]}`} loading="lazy" />
              <div className="city-badge">{cities[i % cities.length]}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .hero-highlight {
          color: var(--terracotta);
          font-weight: 600;
        }
        .hero-social-proof {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.2rem;
          font-size: 0.85rem;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
        }
        .social-proof-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #5B8C5A;
          display: inline-block;
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .hero-trust {
          margin-top: 3rem;
          display: flex; gap: 1.8rem; flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .hero-trust { gap: 1rem; }
        }
      `}</style>
    </section>
  )
}
