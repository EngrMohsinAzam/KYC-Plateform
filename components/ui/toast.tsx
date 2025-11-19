'use client'

import * as React from 'react'

export type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type ToastActionElement = React.ReactElement

export function Toast({ id, title, description, action, open, onOpenChange }: ToastProps) {
  return null // This is just for type definitions, actual toast rendering is handled elsewhere
}

