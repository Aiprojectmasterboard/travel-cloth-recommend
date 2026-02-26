'use client'

const capsuleItems = [
  { emoji: '🧥', name: '리넨 트렌치', cities: '파리 · 로마 · 이동일', versatility: 5 },
  { emoji: '👕', name: '화이트 티 ×2', cities: '전 일정', versatility: 5 },
  { emoji: '👔', name: '스트라이프 셔츠', cities: '파리 · 저녁 식사', versatility: 4 },
  { emoji: '👖', name: '테일러드 팬츠', cities: '파리 · 로마 · 저녁', versatility: 4 },
  { emoji: '👗', name: '미디 슬립 드레스', cities: '로마 · 카페 · 저녁', versatility: 3 },
  { emoji: '👟', name: '화이트 스니커즈', cities: '전 일정 · 관광', versatility: 5 },
  { emoji: '👡', name: '블록힐 뮬', cities: '저녁 · 카페', versatility: 3 },
  { emoji: '👜', name: '크로스바디백', cities: '관광 · 데이타임', versatility: 4 },
  { emoji: '🧣', name: '실크 스카프', cities: '파리 · 저녁 · 악세', versatility: 4 },
  { emoji: '🕶️', name: '선글라스', cities: '전 일정', versatility: 5 },
]

export default function CapsuleSection() {
  return (
    <section className="capsule-section">
      <div className="container">
        <p className="section-label reveal">Capsule Wardrobe</p>
        <h2 className="section-title reveal">10개로 완성하는 여행 전체</h2>
        <p className="section-sub reveal">
          파리 4일 + 로마 3일 기준 · 5월 · 캐리온 사이즈로 충분
        </p>

        <div className="capsule-grid">
          {capsuleItems.map((item, i) => (
            <div
              key={i}
              className="capsule-item reveal"
              style={{ transitionDelay: `${i * 0.05}s` }}
              aria-label={`${item.name} — ${item.cities}`}
            >
              <div className="capsule-emoji-wrap">
                <span className="capsule-emoji">{item.emoji}</span>
              </div>
              <div className="capsule-name">{item.name}</div>
              <div className="capsule-cities">{item.cities}</div>
              <div className="capsule-versatility" aria-label={`활용도 ${item.versatility}/5`}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <span
                    key={j}
                    className={`v-dot ${j < item.versatility ? 'v-dot-active' : ''}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="capsule-note reveal">
          ✦ AI가 도시·계절·활동을 분석해 최적 조합을 제안합니다 · 상세 아이템 설명 포함
        </p>
      </div>

      <style jsx>{`
        .capsule-emoji-wrap {
          width: 52px; height: 52px;
          background: var(--warm-white);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.7rem;
          border: 1px solid var(--border);
          transition: border-color 0.2s, transform 0.2s;
        }
        .capsule-item:hover .capsule-emoji-wrap {
          border-color: var(--terracotta);
          transform: translateY(-2px);
        }
        .capsule-versatility {
          display: flex; justify-content: center; gap: 3px;
          margin-top: 0.5rem;
        }
        .v-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--border);
          transition: background 0.2s;
        }
        .v-dot-active { background: var(--terracotta); }
        .capsule-item:hover .v-dot-active { background: var(--gold); }

        .capsule-note {
          text-align: center;
          font-size: 0.82rem;
          color: var(--muted);
          margin-top: 2.5rem;
          letter-spacing: 0.02em;
        }
      `}</style>
    </section>
  )
}
