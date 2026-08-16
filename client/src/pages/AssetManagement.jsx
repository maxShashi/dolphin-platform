import React, { useState, useEffect, useCallback } from 'react'
import { finances } from '../api/index'
import {
  DollarSign,
  ArrowUp,
  ArrowDown,
  Ban,
  Wallet,
  Search,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'
import DateRangeSelector from '../components/DateRangeSelector'

/* ───────────────────────────────────────────────
   Tab definitions
   ─────────────────────────────────────────────── */
const TABS = [
  { key: 'recharge', label: '充值记录' },
  { key: 'withdraw', label: '提现记录' },
  { key: 'flows', label: '资金流水' },
  { key: 'frozen', label: '冻结记录' },
]

/* ───────────────────────────────────────────────
   Status options per tab
   ─────────────────────────────────────────────── */
const statusOptions = {
  recharge: ['全部', '成功', '处理中', '失败'],
  withdraw: ['全部', '成功', '处理中', '失败'],
  flows: ['全部', '成功', '处理中', '失败'],
  frozen: ['全部', '冻结中', '已解冻'],
}

/* ───────────────────────────────────────────────
   Column definitions per tab
   ─────────────────────────────────────────────── */
const getColumns = (tab) => {
  const columnsMap = {
    recharge: [
      { key: 'orderNo', label: '充值单号', render: (val) => val || '-' },
      {
        key: 'amount',
        label: '充值金额',
        render: (val) => (val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '$0.00'),
      },
      { key: 'method', label: '充值方式', render: (val) => val || '-' },
      {
        key: 'status',
        label: '状态',
        render: (val) => <StatusBadge status={val || 'pending'} />,
      },
      {
        key: 'createdAt',
        label: '创建时间',
        render: (val) => val || '-',
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
    ],
    withdraw: [
      { key: 'orderNo', label: '提现单号', render: (val) => val || '-' },
      {
        key: 'amount',
        label: '提现金额',
        render: (val) => (val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '$0.00'),
      },
      { key: 'method', label: '提现方式', render: (val) => val || '-' },
      {
        key: 'status',
        label: '状态',
        render: (val) => <StatusBadge status={val || 'pending'} />,
      },
      {
        key: 'createdAt',
        label: '创建时间',
        render: (val) => val || '-',
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
    ],
    flows: [
      { key: 'flowNo', label: '流水号', render: (val) => val || '-' },
      {
        key: 'type',
        label: '类型',
        render: (val) => {
          if (!val) return '-'
          const isIncome = val === '收入' || val === 'income'
          return (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: isIncome ? '#00FF88' : '#FF4D4D' }}
            >
              {isIncome ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              {isIncome ? '收入' : '支出'}
            </span>
          )
        },
      },
      {
        key: 'amount',
        label: '金额',
        render: (val) => (val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '$0.00'),
      },
      {
        key: 'status',
        label: '状态',
        render: (val) => <StatusBadge status={val || 'pending'} />,
      },
      { key: 'description', label: '描述', render: (val) => val || '-' },
      {
        key: 'createdAt',
        label: '创建时间',
        render: (val) => val || '-',
      },
    ],
    frozen: [
      { key: 'orderNo', label: '冻结单号', render: (val) => val || '-' },
      {
        key: 'amount',
        label: '冻结金额',
        render: (val) => (val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '$0.00'),
      },
      { key: 'reason', label: '冻结原因', render: (val) => val || '-' },
      {
        key: 'status',
        label: '状态',
        render: (val) => <StatusBadge status={val || 'pending'} />,
      },
      {
        key: 'createdAt',
        label: '创建时间',
        render: (val) => val || '-',
      },
      {
        key: 'unfreezeAt',
        label: '解冻时间',
        render: (val) => val || '-',
      },
    ],
  }
  return columnsMap[tab] || columnsMap.recharge
}

/* ───────────────────────────────────────────────
   Summary card configuration
   ─────────────────────────────────────────────── */
const summaryCards = [
  {
    key: 'totalRecharge',
    label: '总充值',
    icon: ArrowUp,
    color: '#00FF88',
  },
  {
    key: 'totalWithdraw',
    label: '总提现',
    icon: ArrowDown,
    color: '#FF4D4D',
  },
  {
    key: 'availableBalance',
    label: '可用余额',
    icon: DollarSign,
    color: '#00D4FF',
  },
  {
    key: 'frozenFunds',
    label: '冻结资金',
    icon: Ban,
    color: '#FFD600',
  },
]

/* ───────────────────────────────────────────────
   Main Component
   ─────────────────────────────────────────────── */
export default function AssetManagement() {
  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState('recharge')

  /* ── Filter state ── */
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')

  /* ── Data state ── */
  const [summary, setSummary] = useState({
    totalRecharge: 0,
    totalWithdraw: 0,
    availableBalance: 0,
    frozenFunds: 0,
  })
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  /* ── Reset pagination on tab change ── */
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPagination((prev) => ({ ...prev, current: 1 }))
    setStatusFilter('全部')
    setAmountMin('')
    setAmountMax('')
  }

  /* ── Fetch balance summary ── */
  const fetchSummary = useCallback(async () => {
    try {
      const res = await finances.getBalance()
      if (res.data && res.data.data) {
        setSummary({
          totalRecharge: res.data.data.totalRecharge || 0,
          totalWithdraw: res.data.data.totalWithdraw || 0,
          availableBalance: res.data.data.balance || 0,
          frozenFunds: res.data.data.frozen || 0,
        })
      }
    } catch (err) {
      // Keep defaults at 0
    }
  }, [])

  /* ── Fetch table data based on active tab ── */
  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        startDate: dateStart || undefined,
        endDate: dateEnd || undefined,
        status: statusFilter === '全部' ? undefined : statusFilter,
        amountMin: amountMin || undefined,
        amountMax: amountMax || undefined,
      }

      let res
      switch (activeTab) {
        case 'recharge':
          res = await finances.getRechargeRecords(params)
          break
        case 'withdraw':
          res = await finances.getWithdrawRecords(params)
          break
        case 'flows':
          res = await finances.getFlows(params)
          break
        case 'frozen':
          res = await finances.getFrozenRecords(params)
          break
        default:
          res = { data: { data: [], total: 0 } }
      }

      const responseBody = res.data
      if (responseBody && responseBody.data) {
        const responseData = responseBody.data
        if (Array.isArray(responseData)) {
          setTableData(responseData)
          setPagination((prev) => ({ ...prev, total: responseData.length }))
        } else if (responseData.list) {
          setTableData(responseData.list)
          setPagination((prev) => ({
            ...prev,
            total: responseData.total || responseData.list.length,
            current: responseData.page || prev.current,
            pageSize: responseData.pageSize || prev.pageSize,
          }))
        } else {
          setTableData([])
          setPagination((prev) => ({ ...prev, total: 0 }))
        }
      } else {
        setTableData([])
        setPagination((prev) => ({ ...prev, total: 0 }))
      }
    } catch (err) {
      setTableData([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, pagination.current, pagination.pageSize, dateStart, dateEnd, statusFilter, amountMin, amountMax])

  /* ── Initial data load ── */
  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  /* ── Handlers ── */
  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, current: page }))
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  /* ── Determine if the filter row should show amount inputs ── */
  const showAmountFilter = activeTab === 'recharge' || activeTab === 'withdraw'

  return (
    <div className="page-enter space-y-6">
      {/* ══════════════════════════════════════════
          Header
          ══════════════════════════════════════════ */}
      <GlassCard variant="1" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="w-6 h-6" style={{ color: '#00D4FF' }} />
          <h1 className="text-xl font-bold text-white">资产管理</h1>
        </div>

        {/* ══════════════════════════════════════════
            Summary Cards Row
            ══════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => {
            const Icon = card.icon
            const value = summary[card.key]
            return (
              <div key={card.key} className="glass-2 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: `${card.color}15`,
                      border: `1px solid ${card.color}30`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-text-muted text-xs mb-1">{card.label}</p>
                <p className="text-white text-lg font-bold">
                  ${Number(value).toFixed(2)}
                </p>
              </div>
            )
          })}
        </div>

        {/* ══════════════════════════════════════════
            Tabs
            ══════════════════════════════════════════ */}
        <div className="flex gap-6 border-b border-white/5 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className="pb-3 text-sm font-medium relative transition-colors"
              style={{ color: activeTab === tab.key ? '#FFFFFF' : '#64748B' }}
            >
              {tab.label}
              {activeTab === tab.key && (
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

        {/* ══════════════════════════════════════════
            Filter Row
            ══════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* 时间范围 */}
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>时间范围</span>
            <DateRangeSelector 
              value={{ start: dateStart || '', end: dateEnd || '' }} 
              onChange={(range) => { setDateStart(range.start); setDateEnd(range.end); setPagination(prev => ({ ...prev, current: 1 })) }} 
              placeholder="时间范围"
            />
          </div>

          {/* 金额范围 (only for recharge and withdraw) */}
          {showAmountFilter && (
            <div className="flex items-center gap-2">
              <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>金额范围</span>
              <input
                type="number"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
                placeholder="最低"
                className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 w-[100px]"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              />
              <span className="text-xs" style={{ color: '#64748B' }}>-</span>
              <input
                type="number"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
                placeholder="最高"
                className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 w-[100px]"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              />
            </div>
          )}

          {/* 状态 dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>状态</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPagination((prev) => ({ ...prev, current: 1 }))
              }}
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 min-w-[90px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {(statusOptions[activeTab] || statusOptions.recharge).map((opt) => (
                <option key={opt} value={opt} style={{ background: '#0F1428' }}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSearch}
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
            Data Table
            ══════════════════════════════════════════ */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={getColumns(activeTab)}
            data={tableData}
            emptyText="暂无数据"
          />
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