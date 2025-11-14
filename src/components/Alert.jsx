import React, { useEffect, useState } from 'react'

const Alert = ({ message, type = 'success', onClose, autoClose = true }) => {
  const [isVisible, setIsVisible] = useState(!!message)

  useEffect(() => {
    if (message) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [message])

  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoClose, onClose])

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          borderColor: '#45a049'
        }
      case 'error':
        return {
          backgroundColor: '#f44336',
          borderColor: '#d32f2f'
        }
      case 'warning':
        return {
          backgroundColor: '#ff9800',
          borderColor: '#f57c00'
        }
      case 'info':
        return {
          backgroundColor: '#2196F3',
          borderColor: '#1976D2'
        }
      default:
        return {
          backgroundColor: '#4CAF50',
          borderColor: '#45a049'
        }
    }
  }

  if (!isVisible || !message) return null

  return (
    <div style={{
      position: 'fixed',
      top: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: getTypeStyles().backgroundColor,
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 9999,
      maxWidth: '90%',
      width: 'auto',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: '500',
      // 使用简单的CSS过渡效果
      transition: 'opacity 0.3s ease-out'
    }}
    key={message + type + Date.now()}>
      {message}
    </div>
  )
}

export default Alert