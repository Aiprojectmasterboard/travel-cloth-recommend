'use client'

const features = [
  '도시별 AI 코디 이미지 3–4장',
  '캡슐 워드로브 8–12 아이템 리스트',
  '데일리 아웃핏 플랜',
  '공유 가능한 갤러리 링크',
  '생성 후 원본 사진 즉시 삭제',
]

interface PricingSectionProps {
  onCheckout: () => void
}

export default function PricingSection({ onCheckout }: PricingSectionProps) {
  return (
    <section className="pricing-section">
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="section-label reveal">Pricing</p>
        <h2 className="section-title reveal" style={{ maxWidth: 'none' }}>
          딱 $5, 숨겨진 비용 없음
        </h2>
        <p className="section-sub reveal" style={{ margin: '0 auto' }}>
          자동 갱신 없음 · 구독 없음 · 여행마다 필요할 때만
        </p>

        <div className="pricing-card reveal" style={{ marginTop: '2.5rem' }}>
          <div className="pricing-badge">One-time · Per Trip</div>
          <div className="pricing-price">
            <sup>$</sup>5
          </div>
          <div className="pricing-per">1회 여행 · 멀티시티 포함</div>
          <div className="pricing-features">
            {features.map((feat, i) => (
              <div key={i} className="pricing-feat">
                {feat}
              </div>
            ))}
          </div>
          <button
            className="checkout-btn"
            onClick={onCheckout}
            style={{ marginTop: 0 }}
          >
            지금 시작하기 — $5
          </button>
          <p className="pricing-guarantee">
            Polar로 안전 결제 · 결과물 불만족 시 24시간 내 환불 가능
          </p>
        </div>
      </div>
    </section>
  )
}
