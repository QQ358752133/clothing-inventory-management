import Dexie from 'dexie'
// 导入Firebase相关模块
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update, remove } from 'firebase/database';
// 导入Firebase认证模块
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Firebase配置（已更新为您的项目配置）
const firebaseConfig = {
  apiKey: "AIzaSyAexzhaDNB6VjSk7RJk1jWHyIs8BOqKkvI",
  authDomain: "fuzhuang-705a0.firebaseapp.com",
  databaseURL: "https://fuzhuang-705a0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fuzhuang-705a0",
  storageBucket: "fuzhuang-705a0.firebasestorage.app",
  messagingSenderId: "416675247842",
  appId: "1:416675247842:web:d9b091ef5ccd87c1b910bb",
  measurementId: "G-CBBQH3406Y"
};

// 添加初始化调试信息
console.log('Firebase配置:', {
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId
});

console.log('网络状态:', navigator.onLine ? '在线' : '离线');
console.log('设备信息:', navigator.userAgent);

// 初始化Firebase应用（避免重复初始化）
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
console.log('Firebase应用初始化成功:', firebaseApp.name);

// 获取Firebase实时数据库实例
const firebaseDatabase = getDatabase(firebaseApp);
console.log('Firebase数据库实例获取成功');

// 获取Firebase认证实例
const firebaseAuth = getAuth(firebaseApp);
console.log('Firebase认证实例获取成功');

// 监控认证实例状态
console.log('Firebase认证域名:', firebaseAuth.app.options.authDomain);

// 监听全局认证状态变化（用于调试）
onAuthStateChanged(firebaseAuth, (user) => {
  console.log('全局认证状态变化:', user ? {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName
  } : '未登录');
});

export { firebaseAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged };

export class ClothingInventoryDB extends Dexie {
  constructor() {
    super('ClothingInventoryDB')
    
    // 用于追踪是否已设置实时监听
    this.realtimeListenersSet = false;
    
    this.version(1).stores({
      clothes: '++id, code, name, category, size, color, purchasePrice, sellingPrice, createdAt',
      inventory: '++id, clothingId, quantity, updatedAt',
      stockIn: '++id, clothingId, quantity, purchasePrice, totalAmount, date, operator, notes',
      stockOut: '++id, clothingId, quantity, sellingPrice, totalAmount, date, operator, customer, notes'
    })
    
    // 更新到版本2，添加settings表
    this.version(2).stores({
      clothes: '++id, code, name, category, size, color, purchasePrice, sellingPrice, createdAt',
      inventory: '++id, clothingId, quantity, updatedAt',
      stockIn: '++id, clothingId, quantity, purchasePrice, totalAmount, date, operator, notes',
      stockOut: '++id, clothingId, quantity, sellingPrice, totalAmount, date, operator, customer, notes',
      settings: 'key, value'
    })
  }

  // 离线数据同步状态
  async getSyncStatus() {
    return {
      isOnline: navigator.onLine,
      lastSync: localStorage.getItem('lastSync') || '从未同步',
      offlineChanges: parseInt(localStorage.getItem('offlineChanges') || '0')
    }
  }

  // 标记离线操作
  markOfflineChange() {
    const changes = parseInt(localStorage.getItem('offlineChanges') || '0') + 1
    localStorage.setItem('offlineChanges', changes.toString())
  }

  // 标记同步完成
  markSyncComplete() {
    localStorage.setItem('lastSync', new Date().toLocaleString())
    localStorage.setItem('offlineChanges', '0')
  }

  // 同步本地数据到Firebase
  async syncToFirebase() {
    if (!navigator.onLine) {
      console.log('网络未连接，无法同步到Firebase')
      return false
    }

    // 检查用户是否已认证
    const user = firebaseAuth.currentUser;
    if (!user) {
      console.log('用户未认证，无法同步数据到Firebase')
      return false
    }

    try {
      console.log('开始同步数据到Firebase...')
      
      // 定义需要同步的表
      const tables = ['clothes', 'inventory', 'stockIn', 'stockOut']
      
      for (const table of tables) {
        // 获取本地数据
        const localData = await this[table].toArray()
        const localIds = new Set(localData.map(item => item.id))
        
        console.log(`开始同步${table}数据...本地数量: ${localData.length}`)
        
        // 获取Firebase中的数据
        const tableRef = ref(firebaseDatabase, table)
        const snapshot = await get(tableRef)
        const firebaseData = snapshot.val() || {}
        
        // 同步本地数据到Firebase
        for (const item of localData) {
          console.log(`同步${table}: ${item.id}`)
          await set(ref(firebaseDatabase, `${table}/${item.id}`), item)
        }
        
        // 删除Firebase中存在但本地不存在的记录
        for (const key in firebaseData) {
          const firebaseId = parseInt(key)
          if (!localIds.has(firebaseId)) {
            console.log(`从Firebase删除${table}中不存在于本地的记录: ${firebaseId}`)
            await remove(ref(firebaseDatabase, `${table}/${firebaseId}`))
          }
        }
      }

      // 标记同步完成
      this.markSyncComplete()
      console.log('数据同步到Firebase成功')
      return true
    } catch (error) {
      console.error('同步到Firebase失败:', error)
      if (error.code === 'PERMISSION_DENIED') {
        console.error('权限被拒绝：请检查Firebase实时数据库规则设置是否正确，确保只有认证用户可以访问数据')
      } else {
        console.error('错误详情:', error.code, error.message)
      }
      return false
    }
  }

  // 从Firebase同步数据到本地
  async syncFromFirebase() {
    if (!navigator.onLine) {
      console.log('网络未连接，无法从Firebase同步')
      return false
    }

    // 检查用户是否已认证
    const user = firebaseAuth.currentUser;
    if (!user) {
      console.log('用户未认证，无法从Firebase同步数据')
      return false
    }

    try {
      // 同步服装数据
      const clothesRef = ref(firebaseDatabase, 'clothes')
      const clothesSnapshot = await get(clothesRef)
      if (clothesSnapshot.exists()) {
        const clothesData = clothesSnapshot.val()
        await this.clothes.clear()
        for (const key in clothesData) {
          await this.clothes.add(clothesData[key])
        }
      }

      // 同步库存数据
      const inventoryRef = ref(firebaseDatabase, 'inventory')
      const inventorySnapshot = await get(inventoryRef)
      if (inventorySnapshot.exists()) {
        const inventoryData = inventorySnapshot.val()
        await this.inventory.clear()
        for (const key in inventoryData) {
          await this.inventory.add(inventoryData[key])
        }
      }

      // 同步入库记录
      const stockInRef = ref(firebaseDatabase, 'stockIn')
      const stockInSnapshot = await get(stockInRef)
      if (stockInSnapshot.exists()) {
        const stockInData = stockInSnapshot.val()
        await this.stockIn.clear()
        for (const key in stockInData) {
          await this.stockIn.add(stockInData[key])
        }
      }

      // 同步出库记录
      const stockOutRef = ref(firebaseDatabase, 'stockOut')
      const stockOutSnapshot = await get(stockOutRef)
      if (stockOutSnapshot.exists()) {
        const stockOutData = stockOutSnapshot.val()
        await this.stockOut.clear()
        for (const key in stockOutData) {
          await this.stockOut.add(stockOutData[key])
        }
      }

      // 标记同步完成
      this.markSyncComplete()
      console.log('从Firebase同步数据成功')
      return true
    } catch (error) {
      console.error('从Firebase同步数据失败:', error)
      if (error.code === 'PERMISSION_DENIED') {
        console.error('权限被拒绝：请检查Firebase实时数据库规则设置是否正确，确保只有认证用户可以访问数据')
      }
      return false
    }
  }

  // 监听Firebase数据变化，实时更新本地数据库
  setupRealtimeListener() {
    // 防止重复设置监听
    if (this.realtimeListenersSet) {
      console.log('Firebase实时监听已存在，跳过设置')
      return
    }
    
    if (!navigator.onLine) {
      console.log('网络未连接，无法设置实时监听')
      return
    }

    // 检查用户是否已认证
    const user = firebaseAuth.currentUser;
    if (!user) {
      console.log('用户未认证，无法设置Firebase实时监听')
      return
    }

    try {
      // 监听服装数据变化
      onValue(ref(firebaseDatabase, 'clothes'), (snapshot) => {
        try {
          const data = snapshot.val()
          this.clothes.clear().then(() => {
            if (data) {
              const promises = []
              for (const key in data) {
                promises.push(this.clothes.add(data[key]))
              }
              return Promise.all(promises)
            }
            return Promise.resolve()
          }).then(() => {
            console.log('服装数据已从Firebase实时更新')
          }).catch(error => {
            console.error('更新本地服装数据失败:', error)
          })
        } catch (error) {
          console.error('处理服装数据变化时出错:', error)
        }
      }, { onlyOnce: false })

      // 监听库存数据变化
      onValue(ref(firebaseDatabase, 'inventory'), (snapshot) => {
        try {
          const data = snapshot.val()
          this.inventory.clear().then(() => {
            if (data) {
              const promises = []
              for (const key in data) {
                promises.push(this.inventory.add(data[key]))
              }
              return Promise.all(promises)
            }
            return Promise.resolve()
          }).then(() => {
            console.log('库存数据已从Firebase实时更新')
          }).catch(error => {
            console.error('更新本地库存数据失败:', error)
          })
        } catch (error) {
          console.error('处理库存数据变化时出错:', error)
        }
      }, { onlyOnce: false })

      // 监听入库记录变化
      onValue(ref(firebaseDatabase, 'stockIn'), (snapshot) => {
        try {
          const data = snapshot.val()
          this.stockIn.clear().then(() => {
            if (data) {
              const promises = []
              for (const key in data) {
                promises.push(this.stockIn.add(data[key]))
              }
              return Promise.all(promises)
            }
            return Promise.resolve()
          }).then(() => {
            console.log('入库记录已从Firebase实时更新')
          }).catch(error => {
            console.error('更新本地入库记录失败:', error)
          })
        } catch (error) {
          console.error('处理入库记录变化时出错:', error)
        }
      }, { onlyOnce: false })

      // 监听出库记录变化
      onValue(ref(firebaseDatabase, 'stockOut'), (snapshot) => {
        try {
          const data = snapshot.val()
          this.stockOut.clear().then(() => {
            if (data) {
              const promises = []
              for (const key in data) {
                promises.push(this.stockOut.add(data[key]))
              }
              return Promise.all(promises)
            }
            return Promise.resolve()
          }).then(() => {
            console.log('出库记录已从Firebase实时更新')
          }).catch(error => {
            console.error('更新本地出库记录失败:', error)
          })
        } catch (error) {
          console.error('处理出库记录变化时出错:', error)
        }
      }, { onlyOnce: false })

      // 标记监听已设置
      this.realtimeListenersSet = true
      console.log('Firebase实时监听已设置')
    } catch (error) {
      console.error('设置Firebase实时监听失败:', error)
    }
  }
}

export const db = new ClothingInventoryDB()

// 监听网络状态变化
window.addEventListener('online', async () => {
  console.log('网络已连接，正在尝试同步数据...')
  try {
    // 检查用户是否已认证
    const user = firebaseAuth.currentUser;
    if (user) {
      // 用户已认证，执行同步
      console.log('用户已认证，开始同步数据...')
      await db.syncFromFirebase()
      await db.syncToFirebase()
      if (!db.realtimeListenersSet) {
        db.setupRealtimeListener()
      }
    } else {
      console.log('用户未认证，需登录后才能同步数据')
    }
  } catch (error) {
    console.error('处理网络恢复事件时出错:', error)
    // 更详细的错误信息
    if (error.code) {
      console.error('错误代码:', error.code)
    }
    if (error.message) {
      console.error('错误消息:', error.message)
    }
  }
})

window.addEventListener('offline', () => {
  console.log('网络已断开，进入离线模式')
  // 网络断开时重置监听标记
  db.realtimeListenersSet = false;
})

// 应用初始化时执行的操作
function initializeAppData() {
  // 不再自动同步数据，需要用户认证后才能同步
  console.log('应用初始化完成，等待用户认证...');
}

// 初始化应用数据
initializeAppData();