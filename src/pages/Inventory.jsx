import React, { useState, useEffect } from 'react'
import { Warehouse, Search, AlertTriangle, TrendingDown } from 'lucide-react'
import { db } from '../db/database'

const Inventory = ({ refreshStats }) => {
  const [inventory, setInventory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState(10) // 默认值

  useEffect(() => {
    loadInventory()
    loadLowStockThreshold()
  }, [])
  
  // 从系统设置中加载低库存阈值
  const loadLowStockThreshold = async () => {
    try {
      const setting = await db.settings.get({ key: 'lowStockThreshold' })
      if (setting) {
        setLowStockThreshold(setting.value)
      }
    } catch (error) {
      console.error('加载低库存阈值失败:', error)
    }
  }

  const loadInventory = async () => {
    try {
      const [allInventory, allClothes] = await Promise.all([
        db.inventory.toArray(),
        db.clothes.toArray()
      ])
      
      // 合并库存和服装信息
      const inventoryWithDetails = allInventory.map(inv => {
        const clothing = allClothes.find(c => c.id === inv.clothingId)
        return {
          ...inv,
          clothing: clothing || {},
          totalValue: clothing ? inv.quantity * clothing.purchasePrice : 0
        }
      }).filter(item => item.clothing.id) // 过滤掉没有对应服装的库存记录
      
      setInventory(inventoryWithDetails)
    } catch (error) {
      console.error('加载库存数据失败:', error)
    }
  }

  const filteredInventory = inventory.filter(item =>
    item.clothing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.clothing.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.clothing.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = filteredInventory.filter(item => item.quantity <= lowStockThreshold)
  const outOfStockItems = filteredInventory.filter(item => item.quantity === 0)

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: '缺货', color: '#f44336', bgColor: '#FFEBEE' }
    if (quantity <= lowStockThreshold) return { text: '低库存', color: '#FF9800', bgColor: '#FFF3E0' }
    return { text: '充足', color: '#4CAF50', bgColor: '#E8F5E8' }
  }

  const calculateTotalInventoryValue = () => {
    return inventory.reduce((total, item) => total + item.totalValue, 0)
  }

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 className="text-xl font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Warehouse size={24} />
          库存查询
        </h1>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999'
            }} />
            <input
              type="text"
              placeholder="搜索服装名称、编码或品类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px', minHeight: '44px' }}
            />
          </div>
        </div>
      </div>

      {/* 库存概览 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
              <Warehouse size={24} color="#2196F3" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>总库存品类</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#2196F3' }}>
                {filteredInventory.length}
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
              <TrendingDown size={24} color="#4CAF50" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>库存总价值</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#4CAF50' }}>
                ¥{calculateTotalInventoryValue().toLocaleString()}
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
                {lowStockItems.length}
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
              background: '#FFEBEE',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={24} color="#f44336" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>缺货商品</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#f44336' }}>
                {outOfStockItems.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 库存列表 */}
      <div className="card">
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '24px'
        }}>
          库存明细 ({filteredInventory.length} 个品类)
        </h2>
        
        {filteredInventory.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            <Warehouse size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <p>暂无库存数据</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              请先添加服装并进行入库操作
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>服装编码</th>
                  <th>服装名称</th>
                  <th>品类</th>
                  <th>尺码</th>
                  <th>颜色</th>
                  <th>库存数量</th>
                  <th>库存状态</th>
                  <th>进货价格</th>
                  <th>库存价值</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => {
                  const status = getStockStatus(item.quantity)
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '600' }}>{item.clothing.code}</td>
                      <td>{item.clothing.name}</td>
                      <td>{item.clothing.category}</td>
                      <td>{item.clothing.size}</td>
                      <td>{item.clothing.color}</td>
                      <td style={{ 
                        fontWeight: '600',
                        color: item.quantity === 0 ? '#f44336' : item.quantity <= lowStockThreshold ? '#FF9800' : '#4CAF50'
                      }}>
                        {item.quantity} 件
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: status.bgColor,
                          color: status.color
                        }}>
                          {status.text}
                        </span>
                      </td>
                      <td>¥{item.clothing.purchasePrice.toFixed(2)}</td>
                      <td style={{ fontWeight: '600', color: '#2196F3' }}>
                        ¥{item.totalValue.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 低库存预警 */}
      {lowStockItems.length > 0 && (
        <div className="card" style={{ marginTop: '24px', borderLeft: '4px solid #FF9800' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#FF9800'
          }}>
            <AlertTriangle size={20} />
            低库存预警 ({lowStockItems.length} 个品类)
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {lowStockItems.map(item => (
              <div key={item.id} style={{
                padding: '12px',
                background: '#FFF3E0',
                borderRadius: '8px',
                border: '1px solid #FFE0B2'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {item.clothing.name}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {item.clothing.code} | 库存: {item.quantity}件
                </div>
                <div style={{ fontSize: '12px', color: '#FF9800', marginTop: '4px' }}>
                  建议及时补货
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory