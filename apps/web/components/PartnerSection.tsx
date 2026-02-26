'use client'

import { useState } from 'react'
import { useLanguage } from '@/components/LanguageContext'

export default function PartnerSection() {
  const { t } = useLanguage()
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
        setStatus({ msg: t.partner.successMsg, ok: true })
        form.reset()
      } else {
        setStatus({ msg: t.partner.errorMsg, ok: false })
      }
    } catch {
      setStatus({ msg: t.partner.networkError, ok: false })
    }
    setSubmitting(false)
  }

  return (
    <section className="partner-section">
      <div className="container" style={{ maxWidth: '640px', textAlign: 'center' }}>
        <p className="section-label reveal">{t.partner.label}</p>
        <h2 className="section-title reveal">{t.partner.title}</h2>
        <p
          className="section-sub reveal"
          style={{ margin: '0 auto 2.5rem' }}
        >
          {t.partner.sub.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < t.partner.sub.split('\n').length - 1 && <br />}
            </span>
          ))}
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
              <label htmlFor="partnerName">{t.partner.nameLabel}</label>
              <input
                type="text"
                id="partnerName"
                name="name"
                placeholder={t.partner.namePlaceholder}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="partnerCompany">{t.partner.companyLabel}</label>
              <input
                type="text"
                id="partnerCompany"
                name="company"
                placeholder={t.partner.companyPlaceholder}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="partnerEmail">{t.partner.emailLabel}</label>
            <input
              type="email"
              id="partnerEmail"
              name="email"
              placeholder={t.partner.emailPlaceholder}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="partnerType">{t.partner.typeLabel}</label>
            <select id="partnerType" name="partnership_type" required defaultValue="">
              <option value="" disabled>{t.partner.typePlaceholder}</option>
              {t.partner.typeOptions.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="partnerMsg">{t.partner.messageLabel}</label>
            <textarea
              id="partnerMsg"
              name="message"
              rows={4}
              placeholder={t.partner.messagePlaceholder}
              required
            />
          </div>
          <button type="submit" className="form-submit-btn" disabled={submitting}>
            {submitting ? t.partner.submitting : t.partner.submitBtn}
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
