'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/components/LanguageContext'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onToast: (msg: string) => void
}

const DELAYS = [0, 800, 2200, 3800, 5500]
const PROGRESSES = [10, 30, 70, 90, 100]

type StepState = 'pending' | 'active' | 'done'

export default function CheckoutModal({ isOpen, onClose, onToast }: CheckoutModalProps) {
  const { t } = useLanguage()
  const stepCount = t.checkout.steps.length

  const [stepStates, setStepStates] = useState<StepState[]>(Array(stepCount).fill('pending'))
  const [progress, setProgress] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Sync title/subtitle when locale changes
  useEffect(() => {
    if (!isDone) {
      setTitle(t.checkout.title)
      setSubtitle(t.checkout.subtitle)
    } else {
      setTitle(t.checkout.doneTitle)
      setSubtitle(t.checkout.doneSubtitle)
    }
  }, [t, isDone])

  useEffect(() => {
    if (!isOpen) return

    setStepStates(Array(stepCount).fill('pending'))
    setProgress(0)
    setIsDone(false)
    setTitle(t.checkout.title)
    setSubtitle(t.checkout.subtitle)
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    t.checkout.steps.forEach((_, i) => {
      const t2 = setTimeout(() => {
        setStepStates(prev => {
          const next = [...prev]
          for (let j = 0; j < i; j++) next[j] = 'done'
          next[i] = 'active'
          return next
        })
        setProgress(PROGRESSES[i] ?? 100)
      }, DELAYS[i] ?? i * 1200)
      timersRef.current.push(t2)
    })

    const doneTimer = setTimeout(() => {
      setStepStates(Array(stepCount).fill('done'))
      setProgress(100)
      setIsDone(true)
      setTitle(t.checkout.doneTitle)
      setSubtitle(t.checkout.doneSubtitle)
    }, 7000)
    timersRef.current.push(doneTimer)

    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  function handleClose() {
    onClose()
    onToast(t.toast.galleryLink)
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) handleClose()
  }

  const completedCount = stepStates.filter(s => s === 'done').length

  return (
    <div
      className={`modal-overlay${isOpen ? ' open' : ''}`}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-heading"
    >
      <div className={`modal modal-slide${isOpen ? ' modal-slide-in' : ''}`}>
        {/* Step indicator: 1 → 2 → 3 phases */}
        <div className="phase-indicator" aria-label="Progress phases">
          <div className={`phase ${completedCount >= 0 ? 'phase-active' : ''} ${completedCount >= 2 ? 'phase-done' : ''}`}>
            <span className="phase-num">1</span>
            <span className="phase-label">{t.checkout.phases[0]}</span>
          </div>
          <div className="phase-line" />
          <div className={`phase ${completedCount >= 2 ? 'phase-active' : ''} ${completedCount >= 4 ? 'phase-done' : ''}`}>
            <span className="phase-num">2</span>
            <span className="phase-label">{t.checkout.phases[1]}</span>
          </div>
          <div className="phase-line" />
          <div className={`phase ${isDone ? 'phase-active phase-done' : ''}`}>
            <span className="phase-num">{isDone ? '✓' : '3'}</span>
            <span className="phase-label">{t.checkout.phases[2]}</span>
          </div>
        </div>

        <h2 className="modal-title" id="modal-heading">
          {isDone && <span className="done-icon">🎉 </span>}{title}
        </h2>
        <p className="modal-sub">{subtitle}</p>

        <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">{progress}{t.checkout.progressLabel}</div>

        <div className="modal-steps-list">
          {t.checkout.steps.map((stepLabel, i) => {
            const state = stepStates[i] ?? 'pending'
            const icon = t.checkout.stepIcons[i] ?? ''
            return (
              <div
                key={i}
                className={`modal-step-row ${state !== 'pending' ? state : ''}`}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                <div className={`step-dot ${state}`} aria-hidden="true">
                  {state === 'done' ? '✓' : state === 'active' ? '→' : ''}
                </div>
                <span className="step-icon" aria-hidden="true">{icon}</span>
                <span className="step-text">{stepLabel}</span>
                {state === 'active' && (
                  <span className="step-spinner" aria-label={t.checkout.processing} />
                )}
              </div>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="modal-trust">
          {t.checkout.trustBadges.map((badge, i) => (
            <span key={i} className="modal-trust-badge">{badge}</span>
          ))}
        </div>

        <button
          className={`modal-close${isDone ? '' : ' hidden'}`}
          onClick={handleClose}
          aria-label={t.checkout.galleryBtn}
        >
          {t.checkout.galleryBtn}
        </button>
      </div>

      <style jsx>{`
        .modal-slide {
          transform: translateY(32px);
          opacity: 0;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
        }
        .modal-slide-in {
          transform: translateY(0);
          opacity: 1;
        }

        .phase-indicator {
          display: flex; align-items: center; gap: 0; margin-bottom: 2rem;
        }
        .phase {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          flex: 0 0 auto;
        }
        .phase-num {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 2px solid var(--border);
          background: var(--sand);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 0.85rem; color: var(--muted);
          transition: all 0.3s ease;
        }
        .phase-label {
          font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--muted); font-weight: 500;
        }
        .phase-active .phase-num {
          background: var(--terracotta); border-color: var(--terracotta);
          color: white;
        }
        .phase-done .phase-num {
          background: #5B8C5A; border-color: #5B8C5A; color: white;
        }
        .phase-line {
          flex: 1; height: 1px;
          background: var(--border);
          margin: 0 0.5rem;
          position: relative; top: -8px;
        }

        .progress-label {
          font-size: 0.72rem; color: var(--muted);
          text-align: right; margin-top: 0.3rem; margin-bottom: 1.5rem;
        }

        .step-icon {
          font-size: 0.95rem; line-height: 1;
        }
        .step-text {
          flex: 1;
        }
        .step-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(196,97,58,0.25);
          border-top-color: var(--terracotta);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .done-icon { display: inline; }

        .modal-trust {
          display: flex; gap: 1rem; flex-wrap: wrap;
          margin-bottom: 1.5rem;
          padding: 0.8rem 1rem;
          background: var(--sand);
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .modal-trust-badge {
          font-size: 0.75rem; color: var(--muted);
          display: flex; align-items: center; gap: 0.3rem;
        }
      `}</style>
    </div>
  )
}
