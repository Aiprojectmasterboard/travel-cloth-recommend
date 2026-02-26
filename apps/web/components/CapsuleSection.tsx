'use client'

import { useLanguage } from '@/components/LanguageContext'

const capsuleItems = [
  { emoji: '🧥', nameKo: '리넨 트렌치', citiesKo: '파리 · 로마 · 이동일', versatility: 5 },
  { emoji: '👕', nameKo: '화이트 티 ×2', citiesKo: '전 일정', versatility: 5 },
  { emoji: '👔', nameKo: '스트라이프 셔츠', citiesKo: '파리 · 저녁 식사', versatility: 4 },
  { emoji: '👖', nameKo: '테일러드 팬츠', citiesKo: '파리 · 로마 · 저녁', versatility: 4 },
  { emoji: '👗', nameKo: '미디 슬립 드레스', citiesKo: '로마 · 카페 · 저녁', versatility: 3 },
  { emoji: '👟', nameKo: '화이트 스니커즈', citiesKo: '전 일정 · 관광', versatility: 5 },
  { emoji: '👡', nameKo: '블록힐 뮬', citiesKo: '저녁 · 카페', versatility: 3 },
  { emoji: '👜', nameKo: '크로스바디백', citiesKo: '관광 · 데이타임', versatility: 4 },
  { emoji: '🧣', nameKo: '실크 스카프', citiesKo: '파리 · 저녁 · 악세', versatility: 4 },
  { emoji: '🕶️', nameKo: '선글라스', citiesKo: '전 일정', versatility: 5 },
]

// Universal names for non-Korean locales
const capsuleItemsUniversal = [
  { name: 'Linen Trench Coat', cities: 'Paris · Rome · Travel Days' },
  { name: 'White Tee ×2', cities: 'All Days' },
  { name: 'Stripe Shirt', cities: 'Paris · Dinner' },
  { name: 'Tailored Pants', cities: 'Paris · Rome · Evening' },
  { name: 'Midi Slip Dress', cities: 'Rome · Café · Evening' },
  { name: 'White Sneakers', cities: 'All Days · Sightseeing' },
  { name: 'Block Heel Mules', cities: 'Evening · Café' },
  { name: 'Crossbody Bag', cities: 'Sightseeing · Daytime' },
  { name: 'Silk Scarf', cities: 'Paris · Evening · Accessory' },
  { name: 'Sunglasses', cities: 'All Days' },
]

export default function CapsuleSection() {
  const { t, locale } = useLanguage()

  return (
    <section className="capsule-section">
      <div className="container">
        <p className="section-label reveal">{t.capsule.label}</p>
        <h2 className="section-title reveal">{t.capsule.title}</h2>
        <p className="section-sub reveal">{t.capsule.sub}</p>

        <div className="capsule-grid">
          {capsuleItems.map((item, i) => {
            const name = locale === 'ko' ? item.nameKo : capsuleItemsUniversal[i]?.name ?? item.nameKo
            const cities = locale === 'ko' ? item.citiesKo : capsuleItemsUniversal[i]?.cities ?? item.citiesKo
            return (
              <div
                key={i}
                className="capsule-item reveal"
                style={{ transitionDelay: `${i * 0.05}s` }}
                aria-label={`${name} — ${cities}`}
              >
                <div className="capsule-emoji-wrap">
                  <span className="capsule-emoji">{item.emoji}</span>
                </div>
                <div className="capsule-name">{name}</div>
                <div className="capsule-cities">{cities}</div>
                <div className="capsule-versatility" aria-label={`Versatility ${item.versatility}/5`}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span
                      key={j}
                      className={`v-dot ${j < item.versatility ? 'v-dot-active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <p className="capsule-note reveal">{t.capsule.note}</p>
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
