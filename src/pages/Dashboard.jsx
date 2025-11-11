import React from 'react'
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  Users
} from 'lucide-react'

const Dashboard = ({ stats, refreshStats }) => {
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
          style={{ minHeight: '44px' }}
        >
          <RefreshCw size={16} />
          刷新数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              background: '#E3F2FD',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={24} color="#2196F3" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>服装品类总数</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#2196F3' }}>
                {stats.totalClothes}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              background: '#E8F5E8',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={24} color="#4CAF50" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>库存总价值</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#4CAF50' }}>
                ¥{stats.totalValue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              background: '#FFF3E0',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={24} color="#FF9800" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>低库存预警</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#FF9800' }}>
                {stats.lowStockItems}
              </div>
            </div>
          </div>
        </div>
      </div>

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
                onClick={() => window.location.href = action.path}
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

// 添加缺失的图标组件
const RefreshCw = ({ size }) => <span>↻</span>
const Warehouse = ({ size }) => <span>📦</span>
const Shirt = ({ size }) => <span>👕</span>
const Zap = ({ size }) => <span>⚡</span>
const Activity = ({ size }) => <span>📊</span>

export default Dashboard