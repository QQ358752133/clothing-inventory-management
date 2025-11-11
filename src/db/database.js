import Dexie from 'dexie'

export class ClothingInventoryDB extends Dexie {
  constructor() {
    super('ClothingInventoryDB')
    
    this.version(1).stores({
      clothes: '++id, code, name, category, size, color, purchasePrice, sellingPrice, createdAt',
      inventory: '++id, clothingId, quantity, updatedAt',
      stockIn: '++id, clothingId, quantity, purchasePrice, totalAmount, date, operator, notes',
      stockOut: '++id, clothingId, quantity, sellingPrice, totalAmount, date, operator, customer, notes'
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
}

export const db = new ClothingInventoryDB()

// 监听网络状态变化
window.addEventListener('online', () => {
  console.log('网络已连接，可以同步数据')
  // 这里可以添加数据同步逻辑
})

window.addEventListener('offline', () => {
  console.log('网络已断开，进入离线模式')
})