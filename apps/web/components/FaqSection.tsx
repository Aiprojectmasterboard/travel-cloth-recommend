'use client'

const faqs = [
  {
    q: '사진을 꼭 올려야 하나요?',
    a: '아니요. 사진 없이도 AI 모델 기반으로 생성합니다. 단, 내 얼굴이 담긴 코디 이미지를 원하신다면 업로드를 추천해요.',
  },
  {
    q: '사진은 어떻게 처리되나요?',
    a: '이미지 생성에만 사용되며 생성 완료 후 서버에서 즉시 삭제됩니다. 외부 공유, 학습 활용 없습니다.',
  },
  {
    q: '얼마나 걸리나요?',
    a: '결제 후 보통 2–4분 내에 완성됩니다. 도시 수가 많을수록 조금 더 걸릴 수 있어요.',
  },
  {
    q: '도시 수에 제한이 있나요?',
    a: 'MVP 기준 최대 5개 도시까지 가능합니다. 이 이상은 곧 지원 예정이에요.',
  },
  {
    q: '환불이 되나요?',
    a: '생성된 이미지가 명백히 잘못된 경우 24시간 내 100% 환불해드립니다.',
  },
  {
    q: '어떤 여행에도 맞나요?',
    a: '전 세계 도시 지원, 계절·기후·도시 바이브를 분석해 제안합니다. 비즈니스 트립, 허니문, 배낭여행 모두 OK.',
  },
]

export default function FaqSection() {
  return (
    <section className="faq-section" id="faqSection">
      <div className="container">
        <p className="section-label reveal">FAQ</p>
        <h2 className="section-title reveal">자주 묻는 질문</h2>
        <div className="faq-grid">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="faq-item reveal"
              style={{ transitionDelay: i % 2 === 1 ? '0.05s' : '0s' }}
            >
              <div className="faq-q">{faq.q}</div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
