import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react'
import { db } from '../db/database'

const Reports = () => {
  const [reports, setReports] = useState({
    sales: [],
    purchases: [],
    inventory: []
  })
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = async () => {
    try {
      const [stockOutRecords, stockInRecords, clothes] = await Promise.all([
        db.stockOut.where('date').between(dateRange.start, dateRange.end).toArray(),
        db.stockIn.where('date').between(dateRange.start, dateRange.end).toArray(),
        db.clothes.toArray()
      ])

      // 销售统计
      const salesByDate = {}
      const salesByProduct = {}
      let totalSales = 0
      let totalProfit = 0

      stockOutRecords.forEach(record => {
        // 确保有必要的字段
        if (!record.totalAmount || !record.quantity || !record.clothingId) {
          console.warn('出库记录缺少必要字段:', record)
          return
        }

        const clothing = clothes.find(c => c.id === record.clothingId)
        if (clothing && clothing.purchasePrice !== undefined) {
          // 按日期统计
          if (!salesByDate[record.date]) {
            salesByDate[record.date] = { sales: 0, profit: 0, count: 0 }
          }
          salesByDate[record.date].sales += record.totalAmount
          salesByDate[record.date].profit += record.totalAmount - (record.quantity * clothing.purchasePrice)
          salesByDate[record.date].count += record.quantity

          // 按产品统计
          if (!salesByProduct[record.clothingId]) {
            salesByProduct[record.clothingId] = {
              name: clothing.name || '未知名称',
              code: clothing.code || '未知编码',
              sales: 0,
              quantity: 0,
              profit: 0
            }
          }
          salesByProduct[record.clothingId].sales += record.totalAmount
          salesByProduct[record.clothingId].quantity += record.quantity
          salesByProduct[record.clothingId].profit += record.totalAmount - (record.quantity * clothing.purchasePrice)

          totalSales += record.totalAmount
          totalProfit += record.totalAmount - (record.quantity * clothing.purchasePrice)
        } else {
          // 如果没有找到对应的服装信息，仍然将销售金额计入总额
          // 但不计算利润（因为缺少采购价格信息）
          if (!salesByDate[record.date]) {
            salesByDate[record.date] = { sales: 0, profit: 0, count: 0 }
          }
          salesByDate[record.date].sales += record.totalAmount
          salesByDate[record.date].count += record.quantity
          
          totalSales += record.totalAmount
          console.warn('出库记录找不到对应服装信息:', record)
        }
      })

      // 采购统计
      const purchasesByDate = {}
      let totalPurchases = 0

      stockInRecords.forEach(record => {
        if (!purchasesByDate[record.date]) {
          purchasesByDate[record.date] = { amount: 0, count: 0 }
        }
        purchasesByDate[record.date].amount += record.totalAmount
        purchasesByDate[record.date].count += record.quantity
        totalPurchases += record.totalAmount
      })

      setReports({
        sales: {
          byDate: Object.entries(salesByDate).map(([date, data]) => ({
            date,
            sales: data.sales,
            profit: data.profit,
            quantity: data.count
          })),
          byProduct: Object.values(salesByProduct),
          total: totalSales,
          totalProfit: totalProfit,
          totalQuantity: stockOutRecords.reduce((sum, record) => sum + record.quantity, 0)
        },
        purchases: {
          byDate: Object.entries(purchasesByDate).map(([date, data]) => ({
            date,
            amount: data.amount,
            quantity: data.count
          })),
          total: totalPurchases,
          totalQuantity: stockInRecords.reduce((sum, record) => sum + record.quantity, 0)
        },
        inventory: {
          totalProducts: clothes.length,
          totalValue: await calculateTotalInventoryValue(clothes)
        }
      })
    } catch (error) {
      console.error('加载报表数据失败:', error)
    }
  }

  const calculateTotalInventoryValue = async (clothes) => {
    try {
      const inventory = await db.inventory.toArray()
      return inventory.reduce((total, inv) => {
        const clothing = clothes.find(c => c.id === inv.clothingId)
        return total + (clothing ? inv.quantity * clothing.purchasePrice : 0)
      }, 0)
    } catch (error) {
      return 0
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

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
          <BarChart3 size={24} />
          统计报表
        </h1>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">开始日期</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="form-input"
              style={{ minHeight: '44px' }}
            />
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">结束日期</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="form-input"
              style={{ minHeight: '44px' }}
            />
          </div>
        </div>
      </div>

      {/* 关键指标 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              background: '#E8F5E8',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={24} color="#4CAF50" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>销售总额</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#4CAF50' }}>
                {formatCurrency(reports.sales.total)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {reports.sales.totalQuantity} 件商品
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              background: '#FFF3E0',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={24} color="#FF9800" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>销售利润</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#FF9800' }}>
                {formatCurrency(reports.sales.totalProfit)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                利润率: {reports.sales.total > 0 ? ((reports.sales.totalProfit / reports.sales.total) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              background: '#E3F2FD',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={24} color="#2196F3" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>采购总额</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#2196F3' }}>
                {formatCurrency(reports.purchases.total)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {reports.purchases.totalQuantity} 件商品
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              background: '#F3E5F5',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={24} color="#9C27B0" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>库存价值</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#9C27B0' }}>
                {formatCurrency(reports.inventory.totalValue)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {reports.inventory.totalProducts} 个品类
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 销售趋势 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <TrendingUp size={20} />
          销售趋势
        </h2>
        
        {(!reports.sales.byDate || reports.sales.byDate.length === 0) ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            <Calendar size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <p>暂无销售数据</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              在选定日期范围内没有销售记录
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>销售数量</th>
                  <th>销售金额</th>
                  <th>销售利润</th>
                  <th>利润率</th>
                </tr>
              </thead>
              <tbody>
                {reports.sales.byDate.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td style={{ fontWeight: '600' }}>{item.quantity} 件</td>
                    <td style={{ color: '#4CAF50', fontWeight: '600' }}>
                      {formatCurrency(item.sales)}
                    </td>
                    <td style={{ color: '#FF9800', fontWeight: '600' }}>
                      {formatCurrency(item.profit)}
                    </td>
                    <td style={{ color: '#2196F3', fontWeight: '600' }}>
                      {item.sales > 0 ? ((item.profit / item.sales) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 热销商品 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Package size={20} />
          热销商品排行
        </h2>
        
        {(!reports.sales.byProduct || reports.sales.byProduct.length === 0) ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            <Package size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <p>暂无销售数据</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              在选定日期范围内没有销售记录
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>商品编码</th>
                  <th>商品名称</th>
                  <th>销售数量</th>
                  <th>销售金额</th>
                  <th>销售利润</th>
                </tr>
              </thead>
              <tbody>
                {reports.sales.byProduct
                  .sort((a, b) => b.sales - a.sales)
                  .slice(0, 10)
                  .map((item, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '600', color: index < 3 ? '#FF9800' : '#666' }}>
                        #{index + 1}
                      </td>
                      <td style={{ fontWeight: '600' }}>{item.code}</td>
                      <td>{item.name}</td>
                      <td style={{ fontWeight: '600' }}>{item.quantity} 件</td>
                      <td style={{ color: '#4CAF50', fontWeight: '600' }}>
                        {formatCurrency(item.sales)}
                      </td>
                      <td style={{ color: '#FF9800', fontWeight: '600' }}>
                        {formatCurrency(item.profit)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 采购统计 */}
      <div className="card">
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Package size={20} />
          采购统计
        </h2>
        
        {(!reports.purchases.byDate || reports.purchases.byDate.length === 0) ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            <Calendar size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <p>暂无采购数据</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              在选定日期范围内没有采购记录
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>采购数量</th>
                  <th>采购金额</th>
                </tr>
              </thead>
              <tbody>
                {reports.purchases.byDate.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td style={{ fontWeight: '600' }}>{item.quantity} 件</td>
                    <td style={{ color: '#2196F3', fontWeight: '600' }}>
                      {formatCurrency(item.amount)}
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

export default Reports