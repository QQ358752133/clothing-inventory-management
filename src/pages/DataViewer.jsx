import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Database, RefreshCw, Download, Trash2 } from 'lucide-react'
import { db } from '../db/database'
import Alert from '../components/Alert'

// 查看更多按钮组件
const ViewMoreButton = ({ record, table }) => {
  const [expanded, setExpanded] = useState(false)
  
  const getAllFields = () => {
    return Object.keys(record)
  }
  
  const importantFields = getImportantFields(table)
  const allFields = getAllFields()
  const additionalFields = allFields.filter(field => !importantFields.includes(field))
  
  if (additionalFields.length === 0) return null
  
  return (
    <div>
      <button 
        onClick={() => setExpanded(!expanded)}
        style={{
          marginTop: '12px',
          padding: '8px 16px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          fontSize: '14px',
          cursor: 'pointer',
          color: '#495057',
          fontWeight: '500',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
        onTouchStart={(e) => e.target.style.backgroundColor = '#e9ecef'}
        onTouchEnd={(e) => e.target.style.backgroundColor = '#f8f9fa'}
      >
        {expanded ? '收起详情' : '查看更多'}
      </button>
      
      {expanded && (
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '12px', 
          borderTop: '1px solid #e9ecef',
          animation: 'slideDown 0.3s ease'
        }}>
          {additionalFields.map((field) => (
            <div key={field} style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '12px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {formatHeader(field)}
              </span>
              <span style={{ wordBreak: 'break-word', fontSize: '14px', color: '#495057' }}>
                {formatValue(record[field], field)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 获取各表重要字段
const getImportantFields = (tableName) => {
  const fieldMaps = {
    stockIn: ['id', 'clothingInfo', 'quantity', 'purchasePrice', 'totalAmount', 'date', 'operator'],
    stockOut: ['id', 'clothingInfo', 'quantity', 'sellingPrice', 'totalAmount', 'date', 'operator'],
    clothes: ['id', 'code', 'name', 'category', 'size', 'color'],
    inventory: ['id', 'clothingInfo', 'size', 'color', 'quantity']
  }
  return fieldMaps[tableName] || Object.keys(fieldMaps.stockIn)
}

const DataViewer = () => {
  const [selectedTable, setSelectedTable] = useState('stockOut')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState([]) // 选中的记录ID数组
  const [selectAll, setSelectAll] = useState(false) // 全选状态
  const [isDeleting, setIsDeleting] = useState(false) // 删除按钮加载状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('')
  
  // 组件卸载检测引用
  const isMountedRef = useRef(true)

  useEffect(() => {
    // 组件卸载时设置标志
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  useEffect(() => {
    loadRecords()
  }, [selectedTable])
  
  // 安全地设置状态
  const safeSetState = (stateUpdater) => {
    if (isMountedRef.current) {
      setRecords(stateUpdater)
    }
  }
  
  // 安全地设置其他状态
  const safeSetOtherState = (setter, value) => {
    if (isMountedRef.current) {
      setter(value)
    }
  }

  const loadRecords = async () => {
    try {
      // 使用安全的状态更新
      safeSetOtherState(setLoading, true)
      let tableData
      
      // 先获取服装数据，用于关联显示
      const clothesMap = new Map()
      const allClothes = await db.clothes.toArray()
      allClothes.forEach(cloth => {
        clothesMap.set(cloth.id, cloth)
      })
      
      // 检查组件是否仍在挂载
      if (!isMountedRef.current) {
        safeSetOtherState(setLoading, false)
        return
      }
      
      switch (selectedTable) {
        case 'stockIn':
          tableData = await db.stockIn.toArray()
          // 关联服装信息
          tableData = tableData.map(record => {
            const cloth = clothesMap.get(record.clothingId)
            return {
              ...record,
              clothingInfo: cloth ? `ID: ${record.clothingId} (编码: ${cloth.code}, 名称: ${cloth.name})` : `ID: ${record.clothingId} (未找到服装信息)`
            }
          })
          break
        case 'stockOut':
          tableData = await db.stockOut.toArray()
          // 关联服装信息
          tableData = tableData.map(record => {
            const cloth = clothesMap.get(record.clothingId)
            return {
              ...record,
              clothingInfo: cloth ? `ID: ${record.clothingId} (编码: ${cloth.code}, 名称: ${cloth.name})` : `ID: ${record.clothingId} (未找到服装信息)`
            }
          })
          break
        case 'clothes':
          tableData = await db.clothes.toArray()
          break
        case 'inventory':
          tableData = await db.inventory.toArray()
          // 关联库存的服装信息
          tableData = tableData.map(record => {
            const cloth = clothesMap.get(record.clothingId)
            return {
              ...record,
              clothingInfo: cloth ? `ID: ${record.clothingId} (编码: ${cloth.code}, 名称: ${cloth.name})` : `ID: ${record.clothingId} (未找到服装信息)`
            }
          })
          break
        default:
          tableData = []
      }
      
      // 安全地更新状态
      safeSetState(tableData)
    } catch (error) {
      console.error('加载数据失败:', error)
      // 使用自定义Alert组件代替alert
      if (isMountedRef.current) {
        safeSetOtherState(setAlertMessage, '加载数据失败，请刷新页面重试')
        safeSetOtherState(setAlertType, 'error')
      }
    } finally {
      // 使用安全的状态更新
      safeSetOtherState(setLoading, false)
    }
  }

  const filteredRecords = records

  const exportToJson = () => {
    const dataStr = JSON.stringify(filteredRecords, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${selectedTable}-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // 处理单个记录选择
  const handleRecordSelect = (recordId) => {
    // 使用安全的状态更新
    safeSetOtherState(setSelectedRecords, prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId)
      } else {
        return [...prev, recordId]
      }
    })
    // 安全地取消全选状态
    safeSetOtherState(setSelectAll, false)
  }

  // 处理全选
  const handleSelectAll = () => {
    if (selectAll) {
      // 使用安全的状态更新
      safeSetOtherState(setSelectedRecords, [])
      safeSetOtherState(setSelectAll, false)
    } else {
      const allIds = filteredRecords.map(record => record.id)
      // 使用安全的状态更新
      safeSetOtherState(setSelectedRecords, allIds)
      safeSetOtherState(setSelectAll, true)
    }
  }

  // 打开确认删除对话框
  const handleOpenConfirmDialog = () => {
    if (selectedRecords.length === 0) {
      // 使用安全的状态更新
      safeSetOtherState(setAlertMessage, '请先选择要删除的记录')
      safeSetOtherState(setAlertType, 'warning')
      return
    }
    // 使用安全的状态更新
    safeSetOtherState(setShowConfirmDialog, true)
  }

  // 关闭确认删除对话框
  const handleCloseConfirmDialog = () => {
    // 使用安全的状态更新
    safeSetOtherState(setShowConfirmDialog, false)
  }

  // 删除选中的记录
  const handleDeleteSelected = async () => {
    // 使用安全的状态更新
    safeSetOtherState(setShowConfirmDialog, false)
    try {
      // 使用安全的状态更新
      safeSetOtherState(setIsDeleting, true)
      
      for (const recordId of selectedRecords) {
        await db[selectedTable].delete(recordId)
      }

      // 检查组件是否仍在挂载
      if (!isMountedRef.current) {
        safeSetOtherState(setIsDeleting, false)
        return
      }

      // 重新加载数据
      loadRecords()
      // 清空选中状态
      safeSetOtherState(setSelectedRecords, [])
      safeSetOtherState(setSelectAll, false)
      
      // 使用安全的状态更新
      safeSetOtherState(setAlertMessage, '删除成功')
      safeSetOtherState(setAlertType, 'success')
    } catch (error) {
      console.error('删除记录失败:', error)
      // 只有在组件挂载时才显示错误
      if (isMountedRef.current) {
        safeSetOtherState(setAlertMessage, '删除失败，请重试')
        safeSetOtherState(setAlertType, 'error')
      }
    } finally {
      // 使用安全的状态更新
      safeSetOtherState(setIsDeleting, false)
    }
  }

  const getTableHeaders = () => {
    if (records.length === 0) return []
    return Object.keys(records[0])
  }

  return (
    <div className="container" style={{ 
      padding: '16px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* 添加CSS动画样式 - 使用内联样式代替jsx标签 */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease'
      }}>
        <h1 className="text-xl font-semibold" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          fontSize: '24px',
          color: '#212529',
          fontWeight: '700'
        }}>
          <Database size={28} />
          数据查看器
        </h1>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          width: '100%'
        }}>
          <select 
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="form-input"
            style={{ 
              minWidth: '100%', 
              width: '100%',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid #ced4da',
              fontSize: '18px',
              backgroundColor: '#ffffff',
              color: '#495057',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="stockIn">入库记录</option>
            <option value="stockOut">出库记录</option>
            <option value="clothes">服装信息</option>
            <option value="inventory">库存信息</option>
          </select>
          
          <button 
            onClick={loadRecords}
            disabled={loading}
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px',
              padding: '14px 20px',
              fontSize: '18px',
              borderRadius: '8px',
              backgroundColor: '#2196F3',
              color: '#ffffff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 8px rgba(33,150,243,0.3)',
              transition: 'all 0.2s ease',
              minHeight: '50px'
            }}
            onTouchStart={(e) => !loading && (e.target.style.transform = 'scale(0.98)')}
            onTouchEnd={(e) => !loading && (e.target.style.transform = 'scale(1)')}
          >
            <RefreshCw size={'20px'} />
            {loading ? '刷新中...' : '刷新'}
          </button>
          
          <button 
            onClick={exportToJson}
            disabled={records.length === 0}
            className="btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px',
              padding: '14px 20px',
              fontSize: '18px',
              borderRadius: '8px',
              backgroundColor: '#4CAF50',
              color: '#ffffff',
              border: 'none',
              cursor: records.length === 0 ? 'not-allowed' : 'pointer',
              opacity: records.length === 0 ? 0.7 : 1,
              boxShadow: '0 4px 8px rgba(76,175,80,0.3)',
              transition: 'all 0.2s ease',
              minHeight: '50px'
            }}
            onTouchStart={(e) => records.length > 0 && (e.target.style.transform = 'scale(0.98)')}
            onTouchEnd={(e) => records.length > 0 && (e.target.style.transform = 'scale(1)')}
          >
            <Download size={'20px'} />
            导出JSON
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>

        {/* 移动端删除按钮和全选按钮已在卡片列表上方显示 */}
        
        <div style={{ 
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          fontSize: '14px',
          backgroundColor: '#f8f9fa'
        }}>
          {loading ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: '#666'
            }}>
              加载中...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: '#666'
            }}>
              暂无记录
            </div>
          ) : (
                // 移动设备：卡片式布局
                <div style={{ padding: '16px' }}>
                  {/* 移动端操作栏 */}
                  {filteredRecords.length > 0 && (
                    <div style={{ 
                      marginBottom: '20px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px'
                    }}>
                      {/* 移动端全选按钮 */}
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#ffffff', 
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid #e9ecef'
                      }}>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            style={{ 
                              marginRight: '12px', 
                              cursor: 'pointer',
                              width: '20px',
                              height: '20px',
                              accentColor: '#2196F3'
                            }}
                          />
                          <span style={{ fontSize: '16px', color: '#495057', fontWeight: '500' }}>全选</span>
                        </label>
                      </div>
                       
                      {/* 移动端删除按钮 */}
                      {selectedRecords.length > 0 && (
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#ffebee', 
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          border: '1px solid #ffcdd2'
                        }}>
                          <button
                            onClick={handleOpenConfirmDialog}
                            disabled={isDeleting}
                            style={{
                              backgroundColor: '#ef5350',
                              color: 'white',
                              border: 'none',
                              padding: '12px 20px',
                              borderRadius: '8px',
                              cursor: isDeleting ? 'not-allowed' : 'pointer',
                              fontSize: '16px',
                              fontWeight: '600',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all 0.2s ease',
                              minHeight: '48px'
                            }}
                            onTouchStart={(e) => !isDeleting && (e.target.style.transform = 'scale(0.98)')}
                            onTouchEnd={(e) => !isDeleting && (e.target.style.transform = 'scale(1)')}
                          >
                            {isDeleting ? '删除中...' : `删除选中 (${selectedRecords.length})`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 卡片列表 */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px'
                  }}>
                    {filteredRecords.map((record, recordIndex) => (
                      <div 
                        key={recordIndex} 
                        style={{ 
                          border: '1px solid #e9ecef',
                          borderRadius: '12px',
                          padding: '16px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          transition: 'all 0.3s ease',
                          transform: 'translateZ(0)',
                          overflow: 'hidden'
                        }}
                        onTouchStart={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
                        onTouchEnd={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {/* 复选框区域 */}
                        <div style={{ 
                          marginBottom: '16px', 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            userSelect: 'none' 
                          }}>
                            <input
                              type="checkbox"
                              checked={selectedRecords.includes(record.id)}
                              onChange={() => handleRecordSelect(record.id)}
                              style={{ 
                                marginRight: '10px', 
                                cursor: 'pointer',
                                width: '20px',
                                height: '20px',
                                accentColor: '#2196F3'
                              }}
                            />
                            <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>选择记录</span>
                          </label>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* 记录状态标识 */}
                            <div style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {selectedTable === 'stockIn' ? '入库' : 
                               selectedTable === 'stockOut' ? '出库' : 
                               selectedTable === 'clothes' ? '服装' : '库存'}
                            </div>
                          </div>
                        </div>
                        
                        {/* 主要字段信息 */}
                        <div style={{ 
                          marginBottom: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          {getImportantFields(selectedTable).map((field) => (
                            <div key={field} style={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              gap: '4px'
                            }}>
                              <span style={{ 
                                fontWeight: '600', 
                                color: '#6c757d', 
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {formatHeader(field)}
                              </span>
                              <span style={{ 
                                wordBreak: 'break-word', 
                                fontSize: '16px',
                                color: '#212529',
                                fontWeight: field === 'id' || field === 'quantity' ? 'bold' : 'normal'
                              }}>
                                {formatValue(record[field], field)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {/* 查看更多按钮 */}
                        <div style={{ 
                          borderTop: '1px solid #f0f0f0', 
                          paddingTop: '16px' 
                        }}>
                          <ViewMoreButton record={record} table={selectedTable} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            )}
        </div>

        <div style={{ 
          marginTop: '16px', 
          fontSize: '14px', 
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>共 {records.length} 条记录，显示 {filteredRecords.length} 条</span>
        </div>
      </div>

      <Alert message={alertMessage} type={alertType} onClose={() => setAlertMessage('')} />

      {/* 自定义确认删除对话框 */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '90%',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              确认删除
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.5'
            }}>
              确定要删除选中的 {selectedRecords.length} 条记录吗？
              <br />
              <span style={{ color: '#f44336', fontWeight: 'bold' }}>
                此操作不可恢复！
              </span>
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseConfirmDialog}
                style={{
                  padding: '14px 24px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  color: '#2196F3',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flex: 1,
                  minHeight: '50px'
                }}
              >
                取消
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                style={{
                  padding: '14px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                  flex: 1,
                  minHeight: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isDeleting ? '删除中...' : (
                  <>
                    <Trash2 size={18} />
                    确定
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}

// 辅助函数
const getTableTitle = (tableName) => {
  const titles = {
    stockIn: '入库',
    stockOut: '出库',
    clothes: '服装',
    inventory: '库存'
  }
  return titles[tableName] || tableName
}



const formatHeader = (header) => {
  const replacements = {
    id: 'ID',
    clothingId: '服装ID',
    clothingInfo: '服装信息',
    quantity: '数量',
    purchasePrice: '进货价格',
    sellingPrice: '销售价格',
    totalAmount: '总金额',
    date: '日期',
    operator: '操作员',
    customer: '客户',
    notes: '备注',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    name: '名称',
    category: '类别',
    categoryCustom: '自定义类别',
    code: '编码',
    description: '描述',
    size: '尺码',
    color: '颜色',
    customColor: '自定义颜色'
  }
  return replacements[header] || header
}

const formatValue = (value, fieldName) => {
  if (value instanceof Date) {
    return value.toLocaleString('zh-CN')
  }
  if (typeof value === 'number') {
    // 服装ID字段不应该格式化为金额
    if (fieldName === 'clothingId' || fieldName === 'id') {
      return String(value)
    }
    // 检查是否为金额字段
    if (fieldName === 'purchasePrice' || fieldName === 'sellingPrice' || fieldName === 'totalAmount') {
      return value.toFixed(2)
    }
    // 其他数字保持原样
  }
  // 对于服装信息字段，不做特殊处理，直接显示完整信息
  if (fieldName === 'clothingInfo') {
    return value
  }
  if (value === null || value === undefined) {
    return '-'
  }
  return String(value)
}

export default DataViewer