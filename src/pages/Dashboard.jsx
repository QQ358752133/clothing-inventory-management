import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  TrendingUp
} from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  
  // 刷新数据函数（保留按钮功能）
  const refreshStats = () => {
    // 刷新逻辑已简化，因为统计数据已移除
    console.log('刷新数据')
  }
  
  const quickActions = [
    {
      title: '快速入库',
      description: '添加新服装到库存',
      icon: Package,
      path: '/stock-in',
      color: '#4CAF50'
    },
    {
      title: '快速出库',
      description: '销售服装并更新库存',
      icon: TrendingUp,
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
      title: '添加服装',
      description: '新增服装品类',
      icon: Shirt,
      path: '/clothing',
      color: '#9C27B0'
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
        <h1 className="text-xl font-semibold">仪表板</h1>
        <button 
          onClick={refreshStats}
          className="btn btn-secondary"
          style={{ 
            minHeight: '36px', 
            padding: '6px 12px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RefreshCw size={14} />
          刷新数据
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
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
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
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
                    fontSize: '18px',
                    fontWeight: '600',
                    color: action.color
                  }}>
                    {action.title}
                  </span>
                </div>
                <p style={{
                  color: '#666',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  margin: 0
                }}>
                  {action.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 最近活动 */}
      <div className="card">
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Activity size={20} />
          最近活动
        </h2>
        <div style={{
          color: '#666',
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <Calendar size={48} color="#ccc" style={{ marginBottom: '16px' }} />
          <p>暂无最近活动记录</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            开始使用系统后，这里将显示您的操作记录
          </p>
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
const Activity = ({ size }) => <span style={{ fontSize: size }}>📊</span>
const Calendar = ({ size }) => <span style={{ fontSize: size }}>📅</span>

export default Dashboard