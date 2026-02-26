'use client'

import { useState } from 'react'

export default function PartnerSection() {
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setSubmitting(true)
    setStatus(null)
    try {
      const res = await fetch('https://formspree.io/f/mzdaogvq', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        setStatus({ msg: '문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.', ok: true })
        form.reset()
      } else {
        setStatus({ msg: '전송에 실패했습니다. 잠시 후 다시 시도해주세요.', ok: false })
      }
    } catch {
      setStatus({ msg: '네트워크 오류가 발생했습니다. 다시 시도해주세요.', ok: false })
    }
    setSubmitting(false)
  }

  return (
    <section className="partner-section">
      <div className="container" style={{ maxWidth: '640px', textAlign: 'center' }}>
        <p className="section-label reveal">Partnership</p>
        <h2 className="section-title reveal">제휴 문의</h2>
        <p
          className="section-sub reveal"
          style={{ margin: '0 auto 2.5rem' }}
        >
          여행사 · 패션 브랜드 · 인플루언서 · B2B API 연동 등
          <br />
          다양한 협업을 환영합니다.
        </p>

        <form
          id="partnerForm"
          action="https://formspree.io/f/mzdaogvq"
          method="POST"
          className="partner-form reveal"
          onSubmit={handleSubmit}
        >
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="partnerName">이름 / 담당자</label>
              <input
                type="text"
                id="partnerName"
                name="name"
                placeholder="홍길동"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="partnerCompany">회사 / 브랜드명</label>
              <input
                type="text"
                id="partnerCompany"
                name="company"
                placeholder="(주)여행컴퍼니"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="partnerEmail">이메일</label>
            <input
              type="email"
              id="partnerEmail"
              name="email"
              placeholder="hello@company.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="partnerType">제휴 유형</label>
            <select id="partnerType" name="partnership_type" required defaultValue="">
              <option value="" disabled>선택해주세요</option>
              <option value="여행사 협업">여행사 협업</option>
              <option value="패션 브랜드 협업">패션 브랜드 협업</option>
              <option value="인플루언서 / 콘텐츠">인플루언서 / 콘텐츠</option>
              <option value="B2B API 연동">B2B API 연동</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="partnerMsg">문의 내용</label>
            <textarea
              id="partnerMsg"
              name="message"
              rows={4}
              placeholder="협업하고 싶은 내용을 자유롭게 작성해주세요."
              required
            />
          </div>
          <button type="submit" className="form-submit-btn" disabled={submitting}>
            {submitting ? '전송 중…' : '문의 보내기 →'}
          </button>
          {status && (
            <p
              className="form-note"
              style={{ color: status.ok ? 'var(--terracotta)' : '#c0392b' }}
            >
              {status.msg}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
