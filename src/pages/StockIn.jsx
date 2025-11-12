import React, { useState, useEffect } from 'react'
import { Plus, PackagePlus, Search, Trash2 } from 'lucide-react'
import { db } from '../db/database'

const StockIn = ({ refreshStats }) => {
  const [clothes, setClothes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [stockInItems, setStockInItems] = useState([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    operator: '财务',
    notes: ''
  })

  useEffect(() => {
    loadClothes()
  }, [])

  const loadClothes = async () => {
    try {
      const allClothes = await db.clothes.toArray()
      setClothes(allClothes)
    } catch (error) {
      console.error('加载服装数据失败:', error)
    }
  }

  const addStockInItem = () => {
    setStockInItems([...stockInItems, {
      id: Date.now(),
      clothingId: '',
      quantity: 1,
      purchasePrice: 0
    }])
  }

  const updateStockInItem = (id, field, value) => {
    setStockInItems(stockInItems.map(item => {
      if (item.id === id) {
        // 如果是选择服装，自动填充进货价
        if (field === 'clothingId' && value) {
          const selectedClothing = clothes.find(c => c.id === parseInt(value));
          if (selectedClothing && selectedClothing.purchasePrice) {
            return {
              ...item,
              [field]: value,
              purchasePrice: selectedClothing.purchasePrice
            };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }))
  }

  const removeStockInItem = (id) => {
    setStockInItems(stockInItems.filter(item => item.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 验证数据
    const invalidItems = stockInItems.filter(item => 
      !item.clothingId || item.quantity <= 0 || item.purchasePrice <= 0
    )
    
    if (invalidItems.length > 0) {
      alert('请完善所有入库项目的服装、数量和进货价格信息')
      return
    }

    try {
      for (const item of stockInItems) {
        const clothingId = parseInt(item.clothingId)
        const totalAmount = item.quantity * item.purchasePrice
        
        // 添加入库记录
        await db.stockIn.add({
          clothingId: clothingId,
          quantity: parseInt(item.quantity),
          purchasePrice: parseFloat(item.purchasePrice),
          totalAmount: totalAmount,
          date: formData.date,
          operator: formData.operator,
          notes: formData.notes,
          createdAt: new Date()
        })
        
        // 更新库存
        const existingInventory = await db.inventory
          .where('clothingId')
          .equals(clothingId)
          .first()
        
        if (existingInventory) {
          await db.inventory.update(existingInventory.id, {
            quantity: existingInventory.quantity + parseInt(item.quantity),
            updatedAt: new Date()
          })
        } else {
          await db.inventory.add({
            clothingId: clothingId,
            quantity: parseInt(item.quantity),
            updatedAt: new Date()
          })
        }
        
        // 自动更新服装的进货价格
        await db.clothes.update(clothingId, {
          purchasePrice: parseFloat(item.purchasePrice),
          updatedAt: new Date()
        })
      }
      
      // 重置表单
      setStockInItems([])
      setFormData({
        date: new Date().toISOString().split('T')[0],
        operator: '',
        notes: ''
      })
      
      alert('入库操作成功完成！')
      refreshStats()
    } catch (error) {
      console.error('入库操作失败:', error)
      alert('入库操作失败，请重试')
    }
  }

  const filteredClothes = clothes.filter(clothing =>
    clothing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clothing.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const calculateTotalAmount = () => {
    return stockInItems.reduce((total, item) => {
      return total + (item.quantity * item.purchasePrice)
    }, 0)
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
          <PackagePlus size={24} />
          入库管理
        </h1>
      </div>

      {/* 入库表单 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '24px'
        }}>
          新增入库记录
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* 基本信息 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="form-group">
              <label className="form-label">入库日期 *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">操作员 *</label>
              <input
                type="text"
                required
                value={formData.operator}
                onChange={(e) => setFormData({...formData, operator: e.target.value})}
                className="form-input"
                placeholder="输入操作员姓名"
              />
            </div>
          </div>

          {/* 搜索服装 */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">搜索服装</label>
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
                placeholder="搜索服装名称或编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px', minHeight: '44px' }}
              />
            </div>
          </div>

          {/* 入库项目列表 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>入库项目</h3>
              <button 
                type="button"
                onClick={addStockInItem}
                className="btn btn-primary"
                style={{ 
                  minHeight: '36px', 
                  padding: '4px 12px',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} />
                添加
              </button>
            </div>

            {stockInItems.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666',
                border: '2px dashed #e0e0e0',
                borderRadius: '8px'
              }}>
                <PackagePlus size={32} color="#ccc" style={{ marginBottom: '16px' }} />
                <p>暂无入库项目</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  点击"添加项目"按钮开始添加入库服装
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stockInItems.map((item, index) => (
                  <div key={item.id} className="card" style={{ 
                    padding: '16px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontWeight: '600' }}>项目 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeStockInItem(item.id)}
                        className="btn btn-danger"
                        style={{ padding: '8px', minHeight: 'auto' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '12px'
                    }}>
                      <div className="form-group">
                        <label className="form-label">选择服装 *</label>
                        <select
                          required
                          value={item.clothingId}
                          onChange={(e) => updateStockInItem(item.id, 'clothingId', e.target.value)}
                          className="form-input"
                        >
                          <option value="">选择服装</option>
                          {filteredClothes.map(clothing => (
                            <option key={clothing.id} value={clothing.id}>
                              {clothing.code} - {clothing.name} ({clothing.size}/{clothing.color})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">数量 *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => updateStockInItem(item.id, 'quantity', e.target.value)}
                          className="form-input"
                          placeholder="1"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">进货价格 *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={item.purchasePrice}
                          onChange={(e) => updateStockInItem(item.id, 'purchasePrice', e.target.value)}
                          className="form-input"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">小计</label>
                        <div style={{
                          padding: '12px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          fontWeight: '600',
                          color: '#2196F3'
                        }}>
                          ¥{(item.quantity * item.purchasePrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 总金额和备注 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="form-group">
              <label className="form-label">入库总金额</label>
              <div style={{
                padding: '12px',
                background: '#E8F5E8',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '18px',
                color: '#4CAF50',
                textAlign: 'center'
              }}>
                ¥{calculateTotalAmount().toFixed(2)}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="form-input"
                placeholder="可选的备注信息"
                rows="3"
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              onClick={() => {
                setStockInItems([])
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  operator: '',
                  notes: ''
                })
              }}
              className="btn btn-secondary"
              style={{ minHeight: '44px' }}
            >
              重置
            </button>
            <button 
              type="submit"
              disabled={stockInItems.length === 0}
              className="btn btn-success"
              style={{ minHeight: '44px' }}
            >
              确认入库
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockIn