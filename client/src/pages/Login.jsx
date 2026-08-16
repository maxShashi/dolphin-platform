import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ChevronDown, Loader2 } from 'lucide-react'

export default function Login() {
  const { login, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginTab, setLoginTab] = useState('email')
  const [language, setLanguage] = useState('简体中文')
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  // Register form fields
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isRegister) {
      if (!regUsername || !regEmail || !regPassword || !regConfirmPassword) {
        setError('请填写所有字段')
        return
      }
      if (regPassword !== regConfirmPassword) {
        setError('两次输入的密码不一致')
        return
      }
      if (regPassword.length < 6) {
        setError('密码长度至少6位')
        return
      }
      setLoading(true)
      setError('')
      try {
        await register({ username: regUsername, email: regEmail, password: regPassword })
      } catch (err) {
        setError(err.response?.data?.message || '注册失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    } else {
      if (!email || !password) {
        setError('请输入邮箱和密码')
        return
      }
      setLoading(true)
      setError('')
      try {
        await login(email, password)
      } catch (err) {
        setError(err.response?.data?.message || '登录失败，请检查邮箱和密码')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ backgroundColor: '#070B1A' }}>
      {/* Left Side - Atmosphere Area (60%) */}
      <div className="w-[60%] relative flex flex-col items-center justify-center px-12 py-8" style={{ minHeight: '100vh' }}>
        {/* Background glows */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(123, 44, 255, 0.15) 0%, transparent 70%)',
          transform: 'translate(-20%, -20%)',
        }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
          transform: 'translate(20%, 20%)',
        }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Particle dots */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(123, 44, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Top-left logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
          <img
            src="/logo.png?v=2"
            alt="海豚数字营销平台"
            className="w-8 h-8 object-contain"
            style={{ filter: 'drop-shadow(0 0 6px rgba(123, 44, 255, 0.6))' }}
          />
          <span className="text-white text-base font-semibold">海豚数字营销平台-客户端</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            全球一站式智能营销服务平台
          </h1>
          <p className="text-sm text-text-muted mb-12">
            Global one-stop intelligent marketing service platform
          </p>

          {/* Map Image with gradient transition */}
          <div className="w-full max-w-lg mb-4 relative">
            {/* Gradient fade overlay at top and bottom */}
            <div className="absolute inset-0 pointer-events-none z-10" style={{
              background: 'linear-gradient(to top, #070B1A 0%, transparent 15%, transparent 85%, #070B1A 100%)',
            }} />
            <img
              src="/map.png"
              alt="全球服务覆盖"
              className="w-full h-auto object-contain relative z-0"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(123, 44, 255, 0.3))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (40%) */}
      <div className="w-[40%] relative flex items-center justify-center" style={{ minHeight: '100vh' }}>
        {/* Background overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(135deg, rgba(123, 44, 255, 0.05) 0%, transparent 50%, rgba(0, 212, 255, 0.05) 100%)',
        }} />

        <div className="relative z-10 w-full max-w-md px-8">
          {/* Language Dropdown - Top Right */}
          <div className="flex justify-end mb-6 relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {language}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showLangMenu && (
              <div className="absolute top-full right-0 mt-1 glass-3 py-1 min-w-[130px] z-50">
                <button
                  onClick={() => { setLanguage('简体中文'); setShowLangMenu(false) }}
                  className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/5"
                >
                  简体中文
                </button>
                <button
                  onClick={() => { setLanguage('English'); setShowLangMenu(false) }}
                  className="w-full px-3 py-2 text-sm text-text-tertiary text-left hover:bg-white/5"
                >
                  English
                </button>
              </div>
            )}
          </div>

          {/* Login Card */}
          <div className="glass-1 p-8 w-full">
            {/* Tab Switch */}
            <div className="flex gap-6 mb-8 border-b border-white/5">
              <button
                onClick={() => setLoginTab('email')}
                className="pb-3 text-sm font-medium relative transition-colors"
                style={{ color: loginTab === 'email' ? '#FFFFFF' : '#64748B' }}
              >
                邮箱登录
                {loginTab === 'email' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{
                    background: 'linear-gradient(90deg, #7B2CFF, #00D4FF)',
                    boxShadow: '0 0 8px rgba(123, 44, 255, 0.5)',
                  }} />
                )}
              </button>
              <button
                onClick={() => setLoginTab('oauth')}
                className="pb-3 text-sm font-medium relative transition-colors"
                style={{ color: loginTab === 'oauth' ? '#FFFFFF' : '#64748B' }}
              >
                授权登录
                {loginTab === 'oauth' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{
                    background: 'linear-gradient(90deg, #7B2CFF, #00D4FF)',
                    boxShadow: '0 0 8px rgba(123, 44, 255, 0.5)',
                  }} />
                )}
              </button>
            </div>

            {loginTab === 'email' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="px-4 py-3 rounded-lg text-sm" style={{
                    color: '#FF4D4D',
                    background: 'rgba(255, 77, 77, 0.1)',
                    border: '1px solid rgba(255, 77, 77, 0.2)',
                  }}>
                    {error}
                  </div>
                )}

                {isRegister ? (
                  <>
                    {/* Register Username */}
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">
                        <span style={{ color: '#FF4D4D' }}>*</span>
                        用户名
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="请输入用户名"
                        className="w-full px-4 py-2.5 rounded-lg text-sm text-text-secondary outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#00D4FF'; e.target.style.boxShadow = '0 0 8px rgba(0, 212, 255, 0.3)' }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none' }}
                      />
                    </div>
                    {/* Register Email */}
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">
                        <span style={{ color: '#FF4D4D' }}>*</span>
                        邮箱
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="请输入邮箱地址"
                        className="w-full px-4 py-2.5 rounded-lg text-sm text-text-secondary outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#00D4FF'; e.target.style.boxShadow = '0 0 8px rgba(0, 212, 255, 0.3)' }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none' }}
                      />
                    </div>
                    {/* Register Password */}
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">
                        <span style={{ color: '#FF4D4D' }}>*</span>
                        密码
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="请输入密码（至少6位）"
                          className="w-full px-4 py-2.5 rounded-lg text-sm text-text-secondary outline-none transition-all duration-200 pr-10"
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#00D4FF'; e.target.style.boxShadow = '0 0 8px rgba(0, 212, 255, 0.3)' }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-tertiary transition-colors"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">
                        <span style={{ color: '#FF4D4D' }}>*</span>
                        确认密码
                      </label>
                      <div className="relative">
                        <input
                          type={showRegConfirm ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="请再次输入密码"
                          className="w-full px-4 py-2.5 rounded-lg text-sm text-text-secondary outline-none transition-all duration-200 pr-10"
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#00D4FF'; e.target.style.boxShadow = '0 0 8px rgba(0, 212, 255, 0.3)' }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirm(!showRegConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-tertiary transition-colors"
                        >
                          {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Email Input */}
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">
                        <span style={{ color: '#FF4D4D' }}>*</span>
                        邮箱
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="请输入邮箱地址"
                          className="w-full px-4 py-2.5 rounded-lg text-sm text-text-secondary outline-none transition-all duration-200"
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#00D4FF'; e.target.style.boxShadow = '0 0 8px rgba(0, 212, 255, 0.3)' }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none' }}
                        />
                      </div>
                    </div>
                    {/* Password Input */}
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">
                        <span style={{ color: '#FF4D4D' }}>*</span>
                        密码
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="请输入密码"
                          className="w-full px-4 py-2.5 rounded-lg text-sm text-text-secondary outline-none transition-all duration-200 pr-10"
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#00D4FF'; e.target.style.boxShadow = '0 0 8px rgba(0, 212, 255, 0.3)' }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-tertiary transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-200 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #7B2CFF 0%, #00D4FF 100%)',
                    boxShadow: '0 0 16px rgba(123, 44, 255, 0.4), 0 0 32px rgba(0, 212, 255, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(123, 44, 255, 0.6), 0 0 48px rgba(0, 212, 255, 0.3)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(123, 44, 255, 0.4), 0 0 32px rgba(0, 212, 255, 0.2)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isRegister ? '注册中...' : '登录中...'}
                    </span>
                  ) : (
                    isRegister ? '注册' : '登录'
                  )}
                </button>

                {/* Bottom Row */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-text-muted">
                    {isRegister ? '已有账号？' : '没有账号？'}
                    <span
                      className="cursor-pointer font-medium ml-1"
                      style={{ color: '#00D4FF' }}
                      onClick={() => { setIsRegister(!isRegister); setError('') }}
                    >
                      {isRegister ? '去登录' : '立即注册'}
                    </span>
                  </div>
                  {!isRegister && (
                    <span className="text-sm text-text-muted cursor-pointer hover:text-text-tertiary transition-colors">
                      忘记密码
                    </span>
                  )}
                </div>
              </form>
            ) : (
              /* OAuth Login Tab Content */
              <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                <p className="text-sm">第三方授权登录</p>
                <div className="flex gap-4 mt-6">
                  <button className="w-12 h-12 rounded-full glass-2 flex items-center justify-center hover:border-brand-500/30 transition-all duration-200">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="1.5">
                      <rect x="2" y="2" width="20" height="20" rx="4" />
                      <path d="M12 6v12M6 12h12" />
                    </svg>
                  </button>
                  <button className="w-12 h-12 rounded-full glass-2 flex items-center justify-center hover:border-brand-500/30 transition-all duration-200">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00D4FF">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-6">敬请期待更多授权方式</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}