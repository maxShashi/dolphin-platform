import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ current = 1, total = 0, pageSize = 10, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, current - 1)
      let end = Math.min(totalPages - 1, current + 1)

      if (current <= 2) {
        start = 2
        end = Math.min(4, totalPages - 1)
      }
      if (current >= totalPages - 1) {
        start = Math.max(2, totalPages - 3)
        end = totalPages - 1
      }

      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const handleChange = (page) => {
    if (page < 1 || page > totalPages || page === current) return
    onChange && onChange(page)
  }

  if (total <= 0) return null

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <span className="text-text-muted text-sm">
        共{total}条，每页{pageSize}条
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleChange(current - 1)}
          disabled={current <= 1}
          className="glass-2 p-2 rounded-lg transition-all duration-200 hover:shadow-glow-weak disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 text-text-tertiary" />
        </button>

        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-text-muted text-sm">...</span>
            ) : (
              <button
                onClick={() => handleChange(page)}
                className={`min-w-[36px] h-[36px] rounded-lg text-sm font-medium transition-all duration-200 ${
                  page === current
                    ? 'btn-gradient text-white shadow-glow-weak'
                    : 'glass-2 text-text-tertiary hover:text-white hover:shadow-glow-weak'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => handleChange(current + 1)}
          disabled={current >= totalPages}
          className="glass-2 p-2 rounded-lg transition-all duration-200 hover:shadow-glow-weak disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4 text-text-tertiary" />
        </button>
      </div>
    </div>
  )
}