import React, { useState, useEffect, useMemo } from 'react'
import { Database, Search, RefreshCw, Download } from 'lucide-react'
import { db } from '../db/database'
import { useMediaQuery } from '../hooks/useMediaQuery'
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
          marginTop: '8px',
          padding: '4px 8px',
          backgroundColor: '#f0f0f0',
          border: 'none',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          color: '#666'
        }}
      >
        {expanded ? '收起详情' : '查看更多'}
      </button>
      
      {expanded && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
          {additionalFields.map((field) => (
            <div key={field} style={{ marginBottom: '4px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', color: '#888', fontSize: '10px', marginBottom: '1px' }}>
                {formatHeader(field)}
              </span>
              <span style={{ wordBreak: 'break-word', fontSize: '11px', color: '#666' }}>
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
  const [selectedTable, setSelectedTable] = useState('stockIn')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecords, setSelectedRecords] = useState([]) // 选中的记录ID数组
  const [selectAll, setSelectAll] = useState(false) // 全选状态
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isDeleting, setIsDeleting] = useState(false) // 删除按钮加载状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('')

  useEffect(() => {
    loadRecords()
  }, [selectedTable])

  const loadRecords = async () => {
    try {
      setLoading(true)
      let tableData
      
      // 先获取服装数据，用于关联显示
      const clothesMap = new Map()
      const allClothes = await db.clothes.toArray()
      allClothes.forEach(cloth => {
        clothesMap.set(cloth.id, cloth)
      })
      
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
      
      setRecords(tableData)
    } catch (error) {
      console.error('加载数据失败:', error)
      alert('加载数据失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return Object.values(record).some(value => 
      String(value).toLowerCase().includes(searchLower)
    )
  })

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
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId)
      } else {
        return [...prev, recordId]
      }
    })
    setSelectAll(false) // 如果取消选择，全选状态也应该取消
  }

  // 处理全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords([])
      setSelectAll(false)
    } else {
      const allIds = filteredRecords.map(record => record.id)
      setSelectedRecords(allIds)
      setSelectAll(true)
    }
  }

  // 打开确认删除对话框
  const handleOpenConfirmDialog = () => {
    if (selectedRecords.length === 0) {
      setAlertMessage('请先选择要删除的记录')
      setAlertType('warning')
      return
    }
    setShowConfirmDialog(true)
  }

  // 关闭确认删除对话框
  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false)
  }

  // 删除选中的记录
  const handleDeleteSelected = async () => {
    setShowConfirmDialog(false)
    try {
      setIsDeleting(true)
      
      for (const recordId of selectedRecords) {
        // 从本地数据库删除记录
        await db[selectedTable].delete(recordId)
        
        // 同时从Firebase删除记录
        if (navigator.onLine) {
          const { ref, remove } = await import('firebase/database')
          const firebaseDatabase = (await import('../db/database')).firebaseDatabase
          await remove(ref(firebaseDatabase, `${selectedTable}/${recordId}`))
        } else {
          // 标记为离线更改，以便网络恢复后同步
          db.markOfflineChange()
        }
      }

      // 重新加载数据
      loadRecords()
      // 清空选中状态
      setSelectedRecords([])
      setSelectAll(false)
      
      // 如果在线，手动触发同步以确保所有设备数据一致
      if (navigator.onLine) {
        await db.syncToFirebase()
      }
      
      setAlertMessage('删除成功')
      setAlertType('success')
    } catch (error) {
      console.error('删除记录失败:', error)
      setAlertMessage('删除失败，请重试')
      setAlertType('error')
    } finally {
      setIsDeleting(false)
    }
  }

  const getTableHeaders = () => {
    if (records.length === 0) return []
    return Object.keys(records[0])
  }

  return (
    <div className="container" style={{ padding: '10px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '10px',
        textAlign: 'center'
      }}>
        <h1 className="text-xl font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={24} />
          数据查看器
        </h1>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <select 
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="form-input"
            style={{ minWidth: '120px', width: isMobile ? '100%' : 'auto' }}
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
                gap: '4px',
                padding: '6px 10px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
            <RefreshCw size={16} />
            刷新
          </button>
          
          <button 
            onClick={exportToJson}
            disabled={records.length === 0}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={16} />
            导出JSON
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div className="form-group" style={{ margin: 0, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <Search size={16} style={{ cursor: 'pointer' }} 
                onClick={() => document.getElementById('data-viewer-search').focus()} // 添加聚焦功能
              />
              <input
                id="data-viewer-search"
                type="text"
                placeholder={`搜索记录...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ flex: 1, minWidth: isMobile ? '100px' : '200px', fontSize: isMobile ? '14px' : '16px' }}
              />
            </div>
          </div>
        </div>
        
        {/* 删除按钮，仅在入库和出库记录中显示 */}
        {(selectedTable === 'stockIn' || selectedTable === 'stockOut') && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={handleOpenConfirmDialog}
              disabled={selectedRecords.length === 0 || isDeleting}
              className="btn"
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: selectedRecords.length === 0 || isDeleting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isDeleting ? '删除中...' : `删除选中 (${selectedRecords.length})`}
            </button>
          </div>
        )}

        <div style={{ 
          maxHeight: '70vh', 
          overflowY: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          fontSize: isMobile ? '12px' : '14px'
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
            isMobile ? (
                // 移动设备：卡片式布局
                <div style={{ padding: '8px' }}>
                  {/* 移动端删除按钮 */}
                  {(selectedTable === 'stockIn' || selectedTable === 'stockOut') && selectedRecords.length > 0 && (
                    <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#fff3f3', borderRadius: '4px' }}>
                      <button
                        onClick={handleOpenConfirmDialog}
                        disabled={isDeleting}
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {isDeleting ? '删除中...' : `删除选中 (${selectedRecords.length})`}
                      </button>
                    </div>
                  )}
                  
                  {/* 移动端全选按钮 */}
                  {(selectedTable === 'stockIn' || selectedTable === 'stockOut') && filteredRecords.length > 0 && (
                    <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', color: '#666' }}>全选</span>
                      </label>
                    </div>
                  )}
                  
                  {filteredRecords.map((record, recordIndex) => (
                    <div 
                      key={recordIndex} 
                      style={{ 
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        backgroundColor: '#fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* 复选框，仅在入库和出库记录中显示 */}
                      {(selectedTable === 'stockIn' || selectedTable === 'stockOut') && (
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedRecords.includes(record.id)}
                              onChange={() => handleRecordSelect(record.id)}
                              style={{ marginRight: '8px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', color: '#666' }}>选择</span>
                          </label>
                        </div>
                      )}
                      
                      {/* 简化显示，只显示最重要的字段 */}
                      {getImportantFields(selectedTable).map((field) => (
                        <div key={field} style={{ marginBottom: '6px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: '#666', fontSize: '11px', marginBottom: '2px' }}>
                            {formatHeader(field)}
                          </span>
                          <span style={{ wordBreak: 'break-word', fontSize: '12px' }}>
                            {formatValue(record[field], field)}
                          </span>
                        </div>
                      ))}
                      
                      {/* 添加查看更多按钮 */}
                      <ViewMoreButton record={record} table={selectedTable} />
                    </div>
                  ))}
                </div>
              ) : (
                // 桌面设备：表格布局
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ 
                      backgroundColor: '#f5f5f5', 
                      position: 'sticky',
                      top: 0
                    }}>
                      {/* 复选框列，仅在入库和出库记录中显示 */}
                      {(selectedTable === 'stockIn' || selectedTable === 'stockOut') && (
                        <th key="checkbox" style={{
                          padding: '12px',
                          textAlign: 'center',
                          borderBottom: '1px solid #e0e0e0',
                          fontSize: '14px',
                          fontWeight: '600',
                          width: '40px'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            style={{ cursor: 'pointer' }}
                          />
                        </th>
                      )}
                      {getTableHeaders().map((header, index) => (
                        <th key={index} style={{
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e0e0e0',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {formatHeader(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, recordIndex) => (
                      <tr key={recordIndex} style={{
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: recordIndex % 2 === 0 ? '#fff' : '#fafafa'
                      }}>
                        {/* 复选框列，仅在入库和出库记录中显示 */}
                        {(selectedTable === 'stockIn' || selectedTable === 'stockOut') && (
                          <td key="checkbox" style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '14px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            <input
                              type="checkbox"
                              checked={selectedRecords.includes(record.id)}
                              onChange={() => handleRecordSelect(record.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                        )}
                        {getTableHeaders().map((header, index) => (
                        <td key={index} style={{
                          padding: '12px',
                          fontSize: '14px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {formatValue(record[header], header)}
                        </td>
                      ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
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
            width: isMobile ? '90%' : '400px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              确认删除
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: isMobile ? '14px' : '16px',
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
                  padding: isMobile ? '14px 24px' : '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  color: '#2196F3',
                  fontSize: isMobile ? '18px' : '16px',
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
                  padding: isMobile ? '14px 24px' : '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontSize: isMobile ? '18px' : '16px',
                  fontWeight: 'bold',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                  flex: 1,
                  minHeight: '50px'
                }}
              >
                {isDeleting ? '删除中...' : '确定'}
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