import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Download, Upload, Database, AlertTriangle, AlertCircle, Save } from 'lucide-react'
import { db } from '../db/database'

const Settings = () => {
  const [exportStatus, setExportStatus] = useState('')
  const [importStatus, setImportStatus] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  
  // 加载低库存阈值设置
  useEffect(() => {
    loadLowStockThreshold()
  }, [])
  
  const loadLowStockThreshold = async () => {
    try {
      const setting = await db.settings.get({ key: 'lowStockThreshold' })
      if (setting) {
        setLowStockThreshold(setting.value.toString())
      }
    } catch (error) {
      console.error('加载低库存阈值失败:', error)
    }
  }
  
  // 声音设置状态
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [soundStatus, setSoundStatus] = useState('')

  // 加载声音设置
  useEffect(() => {
    loadSoundSettings()
  }, [])

  const loadSoundSettings = async () => {
    try {
      const setting = await db.settings.get({ key: 'soundEnabled' })
      if (setting !== undefined) {
        setSoundEnabled(setting.value)
      }
    } catch (error) {
      console.error('加载声音设置失败:', error)
    }
  }

  // 保存低库存阈值设置
  const saveLowStockThreshold = async () => {
    try {
      setSaveStatus('正在保存...')
      const threshold = parseInt(lowStockThreshold)
      
      // 验证输入
      if (isNaN(threshold) || threshold < 0) {
        setSaveStatus('请输入有效的非负整数')
        setTimeout(() => setSaveStatus(''), 3000)
        return
      }
      
      // 保存到数据库
      await db.settings.put({ key: 'lowStockThreshold', value: threshold })
      
      setSaveStatus('保存成功！')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (error) {
      console.error('保存低库存阈值失败:', error)
      setSaveStatus('保存失败，请重试')
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  // 保存声音设置
  const saveSoundSettings = async () => {
    try {
      setSoundStatus('正在保存...')
      
      // 保存到数据库
      await db.settings.put({ key: 'soundEnabled', value: soundEnabled })
      
      setSoundStatus('保存成功！')
      setTimeout(() => setSoundStatus(''), 3000)
    } catch (error) {
      console.error('保存声音设置失败:', error)
      setSoundStatus('保存失败，请重试')
      setTimeout(() => setSoundStatus(''), 3000)
    }
  }

  // 导出数据
  const exportData = async () => {
    try {
      setExportStatus('正在导出数据...')
      
      // 获取所有数据表的数据
      const clothes = await db.clothes.toArray()
      const inventory = await db.inventory.toArray()
      const stockIn = await db.stockIn.toArray()
      const stockOut = await db.stockOut.toArray()
      
      // 创建备份对象
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          clothes,
          inventory,
          stockIn,
          stockOut
        }
      }
      
      // 创建JSON文件
      const dataStr = JSON.stringify(backupData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      // 创建下载链接
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `服装库存备份_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setExportStatus('数据导出成功！')
      setTimeout(() => setExportStatus(''), 3000)
    } catch (error) {
      console.error('导出数据失败:', error)
      setExportStatus('导出失败，请重试')
      setTimeout(() => setExportStatus(''), 3000)
    }
  }

  // 导入数据
  const importData = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        setImportStatus('正在导入数据...')
        
        const backupData = JSON.parse(e.target.result)
        
        // 验证备份文件格式
        if (!backupData.version || !backupData.data) {
          throw new Error('无效的备份文件格式')
        }
        
        // 清空现有数据
        await db.clothes.clear()
        await db.inventory.clear()
        await db.stockIn.clear()
        await db.stockOut.clear()
        
        // 导入新数据
        if (backupData.data.clothes) {
          await db.clothes.bulkAdd(backupData.data.clothes)
        }
        if (backupData.data.inventory) {
          await db.inventory.bulkAdd(backupData.data.inventory)
        }
        if (backupData.data.stockIn) {
          await db.stockIn.bulkAdd(backupData.data.stockIn)
        }
        if (backupData.data.stockOut) {
          await db.stockOut.bulkAdd(backupData.data.stockOut)
        }
        
        setImportStatus('数据导入成功！页面将刷新...')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } catch (error) {
        console.error('导入数据失败:', error)
        setImportStatus('导入失败：文件格式错误或数据损坏')
        setTimeout(() => setImportStatus(''), 5000)
      }
    }
    
    reader.readAsText(file)
    event.target.value = '' // 清空文件输入
  }

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '32px'
      }}>
        <SettingsIcon size={28} color="#666" />
        <h1 className="text-xl font-semibold">系统设置</h1>
      </div>

      {/* 低库存阈值设置 */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={20} color="#FF9800" />
          低库存阈值设置
        </h2>
        
        <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          设置库存预警阈值，当商品库存低于此值时将标记为低库存。
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="lowStockThreshold" style={{ fontWeight: '500', minWidth: '120px' }}>
              低库存阈值：
            </label>
            <input
              id="lowStockThreshold"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              onWheel={(e) => e.target.blur()}
              placeholder="请输入阈值"
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                width: '150px'
              }}
              min="0"
              step="1"
            />
          </div>
          
          <button
            onClick={saveLowStockThreshold}
            className="btn btn-primary"
            style={{ 
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={16} />
            保存设置
          </button>
        </div>
        
        {saveStatus && (
          <div style={{
            color: saveStatus.includes('成功') ? '#4CAF50' : (saveStatus.includes('有效的') ? '#FF9800' : '#f44336'),
            fontWeight: '500',
            fontSize: '14px'
          }}>
            {saveStatus}
          </div>
        )}
      </div>

      {/* 声音设置 */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={20} color="#2196F3" />
          声音设置
        </h2>
        
        <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
          控制出入库操作时的声音提示。
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="soundEnabled" style={{ fontWeight: '500', minWidth: '120px' }}>
              启用声音提示：
            </label>
            <div style={{ 
              position: 'relative', 
              display: 'inline-block', 
              width: '60px', 
              height: '34px' 
            }}>
              <input
                id="soundEnabled"
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{ 
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: soundEnabled ? '#4CAF50' : '#ccc',
                transition: '.4s',
                borderRadius: '34px'
              }}>
                <span style={{ 
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.4s',
                  borderRadius: '50%'
                }}></span>
              </span>
            </div>
          </div>
          
          <button
            onClick={saveSoundSettings}
            className="btn btn-primary"
            style={{ 
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={16} />
            应用设置
          </button>
        </div>
        
        {soundStatus && (
          <div style={{
            color: soundStatus.includes('成功') ? '#4CAF50' : '#f44336',
            fontWeight: '500',
            fontSize: '14px'
          }}>
            {soundStatus}
          </div>
        )}
      </div>
      
      {/* 数据备份与恢复 */}
      <div className="card">
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Database size={20} />
          数据备份与恢复
        </h2>
        
        <div style={{ 
          color: '#666', 
          marginBottom: '24px',
          lineHeight: '1.6'
        }}>
          备份您的库存数据到本地文件，或从备份文件恢复数据。
          建议定期备份数据以防意外丢失。
        </div>

        {/* 导出数据 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#333'
          }}>
            导出数据备份
          </h3>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={exportData}
              className="btn btn-primary"
              style={{ minHeight: '44px' }}
            >
              <Download size={16} />
              导出数据备份
            </button>
            
            {exportStatus && (
              <span style={{ 
                color: exportStatus.includes('成功') ? '#4CAF50' : '#f44336',
                fontWeight: '500'
              }}>
                {exportStatus}
              </span>
            )}
          </div>
          
          <div style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginTop: '8px'
          }}>
            将导出所有服装信息、库存数据、出入库记录到JSON文件
          </div>
        </div>

        {/* 导入数据 */}
        <div>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#333'
          }}>
            从备份文件恢复数据
          </h3>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <label className="btn btn-secondary" style={{ 
              minHeight: '44px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Upload size={16} />
              选择备份文件
              <input
                type="file"
                accept=".json"
                onChange={importData}
                style={{ display: 'none' }}
              />
            </label>
            
            {importStatus && (
              <span style={{ 
                color: importStatus.includes('成功') ? '#4CAF50' : '#f44336',
                fontWeight: '500'
              }}>
                {importStatus}
              </span>
            )}
          </div>
          
          <div style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginTop: '8px'
          }}>
            注意：导入数据将覆盖所有现有数据，请谨慎操作！
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="card">
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={20} color="#FF9800" />
          使用说明
        </h2>
        
        <div style={{ lineHeight: '1.6' }}>
          <p style={{ marginBottom: '16px' }}>
            <strong>数据备份流程：</strong>
          </p>
          <ol style={{ marginLeft: '20px', marginBottom: '16px' }}>
            <li>点击"导出数据备份"按钮下载备份文件</li>
            <li>将备份文件保存到安全位置（U盘、云盘等）</li>
            <li>在不同设备上打开系统，选择"选择备份文件"</li>
            <li>选择之前导出的备份文件进行恢复</li>
          </ol>
          
          <p style={{ 
            color: '#f44336', 
            fontWeight: '500',
            fontSize: '14px'
          }}>
            ⚠️ 重要提醒：导入数据会完全覆盖当前所有数据，请确保已备份重要数据！
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings