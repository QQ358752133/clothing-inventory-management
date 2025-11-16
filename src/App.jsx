import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import ClothingManagement from './pages/ClothingManagement'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import DataViewer from './pages/DataViewer'
import OfflineIndicator from './components/OfflineIndicator'
import { db } from './db/database'

// 路由切换时滚动到页面顶部的组件
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function App() {
  // Active tab state removed as menu is no longer needed
  const [inventoryStats, setInventoryStats] = useState({
    totalClothes: 0,
    totalValue: 0,
    lowStockItems: 0
  })

  useEffect(() => {
    loadInventoryStats()
  }, [])

  const loadInventoryStats = async () => {
    try {
      // 获取服装总数
      const clothesCount = await db.clothes.count()
      
      // 计算库存总价值
      const inventoryItems = await db.inventory.toArray()
      const clothes = await db.clothes.toArray()
      
      let totalValue = 0
      let lowStockCount = 0
      
      inventoryItems.forEach(inv => {
        const clothing = clothes.find(c => c.id === inv.clothingId)
        if (clothing) {
          totalValue += inv.quantity * clothing.purchasePrice
          if (inv.quantity < 10) { // 库存低于10件视为低库存
            lowStockCount++
          }
        }
      })
      
      setInventoryStats({
        totalClothes: clothesCount,
        totalValue: totalValue,
        lowStockItems: lowStockCount
      })
    } catch (error) {
      console.error('加载库存统计失败:', error)
    }
  }

  const refreshStats = () => {
    loadInventoryStats()
  }

  return (
    <Router>
      <ScrollToTop />
      <div className="app">
        <OfflineIndicator />
        <Header />
        <div className="app-content">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route 
                path="/" 
                element={<Navigate to="/stock-out" replace />} 
              />
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard 
                    stats={inventoryStats} 
                    refreshStats={refreshStats} 
                  />
                } 
              />
              <Route 
                path="/clothing" 
                element={
                  <ClothingManagement 
                    refreshStats={refreshStats} 
                  />
                } 
              />
              <Route 
                path="/stock-in" 
                element={
                  <StockIn 
                    refreshStats={refreshStats} 
                  />
                } 
              />
              <Route 
                path="/stock-out" 
                element={
                  <StockOut 
                    refreshStats={refreshStats} 
                  />
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <Inventory 
                    refreshStats={refreshStats} 
                  />
                } 
              />
              <Route 
                path="/reports" 
                element={<Reports />} 
              />
              <Route 
                path="/settings" 
                element={<Settings />} 
              />
              <Route 
                path="/data-viewer" 
                element={<DataViewer />} 
              />
              <Route 
                path="/members" 
                element={
                  <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ 
                      maxWidth: '500px', 
                      margin: '0 auto',
                      background: 'white',
                      borderRadius: '16px',
                      padding: '40px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚧</div>
                      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
                        开发中...
                      </h1>
                      <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>
                        会员系统功能正在紧张开发中，敬请期待！
                      </p>
                    </div>
                  </div>
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App