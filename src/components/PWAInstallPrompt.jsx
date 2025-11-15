import React, { useState, useEffect, useRef } from 'react'
import { X, Download, Smartphone, ExternalLink } from 'lucide-react'

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const deferredPrompt = useRef(null)

  useEffect(() => {
    // 检测是否为iOS设备
    const userAgent = window.navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(userAgent))
    setIsAndroid(/android/.test(userAgent))
    
    // 检测是否已安装为PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone)

    // 检查localStorage中是否已经忽略了提示
    const isDismissed = localStorage.getItem('pwaPromptDismissed') === 'true'
    if (isDismissed) {
      return
    }

    // 监听beforeinstallprompt事件（Android）
    const handleBeforeInstallPrompt = (e) => {
      // 阻止Chrome 67及更早版本自动显示安装提示
      e.preventDefault()
      // 存储事件以便稍后触发
      deferredPrompt.current = e
      
      // Android设备显示安装提示
      if (isAndroid && !isStandalone) {
        // 延迟显示，避免干扰用户体验
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 3000)
        
        return () => clearTimeout(timer)
      }
    }

    // 监听beforeinstallprompt事件
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS设备显示安装提示
    if (isIOS && !isStandalone) {
      // 延迟显示，避免干扰用户体验
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
      
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isIOS, isAndroid, isStandalone])

  const handleClose = () => {
    setShowPrompt(false)
    // 将选择存储在localStorage中，避免重复提示
    localStorage.setItem('pwaPromptDismissed', 'true')
  }

  const handleInstall = async () => {
    if (!deferredPrompt.current) {
      return
    }

    try {
      // 显示安装提示
      deferredPrompt.current.prompt()
      
      // 等待用户响应
      const { outcome } = await deferredPrompt.current.userChoice
      console.log(`用户${outcome === 'accepted' ? '接受' : '拒绝'}了安装提示`)
      
      // 无论结果如何，都不再显示提示
      setShowPrompt(false)
      localStorage.setItem('pwaPromptDismissed', 'true')
      
      // 重置deferredPrompt
      deferredPrompt.current = null
    } catch (error) {
      console.error('安装提示失败:', error)
    }
  }

  if (!showPrompt || isStandalone) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #2196F3, #1976D2)',
      color: 'white',
      padding: '16px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
      animation: 'slideDown 0.5s ease-out'
    }}>
      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1
        }}>
          <Smartphone size={24} />
          <div>
            <div style={{
              fontWeight: '600',
              fontSize: '16px',
              marginBottom: '4px'
            }}>
              添加到主屏幕
            </div>
            <div style={{
              fontSize: '14px',
              opacity: 0.9
            }}>
              {isIOS ? 
                '点击分享按钮，然后选择"添加到主屏幕"获得更好的使用体验' : 
                '安装应用到主屏幕，获得更快的访问速度和更好的使用体验'
              }
            </div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {isAndroid && !isIOS && (
            <button
              onClick={handleInstall}
              style={{
                background: 'white',
                border: 'none',
                color: '#2196F3',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
              onMouseOut={(e) => e.target.style.background = 'white'}
            >
              <Download size={16} />
              安装
            </button>
          )}
          
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            知道了
          </button>
          
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallPrompt