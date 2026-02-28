import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  as?: React.ElementType
}

export default function Card({
  children,
  className = '',
  onClick,
  as: Tag = 'div',
}: CardProps) {
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
    : ''

  return (
    <Tag
      onClick={onClick}
      className={`bg-white border border-[#F5EFE6] rounded-xl p-6 shadow-sm ${interactiveClasses} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {children}
    </Tag>
  )
}
