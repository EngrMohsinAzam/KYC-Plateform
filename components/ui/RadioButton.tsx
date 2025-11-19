import React from 'react'

interface RadioButtonProps {
  id: string
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  label: string
}

export function RadioButton({ id, name, value, checked, onChange, label }: RadioButtonProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-light rounded-button transition-colors"
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
      />
      <span className="text-text-primary font-medium">{label}</span>
    </label>
  )
}

