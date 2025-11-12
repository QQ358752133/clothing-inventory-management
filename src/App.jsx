import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import PWAInstallPrompt from './components/PWAInstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
import { db } from './db/database'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
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
      <div className="app">
        <PWAInstallPrompt />
        <OfflineIndicator />
        <Header />
        <div className="app-content">
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="main-content">
            <Routes>
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
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
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App