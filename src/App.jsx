import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
import Login from './components/Login'
import { db } from './db/database'
import { firebaseAuth, onAuthStateChanged } from './db/database'

// 路由切换时滚动到页面顶部的组件
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

// 主应用组件
function AppContent() {
  // 用户认证状态
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 导航钩子
  const navigate = useNavigate();
  
  // 调试用户状态变化
  useEffect(() => {
    console.log('App组件 - 用户状态更新:', user);
  }, [user]);
  
  // 调试加载状态变化
  useEffect(() => {
    console.log('App组件 - 加载状态更新:', loading);
  }, [loading]);
  
  // 库存统计数据
  const [inventoryStats, setInventoryStats] = useState({
    totalClothes: 0,
    totalValue: 0,
    lowStockItems: 0
  })

  // 监听用户认证状态变化
  useEffect(() => {
    console.log('设置Firebase认证监听器');
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      console.log('Firebase认证状态变化:', user);
      setUser(user);
      setLoading(false);
    });
    
    return () => {
      console.log('取消Firebase认证监听器');
      unsubscribe();
    };
  }, [])
  
  // 只有在用户已认证时才加载库存统计
  useEffect(() => {
    if (user) {
      console.log('用户已认证，加载库存统计');
      loadInventoryStats();
    } else {
      console.log('用户未认证，不加载库存统计');
      // 清空统计数据
      setInventoryStats({
        totalClothes: 0,
        totalValue: 0,
        lowStockItems: 0
      });
    }
  }, [user])

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

  // 路由保护组件 - 保护需要认证的页面
  const ProtectedRoute = ({ children }) => {
    console.log('ProtectedRoute检查:', { loading, user });
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <div style={{ fontSize: '24px' }}>加载中...</div>
        </div>
      );
    }
    // 确保只有当user存在时才允许访问
    return user ? children : <Navigate to="/login" replace />;
  };

  // 登录页面保护 - 已认证用户不能访问登录页面
  const LoginPageProtection = ({ children }) => {
    console.log('LoginPageProtection检查:', { loading, user });
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <div style={{ fontSize: '24px' }}>加载中...</div>
        </div>
      );
    }
    // 已认证用户重定向到首页
    return user ? <Navigate to="/" replace /> : children;
  };

  return (
    <Routes>
      {/* 登录页面 - 无需认证，但已认证用户不能访问 */}
      <Route 
        path="/login" 
        element={<LoginPageProtection><Login onLoginSuccess={() => navigate('/')} /></LoginPageProtection>} 
      />
        
        {/* 受保护的路由 */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
                    <Navigate to="/stock-out" replace />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
                    <Dashboard stats={inventoryStats} refreshStats={refreshStats} />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/clothing" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
                    <ClothingManagement refreshStats={refreshStats} />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/stock-in" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
                    <StockIn refreshStats={refreshStats} />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/stock-out" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
                    <StockOut refreshStats={refreshStats} />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/inventory" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
                    <Inventory refreshStats={refreshStats} />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
                    <Reports />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
                    <Settings />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/data-viewer" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
                    <DataViewer />
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/members" 
          element={
            <ProtectedRoute>
              <div className="app">
                <OfflineIndicator />
                <Header />
                <div className="app-content">
                  <Navigation />
                  <main className="main-content">
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
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
      </Routes>
  )
}

// 应用组件 - 包含Router
function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App