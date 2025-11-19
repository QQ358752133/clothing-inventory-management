import React, { useState, useEffect } from 'react'
import { Edit, Trash2, Shirt, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { db } from '../db/database'
import Alert from '../components/Alert'

const ClothingManagement = ({ refreshStats }) => {
  const [clothes, setClothes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingClothing, setEditingClothing] = useState(null)
  const [editingInventory, setEditingInventory] = useState(null)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('success')
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedCards, setExpandedCards] = useState({})
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    size: '',
    color: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: ''
  })
  const [customColor, setCustomColor] = useState('')
  const [categoryCustom, setCategoryCustom] = useState('')

  useEffect(() => {
    loadClothes()
  }, [])

  const loadClothes = async () => {
    try {
      const allClothes = await db.clothes.toArray()
      // 加载每个商品的库存信息
      const clothesWithInventory = await Promise.all(
        allClothes.map(async (clothing) => {
          const inventory = await db.inventory
            .where('clothingId')
            .equals(clothing.id)
            .toArray()
          return {
            ...clothing,
            inventory: inventory
          }
        })
      )
      setClothes(clothesWithInventory)
    } catch (error) {
      console.error('加载服装数据失败:', error)
      setAlertMessage('加载服装数据失败')
      setAlertType('error')
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      
      // 验证必填字段
      if (!formData.code || !formData.name || !formData.category || !formData.size || !formData.color) {
        setAlertMessage('请填写所有必填字段')
        setAlertType('error')
        return
      }

      if (editingClothing) {
        // 更新现有商品
        await db.clothes.update(editingClothing.id, {
          code: formData.code,
          name: formData.name,
          category: formData.category,
          size: formData.size,
          color: formData.color,
          purchasePrice: Math.round(parseFloat(formData.purchasePrice) * 100) / 100 || 0,
          sellingPrice: Math.round(parseFloat(formData.sellingPrice) * 100) / 100 || 0,
          updatedAt: new Date().toISOString()
        })
        setAlertMessage('商品信息已更新')
        
        // 如果同时编辑库存
        if (editingInventory) {
          await db.inventory.update(editingInventory.id, {
            quantity: parseInt(formData.quantity) || 0,
            updatedAt: new Date().toISOString()
          })
          setAlertMessage('商品信息和库存已更新')
        }
      } else {
        // 创建新商品
        const newClothing = await db.clothes.add({
          code: formData.code,
          name: formData.name,
          category: formData.category,
          size: formData.size,
          color: formData.color,
          purchasePrice: Math.round(parseFloat(formData.purchasePrice) * 100) / 100 || 0,
          sellingPrice: Math.round(parseFloat(formData.sellingPrice) * 100) / 100 || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        
        // 创建库存记录
        await db.inventory.add({
          clothingId: newClothing,
          quantity: parseInt(formData.quantity) || 0,
          type: 'stock-in',
          reason: '初始库存',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        
        setAlertMessage('商品已添加')
      }
      
      // 重置表单和状态
      setFormData({
        code: '',
        name: '',
        category: '',
        size: '',
        color: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: ''
      })
      setEditingClothing(null)
      setEditingInventory(null)
      setShowAddForm(false)
      
      // 重新加载数据
      loadClothes()
      if (refreshStats) refreshStats()
    } catch (error) {
      console.error('保存商品失败:', error)
      setAlertMessage('保存商品失败')
      setAlertType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (clothing) => {
    setEditingClothing(clothing)
    // 获取第一个库存记录（假设一个商品只有一个库存记录）
    const inventory = clothing.inventory && clothing.inventory.length > 0 ? clothing.inventory[0] : null
    setEditingInventory(inventory)
    setFormData({
      code: clothing.code,
      name: clothing.name,
      category: clothing.category,
      size: clothing.size,
      color: clothing.color,
      purchasePrice: clothing.purchasePrice ? clothing.purchasePrice.toString() : '',
      sellingPrice: clothing.sellingPrice ? clothing.sellingPrice.toString() : '',
      quantity: inventory ? inventory.quantity.toString() : '0'
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个商品吗？')) {
      return
    }
    
    try {
      setIsLoading(true)
      
      // 删除商品
      await db.clothes.delete(id)
      
      // 删除关联的库存记录
      await db.inventory.where('clothingId').equals(id).delete()
      
      // 更新状态
      setClothes(prev => prev.filter(clothing => clothing.id !== id))
      setAlertMessage('商品已删除')
      
      if (refreshStats) refreshStats()
    } catch (error) {
      console.error('删除商品失败:', error)
      setAlertMessage('删除商品失败')
      setAlertType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      code: '',
      name: '',
      category: '',
      size: '',
      color: '',
      purchasePrice: '',
      sellingPrice: '',
      quantity: ''
    })
    setEditingClothing(null)
    setEditingInventory(null)
    setShowAddForm(false)
  }

  const toggleCard = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // 不再需要过滤搜索结果，直接返回所有服装
  const filteredClothes = clothes

  // 常用尺寸选项
  const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '均码']
  
  // 常用颜色选项
  const colors = ['红色', '蓝色', '绿色', '黑色', '白色', '黄色', '紫色', '橙色', '粉色', '灰色', '卡其色', '米白色', '驼色', '米色', '香槟色', '珊瑚色', '薄荷绿', '雾霾蓝', '砖红色', '浅紫色', '鹅黄色', '奶茶色', '烟灰色', '自定义']
  
  // 常用分类选项
  const categories = ['上衣', '裤子', '裙子', '外套', '鞋子', '配件', '自定义']

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
          <Shirt size={24} />
          服装管理
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 border border-transparent rounded-md shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          style={{ 
            fontSize: '16px',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          添加商品
        </button>
      </div>

      {/* 编辑表单 */}
      {(showAddForm || editingClothing) && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {editingClothing ? (
              <>
                <Edit size={20} />
                编辑商品
              </>
            ) : (
              <>
                <Plus size={20} />
                添加商品
              </>
            )}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', 
              gap: '16px',
              marginBottom: '20px'
            }}>
              {/* 商品编码 */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  商品编码 *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 商品名称 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  商品名称 *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 商品分类 */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  商品分类 *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择分类</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                
                {/* 自定义分类输入 */}
                {formData.category === '自定义' && (
                  <input
                    type="text"
                    value={categoryCustom}
                    onChange={(e) => setCategoryCustom(e.target.value)}
                    placeholder="输入自定义分类"
                    style={{
                      marginTop: '8px',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      width: '100%'
                    }}
                    onBlur={() => {
                      if (categoryCustom) {
                        setFormData(prev => ({
                          ...prev,
                          category: categoryCustom
                        }))
                      }
                    }}
                  />
                )}
              </div>
              
              {/* 商品尺寸 */}
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                  商品尺寸 *
                </label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择尺寸</option>
                  {sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 商品颜色 */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  商品颜色 *
                </label>
                <select
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择颜色</option>
                  {colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                
                {/* 自定义颜色输入 */}
                {formData.color === '自定义' && (
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="输入自定义颜色"
                    style={{
                      marginTop: '8px',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      width: '100%'
                    }}
                    onBlur={() => {
                      if (customColor) {
                        setFormData(prev => ({
                          ...prev,
                          color: customColor
                        }))
                      }
                    }}
                  />
                )}
              </div>
              
              {/* 采购价格 */}
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  采购价格
                </label>
                <input
                  type="number"
                  id="purchasePrice"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleFormChange}
                  onWheel={(e) => e.target.blur()}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 销售价格 */}
              <div>
                <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  销售价格
                </label>
                <input
                  type="number"
                  id="sellingPrice"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleFormChange}
                  onWheel={(e) => e.target.blur()}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 库存数量 */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  库存数量
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  onWheel={(e) => e.target.blur()}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                style={{ 
                  fontSize: '16px',
                  minHeight: '50px',
                  minWidth: '100px'
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 border border-transparent rounded-md shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ 
                  fontSize: '16px',
                  minHeight: '50px',
                  minWidth: '100px'
                }}
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 数据表格 */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {/* 移动设备卡片视图 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredClothes.map((clothing) => {
            // 获取第一个库存记录（假设一个商品只有一个库存记录）
            const inventory = clothing.inventory && clothing.inventory.length > 0 ? clothing.inventory[0] : { quantity: 0 }
            const isExpanded = expandedCards[clothing.id] || false
            
            return (
              <div 
                key={clothing.id} 
                className="border border-gray-200 rounded-lg overflow-hidden"
                style={{ backgroundColor: '#fff' }}
              >
                {/* 卡片头部 */}
                <div 
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid #e9ecef', 
                    backgroundColor: '#f8f9fa',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}
                  onClick={() => toggleCard(clothing.id)}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#212529', margin: 0 }}>
                    {clothing.name}
                  </h3>
                  <span style={{ fontSize: '14px', color: '#6c757d' }}>
                    {clothing.code}
                  </span>
                </div>
                
                {/* 卡片内容 */}
                {isExpanded && (
                  <div style={{ padding: '16px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#495057' }}>分类：</span>
                      <span style={{ color: '#212529', fontSize: '16px' }}>{clothing.category}</span>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#495057' }}>尺寸：</span>
                      <span style={{ color: '#212529', fontSize: '16px' }}>{clothing.size}</span>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#495057' }}>颜色：</span>
                      <span style={{ color: '#212529', fontSize: '16px' }}>{clothing.color}</span>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#495057' }}>库存：</span>
                      <span style={{ color: '#212529', fontSize: '16px' }}>{inventory.quantity}</span>
                    </div>
                    
                    {clothing.image && (
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontWeight: '600', color: '#495057' }}>图片：</span>
                        <div style={{ marginTop: '8px' }}>
                          <img 
                            src={clothing.image} 
                            alt={clothing.name} 
                            style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e9ecef' }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                      {/* 编辑按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(clothing)
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ffc107',
                          color: '#212529',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: '500',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Edit size={18} />
                        <span>编辑</span>
                      </button>
                      
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(clothing.id)
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: '500',
                          gap: '8px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Trash2 size={16} />
                        <span>删除</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 显示添加按钮（仅当表单未显示时） */}
      {!showAddForm && !editingClothing && (
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          style={{ 
            zIndex: 100, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          <Plus size={24} />
        </button>
      )}

      {/* 提示信息 */}
      <Alert message={alertMessage} type={alertType} onClose={() => setAlertMessage('')} />
    </div>
  )
}

export default ClothingManagement