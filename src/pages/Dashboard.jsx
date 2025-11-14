import React from 'react'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate()
  
  // 刷新数据函数（保留按钮功能）
  const refreshStats = () => {
    // 刷新逻辑已简化，因为统计数据已移除
    console.log('刷新数据')
  }
  
  // 创建自定义图标组件，使用emoji作为lucide-react的替代
  const PackageIcon = ({ size }) => <span style={{ fontSize: size }}>📦</span>
  const TrendingUpIcon = ({ size }) => <span style={{ fontSize: size }}>📈</span>

  const quickActions = [
    {
      title: '快速入库',
      description: '添加新服装到库存',
      icon: PackageIcon,
      path: '/stock-in',
      color: '#4CAF50'
    },
    {
      title: '快速出库',
      description: '销售服装并更新库存',
      icon: TrendingUpIcon,
      path: '/stock-out',
      color: '#2196F3'
    },
    {
      title: '查看库存',
      description: '检查当前库存状态',
      icon: Warehouse,
      path: '/inventory',
      color: '#FF9800'
    },
    {
      title: '商品管理',
      description: '管理商品信息',
      icon: Shirt,
      path: '/clothing',
      color: '#9C27B0'
    },
    {
      title: '统计报表',
      description: '查看库存统计报表',
      icon: BarChart3,
      path: '/reports',
      color: '#F44336'
    },
    {
      title: '数据查看器',
      description: '查看和导出数据',
      icon: Database,
      path: '/data-viewer',
      color: '#00BCD4'
    },
    {
      title: '系统设置',
      description: '配置系统参数',
      icon: Settings,
      path: '/settings',
      color: '#FFC107'
    }
  ]

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px'
      }}>
        <h1 className="text-xl font-semibold">快速操作</h1>
        <button 
          onClick={refreshStats}
          className="btn btn-secondary"
          style={{ 
            minHeight: '32px', 
            padding: '4px 10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap',
            // 移动端优化
            maxWidth: '120px'
          }}
        >
          <RefreshCw size={12} />
          刷新
        </button>
      </div>

      {/* 统计卡片已移除，按照需求不显示服装品类总数、库存总价值和低库存预警 */}

      {/* 快速操作 */}
      <div className="card">
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Zap size={20} />
          快速操作
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {quickActions.map((action, index) => {
            const IconComponent = action.icon
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                style={{
                  background: 'white',
                  border: `2px solid ${action.color}20`,
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '90px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    background: `${action.color}20`,
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconComponent size={20} color={action.color} />
                  </div>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: action.color
                  }}>
                    {action.title}
                  </span>
                </div>
                <p style={{
                  color: '#666',
                  fontSize: '13px',
                  lineHeight: '1.3',
                  margin: 0
                }}>
                  {action.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>


    </div>
  )
}

// 图标组件（使用emoji作为简化替代）
const RefreshCw = ({ size }) => <span style={{ fontSize: size }}>↻</span>
const Warehouse = ({ size }) => <span style={{ fontSize: size }}>📦</span>
const Shirt = ({ size }) => <span style={{ fontSize: size }}>👕</span>
const Zap = ({ size }) => <span style={{ fontSize: size }}>⚡</span>
const BarChart3 = ({ size }) => <span style={{ fontSize: size }}>📈</span>
const Database = ({ size }) => <span style={{ fontSize: size }}>🗄️</span>
const Settings = ({ size }) => <span style={{ fontSize: size }}>⚙️</span>

export default Dashboard