import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { dashboard } from '../api/index'
import { List, AlertTriangle, BarChart3 } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import GlassCard from '../components/GlassCard'
import DateRangeSelector from '../components/DateRangeSelector'

const subTabs = [
  { key: 'accountCount', label: '账号数量', icon: List },
  { key: 'accountConsumption', label: '账户消耗', icon: BarChart3 },
  { key: 'banTime', label: '账号封禁使用时间', icon: AlertTriangle },
]

const consumptionSubTabs = ['阶段消耗', '封禁消耗']

const CHART_COLORS = {
  total: '#7B2CFF',
  normal: '#00FF88',
  banned: '#FFD600',
  effective: '#FF4D4D',
  consumption: '#00D4FF',
  avgConsumption: '#7B2CFF',
  stageConsumption: '#00D4FF',
  banConsumption: '#FF4D4D',
  banTotal: '#FFD600',
  avgBanTime: '#FF4D4D',
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="glass-3 px-4 py-3">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  )
}

function CustomLegend({ payload }) {
  if (!payload) return null
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs" style={{ color: '#AAB7C4' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AccountData() {
  useAuth()

  /* ── Sub-tab state ── */
  const [activeSubTab, setActiveSubTab] = useState('accountCount')
  const [consumptionSubTab, setConsumptionSubTab] = useState('阶段消耗')

  /* ── Filter state ── */
  const [timezone, setTimezone] = useState('UTC')
  const [dateRange, setDateRange] = useState({
    start: '2026-08-10',
    end: '2026-08-16',
  })

  /* ── Data state ── */
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState([])
  const [stats, setStats] = useState(null)

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        timezone,
        startDate: dateRange.start,
        endDate: dateRange.end,
        type: activeSubTab,
        subType: activeSubTab === 'accountConsumption' ? consumptionSubTab : undefined,
      }
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) delete params[key]
      })

      const res = await dashboard.getAccountData(params)
      const responseData = res.data

      if (responseData) {
        if (responseData.chartData) {
          setChartData(responseData.chartData)
        }
        if (responseData.stats) {
          setStats(responseData.stats)
        }
      }
    } catch (err) {
      // Silently handle — UI stays at default zeros
    } finally {
      setLoading(false)
    }
  }, [timezone, dateRange, activeSubTab, consumptionSubTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ── Render sub-tab content ── */
  const renderAccountCount = () => {
    const accountCards = [
      { key: 'total', label: '总个数', value: stats?.total ?? 0, color: '#7B2CFF' },
      { key: 'normal', label: '正常数量', value: stats?.normal ?? 0, color: '#00FF88' },
      { key: 'banned', label: '封禁数量', value: stats?.banned ?? 0, color: '#FFD600' },
      { key: 'effective', label: '有效消耗账户', value: stats?.effective ?? 0, color: '#FF4D4D' },
    ]

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {accountCards.map((card) => (
            <div key={card.key} className="glass-2 p-4">
              <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-xs" style={{ color: '#AAB7C4' }}>{card.label}</p>
            </div>
          ))}
        </div>

        <div className="w-full" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.length > 0 ? chartData : []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend content={<CustomLegend />} />
              <Line
                type="monotone"
                dataKey="total"
                name="总个数"
                stroke={CHART_COLORS.total}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.total, stroke: '#00D4FF', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="normal"
                name="正常数量"
                stroke={CHART_COLORS.normal}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.normal, stroke: '#00D4FF', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="banned"
                name="封禁数量"
                stroke={CHART_COLORS.banned}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.banned, stroke: '#00D4FF', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="effective"
                name="有效消耗账户"
                stroke={CHART_COLORS.effective}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.effective, stroke: '#00D4FF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>
    )
  }

  const renderAccountConsumption = () => {
    const consumptionCards = [
      { key: 'totalConsumption', label: '总消耗', value: stats?.totalConsumption ?? 0, prefix: '$' },
      { key: 'avgConsumption', label: '平均消耗', value: stats?.avgConsumption ?? 0, prefix: '$' },
    ]

    const formatValue = (val, prefix) => {
      const num = Number(val)
      return `${prefix}${num.toFixed(2)}`
    }

    return (
      <>
        {/* Sub-tabs */}
        <div className="flex gap-6 border-b border-white/5 mb-5 overflow-x-auto overflow-y-hidden flex-nowrap whitespace-nowrap">
          {consumptionSubTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setConsumptionSubTab(tab)}
              className="pb-3 text-sm font-medium relative transition-colors"
              style={{ color: consumptionSubTab === tab ? '#FFFFFF' : '#64748B' }}
            >
              {tab}
              {consumptionSubTab === tab && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{
                    background: 'linear-gradient(90deg, #7B2CFF, #00D4FF)',
                    boxShadow: '0 0 8px rgba(123, 44, 255, 0.5)',
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Data cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
          {consumptionCards.map((card) => (
            <div key={card.key} className="glass-2 p-4">
              <p className="text-2xl font-bold text-white mb-1">{formatValue(card.value, card.prefix)}</p>
              <p className="text-xs" style={{ color: '#AAB7C4' }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="w-full" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.length > 0 ? chartData : []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
              <Legend content={<CustomLegend />} />
              {consumptionSubTab === '阶段消耗' ? (
                <Line
                  type="monotone"
                  dataKey="consumption"
                  name="阶段消耗"
                  stroke={CHART_COLORS.stageConsumption}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART_COLORS.stageConsumption, stroke: '#00D4FF', strokeWidth: 2 }}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="consumption"
                  name="封禁消耗"
                  stroke={CHART_COLORS.banConsumption}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART_COLORS.banConsumption, stroke: '#00D4FF', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>
    )
  }

  const renderBanTime = () => {
    const banCards = [
      { key: 'banTotal', label: '封禁总数', value: stats?.banTotal ?? 0 },
      { key: 'avgBanTime', label: '平均封禁时间', value: stats?.avgBanTime ?? 0, suffix: '天' },
    ]

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
          {banCards.map((card) => (
            <div key={card.key} className="glass-2 p-4">
              <p className="text-2xl font-bold text-white mb-1">
                {card.value}{card.suffix || ''}
              </p>
              <p className="text-xs" style={{ color: '#AAB7C4' }}>{card.label}</p>
            </div>
          ))}
        </div>

        <div className="w-full" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.length > 0 ? chartData : []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend content={<CustomLegend />} />
              <Line
                type="monotone"
                dataKey="banTotal"
                name="封禁总数"
                stroke={CHART_COLORS.banTotal}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.banTotal, stroke: '#00D4FF', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="avgBanTime"
                name="平均封禁时间"
                stroke={CHART_COLORS.avgBanTime}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.avgBanTime, stroke: '#00D4FF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>
    )
  }

  return (
    <div className="page-enter space-y-6">
      {/* ══════════════════════════════════════════
          Header
          ══════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">账号数据</h1>
      </div>

      {/* ══════════════════════════════════════════
          Sub-tab navigation (sidebar style)
          ══════════════════════════════════════════ */}
      <div className="flex gap-1.5 glass-1 p-1.5 overflow-x-auto overflow-y-hidden flex-nowrap" style={{ width: 'fit-content', maxWidth: '100%' }}>
        {subTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveSubTab(tab.key)
                if (tab.key !== 'accountConsumption') {
                  setConsumptionSubTab('阶段消耗')
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSubTab === tab.key
                  ? 'btn-gradient text-white shadow-glow-weak'
                  : 'text-text-tertiary hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════
          Main Content
          ══════════════════════════════════════════ */}
      <GlassCard variant="1" className="p-6">
        {/* Common filter row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>时区</span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <option value="UTC" style={{ background: '#0F1428' }}>UTC</option>
              <option value="Asia/Shanghai" style={{ background: '#0F1428' }}>Asia/Shanghai</option>
              <option value="America/New_York" style={{ background: '#0F1428' }}>America/New_York</option>
              <option value="America/Los_Angeles" style={{ background: '#0F1428' }}>America/Los_Angeles</option>
              <option value="Europe/London" style={{ background: '#0F1428' }}>Europe/London</option>
            </select>
          </div>

          <DateRangeSelector value={dateRange} onChange={setDateRange} placeholder="选择日期范围" />
        </div>

        {/* Content based on active sub-tab */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeSubTab === 'accountCount' && renderAccountCount()}
            {activeSubTab === 'accountConsumption' && renderAccountConsumption()}
            {activeSubTab === 'banTime' && renderBanTime()}
          </>
        )}
      </GlassCard>
    </div>
  )
}