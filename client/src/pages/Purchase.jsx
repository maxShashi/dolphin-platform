import React, { useState, useCallback } from 'react'
import { CheckCircle, Copy, X, Check } from 'lucide-react'
import GlassCard from '../components/GlassCard'

const tags = [
  { label: '高权重', color: '#00FF88' },
  { label: '高ROI', color: '#FFD600' },
]

const TRANSFER_ADDRESS = 'TWSvGYoyydp3NEW2272BkmZvgysgUUcbvz'

/* ───────────────────────────────────────────────
   Recharge Modal
   ─────────────────────────────────────────────── */
function RechargeModal({ open, onClose, options }) {
  const [amount, setAmount] = useState(options?.[0]?.value || '')
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
          {options.map((opt) => (
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

export default function Purchase() {
  const [tab, setTab] = useState('facebook')
  const [showRecharge, setShowRecharge] = useState(false)
  const [rechargeOptions, setRechargeOptions] = useState([])

  const benefits = tab === 'facebook'
    ? ['不限制广告预算', '不限制域名', '不限制主页']
    : ['强力抗封', '精准放量', '贴心服务']

  const featureButtons = tab === 'facebook'
    ? ['不限主页', '不限额度', '不限域名']
    : ['强力抗封', '精准放量', '贴心服务']

  const handleRechargeClick = (options) => {
    setRechargeOptions(options)
    setShowRecharge(true)
  }

  const facebookRechargeOptions = [
    { value: '50U(账户租赁)', label: '50U(账户租赁)' },
  ]

  const delegationRechargeOptions = [
    { value: '800U', label: '800U' },
    { value: '1500U', label: '1500U' },
    { value: '2000U', label: '2000U' },
    { value: '自定义', label: '自定义' },
  ]

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">购买服务</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content area */}
        <div className="flex-1 space-y-4">
          <GlassCard variant="1" className="p-6">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-white/5 mb-6">
              <button
                onClick={() => setTab('facebook')}
                className="pb-3 text-sm font-medium relative transition-colors"
                style={{ color: tab === 'facebook' ? '#FFFFFF' : '#64748B' }}
              >
                Facebook租赁
                {tab === 'facebook' && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                      background: 'linear-gradient(90deg, #7B2CFF, #00D4FF)',
                      boxShadow: '0 0 8px rgba(123, 44, 255, 0.5)',
                    }}
                  />
                )}
              </button>
              <button
                onClick={() => setTab('delegation')}
                className="pb-3 text-sm font-medium relative transition-colors"
                style={{ color: tab === 'delegation' ? '#FFFFFF' : '#64748B' }}
              >
                广告代投
                {tab === 'delegation' && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                      background: 'linear-gradient(90deg, #7B2CFF, #00D4FF)',
                      boxShadow: '0 0 8px rgba(123, 44, 255, 0.5)',
                    }}
                  />
                )}
              </button>
            </div>

            {/* Product detail left-right layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: 宣传图 */}
              <div className="lg:w-1/2">
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(123, 44, 255, 0.15), rgba(0, 212, 255, 0.1))',
                    border: '1px solid rgba(123, 44, 255, 0.2)',
                    boxShadow: '0 0 20px rgba(123, 44, 255, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)',
                  }}
                >
                  <img
                    src={tab === 'facebook' ? '/A_001.png' : '/A_002.JPG'}
                    alt={tab === 'facebook' ? 'Facebook三不限账户' : '广告代投'}
                    className="w-full min-h-[400px] object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Right: 文字区 */}
              <div className="lg:w-1/2 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white">
                    {tab === 'facebook' ? 'Facebook 三不限账户' : '广告代投'}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: '#AAB7C4' }}>
                    {tab === 'facebook'
                      ? '高质量Facebook三不限账户，支持全球开户，行业不限，数量充足，7*24小时服务，账户交付有保障！'
                      : '安排资深投手配置广告投放，全程托管，从受众定位、账户搭建、素材测试到持续迭代调优全流程落地，科学把控投放预算，优化转化链路，助力业务拿到稳定可预期的广告 ROI，收取4%操作费。'}
                  </p>

                  {/* Benefit rows */}
                  <div className="space-y-2.5">
                    {benefits.map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" style={{ color: '#00D4FF' }} />
                        <span className="text-sm text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stock */}
                  <p className="text-sm" style={{ color: '#AAB7C4' }}>
                    库存：<span className="text-white font-medium">{tab === 'facebook' ? '83' : '充足'}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Price */}
                  <p
                    className="text-3xl font-bold"
                    style={{
                      color: '#FF2BD6',
                      textShadow: '0 0 10px rgba(255, 43, 214, 0.5)',
                    }}
                  >
                    {tab === 'facebook' ? '$5.00/个起' : '$800.00起'}
                  </p>

                  {/* Full-width gradient button */}
                  <button
                    className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
                      boxShadow: '0 0 12px rgba(123, 44, 255, 0.4)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(123, 44, 255, 0.6)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(123, 44, 255, 0.4)'
                    }}
                    onClick={() => {
                      if (tab === 'facebook') {
                        handleRechargeClick(facebookRechargeOptions)
                      } else {
                        handleRechargeClick(delegationRechargeOptions)
                      }
                    }}
                  >
                    {tab === 'facebook' ? '立即租赁' : '立即投放'}
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 3 small glass-2 glowing buttons */}
          <div className="flex gap-3">
            {featureButtons.map((label) => (
              <button
                key={label}
                className="glass-2 px-5 py-2.5 rounded-lg text-sm text-text-secondary hover:text-white transition-all duration-200 hover:shadow-glow-weak"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tags with checkmarks */}
          <div className="flex gap-3">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  border: `1px solid ${tag.color}30`,
                }}
              >
                <CheckCircle className="w-3 h-3" />
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      <RechargeModal
        open={showRecharge}
        onClose={() => setShowRecharge(false)}
        options={rechargeOptions}
      />
    </div>
  )
}