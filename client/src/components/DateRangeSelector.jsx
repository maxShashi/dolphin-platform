import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

const PRESETS = [
  { label: '近7天', days: 7 },
  { label: '近30天', days: 30 },
  { label: '近90天', days: 90 },
  { label: '自定义', days: 0 },
]

export default function DateRangeSelector({ value, onChange, placeholder }) {
  const [showMenu, setShowMenu] = useState(false)
  const [customStart, setCustomStart] = useState(value?.start || '')
  const [customEnd, setCustomEnd] = useState(value?.end || '')
  const ref = useRef(null)

  // Determine which preset is active
  const getActiveLabel = () => {
    if (!value?.start || !value?.end) return placeholder || '选择日期范围'
    for (const preset of PRESETS) {
      if (preset.days === 0) continue
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - preset.days)
      const expectedStart = start.toISOString().split('T')[0]
      const expectedEnd = now.toISOString().split('T')[0]
      if (value.start === expectedStart && value.end === expectedEnd) {
        return preset.label
      }
    }
    return `${value.start} ~ ${value.end}`
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePresetClick = (preset) => {
    if (preset.days > 0) {
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - preset.days)
      onChange({
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      })
      setShowMenu(false)
    } else {
      setShowMenu(false)
    }
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({ start: customStart, end: customEnd })
      setShowMenu(false)
    }
  }

  const isCustom = getActiveLabel() === '自定义' || (value?.start && value?.end && !PRESETS.some(p => {
    if (p.days === 0) return false
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - p.days)
    return value.start === start.toISOString().split('T')[0] && value.end === now.toISOString().split('T')[0]
  }))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary outline-none transition-all duration-200 whitespace-nowrap"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(123, 44, 255, 0.4)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)' }}
      >
        <span className="min-w-[80px] text-left">{getActiveLabel()}</span>
        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
      </button>

      {showMenu && (
        <div
          className="absolute left-0 top-full mt-1 min-w-[200px] z-50"
          style={{
            background: 'rgba(15, 20, 40, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(123, 44, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="w-full px-4 py-2.5 text-sm text-left transition-colors"
              style={{
                color: getActiveLabel() === preset.label ? '#FFFFFF' : '#AAB7C4',
                background: getActiveLabel() === preset.label ? 'rgba(123, 44, 255, 0.2)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (getActiveLabel() !== preset.label) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { if (getActiveLabel() !== preset.label) e.currentTarget.style.background = 'transparent' }}
            >
              {preset.label}
              {preset.days === 0 && (
                <span className="text-text-muted ml-2 text-xs">自定义范围</span>
              )}
            </button>
          ))}

          {/* Custom date inputs */}
          <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart || value?.start || ''}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-2 py-1.5 rounded text-xs text-text-secondary outline-none"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
              <span className="text-text-muted text-xs">~</span>
              <input
                type="date"
                value={customEnd || value?.end || ''}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-2 py-1.5 rounded text-xs text-text-secondary outline-none"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
              <button
                type="button"
                onClick={handleCustomApply}
                className="px-2 py-1.5 rounded text-xs font-medium text-white"
                style={{
                  background: 'linear-gradient(135deg, #7B2CFF 0%, #00D4FF 100%)',
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}