import Dexie from 'dexie'
// 导入Firebase相关模块
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update, remove } from 'firebase/database';

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

// 初始化Firebase应用
const firebaseApp = initializeApp(firebaseConfig);

// 获取Firebase实时数据库实例
const firebaseDatabase = getDatabase(firebaseApp);

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

    try {
      console.log('开始同步数据到Firebase...')
      
      // 检查本地数据数量
      const clothesCount = await this.clothes.count()
      const inventoryCount = await this.inventory.count()
      const stockInCount = await this.stockIn.count()
      const stockOutCount = await this.stockOut.count()
      
      console.log(`本地数据数量: 服装${clothesCount}, 库存${inventoryCount}, 入库${stockInCount}, 出库${stockOutCount}`)
      
      // 同步服装数据
      const clothes = await this.clothes.toArray()
      console.log('开始同步服装数据...', clothes.length)
      for (const item of clothes) {
        console.log(`同步服装: ${item.id} - ${item.name}`)
        await set(ref(firebaseDatabase, `clothes/${item.id}`), item)
      }

      // 同步库存数据
      const inventory = await this.inventory.toArray()
      console.log('开始同步库存数据...', inventory.length)
      for (const item of inventory) {
        console.log(`同步库存: ${item.id} - 服装ID: ${item.clothingId}, 数量: ${item.quantity}`)
        await set(ref(firebaseDatabase, `inventory/${item.id}`), item)
      }

      // 同步入库记录
      const stockIn = await this.stockIn.toArray()
      console.log('开始同步入库记录...', stockIn.length)
      for (const item of stockIn) {
        console.log(`同步入库: ${item.id} - 服装ID: ${item.clothingId}, 数量: ${item.quantity}`)
        await set(ref(firebaseDatabase, `stockIn/${item.id}`), item)
      }

      // 同步出库记录
      const stockOut = await this.stockOut.toArray()
      console.log('开始同步出库记录...', stockOut.length)
      for (const item of stockOut) {
        console.log(`同步出库: ${item.id} - 服装ID: ${item.clothingId}, 数量: ${item.quantity}`)
        await set(ref(firebaseDatabase, `stockOut/${item.id}`), item)
      }

      // 标记同步完成
      this.markSyncComplete()
      console.log('数据同步到Firebase成功')
      return true
    } catch (error) {
      console.error('同步到Firebase失败:', error)
      console.error('错误详情:', error.code, error.message)
      return false
    }
  }

  // 从Firebase同步数据到本地
  async syncFromFirebase() {
    if (!navigator.onLine) {
      console.log('网络未连接，无法从Firebase同步')
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

    try {
      // 监听服装数据变化
      onValue(ref(firebaseDatabase, 'clothes'), (snapshot) => {
        try {
          const data = snapshot.val()
          if (data) {
            this.clothes.clear().then(() => {
              const promises = []
              for (const key in data) {
                promises.push(this.clothes.add(data[key]))
              }
              return Promise.all(promises)
            }).then(() => {
              console.log('服装数据已从Firebase实时更新')
            }).catch(error => {
              console.error('更新本地服装数据失败:', error)
            })
          }
        } catch (error) {
          console.error('处理服装数据变化时出错:', error)
        }
      }, { onlyOnce: false })

      // 监听库存数据变化
      onValue(ref(firebaseDatabase, 'inventory'), (snapshot) => {
        try {
          const data = snapshot.val()
          if (data) {
            this.inventory.clear().then(() => {
              const promises = []
              for (const key in data) {
                promises.push(this.inventory.add(data[key]))
              }
              return Promise.all(promises)
            }).then(() => {
              console.log('库存数据已从Firebase实时更新')
            }).catch(error => {
              console.error('更新本地库存数据失败:', error)
            })
          }
        } catch (error) {
          console.error('处理库存数据变化时出错:', error)
        }
      }, { onlyOnce: false })

      // 监听入库记录变化
      onValue(ref(firebaseDatabase, 'stockIn'), (snapshot) => {
        try {
          const data = snapshot.val()
          if (data) {
            this.stockIn.clear().then(() => {
              const promises = []
              for (const key in data) {
                promises.push(this.stockIn.add(data[key]))
              }
              return Promise.all(promises)
            }).then(() => {
              console.log('入库记录已从Firebase实时更新')
            }).catch(error => {
              console.error('更新本地入库记录失败:', error)
            })
          }
        } catch (error) {
          console.error('处理入库记录变化时出错:', error)
        }
      }, { onlyOnce: false })

      // 监听出库记录变化
      onValue(ref(firebaseDatabase, 'stockOut'), (snapshot) => {
        try {
          const data = snapshot.val()
          if (data) {
            this.stockOut.clear().then(() => {
              const promises = []
              for (const key in data) {
                promises.push(this.stockOut.add(data[key]))
              }
              return Promise.all(promises)
            }).then(() => {
              console.log('出库记录已从Firebase实时更新')
            }).catch(error => {
              console.error('更新本地出库记录失败:', error)
            })
          }
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
  console.log('网络已连接，可以同步数据')
  try {
    // 网络恢复时重置监听标记
    db.realtimeListenersSet = false;
    // 网络恢复时自动同步数据
    await db.syncFromFirebase();
    await db.syncToFirebase();
    db.setupRealtimeListener();
  } catch (error) {
    console.error('网络恢复时数据同步失败:', error);
  }
})

window.addEventListener('offline', () => {
  console.log('网络已断开，进入离线模式')
  // 网络断开时重置监听标记
  db.realtimeListenersSet = false;
})

// 应用初始化时执行的操作
async function initializeAppData() {
  if (navigator.onLine) {
    try {
      // 先从Firebase同步初始数据
      await db.syncFromFirebase();
      // 然后设置实时监听
      db.setupRealtimeListener();
    } catch (error) {
      console.error('应用初始化数据同步失败:', error);
      // 即使初始同步失败，也尝试设置实时监听
      db.setupRealtimeListener();
    }
  } else {
    console.log('应用启动时网络离线，将在网络连接后自动同步数据');
  }
}

// 初始化应用数据
initializeAppData();