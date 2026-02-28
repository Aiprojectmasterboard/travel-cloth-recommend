'use client'

export interface ProgressChecklistProps {
  /** Number of completed steps (0–4) */
  completedSteps: number
}

const STEPS = [
  { label: 'Weather Analysis', icon: '🌤️' },
  { label: 'Vibe Detection', icon: '✨' },
  { label: 'Capsule Estimate', icon: '👗' },
  { label: 'Style Photos', icon: '📸', locked: true },
]

export default function ProgressChecklist({ completedSteps }: ProgressChecklistProps) {
  return (
    <div
      className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center"
      role="list"
      aria-label="Analysis progress"
    >
      {STEPS.map((step, index) => {
        const isDone = index < completedSteps
        const isLocked = step.locked && index >= completedSteps

        return (
          <div key={step.label} className="flex sm:flex-1 items-center" role="listitem">
            <div
              className={`
                flex items-center gap-2 flex-1
                px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${
                  isDone
                    ? 'text-[#b8552e] bg-[#b8552e]/5'
                    : isLocked
                    ? 'text-[#1A1410]/30'
                    : 'text-[#1A1410]/50'
                }
              `}
              aria-label={`${step.label}: ${isDone ? 'complete' : isLocked ? 'locked' : 'pending'}`}
            >
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0
                  ${isDone ? 'bg-[#b8552e]/10 text-[#b8552e]' : 'bg-[#1A1410]/5'}
                `}
                aria-hidden="true"
              >
                {isDone ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isLocked ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
              <span className="leading-tight">{step.label}</span>
            </div>

            {/* Connector line between steps (not after last) */}
            {index < STEPS.length - 1 && (
              <div
                className="hidden sm:block w-6 h-px mx-1 flex-shrink-0 transition-colors duration-500"
                style={{ background: index < completedSteps ? '#b8552e' : 'rgba(26,20,16,0.12)' }}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
