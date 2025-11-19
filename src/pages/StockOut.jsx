import React, { useState, useEffect, useRef } from 'react'
import { Plus, PackageMinus, Trash2, Calculator, RefreshCw } from 'lucide-react'
import { db } from '../db/database'
import Alert from '../components/Alert'

// 移除全局变量和事件监听器，避免内存泄漏

// 获取声音设置
const getSoundSettings = async () => {
  try {
    // 检查声音设置
    const setting = await db.settings.get({ key: 'soundEnabled' })
    // 默认启用声音
    return setting !== undefined ? setting.value : true
  } catch (error) {
    console.error('获取声音设置失败:', error)
    // 默认启用声音
    return true
  }
}

// 检查资源文件是否存在
const checkResourceExists = (url) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('HEAD', url)
    xhr.onload = () => resolve(xhr.status === 200)
    xhr.onerror = () => resolve(false)
    xhr.send()
  })
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
    
    // 使用try-catch包装整个音频处理逻辑
    try {
      // 先检查音频文件是否存在
      const audioExists = await checkResourceExists('/audio/success.mp3')
      
      if (audioExists) {
        // 使用更安全的方式创建和播放音频
        try {
          const audio = new Audio('/audio/success.mp3')
          audio.volume = 0.5
          
          // 安全地播放音频
          await audio.play()
        } catch (audioError) {
          console.warn('无法播放外部音频文件，切换到默认音效')
          playDefaultSuccessSound()
        }
      } else {
        // 如果音频文件不存在，使用默认音效
        playDefaultSuccessSound()
      }
    } catch (error) {
      console.warn('音频处理出错，跳过声音播放')
      // 静默失败，不影响应用流程
    }
  } catch (error) {
    // 捕获所有可能的错误，确保不影响应用
    console.debug('播放声音出错但已处理:', error)
  }
}

// 默认的成功提示音 - 叮咚音效
const playDefaultSuccessSound = () => {
  // 使用更安全的方式，避免在不支持的环境中出错
  if (!window.AudioContext && !window.webkitAudioContext) {
    return // 不支持AudioContext，静默退出
  }
  
  try {
    // 使用try-catch包装每个AudioContext操作
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const audioContext = new AudioContext()
    
    // 确保AudioContext处于运行状态
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {}) // 忽略可能的错误
    }
    
    // 使用Promise.all处理两个声音，确保不会互相阻塞
    const playDingSound = () => {
      try {
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()
        oscillator.connect(gain)
        gain.connect(audioContext.destination)
        
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1)
        
        gain.gain.setValueAtTime(0.5, audioContext.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (e) {
        console.debug('高音播放失败:', e)
      }
    }
    
    const playDongSound = () => {
      try {
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()
        oscillator.connect(gain)
        gain.connect(audioContext.destination)
        
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.15)
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.3)
        
        gain.gain.setValueAtTime(0.5, audioContext.currentTime + 0.15)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime + 0.15)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (e) {
        console.debug('低音播放失败:', e)
      }
    }
    
    playDingSound()
    playDongSound()
  } catch (error) {
    // 静默处理错误，不影响应用流程
    console.debug('播放默认声音失败但已处理:', error)
  }
}

const StockOut = ({ refreshStats }) => {
  // 组件卸载检测引用
  const isMountedRef = useRef(true)
  
  // 组件卸载时设置标志
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  // 安全的状态更新函数
  const safeSetState = (setStateFn, ...args) => {
    if (isMountedRef.current) {
      setStateFn(...args)
    }
  }
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
    // 使用安全的状态更新
    safeSetState(setFormData, prev => ({ ...prev, date: getCurrentDate() }))
  }, [])
  
  // 自定义弹窗状态
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('success')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // 立即检查组件是否已卸载
    if (!isMountedRef.current) return
    
    try {
      // 创建可取消的Promise包装器
      const cancelablePromise = (promise) => {
        let canceled = false;
        const wrappedPromise = new Promise((resolve, reject) => {
          promise.then(
            value => canceled ? reject({ canceled: true }) : resolve(value),
            error => canceled ? reject({ canceled: true }) : reject(error)
          );
        });
        return {
          promise: wrappedPromise,
          cancel: () => canceled = true
        };
      };
      
      // 包装异步操作
      const clothesPromise = cancelablePromise(db.clothes.toArray());
      const inventoryPromise = cancelablePromise(db.inventory.toArray());
      
      // 等待结果
      const [allClothes, allInventory] = await Promise.all([
        clothesPromise.promise,
        inventoryPromise.promise
      ]);
      
      // 再次检查组件是否仍在挂载
      if (!isMountedRef.current) return
      
      // 使用安全的状态更新
      safeSetState(setClothes, allClothes)
      safeSetState(setInventory, allInventory)
    } catch (error) {
      // 如果是取消的操作，不处理错误
      if (error && error.canceled) return;
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
    
    // 立即检查组件是否已卸载
    if (!isMountedRef.current) return
    
    // 验证数据
    const invalidItems = stockOutItems.filter(item => 
      !item.clothingId || item.quantity <= 0 || item.sellingPrice <= 0
    )
    
    if (invalidItems.length > 0) {
      safeSetState(setAlertMessage, '请完善所有出库项目的服装、数量和销售价格信息')
      safeSetState(setAlertType, 'error')
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
      safeSetState(setAlertMessage, `以下服装库存不足：${itemNames.join(', ')}`)
      safeSetState(setAlertType, 'error')
      return
    }

    try {
      // 创建可取消的操作标志
      let operationCanceled = false
      
      for (const item of stockOutItems) {
        // 每次循环都检查组件是否已卸载
        if (!isMountedRef.current || operationCanceled) {
          operationCanceled = true
          return
        }
        
        const clothing = clothes.find(c => c.id === parseInt(item.clothingId))
        
        // 确保totalAmount计算正确
        const calculatedTotalAmount = parseFloat((item.quantity * item.sellingPrice).toFixed(2));
        
        // 添加出库记录，确保所有必要字段完整
        await db.stockOut.add({
          clothingId: parseInt(item.clothingId),
          quantity: parseInt(item.quantity),
          sellingPrice: Math.round(parseFloat(item.sellingPrice) * 100) / 100,
          totalAmount: calculatedTotalAmount,
          date: formData.date,
          operator: formData.operator || '未知操作员',
          notes: formData.notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // 标记离线更改
        if (!navigator.onLine && db.markOfflineChange) {
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
      
      // 检查组件是否仍在挂载
      if (!isMountedRef.current) return
      
      // 重置表单，但保留操作员信息
      const totalAmount = calculateTotalAmount()
      safeSetState(setStockOutItems, [{
        id: Date.now(),
        clothingId: '',
        quantity: 1,
        sellingPrice: 0,
        availableQuantity: 0
      }])
      safeSetState(setFormData, {
        date: new Date().toISOString().split('T')[0],
        operator: formData.operator,
        notes: ''
      })
      
      // 使用安全的状态更新
      safeSetState(setAlertMessage, `出库操作成功完成！销售总额：¥${totalAmount.toFixed(2)}`)
      safeSetState(setAlertType, 'success')
      
      // 播放成功提示音 - 不等待完成，避免阻塞UI
      playSuccessSound().catch(() => {})
      
      // 检查组件是否仍在挂载，然后刷新统计数据
      if (isMountedRef.current && typeof refreshStats === 'function') {
        refreshStats()
      }
    } catch (error) {
      console.error('出库操作失败:', error)
      // 只有在组件挂载时才显示错误信息
      if (isMountedRef.current) {
        safeSetState(setAlertMessage, '出库操作失败，请重试')
        safeSetState(setAlertType, 'error')
      }
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
                onClick={() => addStockOutItem()}
                className="btn btn-primary"
                style={{ 
                  minHeight: '36px', 
                  padding: '4px 12px',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
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
                  style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <RefreshCw size={16} />
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