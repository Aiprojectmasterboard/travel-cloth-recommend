'use client'

import { useState, useEffect, useRef } from 'react'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onToast: (msg: string) => void
}

const STEPS = [
  { label: '결제 확인 중', icon: '💳' },
  { label: '기후 · 바이브 분석', icon: '🌤️' },
  { label: '코디 이미지 생성 (AI)', icon: '🎨' },
  { label: '캡슐 워드로브 최적화', icon: '✨' },
  { label: '갤러리 생성 완료', icon: '📸' },
]

const DELAYS = [0, 800, 2200, 3800, 5500]
const PROGRESSES = [10, 30, 70, 90, 100]

type StepState = 'pending' | 'active' | 'done'

export default function CheckoutModal({ isOpen, onClose, onToast }: CheckoutModalProps) {
  const [stepStates, setStepStates] = useState<StepState[]>(STEPS.map(() => 'pending'))
  const [progress, setProgress] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [title, setTitle] = useState('결제 처리 중…')
  const [subtitle, setSubtitle] = useState('잠시 후 AI가 여행 스타일을 생성합니다.')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!isOpen) return

    setStepStates(STEPS.map(() => 'pending'))
    setProgress(0)
    setIsDone(false)
    setTitle('결제 처리 중…')
    setSubtitle('잠시 후 AI가 여행 스타일을 생성합니다.')
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setStepStates(prev => {
          const next = [...prev]
          for (let j = 0; j < i; j++) next[j] = 'done'
          next[i] = 'active'
          return next
        })
        setProgress(PROGRESSES[i])
      }, DELAYS[i])
      timersRef.current.push(t)
    })

    const doneTimer = setTimeout(() => {
      setStepStates(STEPS.map(() => 'done'))
      setProgress(100)
      setIsDone(true)
      setTitle('완성됐습니다!')
      setSubtitle('여행 스타일 갤러리가 준비됐어요. 공유 링크도 함께 전달됩니다.')
    }, 7000)
    timersRef.current.push(doneTimer)

    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [isOpen])

  function handleClose() {
    onClose()
    onToast('갤러리 링크가 이메일로 발송됩니다 (데모)')
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) handleClose()
  }

  const activeStep = stepStates.findIndex(s => s === 'active')
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
        <div className="phase-indicator" aria-label="진행 단계">
          <div className={`phase ${completedCount >= 0 ? 'phase-active' : ''} ${completedCount >= 2 ? 'phase-done' : ''}`}>
            <span className="phase-num">1</span>
            <span className="phase-label">결제</span>
          </div>
          <div className="phase-line" />
          <div className={`phase ${completedCount >= 2 ? 'phase-active' : ''} ${completedCount >= 4 ? 'phase-done' : ''}`}>
            <span className="phase-num">2</span>
            <span className="phase-label">생성 중</span>
          </div>
          <div className="phase-line" />
          <div className={`phase ${isDone ? 'phase-active phase-done' : ''}`}>
            <span className="phase-num">{isDone ? '✓' : '3'}</span>
            <span className="phase-label">완료</span>
          </div>
        </div>

        <h2 className="modal-title" id="modal-heading">
          {isDone && <span className="done-icon">🎉 </span>}{title}
        </h2>
        <p className="modal-sub">{subtitle}</p>

        <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">{progress}% 완료</div>

        <div className="modal-steps-list">
          {STEPS.map((step, i) => {
            const state = stepStates[i]
            return (
              <div
                key={i}
                className={`modal-step-row ${state !== 'pending' ? state : ''}`}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                <div className={`step-dot ${state}`} aria-hidden="true">
                  {state === 'done' ? '✓' : state === 'active' ? '→' : ''}
                </div>
                <span className="step-icon" aria-hidden="true">{step.icon}</span>
                <span className="step-text">{step.label}</span>
                {state === 'active' && (
                  <span className="step-spinner" aria-label="처리 중" />
                )}
              </div>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="modal-trust">
          <span className="modal-trust-badge">🔒 Polar 보안 결제</span>
          <span className="modal-trust-badge">↩ 30일 환불 보장</span>
        </div>

        <button
          className={`modal-close${isDone ? '' : ' hidden'}`}
          onClick={handleClose}
          aria-label="갤러리 보러 가기"
        >
          갤러리 보러 가기 →
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
