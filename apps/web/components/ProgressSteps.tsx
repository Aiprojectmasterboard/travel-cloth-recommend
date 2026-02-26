'use client'

interface ProgressStepsProps {
  currentStep: 1 | 2 | 3 | 4
}

const STEPS = [
  { num: 1, icon: '📍', label: '도시 입력' },
  { num: 2, icon: '📅', label: '월 선택' },
  { num: 3, icon: '👁', label: '미리보기' },
  { num: 4, icon: '🔓', label: '결제 완료' },
] as const

type StepState = 'completed' | 'current' | 'upcoming'

function getStepState(stepNum: number, currentStep: number): StepState {
  if (stepNum < currentStep) return 'completed'
  if (stepNum === currentStep) return 'current'
  return 'upcoming'
}

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="progress-steps-wrap" aria-label="진행 단계">
      <div className="progress-steps">
        {STEPS.map((step, idx) => {
          const state = getStepState(step.num, currentStep)
          const isLastStep = idx === STEPS.length - 1
          return (
            <div key={step.num} className="step-item">
              {/* Step circle */}
              <div
                className={`step-circle step-circle-${state}`}
                aria-current={state === 'current' ? 'step' : undefined}
                aria-label={`Step ${step.num}: ${step.label}${state === 'completed' ? ' (completed)' : state === 'current' ? ' (current)' : ''}`}
              >
                {state === 'completed' ? (
                  /* Checkmark for completed steps */
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="step-icon" aria-hidden="true">{step.icon}</span>
                )}
              </div>

              {/* Step label — hidden on mobile, visible on desktop */}
              <span className={`step-label step-label-${state}`} aria-hidden="true">
                {step.label}
              </span>

              {/* Connector line between steps */}
              {!isLastStep && (
                <div
                  className={`step-connector step-connector-${state === 'completed' ? 'done' : 'pending'}`}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .progress-steps-wrap {
          width: 100%;
          max-width: 500px;
          margin: 0 auto 2rem;
        }

        .progress-steps {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          position: relative;
        }

        /* ── Each step item ── */
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }

        /* ── Circle ── */
        .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          transition: background 0.25s, box-shadow 0.25s;
        }
        .step-circle-completed {
          background: var(--terracotta);
          color: white;
        }
        .step-circle-current {
          background: var(--gold, #c8a96e);
          color: var(--ink);
          box-shadow: 0 0 0 3px rgba(200,169,110,0.3);
        }
        .step-circle-upcoming {
          background: var(--border, #e8e0d5);
          color: var(--muted, #9c8c7e);
        }

        .step-icon {
          font-size: 0.95rem;
          line-height: 1;
        }

        /* ── Label ── */
        .step-label {
          margin-top: 0.45rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
          letter-spacing: 0.01em;
          line-height: 1.2;
        }
        .step-label-completed {
          color: var(--terracotta);
        }
        .step-label-current {
          color: var(--ink);
          font-weight: 600;
        }
        .step-label-upcoming {
          color: var(--muted, #9c8c7e);
        }

        /* ── Connector line ── */
        .step-connector {
          position: absolute;
          top: 18px; /* vertically center with circle (36px / 2) */
          left: 50%;
          width: 100%;
          height: 2px;
          transform: translateY(-50%);
          z-index: 0;
        }
        .step-connector-done {
          background: var(--terracotta);
        }
        .step-connector-pending {
          background: var(--border, #e8e0d5);
        }

        /* ── Mobile: hide labels, show only icon+number in compact circles ── */
        @media (max-width: 480px) {
          .step-label {
            display: none;
          }
          .step-circle {
            width: 30px;
            height: 30px;
          }
          .step-icon {
            font-size: 0.8rem;
          }
          .step-connector {
            top: 15px;
          }
        }
      `}</style>
    </div>
  )
}
