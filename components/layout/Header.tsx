'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  showBack?: boolean
  showClose?: boolean
  showInfo?: boolean
  title?: string
  onBack?: () => void
  onClose?: () => void
}

export function Header({ showBack = false, showClose = false, showInfo = false, title, onBack, onClose }: HeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      router.push('/')
    }
  }

  return (
    <header className="flex items-center justify-between p-3 md:p-4 bg-white relative border-b border-gray-200 md:border-b-0 z-[100] sticky top-0 md:static shadow-sm md:shadow-none w-full">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 md:p-4 hover:bg-surface-light active:bg-gray-200 rounded-full transition-colors flex-shrink-0 touch-manipulation -ml-1"
            aria-label="Go back"
          >
            <svg className="w-7 h-7 md:w-6 md:h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
      {title && (
        <h1 className="text-base md:text-lg font-semibold text-text-primary absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[60%] md:max-w-none">
          {title}
        </h1>
      )}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {showInfo && (
          <button
            className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-surface-light flex items-center justify-center hover:bg-surface-gray transition-colors"
            aria-label="Information"
          >
            <svg className="w-5 h-5 md:w-5 md:h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
        {showClose && (
          <button
            onClick={handleClose}
            className="p-2 md:p-2 hover:bg-surface-light active:bg-gray-200 rounded-full transition-colors flex-shrink-0 touch-manipulation -mr-1"
            aria-label="Close"
          >
            <svg className="w-7 h-7 md:w-6 md:h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}

