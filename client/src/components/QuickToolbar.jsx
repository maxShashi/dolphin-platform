import React from 'react'
import { FileText, Clock } from 'lucide-react'

export default function QuickToolbar() {
  const buttons = [
    { icon: FileText, label: '工单' },
    { icon: Clock, label: '工作时间' },
  ]

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          className="group relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: 'rgba(15, 20, 40, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(123, 44, 255, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00D4FF'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 212, 255, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(123, 44, 255, 0.3)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          title={btn.label}
        >
          <btn.icon
            className="w-4.5 h-4.5 text-text-tertiary group-hover:text-accent-cyan transition-colors duration-300"
            style={{ width: 18, height: 18 }}
          />
        </button>
      ))}
    </div>
  )
}