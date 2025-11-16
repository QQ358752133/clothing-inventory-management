import React, { useState, useEffect } from 'react';
import { firebaseAuth, signInWithEmailAndPassword } from '../db/database';
import { getAuth } from 'firebase/auth';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [swStatus, setSwStatus] = useState('未知');
  const [networkDetails, setNetworkDetails] = useState({});
  const [firebaseAuthTestResult, setFirebaseAuthTestResult] = useState(null);
  
  // 检查Service Worker状态
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => {
          setSwStatus('已注册并激活');
          console.log('Service Worker已注册:', registration);
        })
        .catch(err => {
          setSwStatus(`注册失败: ${err.message}`);
          console.log('Service Worker注册失败:', err);
        });
    } else {
      setSwStatus('不支持');
    }
    
    // 检查网络详细信息
    checkNetworkDetails();
  }, []);
  
  // 检查网络详细信息
  const checkNetworkDetails = () => {
    const details = {
      online: navigator.onLine,
      connectionType: navigator.connection?.type || '未知',
      effectiveType: navigator.connection?.effectiveType || '未知',
      rtt: navigator.connection?.rtt || '未知',
      downlink: navigator.connection?.downlink || '未知',
      hasServiceWorker: 'serviceWorker' in navigator
    };
    setNetworkDetails(details);
    console.log('网络详细信息:', details);
  };

  // 测试Firebase认证URL的连接
  const testFirebaseAuthUrl = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('开始测试Firebase认证URL...');
      
      // 直接测试Firebase认证API的连接性
      const authUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAexzhaDNB6VjSk7RJk1jWHyIs8BOqKkvI';
      
      // 使用HEAD请求测试连接，不发送实际登录数据
      const response = await fetch(authUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      
      const result = {
        success: response.type === 'opaque', // no-cors模式下会返回opaque响应
        status: response.type,
        timestamp: new Date().toISOString()
      };
      
      setFirebaseAuthTestResult(result);
      console.log('Firebase认证URL测试结果:', result);
      
      // 同时测试DNS解析
      try {
        const dnsTest = await fetch('https://dns.google/resolve?name=identitytoolkit.googleapis.com', {
          method: 'GET',
          cache: 'no-cache'
        });
        const dnsData = await dnsTest.json();
        console.log('DNS解析结果:', dnsData);
        result.dnsSuccess = true;
        result.dnsData = dnsData;
      } catch (dnsError) {
        console.log('DNS解析测试失败:', dnsError);
        result.dnsSuccess = false;
        result.dnsError = dnsError.message;
      }
      
      setFirebaseAuthTestResult({ ...result });
      
    } catch (error) {
      console.error('Firebase认证URL测试失败:', error);
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      setFirebaseAuthTestResult(errorResult);
      setError(`Firebase连接测试失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 清除浏览器缓存和Storage
  const clearBrowserCache = async () => {
    try {
      // 清除Service Worker缓存
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
        console.log('浏览器缓存已清除');
      }
      
      // 清除localStorage
      localStorage.clear();
      console.log('localStorage已清除');
      
      // 清除sessionStorage
      sessionStorage.clear();
      console.log('sessionStorage已清除');
      
      // 提示用户刷新页面
      alert('缓存已清除，请刷新页面后重试登录');
    } catch (error) {
      console.error('清除缓存失败:', error);
      alert(`清除缓存失败: ${error.message}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setDebugInfo('');

    try {
      // 在开发环境中，尝试禁用Service Worker以隔离问题
      let serviceWorkerStatus = 'not-available';
      if (process.env.NODE_ENV === 'development' && 'serviceWorker' in navigator) {
        console.log('开发环境：检查Service Worker状态...');
        
        // 检查是否有活动的Service Worker
        if (navigator.serviceWorker.controller) {
          console.log('发现活动的Service Worker，尝试禁用...');
          serviceWorkerStatus = 'controller-present';
          
          // 注销所有Service Worker注册
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Service Worker已注销:', registration);
          }
          serviceWorkerStatus = 'unregistered';
        } else {
          serviceWorkerStatus = 'no-controller';
        }
      }

      // 在开发环境中，尝试强制重新获取网络状态
      if (process.env.NODE_ENV === 'development') {
        console.log('开发环境：强制检查网络状态...');
        
        // 尝试从一个可靠的服务器获取数据来验证网络连接
        let networkTestResult = 'not-tested';
        try {
          const testResponse = await fetch('https://www.google.com/generate_204', { 
            method: 'HEAD',
            cache: 'no-cache',
            mode: 'no-cors'
          });
          networkTestResult = testResponse.type === 'opaque' ? 'connected' : 'error';
          console.log('网络测试响应:', testResponse.type, networkTestResult);
        } catch (testError) {
          networkTestResult = 'failed';
          console.log('网络测试失败:', testError);
        }
      }

      // 添加调试信息
      const debugData = {
        timestamp: new Date().toISOString(),
        deviceInfo: navigator.userAgent,
        networkOnline: navigator.onLine,
        serviceWorkerStatus: serviceWorkerStatus,
        email: email,
        passwordLength: password.length
      };
      
      console.log('登录请求信息:', debugData);
      setDebugInfo(JSON.stringify(debugData, null, 2));
      
      // 登录Firebase - 添加超时处理
      const userCredential = await Promise.race([
        signInWithEmailAndPassword(firebaseAuth, email, password),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('登录请求超时')), 30000)
        )
      ]);
      console.log('登录成功:', userCredential.user);
      
      // 登录成功后调用回调函数
      if (onLoginSuccess) {
        onLoginSuccess(userCredential.user);
      }
    } catch (error) {
      console.error('登录失败:', error);
      console.error('错误类型:', typeof error);
      console.error('错误toString():', error.toString());
      console.error('错误代码:', error.code);
      console.error('错误消息:', error.message);
      
      // 保存详细错误信息用于调试
      const errorDetails = {
        code: error.code,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        errorObjectKeys: Object.keys(error),
        errorToString: error.toString(),
        networkDetails: networkDetails,
        serviceWorkerStatus: swStatus
      };
      
      // 如果是网络请求失败，自动测试Firebase认证URL
      if (error.code === 'auth/network-request-failed') {
        console.log('检测到网络请求失败，自动测试Firebase认证URL...');
        
        // 异步测试Firebase认证URL，不阻塞错误处理
        (async () => {
          const authUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAexzhaDNB6VjSk7RJk1jWHyIs8BOqKkvI';
          try {
            const response = await fetch(authUrl, {
              method: 'HEAD',
              cache: 'no-cache',
              mode: 'no-cors'
            });
            errorDetails.firebaseAuthTest = {
              success: response.type === 'opaque',
              status: response.type
            };
            console.log('Firebase认证URL测试结果:', errorDetails.firebaseAuthTest);
          } catch (testError) {
            errorDetails.firebaseAuthTest = {
              success: false,
              error: testError.message
            };
            console.log('Firebase认证URL测试失败:', testError);
          }
          
          // 更新调试信息，包含Firebase认证测试结果
          setDebugInfo(JSON.stringify(errorDetails, null, 2));
        })();
      }
      
      console.log('详细错误信息:', errorDetails);
      
      setError(getErrorMessage(error));
      // 在开发环境下显示详细错误信息
      if (process.env.NODE_ENV === 'development') {
        setDebugInfo(JSON.stringify(errorDetails, null, 2));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 根据错误代码返回友好的错误消息
  const getErrorMessage = (error) => {
    // 打印完整错误对象到控制台（用于调试）
    console.log('完整错误对象:', error);
    
    // 增加防御性编程，确保即使error对象没有某些属性也能正常工作
    let errorCode = error.code;
    let errorMessage = error.message;
    
    // 如果error是字符串，直接返回
    if (typeof error === 'string') {
      return `登录失败: ${error}`;
    }
    
    // 如果error对象没有code或message属性，尝试从其他属性获取信息
    if (!errorCode) {
      // 尝试从error对象的其他属性获取错误代码
      errorCode = error.error?.code || error.name || 'unknown-error';
    }
    
    if (!errorMessage) {
      // 尝试从error对象的其他属性获取错误消息
      errorMessage = error.error?.message || error.toString() || '未知错误';
    }
    
    // 针对不同错误代码返回友好消息
    switch (errorCode) {
      case 'auth/invalid-email':
        return '无效的邮箱格式';
      case 'auth/user-disabled':
        return '该账户已被禁用';
      case 'auth/user-not-found':
        return '邮箱不存在';
      case 'auth/wrong-password':
        return '密码错误';
      case 'auth/network-request-failed':
        return `网络请求失败: ${errorMessage}`;
      case 'auth/too-many-requests':
        return '登录尝试次数过多，请稍后重试';
      case 'auth/invalid-login-credentials':
        return '邮箱或密码错误';
      default:
        return `登录失败: ${errorCode} - ${errorMessage}`;
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>服装出入库管理系统</h2>
        <p className="login-subtitle">管理员登录</p>
        
        {error && <div className="login-error">{error}</div>}
        
        {/* 调试信息显示 */}
        {debugInfo && (
          <div className="debug-info">
            <h4>调试信息</h4>
            <pre>{debugInfo}</pre>
          </div>
        )}

        {/* 网络诊断工具 */}
        <div className="diagnostic-tools">
          <h4>网络诊断</h4>
          <div className="diagnostic-buttons">
            <button 
              type="button" 
              className="diagnostic-button"
              onClick={testFirebaseAuthUrl}
              disabled={isLoading}
            >
              测试Firebase连接
            </button>
            <button 
              type="button" 
              className="diagnostic-button"
              onClick={clearBrowserCache}
            >
              清除缓存和数据
            </button>
          </div>
          
          {/* Firebase认证测试结果 */}
          {firebaseAuthTestResult && (
            <div className={`diagnostic-result ${firebaseAuthTestResult.success ? 'success' : 'error'}`}>
              <h5>Firebase连接测试结果</h5>
              <pre>{JSON.stringify(firebaseAuthTestResult, null, 2)}</pre>
            </div>
          )}
          
          {/* 网络状态信息 */}
          <div className="network-status">
            <h5>网络状态</h5>
            <p>在线状态: {networkDetails.online ? '在线' : '离线'}</p>
            <p>连接类型: {networkDetails.connectionType}</p>
            <p>有效类型: {networkDetails.effectiveType}</p>
            <p>延迟: {networkDetails.rtt}ms</p>
            <p>下行速度: {networkDetails.downlink}Mbps</p>
            <p>Service Worker: {swStatus}</p>
          </div>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="请输入管理员邮箱"
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        
        .login-form {
          background: white;
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        
        .login-form h2 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: bold;
          color: #333;
          text-align: center;
        }
        
        .login-subtitle {
          margin: 0 0 32px 0;
          font-size: 16px;
          color: #666;
          text-align: center;
        }
        
        .login-error {
          background-color: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 14px;
        }
        
        .debug-info {
          background-color: #f0f0f0;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 12px;
          overflow: auto;
          max-height: 200px;
        }
        
        .debug-info h4 {
          margin: 0 0 8px 0;
          color: #666;
          font-size: 14px;
        }
        
        .debug-info pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          color: #333;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* 网络诊断工具样式 */
        .diagnostic-tools {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
        }
        
        .diagnostic-tools h4 {
          margin: 0 0 12px 0;
          color: #495057;
          font-size: 16px;
        }
        
        .diagnostic-tools h5 {
          margin: 12px 0 8px 0;
          color: #6c757d;
          font-size: 14px;
        }
        
        .diagnostic-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .diagnostic-button {
          padding: 8px 12px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.3s;
          flex: 1;
        }
        
        .diagnostic-button:hover:not(:disabled) {
          background: #5a6268;
        }
        
        .diagnostic-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .diagnostic-result {
          background-color: white;
          padding: 8px;
          border-radius: 4px;
          margin-top: 8px;
          font-size: 12px;
          overflow: auto;
          max-height: 150px;
        }
        
        .diagnostic-result.success {
          border-left: 3px solid #28a745;
        }
        
        .diagnostic-result.error {
          border-left: 3px solid #dc3545;
        }
        
        .diagnostic-result pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .network-status {
          background-color: white;
          padding: 12px;
          border-radius: 4px;
          margin-top: 12px;
        }
        
        .network-status p {
          margin: 4px 0;
          font-size: 12px;
          color: #495057;
        }
      `}</style>
    </div>
  );
}

export default Login;