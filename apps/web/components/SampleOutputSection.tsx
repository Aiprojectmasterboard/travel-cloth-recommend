'use client'

const sampleCards = [
  {
    img: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=500&q=75',
    alt: 'paris cafe look',
    mood: 'Café Morning',
    city: 'Paris',
    flag: '🇫🇷',
    look: '리넨 셔츠 + 테일러드 트라우저\n베이지 트렌치',
    tall: false,
  },
  {
    img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=500&q=75',
    alt: 'rome evening',
    mood: 'Evening Walk',
    city: 'Rome',
    flag: '🇮🇹',
    look: '슬립 드레스 + 스트랩 샌들\n린넨 재킷 레이어',
    tall: true,
  },
  {
    img: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=500&q=75',
    alt: 'paris sightseeing',
    mood: 'Sightseeing',
    city: 'Paris',
    flag: '🇫🇷',
    look: '화이트 티 + 와이드 진\n블록힐 뮬',
    tall: false,
  },
  {
    img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=75',
    alt: 'airport travel look',
    mood: 'Airport Look',
    city: 'In Transit',
    flag: '✈️',
    look: '조거 팬츠 + 오버사이즈 후드\n클린 스니커즈',
    tall: true,
  },
  {
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&q=75',
    alt: 'tokyo street style',
    mood: 'Street Style',
    city: 'Tokyo',
    flag: '🇯🇵',
    look: '미니 스커트 + 오버사이즈 블레이저\n플랫폼 슈즈',
    tall: false,
  },
  {
    img: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=500&q=75',
    alt: 'barcelona beach',
    mood: 'Beach Day',
    city: 'Barcelona',
    flag: '🇪🇸',
    look: '스트라이프 원피스 + 에스파드리유\n라탄 토트백',
    tall: false,
  },
]

export default function SampleOutputSection() {
  return (
    <section className="sample-section" id="sampleSection">
      <div className="container">
        <p className="section-label reveal">Sample Output</p>
        <h2 className="section-title reveal">이런 결과물을 받게 됩니다</h2>
        <p className="section-sub reveal">도시마다 3–4가지 무드로 생성 · 얼굴은 내 사진 유지</p>

        <div className="masonry-grid">
          {sampleCards.map((card, i) => (
            <div
              key={i}
              className={`masonry-card reveal ${card.tall ? 'card-tall' : 'card-normal'}`}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="card-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.img} alt={card.alt} loading="lazy" />
                <div className="card-mood-badge">{card.mood}</div>
                {/* Hover overlay */}
                <div className="card-overlay" aria-hidden="true">
                  <div className="overlay-city">
                    <span>{card.flag}</span>
                    <span>{card.city}</span>
                  </div>
                  <div className="overlay-look">
                    {card.look.split('\n').map((line, j) => (
                      <span key={j}>{line}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card-info">
                <div className="output-city">{card.flag} {card.city}</div>
                <div className="output-look">
                  {card.look.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < card.look.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .masonry-grid {
          column-count: 3;
          column-gap: 1.2rem;
          margin-top: 3rem;
        }
        .masonry-card {
          break-inside: avoid;
          margin-bottom: 1.2rem;
          border-radius: 14px;
          overflow: hidden;
          background: var(--cream);
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: pointer;
        }
        .masonry-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.14);
        }
        .card-img-wrap {
          position: relative;
          overflow: hidden;
        }
        .card-normal .card-img-wrap { aspect-ratio: 3/4; }
        .card-tall .card-img-wrap { aspect-ratio: 2/3; }
        .card-img-wrap img {
          width: 100%; height: 100%; object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        .masonry-card:hover .card-img-wrap img {
          transform: scale(1.04);
        }
        .card-mood-badge {
          position: absolute; top: 10px; left: 10px;
          background: rgba(253,250,246,0.92);
          font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 4px; color: var(--ink);
          font-weight: 600;
          backdrop-filter: blur(6px);
          z-index: 2;
        }
        .card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(26,20,16,0.88) 0%, rgba(26,20,16,0.2) 55%, transparent 100%);
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 1.1rem;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 3;
        }
        .masonry-card:hover .card-overlay { opacity: 1; }
        .overlay-city {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.8rem; font-weight: 600; color: white;
          letter-spacing: 0.04em;
          margin-bottom: 0.4rem;
        }
        .overlay-look {
          display: flex; flex-direction: column; gap: 2px;
          font-size: 0.75rem; color: rgba(255,255,255,0.75);
          line-height: 1.4;
        }
        .card-info {
          padding: 0.85rem;
        }

        @media (max-width: 1024px) {
          .masonry-grid { column-count: 2; }
        }
        @media (max-width: 540px) {
          .masonry-grid { column-count: 2; column-gap: 0.8rem; margin-top: 2rem; }
          .masonry-card { margin-bottom: 0.8rem; }
        }
      `}</style>
    </section>
  )
}
