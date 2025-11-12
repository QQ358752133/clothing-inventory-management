import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Shirt, 
  PackagePlus, 
  PackageMinus, 
  Warehouse,
  BarChart3,
  Settings,
  Database,
  Menu,
  X
} from 'lucide-react'

const Navigation = ({ activeTab, setActiveTab }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const navItems = [
    { id: 'dashboard', path: '/dashboard', label: '仪表板', icon: Home },
    { id: 'clothing', path: '/clothing', label: '服装管理', icon: Shirt },
    { id: 'stock-in', path: '/stock-in', label: '入库管理', icon: PackagePlus },
    { id: 'stock-out', path: '/stock-out', label: '出库管理', icon: PackageMinus },
    { id: 'inventory', path: '/inventory', label: '库存查询', icon: Warehouse },
    { id: 'reports', path: '/reports', label: '统计报表', icon: BarChart3 },
    { id: 'data-viewer', path: '/data-viewer', label: '数据查看器', icon: Database },
    { id: 'settings', path: '/settings', label: '系统设置', icon: Settings }
  ]

  // 手机端底部导航（只显示主要功能）
  const mobileNavItems = [
    { id: 'dashboard', path: '/dashboard', label: '仪表板', icon: Home },
    { id: 'stock-in', path: '/stock-in', label: '入库', icon: PackagePlus },
    { id: 'stock-out', path: '/stock-out', label: '出库', icon: PackageMinus },
    { id: 'inventory', path: '/inventory', label: '库存', icon: Warehouse },
    { id: 'menu', path: '#', label: '菜单', icon: Menu }
  ]

  const handleMobileNavClick = (item) => {
    if (item.id === 'menu') {
      setIsMobileMenuOpen(!isMobileMenuOpen)
    } else {
      setActiveTab(item.id)
      setIsMobileMenuOpen(false)
      // 使用React Router的navigate进行路由跳转
      navigate(item.path)
    }
  }

  if (isMobile) {
    return (
      <>
        {/* 手机端底部导航栏 */}
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0',
          zIndex: 1000,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}>
          {mobileNavItems.map(item => {
            const isActive = location.pathname === item.path
            const IconComponent = item.icon
            
            return (
              <button
                key={item.id}
                onClick={() => handleMobileNavClick(item)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#2196F3' : '#666',
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '400',
                  minWidth: '60px',
                  minHeight: '50px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* 手机端侧边菜单 */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: '60px',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <div style={{
              background: 'white',
              width: '280px',
              height: '100%',
              padding: '20px 0',
              overflowY: 'auto',
              animation: 'slideIn 0.3s ease'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 20px 20px',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>功能菜单</h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '0 20px'
              }}>
                {navItems.map(item => {
                  const isActive = location.pathname === item.path
                  const IconComponent = item.icon
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => {
                        setActiveTab(item.id)
                        setIsMobileMenuOpen(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: isActive ? '#2196F3' : '#666',
                        background: isActive ? '#E3F2FD' : 'transparent',
                        border: isActive ? '2px solid #2196F3' : '2px solid transparent',
                        fontWeight: isActive ? '600' : '400',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                        minHeight: '56px'
                      }}
                    >
                      <IconComponent size={20} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // 桌面端导航
  return (
    <nav style={{
      background: 'white',
      borderRight: '1px solid #e0e0e0',
      width: '280px',
      minHeight: 'calc(100vh - 80px)',
      padding: '20px 0',
      flexShrink: 0
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '0 20px'
      }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path
          const IconComponent = item.icon
          
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: isActive ? '#2196F3' : '#666',
                background: isActive ? '#E3F2FD' : 'transparent',
                border: isActive ? '2px solid #2196F3' : '2px solid transparent',
                fontWeight: isActive ? '600' : '400',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                minHeight: '56px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.background = '#f5f5f5'
                  e.target.style.color = '#333'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.background = 'transparent'
                  e.target.style.color = '#666'
                }
              }}
            >
              <IconComponent size={20} />
              {item.label}
            </Link>
          )
        })}
      </div>
      
      {/* 平板优化：底部操作提示 */}
      <div style={{
        marginTop: 'auto',
        padding: '20px',
        borderTop: '1px solid #e0e0e0',
        fontSize: '12px',
        color: '#999',
        textAlign: 'center'
      }}>
        触摸优化的导航菜单
      </div>
    </nav>
  )
}

export default Navigation