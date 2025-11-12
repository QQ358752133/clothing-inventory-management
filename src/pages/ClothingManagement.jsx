import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Shirt } from 'lucide-react'
import { db } from '../db/database'
import { useMediaQuery } from '../hooks/useMediaQuery'

const ClothingManagement = ({ refreshStats }) => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [clothes, setClothes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClothing, setEditingClothing] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    size: '',
    color: '',
    customColor: '',
    categoryCustom: '',
    purchasePrice: '',
    sellingPrice: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // 处理自定义颜色
      const finalColor = (formData.color === '其他' && formData.customColor) ? formData.customColor : formData.color
      // 处理自定义品类
      const finalCategory = (formData.category === '其他' && formData.categoryCustom) ? formData.categoryCustom : formData.category
      
      if (editingClothing) {
        // 更新服装信息
        await db.clothes.update(editingClothing.id, {
          ...formData,
          color: finalColor,
          category: finalCategory,
          purchasePrice: parseFloat(formData.purchasePrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          updatedAt: new Date()
        })
      } else {
        // 新增服装
        await db.clothes.add({
          ...formData,
          color: finalColor,
          category: finalCategory,
          purchasePrice: parseFloat(formData.purchasePrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        
        // 初始化库存
        await db.inventory.add({
          clothingId: await db.clothes.toCollection().lastKey(),
          quantity: 0,
          updatedAt: new Date()
        })
      }
      
      resetForm()
      loadClothes()
      refreshStats()
    } catch (error) {
      console.error('保存服装信息失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: '',
      size: '',
      color: '',
      customColor: '',
      categoryCustom: '',
      purchasePrice: '',
      sellingPrice: ''
    })
    setEditingClothing(null)
    setShowForm(false)
  }

  const editClothing = (clothing) => {
    // 判断是否是自定义颜色
    const isCustomColor = !colors.includes(clothing.color)
    // 判断是否是自定义品类
    const isCustomCategory = !categories.includes(clothing.category)
    setFormData({
      code: clothing.code,
      name: clothing.name,
      category: isCustomCategory ? '其他' : clothing.category || '',
      size: clothing.size,
      color: isCustomColor ? '其他' : clothing.color,
      customColor: isCustomColor ? clothing.color : '',
      categoryCustom: isCustomCategory ? clothing.category : '',
      purchasePrice: clothing.purchasePrice,
      sellingPrice: clothing.sellingPrice
    })
    setEditingClothing(clothing)
    setShowForm(true)
  }

  const deleteClothing = async (id) => {
    if (window.confirm('确定要删除这件服装吗？此操作不可恢复！')) {
      try {
        await db.clothes.delete(id)
        await db.inventory.where('clothingId').equals(id).delete()
        loadClothes()
        refreshStats()
      } catch (error) {
        console.error('删除服装失败:', error)
      }
    }
  }

  const filteredClothes = clothes.filter(clothing =>
    clothing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clothing.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (clothing.category && clothing.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  const colors = ['黑色', '白色', '红色', '蓝色', '绿色', '黄色', '紫色', '灰色', '棕色', '粉色', '橙色', '青色']
  const categories = ['连衣裙', '上衣', 'T恤', '衬衫', '卫衣', '毛衣', '外套', '牛仔裤', '休闲裤', '短裙', '长裙', '半身裙', '短裤', '阔腿裤', '西装裤', '运动裤', '针织衫', '背心', '吊带裙', '背带裤']

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
          
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
            style={{ minHeight: '44px' }}
          >
            <Plus size={16} />
            新增服装
          </button>
        </div>
      </div>

      {/* 新增/编辑表单 */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '24px'
          }}>
            {editingClothing ? '编辑服装信息' : '新增服装'}
          </h2>
          
          <form onSubmit={handleSubmit}>
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
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="form-input"
                  placeholder="如：F001"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">服装名称 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  placeholder="如：男士T恤"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">品类 *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="form-input"
                >
                  <option value="">选择品类</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="其他">其他</option>
                </select>
                {formData.category === '其他' && (
                  <input
                    type="text"
                    className="form-input"
                    style={{ marginTop: '8px' }}
                    value={formData.categoryCustom}
                    onChange={(e) => setFormData({...formData, categoryCustom: e.target.value})}
                    placeholder="手动输入品类名称"
                    required={formData.category === '其他'}
                  />
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">尺码 *</label>
                <select
                  required
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
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
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">选择颜色</option>
                  {colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                  <option value="其他">其他</option>
                </select>
                {(formData.color === '其他' || formData.customColor) && (
                  <input
                    type="text"
                    className="form-input"
                    style={{ marginTop: '8px' }}
                    value={formData.customColor}
                    onChange={(e) => setFormData({...formData, customColor: e.target.value})}
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
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
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
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
                style={{ minHeight: '44px' }}
              >
                取消
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                style={{ minHeight: '44px' }}
              >
                {editingClothing ? '更新' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 服装列表 */}
      <div className="card">
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '24px'
        }}>
          服装列表 ({filteredClothes.length} 件)
        </h2>
        
        {filteredClothes.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            <Shirt size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <p>暂无服装数据</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              点击"新增服装"按钮开始添加
            </p>
          </div>
        ) : isMobile ? (
          // 手机端卡片布局
          <div className="mobile-table-row">
            {filteredClothes.map(clothing => (
              <div key={clothing.id} className="mobile-table-card">
                <div className="mobile-table-cell">
                  <span className="mobile-table-label">编码</span>
                  <span className="mobile-table-value" style={{ fontWeight: '600' }}>{clothing.code}</span>
                </div>
                <div className="mobile-table-cell">
                  <span className="mobile-table-label">名称</span>
                  <span className="mobile-table-value">{clothing.name}</span>
                </div>
                <div className="mobile-table-cell">
                  <span className="mobile-table-label">品类</span>
                  <span className="mobile-table-value">{clothing.category || '-'}</span>
                </div>
                <div className="mobile-table-cell">
                  <span className="mobile-table-label">尺码</span>
                  <span className="mobile-table-value">{clothing.size}</span>
                </div>
                <div className="mobile-table-cell">
                  <span className="mobile-table-label">颜色</span>
                  <span className="mobile-table-value">{clothing.color}</span>
                </div>
                <div className="mobile-table-cell">
                  <span className="mobile-table-label">进货价</span>
                  <span className="mobile-table-value">¥{clothing.purchasePrice.toFixed(2)}</span>
                </div>
                <div className="mobile-table-cell">
                  <span className="mobile-table-label">销售价</span>
                  <span className="mobile-table-value" style={{ color: '#4CAF50', fontWeight: '600' }}>
                    ¥{clothing.sellingPrice.toFixed(2)}
                  </span>
                </div>
                <div className="mobile-actions">
                  <button
                    onClick={() => editClothing(clothing)}
                    className="btn btn-secondary"
                    style={{ padding: '12px', minHeight: 'auto', fontSize: '14px' }}
                  >
                    <Edit size={16} />
                    编辑
                  </button>
                  <button
                    onClick={() => deleteClothing(clothing.id)}
                    className="btn btn-danger"
                    style={{ padding: '12px', minHeight: 'auto', fontSize: '14px' }}
                  >
                    <Trash2 size={16} />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 桌面端表格布局
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>编码</th>
                  <th>名称</th>
                  <th>品类</th>
                  <th>尺码</th>
                  <th>颜色</th>
                  <th>进货价</th>
                  <th>销售价</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredClothes.map(clothing => (
                  <tr key={clothing.id}>
                    <td style={{ fontWeight: '600' }}>{clothing.code}</td>
                    <td>{clothing.name}</td>
                    <td>{clothing.category || '-'}</td>
                    <td>{clothing.size}</td>
                    <td>{clothing.color}</td>
                    <td>¥{clothing.purchasePrice.toFixed(2)}</td>
                    <td style={{ color: '#4CAF50', fontWeight: '600' }}>
                      ¥{clothing.sellingPrice.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => editClothing(clothing)}
                          className="btn btn-secondary"
                          style={{ padding: '8px', minHeight: 'auto' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => deleteClothing(clothing.id)}
                          className="btn btn-danger"
                          style={{ padding: '8px', minHeight: 'auto' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClothingManagement