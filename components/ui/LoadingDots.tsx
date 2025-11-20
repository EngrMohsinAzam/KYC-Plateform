import React from 'react'

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export function LoadingDots({ 
  size = 'md', 
  color = 'currentColor',
  className = '' 
}: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2'
  }

  return (
    <div className={`flex items-center justify-center ${gapClasses[size]} ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full animate-dot-swap`}
        style={{ backgroundColor: color }}
      />
      <div 
        className={`${sizeClasses[size]} rounded-full animate-dot-swap-delay-1`}
        style={{ backgroundColor: color }}
      />
      <div 
        className={`${sizeClasses[size]} rounded-full animate-dot-swap-delay-2`}
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

// Full page loading component
interface LoadingPageProps {
  message?: string
  className?: string
}

export function LoadingPage({ 
  message = 'Loading...', 
  className = '' 
}: LoadingPageProps) {
  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingDots size="lg" color="#2563eb" className="mb-4" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Inline loading component (for buttons, etc.)
interface LoadingInlineProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
  showText?: boolean
}

export function LoadingInline({ 
  message, 
  size = 'md',
  color = 'currentColor',
  className = '',
  showText = true
}: LoadingInlineProps) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LoadingDots size={size} color={color} />
      {showText && message && <span>{message}</span>}
    </span>
  )
}

