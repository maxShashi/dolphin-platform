import React from 'react'

const variantStyles = {
  '1': 'glass-1',
  '2': 'glass-2',
  '3': 'glass-3',
}

export default function GlassCard({ variant = '1', className = '', children, onClick, hoverable = false }) {
  const baseStyle = variantStyles[variant] || variantStyles['1']
  const hoverStyle = hoverable
    ? 'transition-all duration-300 hover:shadow-glow-medium hover:border-brand-500/30 cursor-pointer'
    : ''

  return (
    <div
      className={`${baseStyle} ${hoverStyle} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}