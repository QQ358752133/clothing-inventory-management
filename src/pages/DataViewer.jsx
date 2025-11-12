import React, { useState, useEffect } from 'react'
import { Database, Search, RefreshCw, Download } from 'lucide-react'
import { db } from '../db/database'

const DataViewer = () => {
  const [selectedTable, setSelectedTable] = useState('stockIn')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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

  const getTableHeaders = () => {
    if (records.length === 0) return []
    return Object.keys(records[0])
  }

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 className="text-xl font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={24} />
          数据查看器
        </h1>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="form-input"
            style={{ minWidth: '120px' }}
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
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
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
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder={`搜索${getTableTitle(selectedTable)}记录...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ flex: 1, minWidth: 200 }}
              />
            </div>
          </div>
        </div>

        <div style={{ 
          maxHeight: '60vh', 
          overflowY: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f5f5f5', 
                  position: 'sticky',
                  top: 0
                }}>
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