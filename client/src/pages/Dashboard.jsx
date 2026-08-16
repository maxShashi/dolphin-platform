import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/index'
import {
  Wallet,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  Percent,
  ArrowUp,
  MessageCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  X,
  Check,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts'
import DateRangeSelector from '../components/DateRangeSelector'

/* ───────────────────────────────────────────────
   Custom Tooltip for the chart
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
   Loading Spinner
   ─────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/* ───────────────────────────────────────────────
   Recharge Modal
   ─────────────────────────────────────────────── */
const RECHARGE_OPTIONS = [
  { value: '50U(账户租赁)', label: '50U(账户租赁)' },
  { value: '800U', label: '800U' },
  { value: '1500U', label: '1500U' },
  { value: '2000U', label: '2000U' },
  { value: '自定义', label: '自定义' },
]

const TRANSFER_ADDRESS = 'TWSvGYoyydp3NEW2272BkmZvgysgUUcbvz'

function RechargeModal({ open, onClose }) {
  const [amount, setAmount] = useState('50U(账户租赁)')
  const [customAmount, setCustomAmount] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(TRANSFER_ADDRESS).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="glass-3 w-full max-w-md mx-4 p-6 rounded-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-white text-lg font-semibold mb-5">充值</h2>

        {/* Amount dropdown */}
        <select
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none mb-3 transition-all duration-200"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {RECHARGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: '#0F1428' }}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom amount input */}
        {amount === '自定义' && (
          <input
            type="text"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="请输入自定义金额"
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none mb-3 transition-all duration-200"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          />
        )}

        {/* Network info */}
        <p className="text-sm mb-1" style={{ color: '#8096B8' }}>转账网络 TRC20</p>

        {/* Address with copy */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-white text-sm font-mono break-all flex-1">{TRANSFER_ADDRESS}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
            title="复制"
          >
            {copySuccess ? (
              <Check className="w-4 h-4" style={{ color: '#00FF88' }} />
            ) : (
              <Copy className="w-4 h-4" style={{ color: '#64748B' }} />
            )}
          </button>
        </div>

        {copySuccess && (
          <p className="text-xs mb-3" style={{ color: '#00FF88' }}>已复制</p>
        )}

        {/* QR Code */}
        <p className="text-sm text-center mb-3" style={{ color: '#8096B8' }}>扫码转账</p>
        <img
          src="/transfercode.jpg"
          alt="转账二维码"
          className="max-w-[200px] mx-auto rounded-lg"
        />
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────
   Main Dashboard Component
   ─────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userName = user?.username || '用户'
  const firstLetter = userName.charAt(0).toUpperCase()

  /* ── Module 3 state ── */
  const [dataTab, setDataTab] = useState('adPlatform')
  const [experienceIndex, setExperienceIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [adAccount, setAdAccount] = useState('all')
  const [timezone, setTimezone] = useState('UTC')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  /* ── Fund state ── */
  const [balance, setBalance] = useState(0)
  const [frozen, setFrozen] = useState(0)

  /* ── Chart data state ── */
  const [chartData, setChartData] = useState([])

  /* ── Customer service state ── */
  const [copied, setCopied] = useState(false)
  const telegramHandle = '@meilala32'

  /* ── Recharge modal state ── */
  const [showRechargeModal, setShowRechargeModal] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText('meilala32').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  /* ── Fetch balance data ── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const balanceRes = await api.get('/finances/balance')
      if (balanceRes.data) {
        setBalance(balanceRes.data.balance || 0)
        setFrozen(balanceRes.data.frozen || 0)
      }
    } catch (err) {
      // Silently handle — UI stays at default zeros
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ── Generate array of dates between two dates ── */
  const getDateRange = (start, end) => {
    const dates = []
    const current = new Date(start)
    const endDate = new Date(end)
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  /* ── Fetch consumption chart data based on date range ── */
  useEffect(() => {
    const fetchConsumptionData = async () => {
      if (!dateRange.start || !dateRange.end) return
      try {
        const res = await api.get('/dashboard/consumption', {
          params: { startDate: dateRange.start, endDate: dateRange.end },
        })
        if (res.data && res.data.code === 200) {
          // Build a complete date range, fill missing dates with 0
          const allDates = getDateRange(dateRange.start, dateRange.end)
          const dataMap = {}
          res.data.data.forEach((item) => {
            dataMap[item.date] = item.total_spend
          })
          const mapped = allDates.map((date) => ({
            date: date.slice(5), // show MM-DD on x-axis
            value: dataMap[date] || 0,
          }))
          setChartData(mapped)
        }
      } catch (err) {
        // Silently handle
      }
    }
    fetchConsumptionData()
  }, [dateRange])

  /* ── Experience carousel ── */
  const experienceSlides = [
    {
      cards: [
        {
          id: 'recharge',
          icon: Wallet,
          iconColor: '#00FF88',
          bgGlow: 'rgba(0, 255, 136, 0.1)',
          title: '充值',
          subtitle: '充值开启专业广告之旅',
          buttonText: '立即充值',
        },
        {
          id: 'service',
          icon: UserCircle,
          iconColor: '#FF4D4D',
          bgGlow: 'rgba(255, 77, 77, 0.1)',
          title: '服务',
          subtitle: '购买服务，开启营销',
          buttonText: '立即购买',
        },
      ],
    },
  ]

  const totalSlides = experienceSlides.length
  const currentSlide = experienceSlides[experienceIndex]

  /* ── Data cards ── */
  const dataCards = [
    { label: '消耗', value: '$0.00', icon: DollarSign, color: '#00D4FF' },
    { label: '展示次数', value: '0', icon: TrendingUp, color: '#7B2CFF' },
    { label: '点击量', value: '0', icon: MousePointerClick, color: '#FF2BD6' },
    { label: 'CTR', value: '0%', icon: Percent, color: '#00FF88' },
  ]

  return (
    <div className="page-enter space-y-6">
      {/* ══════════════════════════════════════════
          MODULE 1: Welcome Card
          ══════════════════════════════════════════ */}
      <div className="glass-1 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
              boxShadow: '0 0 12px rgba(123, 44, 255, 0.4)',
            }}
          >
            {firstLetter}
          </div>
          <div>
            <p className="text-white text-base font-medium">您好，{userName}</p>
            <p className="text-text-muted text-xs mt-0.5">欢迎回到海豚数字营销平台</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MODULE 2: 开始体验
          ══════════════════════════════════════════ */}
      <div className="glass-1 p-6">
        {/* Title row */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-base">开始体验</h2>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <button
              onClick={() => setExperienceIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1))}
              className="hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>{experienceIndex + 1}/{totalSlides}</span>
            <button
              onClick={() => setExperienceIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0))}
              className="hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cards */}
        {currentSlide && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSlide.cards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.id} className="glass-2 p-5 flex items-center gap-4 hover:border-white/20 transition-all duration-200">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: card.bgGlow,
                      border: `1px solid ${card.iconColor}33`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: card.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{card.title}</p>
                    <p className="text-text-muted text-xs mt-0.5 truncate">{card.subtitle}</p>
                  </div>
                  <button
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200 flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
                      boxShadow: '0 0 10px rgba(123, 44, 255, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 18px rgba(123, 44, 255, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(123, 44, 255, 0.3)'
                    }}
                    onClick={() => {
                      if (card.id === 'recharge') {
                        setShowRechargeModal(true)
                      } else if (card.id === 'service') {
                        navigate('/purchase')
                      }
                    }}
                  >
                    {card.buttonText}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          MODULE 3: Data Analysis + Platform Funds
          ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ───── Left wide: Data Analysis ───── */}
        <div className="lg:col-span-2 glass-1 p-6">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-white/5 mb-5">
            <button
              onClick={() => setDataTab('adPlatform')}
              className="pb-3 text-sm font-medium relative transition-colors"
              style={{ color: dataTab === 'adPlatform' ? '#FFFFFF' : '#64748B' }}
            >
              广告平台数据
              {dataTab === 'adPlatform' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{
                  background: 'linear-gradient(90deg, #7B2CFF, #00D4FF)',
                  boxShadow: '0 0 8px rgba(123, 44, 255, 0.5)',
                }} />
              )}
            </button>
            
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <select
              value={adAccount}
              onChange={(e) => setAdAccount(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <option value="all" style={{ background: '#0F1428' }}>全部广告账号</option>
              <option value="1" style={{ background: '#0F1428' }}>账号 1</option>
              <option value="2" style={{ background: '#0F1428' }}>账号 2</option>
            </select>

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
            </select>

            <DateRangeSelector value={dateRange} onChange={setDateRange} placeholder="选择日期范围" />
          </div>

          {/* 4 Data Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {dataCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="glass-2 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                    <span className="text-text-muted text-xs">{card.label}</span>
                  </div>
                  <p className="text-white text-xl font-bold">{card.value}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <ArrowUp className="w-3 h-3 text-success" />
                    <span className="text-success text-xs">比较上一周期 +0%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Line Chart */}
          {loading ? (
            <Spinner />
          ) : chartData && chartData.length > 0 ? (
            <div className="w-full" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7B2CFF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#7B2CFF" stopOpacity={0} />
                    </linearGradient>
                    <filter id="chartGlow">
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
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7B2CFF"
                    strokeWidth={2}
                    strokeOpacity={0.9}
                    fill="url(#chartGradient)"
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
          ) : (
            <div className="w-full flex items-center justify-center" style={{ height: 260 }}>
              <div className="w-full max-w-md" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{ date: '', value: 0 }]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                      domain={[0, 100]}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="absolute text-text-muted text-sm">选择日期范围后查看数据</p>
            </div>
          )}
        </div>

        {/* ───── Right narrow: Platform Funds ───── */}
        <div className="lg:col-span-1 glass-1 p-6">
          {/* Balance header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-text-muted text-xs mb-1">平台余额</p>
              <p className="text-white text-3xl font-bold">$ {balance.toFixed(2)}</p>
            </div>
            
          </div>

          {/* Fund details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between glass-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00D4FF' }} />
                <span className="text-text-muted text-sm">平台余额</span>
              </div>
              <span className="text-white text-sm font-semibold">$ {balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between glass-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF4D4D' }} />
                <span className="text-text-muted text-sm">冻结资金</span>
              </div>
              <span className="text-white text-sm font-semibold">$ {frozen.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Service */}
          <div className="border-t border-white/5 pt-5">
            <div className="flex gap-6 border-b border-white/5 mb-4">
              <button
                className="pb-3 text-sm font-medium relative text-white"
              >
                平台客服
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{
                  background: 'linear-gradient(90deg, #7B2CFF, #00D4FF)',
                  boxShadow: '0 0 8px rgba(123, 44, 255, 0.5)',
                }} />
              </button>
            </div>

            {/* Customer Service Card */}
            <div className="glass-2 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #FF2BD6, #7B2CFF)',
                  }}
                >
                  美
                </div>
                <div>
                  <p className="text-white text-sm font-medium">美啦啦</p>
                  <p className="text-text-muted text-xs">客服专员</p>
                </div>
              </div>

              {/* Telegram Contact */}
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4" style={{ color: '#0088CC' }} />
                <span className="text-text-muted text-xs flex-1">{telegramHandle}</span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  title="复制"
                >
                  <Copy className="w-3.5 h-3.5" style={{ color: copied ? '#00FF88' : '#64748B' }} />
                </button>
              </div>

              {copied && (
                <p className="text-success text-xs mb-2" style={{ color: '#00FF88' }}>已复制到剪贴板</p>
              )}

              <a
                href={`https://t.me/meilala32`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
                  boxShadow: '0 0 10px rgba(123, 44, 255, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 18px rgba(123, 44, 255, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(123, 44, 255, 0.3)'
                }}
              >
                <MessageCircle className="w-3.5 h-3.5" style={{ color: '#0088CC' }} />
                咨询
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          Recharge Modal
          ══════════════════════════════════════════ */}
      <RechargeModal
        open={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
      />
    </div>
  )
}