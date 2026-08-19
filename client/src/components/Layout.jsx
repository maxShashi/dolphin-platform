import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  UserCircle,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Wallet,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import Navbar from './Navbar'

const menuItems = [
  { path: '/dashboard', label: '首页', icon: LayoutDashboard },
  { path: '/purchase', label: '购买服务', icon: ShoppingCart },
  { path: '/accounts', label: '广告账号', icon: UserCircle },
  {
    label: '订单管理',
    icon: ClipboardList,
    children: [
      { path: '/orders/rental', label: '租赁订单管理' },
      { path: '/orders/delegation', label: '代投订单管理' },
    ],
  },
  { path: '/account-data', label: '账号数据', icon: BarChart3 },
  { path: '/bi-analysis', label: 'BI分析', icon: TrendingUp },
  { path: '/assets', label: '资产管理', icon: Wallet },
]

export default function Layout() {
  const location = useLocation()
  const [expandedMenu, setExpandedMenu] = useState('订单管理')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path) => location.pathname === path
  const isChildActive = (children) =>
    children && children.some((child) => location.pathname === child.path)

  const toggleExpand = (label) => {
    setExpandedMenu((prev) => (prev === label ? '' : label))
  }

  const closeSidebar = () => setSidebarOpen(false)

  const renderNavItems = (closeOnClick = false) =>
    menuItems.map((item) => {
      if (item.children) {
        const childActive = isChildActive(item.children)
        return (
          <div key={item.label}>
            <button
              onClick={() => toggleExpand(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                childActive
                  ? 'text-white'
                  : 'text-text-tertiary hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedMenu === item.label ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                expandedMenu === item.label ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="ml-8 mt-1 space-y-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    onClick={closeOnClick ? closeSidebar : undefined}
                    className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive(child.path)
                        ? 'text-white font-medium'
                        : 'text-text-tertiary hover:text-white'
                    }`}
                    style={
                      isActive(child.path)
                        ? {
                            background: 'linear-gradient(135deg, rgba(123, 44, 255, 0.2), rgba(0, 212, 255, 0.1))',
                            borderLeft: '2px solid #7B2CFF',
                            boxShadow: '0 0 8px rgba(123, 44, 255, 0.15)',
                          }
                        : {}
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        )
      }

      return (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={closeOnClick ? closeSidebar : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
            isActive(item.path)
              ? 'text-white font-medium'
              : 'text-text-tertiary hover:text-white hover:bg-white/5'
          }`}
          style={
            isActive(item.path)
              ? {
                  background: 'linear-gradient(135deg, rgba(123, 44, 255, 0.2), rgba(0, 212, 255, 0.1))',
                  borderLeft: '2px solid #7B2CFF',
                  boxShadow: '0 0 8px rgba(123, 44, 255, 0.15)',
                }
              : {}
          }
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{item.label}</span>
        </NavLink>
      )
    })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#070B1A' }}>
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside
        className={`sidebar-panel fixed left-0 top-0 h-screen w-[260px] z-40 pt-16 flex flex-col ${
          sidebarOpen ? 'open' : ''
        }`}
        style={{
          background: 'rgba(7, 11, 26, 0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Mobile close button */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-3 text-text-muted hover:text-white md:hidden z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {renderNavItems(true)}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="glass-1 px-3 py-2.5">
            <p className="text-xs text-text-muted">海豚数字营销平台</p>
            <p className="text-xs text-text-muted mt-0.5">v3.2.3</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 min-h-screen page-enter main-content">
        <Outlet />
      </main>
    </div>
  )
}