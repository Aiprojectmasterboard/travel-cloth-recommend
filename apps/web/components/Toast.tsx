'use client'

import { useEffect, useRef } from 'react'

interface ToastProps {
  message: string
  visible: boolean
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div className={`toast${visible ? ' show' : ''}`} aria-live="polite">
      {message}
    </div>
  )
}
