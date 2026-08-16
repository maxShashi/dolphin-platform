import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { orders } from '../api/index'
import GlassCard from '../components/GlassCard'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'
import DateRangeSelector from '../components/DateRangeSelector'

const platformTabs = ['All']
const statusTabs = ['正常充值']

const statusCardConfig = [
  { key: 'total', label: '订单总数' },
  { key: 'pending', label: '充值中' },
  { key: 'completed', label: '已完结' },
  { key: 'failed', label: '异常' },
]

export default function DelegationOrders() {
  useAuth()

  /* ── Tab state ── */
  const [platformTab, setPlatformTab] = useState('All')
  const [statusTab, setStatusTab] = useState('正常充值')
  const [selectedCard, setSelectedCard] = useState('total')

  /* ── Filter state ── */
  const [filters, setFilters] = useState({
    orderNo: '',
    rechargeAccount: '',
    createStart: '',
    createEnd: '',
    completeStart: '',
    completeEnd: '',
  })

  /* ── Data state ── */
  const [stats, setStats] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  /* ── Fetch stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const res = await orders.getRechargeStats()
      if (res.data && res.data.data) {
        setStats(res.data.data)
      }
    } catch (err) {
      // Silently handle
    }
  }, [])

  /* ── Fetch recharge orders list ── */
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        platform: platformTab === 'All' ? '' : platformTab,
        status: statusTab,
        ...filters,
      }
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key]
        }
      })

      const res = await orders.getRechargeOrders(params)
      const responseBody = res.data

      if (responseBody && responseBody.data) {
        const responseData = responseBody.data
        if (Array.isArray(responseData)) {
          setData(responseData)
          setPagination((prev) => ({ ...prev, total: responseData.length }))
        } else if (responseData.list) {
          setData(responseData.list)
          setPagination((prev) => ({
            ...prev,
            total: responseData.total || responseData.list.length,
            current: responseData.page || prev.current,
            pageSize: responseData.pageSize || prev.pageSize,
          }))
        }
      }
    } catch (err) {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }, [pagination.current, pagination.pageSize, platformTab, statusTab, filters])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  /* ── Handlers ── */
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, current: page }))
  }

  const getStatValue = (key) => {
    if (!stats) return 0
    return stats[key] !== undefined ? stats[key] : 0
  }

  /* ── Columns ── */
  const columns = [
    { key: 'orderNo', label: '订单号', render: (val) => val || '-' },
    { key: 'platform', label: '平台名称', render: (val) => val || '-' },
    {
      key: 'paymentStatus',
      label: '支付状态',
      render: (val) => {
        if (!val) return '-'
        const statusMap = {
          paid: '已支付',
          unpaid: '未支付',
          refunded: '已退款',
        }
        return <StatusBadge status={statusMap[val] || val} type={val === 'paid' ? 'success' : val === 'unpaid' ? 'pending' : 'normal'} />
      },
    },
    {
      key: 'rechargeStatus',
      label: '充值状态',
      render: (val) => {
        if (!val) return '-'
        const statusMap = {
          processing: '充值中',
          completed: '已充值',
          failed: '充值失败',
        }
        return <StatusBadge status={statusMap[val] || val} type={val === 'completed' ? 'success' : val === 'failed' ? 'error' : 'pending'} />
      },
    },
    {
      key: 'orderAmount',
      label: '订单金额',
      render: (val) => (val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '-'),
    },
    {
      key: 'serviceFee',
      label: '服务费',
      render: (val) => (val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '-'),
    },
    {
      key: 'rechargeAmount',
      label: '充值金额',
      render: (val) => (val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '-'),
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
            // Handle view action
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
          Header & Platform Tabs
          ══════════════════════════════════════════ */}
      <GlassCard variant="1" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">代投订单管理</h1>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-6 border-b border-white/5 mb-5">
          {platformTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setPlatformTab(tab)
                setPagination((prev) => ({ ...prev, current: 1 }))
              }}
              className="pb-3 text-sm font-medium relative transition-colors"
              style={{ color: platformTab === tab ? '#FFFFFF' : '#64748B' }}
            >
              {tab}(0)
              {platformTab === tab && (
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

        {/* Status tabs */}
        <div className="flex gap-6 border-b border-white/5 mb-5">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusTab(tab)
                setPagination((prev) => ({ ...prev, current: 1 }))
              }}
              className="pb-3 text-sm font-medium relative transition-colors"
              style={{ color: statusTab === tab ? '#FFFFFF' : '#64748B' }}
            >
              {tab}
              {statusTab === tab && (
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

        {/* 4 status cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statusCardConfig.map((card) => {
            const isSelected = selectedCard === card.key
            return (
              <div
                key={card.key}
                className="glass-2 p-4 text-center cursor-pointer transition-all duration-200"
                style={{
                  border: isSelected ? '1px solid rgba(123, 44, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isSelected ? '0 0 12px rgba(123, 44, 255, 0.4)' : 'none',
                }}
                onClick={() => setSelectedCard(card.key)}
              >
                <p className="text-2xl font-bold text-white mb-1">{getStatValue(card.key)}</p>
                <p className="text-xs" style={{ color: '#AAB7C4' }}>{card.label}</p>
              </div>
            )
          })}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>订单号</span>
            <input
              type="text"
              value={filters.orderNo}
              onChange={(e) => handleFilterChange('orderNo', e.target.value)}
              placeholder="请输入订单号"
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 w-[140px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>充值账户</span>
            <select
              value={filters.rechargeAccount}
              onChange={(e) => handleFilterChange('rechargeAccount', e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 min-w-[120px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <option value="" style={{ background: '#0F1428' }}>全部账户</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>创建时间</span>
            <DateRangeSelector 
              value={{ start: filters.createStart || '', end: filters.createEnd || '' }} 
              onChange={(range) => { handleFilterChange('createStart', range.start); handleFilterChange('createEnd', range.end) }} 
              placeholder="创建时间"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>完成时间</span>
            <DateRangeSelector 
              value={{ start: filters.completeStart || '', end: filters.completeEnd || '' }} 
              onChange={(range) => { handleFilterChange('completeStart', range.start); handleFilterChange('completeEnd', range.end) }} 
              placeholder="完成时间"
            />
          </div>
        </div>

        {/* Data table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={data} emptyText="暂无代投订单数据" />
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