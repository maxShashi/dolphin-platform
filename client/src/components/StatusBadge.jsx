import React from 'react'

const statusConfig = {
  normal: {
    bg: 'rgba(0, 255, 136, 0.1)',
    text: '#00FF88',
    border: 'rgba(0, 255, 136, 0.2)',
    glow: 'glow-success',
  },
  success: {
    bg: 'rgba(0, 255, 136, 0.1)',
    text: '#00FF88',
    border: 'rgba(0, 255, 136, 0.2)',
    glow: 'glow-success',
  },
  banned: {
    bg: 'rgba(255, 77, 77, 0.1)',
    text: '#FF4D4D',
    border: 'rgba(255, 77, 77, 0.2)',
    glow: 'glow-error',
  },
  error: {
    bg: 'rgba(255, 77, 77, 0.1)',
    text: '#FF4D4D',
    border: 'rgba(255, 77, 77, 0.2)',
    glow: 'glow-error',
  },
  pending: {
    bg: 'rgba(255, 214, 0, 0.1)',
    text: '#FFD600',
    border: 'rgba(255, 214, 0, 0.2)',
    glow: 'glow-warning',
  },
  warning: {
    bg: 'rgba(255, 214, 0, 0.1)',
    text: '#FFD600',
    border: 'rgba(255, 214, 0, 0.2)',
    glow: 'glow-warning',
  },
  active: {
    bg: 'rgba(123, 44, 255, 0.15)',
    text: '#FFFFFF',
    border: 'rgba(123, 44, 255, 0.3)',
    glow: 'glow-weak',
  },
  selected: {
    bg: 'rgba(123, 44, 255, 0.15)',
    text: '#FFFFFF',
    border: 'rgba(123, 44, 255, 0.3)',
    glow: 'glow-weak',
  },
}

const defaultConfig = {
  bg: 'rgba(100, 116, 139, 0.1)',
  text: '#AAB7C4',
  border: 'rgba(100, 116, 139, 0.2)',
  glow: '',
}

export default function StatusBadge({ status = '', type = 'normal', className = '' }) {
  const key = status.toLowerCase() || type
  const config = statusConfig[key] || defaultConfig

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.glow} ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {status}
    </span>
  )
}