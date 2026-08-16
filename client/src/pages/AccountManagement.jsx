import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { accounts } from '../api/index'
import {
  Facebook,
  Download,
  RotateCcw,
  UserPlus,
  Wallet,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import DateRangeSelector from '../components/DateRangeSelector'

const amountSegments = [
  { key: '0-10', label: '$0-10', range: [0, 10] },
  { key: '10-100', label: '$10-100', range: [10, 100] },
  { key: '100-500', label: '$100-500', range: [100, 500] },
  { key: '500-1000', label: '$500-1000', range: [500, 1000] },
  { key: '1000-2000', label: '$1000-2000', range: [1000, 2000] },
  { key: '2000+', label: '$2000+', range: [2000, Infinity] },
]



const accountTypeOptions = ['全部', '企业户', '个人户', '三不限']
const accountAttrOptions = ['全部', '直客', '代理', '自营']
const accountTagOptions = ['全部', '高权重', '高ROI', '新号', '老号']

export default function AccountManagement() {
  useAuth()

  /* ── Tab state ── */
  const [statusTab, setStatusTab] = useState('正常')

  /* ── Filter state ── */
  const [filters, setFilters] = useState({
    accountType: '',
    accountAttr: '',
    accountId: '',
    accountName: '',
    deliveryStart: '',
    deliveryEnd: '',
    rentalNote: '',
    accountNote: '',
    accountTag: '',
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
      const res = await accounts.getStats()
      if (res.data && res.data.data) {
        setStats(res.data.data)
      }
    } catch (err) {
      // Silently handle
    }
  }, [])

  /* ── Fetch account list ── */
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        status: statusTab,
        ...filters,
      }
      // Remove empty filter values
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key]
        }
      })

      const res = await accounts.getList(params)
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
  }, [pagination.current, pagination.pageSize, statusTab, filters])

  /* ── Initial data load ── */
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  /* ── Handle filter change ── */
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  /* ── Handle page change ── */
  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, current: page }))
  }

  /* ── Get segment count from stats ── */
  const getSegmentData = (key) => {
    if (!stats) {
      return { total: 0, normal: 0, banned: 0 }
    }
    const segment = stats[key]
    return segment
      ? { total: segment.count || segment.total || 0, normal: segment.normal || 0, banned: segment.banned || 0 }
      : { total: 0, normal: 0, banned: 0 }
  }

  /* ── Action handlers ── */
  const handleExport = () => {
    accounts.exportCSV()
  }

  const handleBatchClear = () => {
    accounts.batchStatus({ action: 'clear' })
  }

  const handleBatchAdjust = () => {
    accounts.batchAdjust({ action: 'adjust' })
  }

  const handleBatchRecharge = () => {
    accounts.batchRecharge({ action: 'recharge' })
  }

  /* ── DataTable columns ── */
  const columns = [
    { key: 'id', label: '账号ID' },
    { key: 'name', label: '账号名称' },
    { key: 'type', label: '账号类型', render: (val) => val || '-' },
    { key: 'attribute', label: '账号属性', render: (val) => val || '-' },
    { key: 'bmId', label: 'BMID', render: (val) => val || '-' },
    { key: 'timezone', label: '账户时区', render: (val) => val || '-' },
    {
      key: 'totalSpend',
      label: '累计消耗',
      render: (val) => (val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '-'),
    },
    {
      key: 'deliveryDate',
      label: '交付时间',
      render: (val) => val || '-',
    },
  ]

  return (
    <div className="page-enter space-y-6">
      {/* ══════════════════════════════════════════
          Header
          ══════════════════════════════════════════ */}
      <GlassCard variant="1" className="p-6">
        {/* Header row */}
        <div className="flex items-center mb-6">
            <div className="flex items-center gap-3">
              <Facebook className="w-6 h-6" style={{ color: '#1877F2' }} />
              <h1 className="text-xl font-bold text-white">Facebook</h1>
            </div>
          </div>

        {/* 6 amount segment cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {amountSegments.map((seg) => {
            const segData = getSegmentData(seg.key)
            return (
              <div key={seg.key} className="glass-2 p-4 text-center">
                <p className="text-2xl font-bold text-white mb-1">{segData.total}</p>
                <p className="text-xs mb-2" style={{ color: '#AAB7C4' }}>{seg.label}</p>
                <div className="flex items-center justify-center gap-3 text-xs">
                  <span style={{ color: '#00FF88' }}>正常:{segData.normal}</span>
                  <span style={{ color: '#FF4D4D' }}>封禁:{segData.banned}</span>
                </div>
              </div>
            )
          })}
        </div>

        

        {/* Filter row 1 */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>账号类型</span>
            <select
              value={filters.accountType}
              onChange={(e) => handleFilterChange('accountType', e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 min-w-[100px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {accountTypeOptions.map((opt) => (
                <option key={opt} value={opt === '全部' ? '' : opt} style={{ background: '#0F1428' }}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>账号属性</span>
            <select
              value={filters.accountAttr}
              onChange={(e) => handleFilterChange('accountAttr', e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 min-w-[100px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {accountAttrOptions.map((opt) => (
                <option key={opt} value={opt === '全部' ? '' : opt} style={{ background: '#0F1428' }}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>账号ID</span>
            <input
              type="text"
              value={filters.accountId}
              onChange={(e) => handleFilterChange('accountId', e.target.value)}
              placeholder="请输入账号ID"
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 w-[140px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>账号名称</span>
            <input
              type="text"
              value={filters.accountName}
              onChange={(e) => handleFilterChange('accountName', e.target.value)}
              placeholder="请输入账号名称"
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 w-[140px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />
          </div>
        </div>

        {/* Filter row 2 */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <DateRangeSelector 
              value={{ start: filters.deliveryStart || '', end: filters.deliveryEnd || '' }} 
              onChange={(range) => { handleFilterChange('deliveryStart', range.start); handleFilterChange('deliveryEnd', range.end) }} 
              placeholder="交付时间"
            />

          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>租赁备注</span>
            <input
              type="text"
              value={filters.rentalNote}
              onChange={(e) => handleFilterChange('rentalNote', e.target.value)}
              placeholder="租赁备注"
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 w-[120px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>账号备注</span>
            <input
              type="text"
              value={filters.accountNote}
              onChange={(e) => handleFilterChange('accountNote', e.target.value)}
              placeholder="账号备注"
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 w-[120px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap" style={{ color: '#AAB7C4' }}>账号标签</span>
            <select
              value={filters.accountTag}
              onChange={(e) => handleFilterChange('accountTag', e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs text-text-secondary outline-none transition-all duration-200 min-w-[100px]"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {accountTagOptions.map((opt) => (
                <option key={opt} value={opt === '全部' ? '' : opt} style={{ background: '#0F1428' }}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
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
          <button
            onClick={handleBatchClear}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
              boxShadow: '0 0 8px rgba(123, 44, 255, 0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 14px rgba(123, 44, 255, 0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 8px rgba(123, 44, 255, 0.3)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            批量发起清零
          </button>
          <button
            onClick={handleBatchAdjust}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
              boxShadow: '0 0 8px rgba(123, 44, 255, 0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 14px rgba(123, 44, 255, 0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 8px rgba(123, 44, 255, 0.3)' }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            批量调整商业号
          </button>
          <button
            onClick={handleBatchRecharge}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
              boxShadow: '0 0 8px rgba(123, 44, 255, 0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 14px rgba(123, 44, 255, 0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 8px rgba(123, 44, 255, 0.3)' }}
          >
            <Wallet className="w-3.5 h-3.5" />
            批量充值
          </button>
        </div>

        {/* Data table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={data} emptyText="暂无账号数据" />
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