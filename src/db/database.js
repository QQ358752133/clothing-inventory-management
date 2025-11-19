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
}

export const db = new ClothingInventoryDB()

// 网络状态监听管理
let onlineListener = null;
let offlineListener = null;

// 添加网络状态监听器
export const setupNetworkListeners = () => {
  // 确保不会重复添加监听器
  if (!onlineListener) {
    onlineListener = () => {
      console.log('网络已连接，可以同步数据');
      // 这里可以添加数据同步逻辑
    };
    window.addEventListener('online', onlineListener);
  }
  
  if (!offlineListener) {
    offlineListener = () => {
      console.log('网络已断开，进入离线模式');
    };
    window.addEventListener('offline', offlineListener);
  }
};

// 移除网络状态监听器
export const cleanupNetworkListeners = () => {
  if (onlineListener) {
    window.removeEventListener('online', onlineListener);
    onlineListener = null;
  }
  
  if (offlineListener) {
    window.removeEventListener('offline', offlineListener);
    offlineListener = null;
  }
};