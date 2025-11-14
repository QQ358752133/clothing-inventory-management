import React, { useState, useEffect } from 'react'
import { PackagePlus, Shirt } from 'lucide-react'
import { db } from '../db/database'
import Alert from '../components/Alert'

// 播放成功提示音 - 支持自定义音频文件
const playSuccessSound = () => {
  try {
    // 尝试使用自定义音频文件
    const audio = new Audio('/audio/success.mp3')
    audio.volume = 0.1
    
    // 如果音频加载失败，则回退到Web Audio API生成的音效
    audio.onerror = () => {
      console.log('自定义音频文件未找到，使用默认音效')
      playDefaultSuccessSound()
    }
    
    audio.play()
  } catch (error) {
    console.error('播放自定义音频失败，使用默认音效:', error)
    playDefaultSuccessSound()
  }
}

// 默认的成功提示音 - 叮咚音效
const playDefaultSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // 生成"叮"的声音 (高音)
    const dingOscillator = audioContext.createOscillator()
    const dingGain = audioContext.createGain()
    dingOscillator.connect(dingGain)
    dingGain.connect(audioContext.destination)
    
    dingOscillator.type = 'sine'
    dingOscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
    dingOscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1)
    
    dingGain.gain.setValueAtTime(0.1, audioContext.currentTime)
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
    
    dongGain.gain.setValueAtTime(0.1, audioContext.currentTime + 0.15)
    dongGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    dongOscillator.start(audioContext.currentTime + 0.15)
    dongOscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.error('播放默认声音失败:', error)
  }
}

const StockIn = ({ refreshStats }) => {
  const [clothes, setClothes] = useState([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    operator: '财务-符冬梅',
    notes: ''
  })
  
  // 自定义弹窗状态
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('success')
  // 新增服装相关状态 - 默认显示表单
  const [showAddClothingForm, setShowAddClothingForm] = useState(true)
  const [addClothingFormData, setAddClothingFormData] = useState({
    code: '',
    name: '',
    category: '',
    size: '',
    color: '',
    customColor: '',
    categoryCustom: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: 1,
    remark: ''
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
  
  // 新增服装的尺码、颜色、品类常量
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  const colors = ['黑色', '白色', '红色', '蓝色', '绿色', '黄色', '紫色', '灰色', '棕色', '粉色', '橙色', '青色']
  const categories = ['连衣裙', '上衣', 'T恤', '衬衫', '卫衣', '毛衣', '外套', '牛仔裤', '休闲裤', '短裙', '长裙', '半身裙', '短裤', '阔腿裤', '西装裤', '运动裤', '针织衫', '背心', '吊带裙', '背带裤']
  
  // 重置新增服装表单 - 只重置数据，不隐藏表单
  const resetAddClothingForm = () => {
    setAddClothingFormData({
      code: '',
      name: '',
      category: '',
      size: '',
      color: '',
      customColor: '',
      categoryCustom: '',
      purchasePrice: '',
      sellingPrice: '',
      quantity: 1,
      remark: ''
    })
  }
  
  // 提交新增服装表单并直接入库
  const handleAddClothingSubmit = async (e) => {
    e.preventDefault()
    try {
      // 验证数量
      if (parseInt(addClothingFormData.quantity) <= 0) {
        alert('请输入有效的入库数量')
        return
      }
      
      // 处理自定义颜色
      const finalColor = (addClothingFormData.color === '其他' && addClothingFormData.customColor) ? addClothingFormData.customColor : addClothingFormData.color
      // 处理自定义品类
      const finalCategory = (addClothingFormData.category === '其他' && addClothingFormData.categoryCustom) ? addClothingFormData.categoryCustom : addClothingFormData.category
      
      // 新增服装，确保价格精度
      const newClothingId = await db.clothes.add({
        ...addClothingFormData,
        color: finalColor,
        category: finalCategory,
        purchasePrice: parseFloat(parseFloat(addClothingFormData.purchasePrice).toFixed(2)),
        sellingPrice: parseFloat(parseFloat(addClothingFormData.sellingPrice).toFixed(2)),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      const purchasePrice = parseFloat(parseFloat(addClothingFormData.purchasePrice).toFixed(2))
      const quantity = parseInt(addClothingFormData.quantity)
      const totalAmount = purchasePrice * quantity
      
      // 添加入库记录
      await db.stockIn.add({
        clothingId: newClothingId,
        quantity: quantity,
        purchasePrice: purchasePrice,
        totalAmount: totalAmount,
        date: formData.date,
        operator: formData.operator,
        notes: addClothingFormData.remark,
        createdAt: new Date()
      })
      
      // 初始化并更新库存
      await db.inventory.add({
        clothingId: newClothingId,
        quantity: quantity,
        updatedAt: new Date()
      })
      
      // 重新加载服装数据
      loadClothes()
      resetAddClothingForm()
      setAlertMessage('服装添加并入库成功！')
      setAlertType('success')
      playSuccessSound() // 播放成功提示音
      refreshStats()
    } catch (error) {
      console.error('保存服装信息失败:', error)
      setAlertMessage('保存服装信息失败，请重试')
      setAlertType('error')
    }
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
        
        <div>
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



          {/* 新增服装表单 */}
          {showAddClothingForm && (
            <div className="card" style={{ marginBottom: '24px', background: '#f8f9fa' }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '24px'
              }}>
                <Shirt size={18} style={{ marginRight: '8px' }} />
                新增服装
              </h2>
              
              <form onSubmit={handleAddClothingSubmit}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div className="form-group">
                    <label className="form-label">服装编码 *</label>
                    <input
                      type="text"
                      required
                      value={addClothingFormData.code}
                      onChange={(e) => setAddClothingFormData({...addClothingFormData, code: e.target.value})}
                      className="form-input"
                      placeholder="如：F001"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">服装名称 *</label>
                    <input
                      type="text"
                      required
                      value={addClothingFormData.name}
                      onChange={(e) => setAddClothingFormData({...addClothingFormData, name: e.target.value})}
                      className="form-input"
                      placeholder="如：男士T恤"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">品类 *</label>
                    <select
                      required
                      value={addClothingFormData.category}
                      onChange={(e) => setAddClothingFormData({...addClothingFormData, category: e.target.value})}
                      className="form-input"
                    >
                      <option value="">选择品类</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                      <option value="其他">其他</option>
                    </select>
                    {addClothingFormData.category === '其他' && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ marginTop: '8px' }}
                        value={addClothingFormData.categoryCustom}
                        onChange={(e) => setAddClothingFormData({...addClothingFormData, categoryCustom: e.target.value})}
                        placeholder="手动输入品类名称"
                        required={addClothingFormData.category === '其他'}
                      />
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">尺码 *</label>
                    <select
                      required
                      value={addClothingFormData.size}
                      onChange={(e) => setAddClothingFormData({...addClothingFormData, size: e.target.value})}
                      className="form-input"
                    >
                      <option value="">选择尺码</option>
                      {sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  

                  
                  <div className="form-group">
                    <label className="form-label">颜色 *</label>
                    <select
                      value={addClothingFormData.color}
                      onChange={(e) => setAddClothingFormData({...addClothingFormData, color: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">选择颜色</option>
                      {colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                      <option value="其他">其他</option>
                    </select>
                    {(addClothingFormData.color === '其他' || addClothingFormData.customColor) && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ marginTop: '8px' }}
                        value={addClothingFormData.customColor}
                        onChange={(e) => setAddClothingFormData({...addClothingFormData, customColor: e.target.value})}
                        placeholder="手动输入颜色名称"
                      />
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">进货价格 *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={addClothingFormData.purchasePrice}
                      onChange={(e) => setAddClothingFormData({...addClothingFormData, purchasePrice: e.target.value})}
                      className="form-input"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">销售价格 *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={addClothingFormData.sellingPrice}
                      onChange={(e) => setAddClothingFormData({...addClothingFormData, sellingPrice: e.target.value})}
                      className="form-input"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">入库数量 *</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={addClothingFormData.quantity}
                      onChange={(e) => setAddClothingFormData({...addClothingFormData, quantity: e.target.value})}
                      className="form-input"
                      placeholder="1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">备注</label>
                    <textarea
                      value={addClothingFormData.remark}
                      onChange={(e) => setAddClothingFormData({...addClothingFormData, remark: e.target.value})}
                      className="form-input"
                      placeholder="添加备注信息"
                      rows="2"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    style={{ minHeight: '44px' }}
                  >
                    保存并入库
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StockIn