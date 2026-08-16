import React, { useState, useEffect, useCallback } from 'react'
import { dashboard } from '../api/index'
import {
  TrendingUp,
  PieChart,
  Download,
  Search,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import GlassCard from '../components/GlassCard'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'

/* ───────────────────────────────────────────────
   Constants
   ─────────────────────────────────────────────── */
const timeRangeOptions = ['近7天', '近30天', '近90天', '自定义']
const accountAttrOptions = ['全部', '直客', '代理', '自营']

/* ───────────────────────────────────────────────
   Custom Chart Tooltip (glass-3 style)
   ─────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="glass-3 px-4 py-3">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">
        消耗: ${payload[0].value.toFixed(2)}
      </p>
    </div>
  )
}

/* ───────────────────────────────────────────────
   Custom Pie Legend
   ─────────────────────────────────────────────── */
function PieLegend({ payload }) {
  if (!payload) return null
  return (
    <div className="flex items-center justify-center gap-6 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-muted text-xs">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────────────────────────────
   Main Component
   ─────────────────────────────────────────────── */
export default function BIAnalysis() {
  /* ── Filter state ── */
  const [timeRange, setTimeRange] = useState('近7天')
  const [accountAttr, setAccountAttr] = useState('全部')
  const [accountId, setAccountId] = useState('')
  const [accountName, setAccountName] = useState('')

  /* ── Data state ── */
  const [chartData, setChartData] = useState([])
  const [pieData, setPieData] = useState([
    { name: 'ET', value: 0, color: '#00D4FF' },
    { name: 'BM', value: 0, color: '#5A1CCC' },
  ])
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  /* ── Generate default chart dates ── */
  const generateDefaultDates = useCallback(() => {
    const days = timeRange === '近7天' ? 7 : timeRange === '近30天' ? 30 : 90
    const data = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      data.push({ date: `${month}-${day}`, value: 0 })
    }
    return data
  }, [timeRange])

  /* ── Fetch BI analysis data ── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        timeRange,
        accountAttr: accountAttr === '全部' ? undefined : accountAttr,
        accountId: accountId || undefined,
        accountName: accountName || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      }
      const res = await dashboard.getBIAnalysis(params)
      const responseData = res.data

      // Chart data
      if (responseData?.chartData) {
        setChartData(responseData.chartData)
      } else {
        setChartData(generateDefaultDates())
      }

      // Pie data
      if (responseData?.pieData) {
        setPieData(responseData.pieData)
      }

      // Table data
      if (Array.isArray(responseData?.list)) {
        setTableData(responseData.list)
        setPagination((prev) => ({
          ...prev,
          total: responseData.total || responseData.list.length,
        }))
      } else {
        setTableData([])
        setPagination((prev) => ({ ...prev, total: 0 }))
      }
    } catch (err) {
      setChartData(generateDefaultDates())
      setTableData([])
    } finally {
      setLoading(false)
    }
  }, [timeRange, accountAttr, accountId, accountName, pagination.current, pagination.pageSize, generateDefaultDates])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ── Handlers ── */
  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, current: page }))
  }

  const handleExport = () => {
    // TODO: implement export
  }

  /* ── DataTable columns ── */
  const columns = [
    { key: 'accountName', label: '账号名称', render: (val) => val || '-' },
    { key: 'accountId', label: '账号ID', render: (val) => val || '-' },
    {
      key: 'totalSpend',
      label: '累计消耗金额',
      render: (val) => (val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '$0.00'),
    },
    {
      key: 'actions',
      label: '操作',
      render: (_, _row) => (
        <button
          className="text-sm font-medium transition-all duration-200 hover:brightness-125"
          style={{ color: '#7B2CFF' }}
          onClick={(e) => {
            e.stopPropagation()
            // TODO: view details
          }}
        >
          查看详情
        </button>
      ),
    },
  ]

  return (
    <div className="page-enter space-y-6">
      {/* ══════════════════════════════════════════
          Header & Filters
          ══════════════════════════════════════════ */}
      <GlassCard variant="1" className="p-6">
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" style={{ color: '#7B2CFF' }} />
            <h1 className="text-xl font-bold text-white">账号消耗分析</h1>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* 时间范围 */}
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>时间范围</span>
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value)
                setPagination((prev) => ({ ...prev, current: 1 }))
              }}
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 min-w-[100px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {timeRangeOptions.map((opt) => (
                <option key={opt} value={opt} style={{ background: '#0F1428' }}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 账号属性 */}
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>账号属性</span>
            <select
              value={accountAttr}
              onChange={(e) => {
                setAccountAttr(e.target.value)
                setPagination((prev) => ({ ...prev, current: 1 }))
              }}
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 min-w-[100px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {accountAttrOptions.map((opt) => (
                <option key={opt} value={opt === '全部' ? '全部' : opt} style={{ background: '#0F1428' }}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 账号ID */}
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>账号ID</span>
            <input
              type="text"
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value)
                setPagination((prev) => ({ ...prev, current: 1 }))
              }}
              placeholder="请输入账号ID"
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 w-[140px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />
          </div>

          {/* 账号名称 */}
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>账号名称</span>
            <input
              type="text"
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value)
                setPagination((prev) => ({ ...prev, current: 1 }))
              }}
              placeholder="请输入账号名称"
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 w-[140px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />
          </div>

          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
              boxShadow: '0 0 8px rgba(123, 44, 255, 0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 14px rgba(123, 44, 255, 0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 8px rgba(123, 44, 255, 0.3)' }}
          >
            <Search className="w-3.5 h-3.5" />
            查询
          </button>
        </div>

        {/* ══════════════════════════════════════════
            Charts: Left AreaChart + Right PieChart
            ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Left: AreaChart (60%) */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" style={{ color: '#7B2CFF' }} />
              <h3 className="text-sm font-semibold text-white">消耗走势图</h3>
            </div>
            <div className="w-full" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="biChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7B2CFF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#7B2CFF" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7B2CFF"
                    strokeWidth={2}
                    strokeOpacity={0.9}
                    fill="url(#biChartGradient)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: '#7B2CFF',
                      stroke: '#00D4FF',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: PieChart (40%) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4" style={{ color: '#00D4FF' }} />
              <h3 className="text-sm font-semibold text-white">消耗分布</h3>
            </div>
            <div className="w-full" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    label={({ name, value, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}% ($${value.toFixed(0)})`
                    }
                    labelLine={{
                      stroke: 'rgba(255,255,255,0.15)',
                      strokeWidth: 1,
                    }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.color}
                        style={{
                          filter: `drop-shadow(0 0 6px ${entry.color}40)`,
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const d = payload[0]
                      return (
                        <div className="glass-3 px-3 py-2">
                          <p className="text-xs text-text-muted">{d.name}</p>
                          <p className="text-sm font-semibold text-white">
                            ${d.value.toFixed(2)}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Legend content={<PieLegend />} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ══════════════════════════════════════════
          Table Section
          ══════════════════════════════════════════ */}
      <GlassCard variant="1" className="p-6">
        {/* Title row with export button */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">账号消耗列表</h2>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
              boxShadow: '0 0 8px rgba(123, 44, 255, 0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 14px rgba(123, 44, 255, 0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 8px rgba(123, 44, 255, 0.3)' }}
          >
            <Download className="w-3.5 h-3.5" />
            导出
          </button>
        </div>

        {/* Data table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={tableData} emptyText="暂无消耗数据" />
        )}

        {/* Pagination */}
        <Pagination
          current={pagination.current}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={handlePageChange}
        />
      </GlassCard>
    </div>
  )
}