'use client'

export default function HowItWorksSection() {
  return (
    <section className="how-bg" id="howSection">
      <div className="container">
        <p className="section-label reveal">How It Works</p>
        <h2 className="section-title reveal">3분이면 충분해요</h2>
        <div className="steps">
          <div className="step reveal">
            <div className="step-num">1</div>
            <h3>여행 일정 입력</h3>
            <p>도시명과 체류 일수를 입력합니다. 멀티시티도 OK.</p>
          </div>
          <div className="step reveal" style={{ transitionDelay: '0.1s' }}>
            <div className="step-num">2</div>
            <h3>사진 업로드 (선택)</h3>
            <p>내 얼굴 사진을 올리면 나처럼 보이는 코디 이미지를 생성합니다.</p>
          </div>
          <div className="step reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="step-num">3</div>
            <h3>미리보기 확인 후 결제</h3>
            <p>1장 무료 미리보기로 퀄리티를 먼저 확인하세요. $5에 전체 언락.</p>
          </div>
          <div className="step reveal" style={{ transitionDelay: '0.3s' }}>
            <div className="step-num">4</div>
            <h3>갤러리 공유</h3>
            <p>생성 완료 후 공유 가능한 갤러리 링크를 드립니다.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
