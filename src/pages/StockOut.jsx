import React, { useState, useEffect } from 'react'
import { Plus, PackageMinus, Trash2, Calculator } from 'lucide-react'
import { db } from '../db/database'
import Alert from '../components/Alert'

// 获取声音设置
const getSoundSettings = async () => {
  try {
    const setting = await db.settings.get({ key: 'soundEnabled' })
    // 默认启用声音
    return setting !== undefined ? setting.value : true
  } catch (error) {
    console.error('获取声音设置失败:', error)
    // 默认启用声音
    return true
  }
}

// 播放成功提示音 - 支持自定义音频文件
const playSuccessSound = async () => {
  try {
    // 检查声音设置
    const isSoundEnabled = await getSoundSettings()
    
    // 如果声音被禁用，不播放声音
    if (!isSoundEnabled) {
      return
    }
    
    // 提高音量以确保可听见
    const audio = new Audio('/audio/success.mp3')
    audio.volume = 0.5 // 从0.1提高到0.5
    
    // 检查并激活AudioContext（解决iOS问题）
    if (window.AudioContext || window.webkitAudioContext) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
    }
    
    audio.onerror = () => {
      console.log('自定义音频文件未找到，使用默认音效')
      playDefaultSuccessSound()
    }
    
    await audio.play()
  } catch (error) {
    console.error('播放自定义音频失败，使用默认音效:', error)
    playDefaultSuccessSound()
  }
}

// 默认的成功提示音 - 叮咚音效
const playDefaultSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // 确保AudioContext处于运行状态（解决iOS问题）
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    
    // 生成"叮"的声音 (高音)
    const dingOscillator = audioContext.createOscillator()
    const dingGain = audioContext.createGain()
    dingOscillator.connect(dingGain)
    dingGain.connect(audioContext.destination)
    
    dingOscillator.type = 'sine'
    dingOscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
    dingOscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1)
    
    dingGain.gain.setValueAtTime(0.5, audioContext.currentTime) // 提高音量
    dingGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    dingOscillator.start(audioContext.currentTime)
    dingOscillator.stop(audioContext.currentTime + 0.1)
    
    // 生成"咚"的声音 (低音)
    const dongOscillator = audioContext.createOscillator()
    const dongGain = audioContext.createGain()
    dongOscillator.connect(dongGain)
    dongGain.connect(audioContext.destination)
    
    dongOscillator.type = 'sine'
    dongOscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.15)
    dongOscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.3)
    
    dongGain.gain.setValueAtTime(0.5, audioContext.currentTime + 0.15) // 提高音量
    dongGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    dongOscillator.start(audioContext.currentTime + 0.15)
    dongOscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.error('播放默认声音失败:', error)
  }
}

const StockOut = ({ refreshStats }) => {
  const [clothes, setClothes] = useState([])
  const [inventory, setInventory] = useState([])
  // 默认展开销售项目部，添加一个空的销售项目
  const [stockOutItems, setStockOutItems] = useState([{
    id: Date.now(),
    clothingId: '',
    quantity: 1,
    sellingPrice: 0,
    availableQuantity: 0
  }])
  // 使用getCurrentDate函数获取当前日期，确保准确性
  const getCurrentDate = () => {
    const now = new Date()
    // 使用本地日期格式化，避免时区偏差
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const [formData, setFormData] = useState({
    date: getCurrentDate(),
    operator: '店长-符文静',
    notes: ''
  })
  // 页面加载时更新日期，确保即使组件被缓存也能获取最新日期
  useEffect(() => {
    setFormData(prev => ({ ...prev, date: getCurrentDate() }))
  }, [])
  
  // 自定义弹窗状态
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('success')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [allClothes, allInventory] = await Promise.all([
        db.clothes.toArray(),
        db.inventory.toArray()
      ])
      setClothes(allClothes)
      setInventory(allInventory)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const addStockOutItem = () => {
    setStockOutItems([...stockOutItems, {
      id: Date.now(),
      clothingId: '',
      quantity: 1,
      sellingPrice: 0,
      availableQuantity: 0
    }])
  }

  const updateStockOutItem = (id, field, value) => {
    const updatedItems = stockOutItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // 如果选择了服装，自动设置销售价格和可用数量
        if (field === 'clothingId' && value) {
          const selectedClothing = clothes.find(c => c.id === parseInt(value))
          const inventoryItem = inventory.find(inv => inv.clothingId === parseInt(value))
          
          if (selectedClothing) {
            // 确保价格精度，避免浮点数误差
            updatedItem.sellingPrice = Math.round(selectedClothing.sellingPrice * 100) / 100
            updatedItem.availableQuantity = inventoryItem ? inventoryItem.quantity : 0
          }
        }
        
        // 如果直接修改销售价格，也确保精度
        if (field === 'sellingPrice') {
          updatedItem.sellingPrice = Math.round(parseFloat(value) * 100) / 100
        }
        
        return updatedItem
      }
      return item
    })
    
    setStockOutItems(updatedItems)
  }

  const removeStockOutItem = (id) => {
    setStockOutItems(stockOutItems.filter(item => item.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 验证数据
    const invalidItems = stockOutItems.filter(item => 
      !item.clothingId || item.quantity <= 0 || item.sellingPrice <= 0
    )
    
    if (invalidItems.length > 0) {
      alert('请完善所有出库项目的服装、数量和销售价格信息')
      return
    }

    // 检查库存是否足够
    const insufficientStock = stockOutItems.filter(item => 
      item.quantity > item.availableQuantity
    )
    
    if (insufficientStock.length > 0) {
      const itemNames = insufficientStock.map(item => {
        const clothing = clothes.find(c => c.id === parseInt(item.clothingId))
        return clothing ? clothing.name : '未知服装'
      })
      alert(`以下服装库存不足：${itemNames.join(', ')}`)
      return
    }

    try {
      for (const item of stockOutItems) {
        const clothing = clothes.find(c => c.id === parseInt(item.clothingId))
        const totalAmount = item.quantity * item.sellingPrice
        
        // 确保totalAmount计算正确
        const calculatedTotalAmount = parseFloat((item.quantity * item.sellingPrice).toFixed(2));
        
        // 添加出库记录，确保所有必要字段完整
        await db.stockOut.add({
          clothingId: parseInt(item.clothingId),
          quantity: parseInt(item.quantity),
          sellingPrice: Math.round(parseFloat(item.sellingPrice) * 100) / 100, // 确保价格精度，避免浮点数误差
          totalAmount: calculatedTotalAmount, // 使用精确计算的总金额
          date: formData.date,
          operator: formData.operator || '未知操作员',
          notes: formData.notes || '',
          createdAt: new Date(),
          updatedAt: new Date() // 添加更新时间字段，便于后续管理
        });
        
        // 标记离线更改
        if (!navigator.onLine) {
          db.markOfflineChange();
        }
        
        // 更新库存
        const existingInventory = await db.inventory
          .where('clothingId')
          .equals(parseInt(item.clothingId))
          .first()
        
        if (existingInventory) {
          await db.inventory.update(existingInventory.id, {
            quantity: existingInventory.quantity - parseInt(item.quantity),
            updatedAt: new Date()
          })
        }
      }
      
      // 重置表单，但保留操作员信息，并默认展开销售项目部
      setStockOutItems([{
        id: Date.now(),
        clothingId: '',
        quantity: 1,
        sellingPrice: 0,
        availableQuantity: 0
      }])
      setFormData({
        date: new Date().toISOString().split('T')[0],
        operator: formData.operator, // 保留操作员信息
        notes: ''
      })
      
      setAlertMessage(`出库操作成功完成！销售总额：¥${calculateTotalAmount().toFixed(2)}`)
      setAlertType('success')
      await playSuccessSound() // 播放成功提示音
      refreshStats()
    } catch (error) {
      console.error('出库操作失败:', error)
      setAlertMessage('出库操作失败，请重试')
      setAlertType('error')
    }
  }

  const filteredClothes = clothes.filter(clothing => {
    const inventoryItem = inventory.find(inv => inv.clothingId === clothing.id)
    const hasStock = inventoryItem && inventoryItem.quantity > 0
    
    return hasStock
  })

  const calculateTotalAmount = () => {
    const total = stockOutItems.reduce((sum, item) => {
      return sum + (item.quantity * item.sellingPrice)
    }, 0)
    return Math.round(total * 100) / 100
  }



  return (
    <div className="container">
      <Alert
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertMessage('')}
      />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 className="text-xl font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackageMinus size={24} />
          出库管理
        </h1>
      </div>

      {/* 出库表单 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '24px'
        }}>
          新增出库记录（销售）
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
              <label className="form-label">销售日期 *</label>
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



          {/* 出库项目列表 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>销售商品</h3>
              <button 
                type="button"
                onClick={addStockOutItem}
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

            {stockOutItems.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666',
                border: '2px dashed #e0e0e0',
                borderRadius: '8px'
              }}>
                <PackageMinus size={32} color="#ccc" style={{ marginBottom: '16px' }} />
                <p>暂无销售商品</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  点击"添加项目"按钮开始添加销售服装
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stockOutItems.map((item, index) => (
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
                      <span style={{ fontWeight: '600' }}>销售商品 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeStockOutItem(item.id)}
                        className="btn btn-danger"
                        style={{ 
                          padding: '8px', 
                          minHeight: 'auto',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
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
                          onChange={(e) => updateStockOutItem(item.id, 'clothingId', e.target.value)}
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
                        <label className="form-label">销售数量 *</label>
                        <input
                          type="number"
                          min="1"
                          max={item.availableQuantity}
                          required
                          value={item.quantity}
                          onChange={(e) => updateStockOutItem(item.id, 'quantity', e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          className="form-input"
                          placeholder="1"
                        />
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          可用库存: {item.availableQuantity} 件
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">销售价格 *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={item.sellingPrice}
                          onChange={(e) => updateStockOutItem(item.id, 'sellingPrice', e.target.value)}
                          onWheel={(e) => e.target.blur()}
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
                          color: '#4CAF50'
                        }}>
                          ¥{(item.quantity * item.sellingPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 金额统计 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="form-group">
              <label className="form-label">销售总额</label>
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
                // 重置表单，默认展开销售项目部
                setStockOutItems([{
                  id: Date.now(),
                  clothingId: '',
                  quantity: 1,
                  sellingPrice: 0,
                  availableQuantity: 0
                }])
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
              disabled={stockOutItems.length === 0}
              className="btn btn-success"
              style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Calculator size={16} />
              确认销售 (¥{calculateTotalAmount().toFixed(2)})
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockOut