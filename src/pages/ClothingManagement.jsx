import React, { useState, useEffect } from 'react'
import { Edit, Trash2, Shirt, Search, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { db } from '../db/database'
import { useMediaQuery } from '../hooks/useMediaQuery'
import Alert from '../components/Alert'

const ClothingManagement = ({ refreshStats }) => {
  const [clothes, setClothes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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
  
  // 使用媒体查询检测移动设备
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    loadClothes()
    
    // 检测是否为平板设备
    const checkTablet = () => {
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024)
    }
    
    checkTablet()
    window.addEventListener('resize', checkTablet)
    return () => window.removeEventListener('resize', checkTablet)
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

  // 过滤搜索结果
  const filteredClothes = clothes.filter(clothing => {
    const search = searchTerm.toLowerCase()
    return (
      clothing.code.toLowerCase().includes(search) ||
      clothing.name.toLowerCase().includes(search) ||
      clothing.category.toLowerCase().includes(search) ||
      clothing.size.toLowerCase().includes(search) ||
      clothing.color.toLowerCase().includes(search)
    )
  })

  // 常用尺寸选项
  const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  
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
        
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', cursor: 'pointer' }} 
            onClick={() => document.getElementById('clothing-search').focus()} // 添加聚焦功能
          />
          <input
            id="clothing-search"
            type="text"
            placeholder="搜索商品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px 8px 32px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: isMobile ? '100px' : '200px',
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196F3'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

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
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
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
                  fontSize: isMobile ? '16px' : '14px',
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
                  fontSize: isMobile ? '16px' : '14px',
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
        {isMobile ? (
          /* 移动设备卡片视图 */
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
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#f9fafb',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                    onClick={() => toggleCard(clothing.id)}
                  >
                    <div>
                      <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>{clothing.name}</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>{clothing.code}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        backgroundColor: inventory.quantity <= 0 ? '#ef4444' : '#10b981', 
                        color: '#fff', 
                        padding: '2px 6px', 
                        borderRadius: '10px'
                      }}>
                        {inventory.quantity}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                  
                  {/* 卡片内容 */}
                  {isExpanded && (
                    <div style={{ padding: '16px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: isMobile ? '16px' : '14px', color: '#6b7280', marginBottom: '8px' }}>
                          <strong>分类:</strong> {clothing.category}
                        </p>
                        <p style={{ fontSize: isMobile ? '16px' : '14px', color: '#6b7280', marginBottom: '8px' }}>
                          <strong>尺寸:</strong> {clothing.size}
                        </p>
                        <p style={{ fontSize: isMobile ? '16px' : '14px', color: '#6b7280', marginBottom: '8px' }}>
                          <strong>颜色:</strong> {clothing.color}
                        </p>
                        {clothing.purchasePrice > 0 && (
                          <p style={{ fontSize: isMobile ? '16px' : '14px', color: '#6b7280', marginBottom: '8px' }}>
                            <strong>采购价:</strong> ¥{clothing.purchasePrice.toFixed(2)}
                          </p>
                        )}
                        {clothing.sellingPrice > 0 && (
                          <p style={{ fontSize: isMobile ? '16px' : '14px', color: '#6b7280', marginBottom: '8px' }}>
                            <strong>销售价:</strong> ¥{clothing.sellingPrice.toFixed(2)}
                          </p>
                        )}
                        <p style={{ fontSize: isMobile ? '16px' : '14px', color: '#6b7280' }}>
                          <strong>库存:</strong> {inventory.quantity}
                        </p>
                      </div>
                       
                      {/* 操作按钮 */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        gap: '8px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(clothing)
                          }}
                          className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          style={{ 
                            fontSize: isMobile ? '16px' : '14px',
                            minHeight: '50px',
                            minWidth: '100px'
                          }}
                        >
                          <Edit size={isMobile ? '20' : '16'} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                          编辑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(clothing.id)
                          }}
                          className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          style={{ 
                            fontSize: isMobile ? '16px' : '14px',
                            minHeight: '50px',
                            minWidth: '100px'
                          }}
                        >
                          <Trash2 size={isMobile ? '20' : '16'} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                          删除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* 桌面设备表格视图 */
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品编码
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品名称
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  尺寸
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  颜色
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  采购价
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  销售价
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  库存
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClothes.map((clothing) => {
                // 获取第一个库存记录（假设一个商品只有一个库存记录）
                const inventory = clothing.inventory && clothing.inventory.length > 0 ? clothing.inventory[0] : { quantity: 0 }
                
                return (
                  <tr key={clothing.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clothing.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {clothing.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clothing.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clothing.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clothing.color}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ¥{clothing.purchasePrice ? clothing.purchasePrice.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ¥{clothing.sellingPrice ? clothing.sellingPrice.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '10px', 
                        fontSize: '12px',
                        backgroundColor: inventory.quantity <= 0 ? '#ef4444' : '#10b981',
                        color: '#fff'
                      }}>
                        {inventory.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(clothing)}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none"
                          style={{ 
                            padding: '8px 12px',
                            borderRadius: '6px',
                            transition: 'background-color 0.2s',
                            minHeight: '40px',
                            minWidth: '70px',
                            fontSize: '14px'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(37, 99, 235, 0.1)'}
                          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <Edit size={16} />
                          {isTablet ? '编辑' : ''}
                        </button>
                        <button
                          onClick={() => handleDelete(clothing.id)}
                          className="text-red-600 hover:text-red-900 focus:outline-none"
                          style={{ 
                            padding: '8px 12px',
                            borderRadius: '6px',
                            transition: 'background-color 0.2s',
                            minHeight: '40px',
                            minWidth: '70px',
                            fontSize: '14px'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <Trash2 size={16} />
                          {isTablet ? '删除' : ''}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
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