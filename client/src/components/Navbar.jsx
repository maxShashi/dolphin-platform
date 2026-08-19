import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onMenuToggle, sidebarOpen }) {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const menuRef = useRef(null)
  const langRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 md:px-6"
      style={{
        background: 'rgba(15, 20, 40, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderImage: 'linear-gradient(90deg, #7B2CFF, #FF2BD6, #00D4FF) 1',
        boxShadow: '0 0 6px rgba(123, 44, 255, 0.4)',
      }}
    >
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors text-text-tertiary"
          aria-label="菜单"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src="/logo.png?v=2" alt="海豚数字营销平台" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
        <span className="text-base md:text-lg font-bold gradient-text hidden sm:inline">
          海豚数字营销平台
        </span>
      </div>

      {/* Center: decorative */}
      <div className="hidden md:flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-breathe" />
        <span className="text-xs text-text-muted ml-1.5">系统运行中</span>
      </div>

      {/* Right: icons */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Language */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="hidden sm:flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm text-text-tertiary hover:text-white"
          >
            简体中文
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-1 glass-3 py-1 min-w-[120px] z-50">
              <button className="w-full px-3 py-2 text-sm text-white text-left hover:bg-white/5">
                简体中文
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* User */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1 md:gap-2 px-1.5 md:px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div
              className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #7B2CFF, #00D4FF)',
              }}
            >
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs md:text-sm text-text-secondary hidden sm:block max-w-[80px] md:max-w-[100px] truncate">
              {user?.username || '用户'}
            </span>
            <ChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5 text-text-muted" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 glass-3 py-1 min-w-[160px] z-50">
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-sm text-white font-medium">{user?.username || '用户'}</p>
                <p className="text-xs text-text-muted mt-0.5">{user?.email || ''}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}