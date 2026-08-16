import React from 'react'
import { Inbox } from 'lucide-react'

export default function DataTable({ columns = [], data = [], emptyText = '暂无数据', onRowClick }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-1 p-12 flex flex-col items-center justify-center">
        <Inbox className="w-12 h-12 text-text-muted mb-3" />
        <span className="text-text-muted text-sm">{emptyText}</span>
      </div>
    )
  }

  return (
    <div className="glass-1 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              style={{
                background: 'rgba(123, 44, 255, 0.15)',
                borderBottom: '1px solid rgba(123, 44, 255, 0.2)',
              }}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap"
                  style={{ fontWeight: 600 }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className="transition-all duration-200"
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(123, 44, 255, 0.08)'
                  e.currentTarget.style.boxShadow = '0 0 8px rgba(123, 44, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm text-text-secondary"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}