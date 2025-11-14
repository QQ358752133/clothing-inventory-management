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
      // 确保日期范围查询包含边界日期的所有记录
      const startDate = dateRange.start;
      const endDate = dateRange.end;
      
      // 增加调试日志
      console.log('正在加载报表数据，日期范围:', { startDate, endDate });
      
      // 使用更宽松的日期比较，确保包含边界日期的所有记录
      const stockOutRecords = await db.stockOut.filter(record => {
        // 处理可能的日期格式不一致问题
        const recordDate = typeof record.date === 'string' ? record.date.split('T')[0] : record.date;
        return recordDate >= startDate && recordDate <= endDate;
      }).toArray();
      
      const stockInRecords = await db.stockIn.filter(record => {
        const recordDate = typeof record.date === 'string' ? record.date.split('T')[0] : record.date;
        return recordDate >= startDate && recordDate <= endDate;
      }).toArray();
      
      const clothes = await db.clothes.toArray();
      
      console.log('查询结果数量:', { stockOutRecords: stockOutRecords.length, stockInRecords: stockInRecords.length });

      // 销售统计
      const salesByDate = {};
      const salesByProduct = {};
      let totalSales = 0;
      let totalProfit = 0;
      let totalQuantity = 0;

      stockOutRecords.forEach(record => {
        // 修复：即使缺少部分字段，也尝试收集可用数据
        const recordTotalAmount = record.totalAmount || 0;
        const recordQuantity = record.quantity || 0;
        
        // 确保有必要的销售金额数据才进行统计
        if (recordTotalAmount > 0) {
          // 修复：将所有有效销售金额计入总销售额
          totalSales += recordTotalAmount;
          totalQuantity += recordQuantity;
          
          // 按日期统计（始终记录销售额和数量）
          const recordDate = record.date || '未知日期';
          if (!salesByDate[recordDate]) {
            salesByDate[recordDate] = { sales: 0, profit: 0, quantity: 0 };
          }
          salesByDate[recordDate].sales += recordTotalAmount;
          salesByDate[recordDate].quantity += recordQuantity;
          
          // 如果有服装ID和数量，尝试计算利润
          if (record.clothingId) {
            const clothing = clothes.find(c => c.id === record.clothingId);
            
            if (clothing && clothing.purchasePrice !== undefined && clothing.purchasePrice > 0 && recordQuantity > 0) {
              // 可以计算利润的情况
              const profit = recordTotalAmount - (recordQuantity * clothing.purchasePrice);
              
              // 更新日期统计的利润
              salesByDate[recordDate].profit += profit;
              
              // 更新总利润
              totalProfit += profit;
              
              // 按产品统计
              if (!salesByProduct[record.clothingId]) {
                salesByProduct[record.clothingId] = {
                  name: clothing.name || '未知名称',
                  code: clothing.code || '未知编码',
                  sales: 0,
                  quantity: 0,
                  profit: 0
                };
              }
              salesByProduct[record.clothingId].sales += recordTotalAmount;
              salesByProduct[record.clothingId].quantity += recordQuantity;
              salesByProduct[record.clothingId].profit += profit;
            } else {
              // 无法计算利润的情况，但仍然记录销售额和数量
              console.warn('无法计算利润，缺少必要信息:', {
                record,
                clothing: clothing || '未找到'
              });
            }
          } else {
            console.warn('出库记录缺少服装ID:', record);
          }
        } else {
          console.warn('出库记录销售金额无效:', record);
        }
      })
      
      console.log('统计结果:', { totalSales, totalProfit, totalQuantity });

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
            quantity: data.quantity
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
      const total = inventory.reduce((sum, inv) => {
        const clothing = clothes.find(c => c.id === inv.clothingId)
        return sum + (clothing ? inv.quantity * clothing.purchasePrice : 0)
      }, 0)
      return Math.round(total * 100) / 100 // 确保总价值精度
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
            <table className="table" style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f5f7fa',
                  borderBottom: '2px solid #e4e7ed'
                }}>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>日期</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>销售数量</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>销售金额</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>销售利润</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>利润率</th>
                </tr>
              </thead>
              <tbody>
                {reports.sales.byDate.map((item, index) => (
                  <tr key={index} style={{ 
                    borderBottom: '1px solid #ebeef5',
                    transition: 'background-color 0.2s'
                  }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f2f5'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      color: '#303133'
                    }}>{item.date}</td>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#303133'
                    }}>{item.quantity} 件</td>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'right',
                      color: '#4CAF50', 
                      fontWeight: '600'
                    }}>
                      {formatCurrency(item.sales)}
                    </td>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'right',
                      color: '#FF9800', 
                      fontWeight: '600'
                    }}>
                      {formatCurrency(item.profit)}
                    </td>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center',
                      color: '#2196F3', 
                      fontWeight: '600'
                    }}>
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
            <table className="table" style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f5f7fa',
                  borderBottom: '2px solid #e4e7ed'
                }}>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>排名</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>商品编码</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>商品名称</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>销售数量</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>销售金额</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>销售利润</th>
                </tr>
              </thead>
              <tbody>
                {reports.sales.byProduct
                  .sort((a, b) => b.sales - a.sales)
                  .slice(0, 10)
                  .map((item, index) => (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #ebeef5',
                      transition: 'background-color 0.2s'
                    }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f2f5'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontWeight: '600', 
                        color: index < 3 ? '#FF9800' : '#666'
                      }}>
                        #{index + 1}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#303133'
                      }}>{item.code}</td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        color: '#303133'
                      }}>{item.name}</td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#303133'
                      }}>{item.quantity} 件</td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'right',
                        color: '#4CAF50', 
                        fontWeight: '600'
                      }}>
                        {formatCurrency(item.sales)}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'right',
                        color: '#FF9800', 
                        fontWeight: '600'
                      }}>
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
            <table className="table" style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f5f7fa',
                  borderBottom: '2px solid #e4e7ed'
                }}>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>日期</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>采购数量</th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    color: '#303133',
                    borderBottom: '1px solid #e4e7ed'
                  }}>采购金额</th>
                </tr>
              </thead>
              <tbody>
                {reports.purchases.byDate.map((item, index) => (
                  <tr key={index} style={{ 
                    borderBottom: '1px solid #ebeef5',
                    transition: 'background-color 0.2s'
                  }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f2f5'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      color: '#303133'
                    }}>{item.date}</td>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#303133'
                    }}>{item.quantity} 件</td>
                    <td style={{ 
                      padding: '12px 16px', 
                      textAlign: 'right',
                      color: '#2196F3', 
                      fontWeight: '600'
                    }}>
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