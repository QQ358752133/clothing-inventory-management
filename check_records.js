// 检查数据库中的入库和出库记录
import Dexie from 'dexie';

// 定义与原项目相同的数据库结构
class ClothingInventoryDB extends Dexie {
  constructor() {
    super('ClothingInventoryDB');
    this.version(1).stores({
      clothes: 'id, name, category, purchasePrice, sellingPrice, description',
      inventory: 'id, clothingId, quantity, lastUpdated',
      stockIn: 'id, clothingId, quantity, date, totalAmount, remarks',
      stockOut: 'id, clothingId, quantity, date, totalAmount, remarks',
      settings: 'key, value'
    });
  }
}

async function checkRecords() {
  try {
    const db = new ClothingInventoryDB();
    
    console.log('=== 检查数据库记录 ===');
    
    // 检查入库记录
    const stockInRecords = await db.stockIn.toArray();
    console.log(`入库记录数量: ${stockInRecords.length}`);
    if (stockInRecords.length > 0) {
      console.log('前3条入库记录:');
      stockInRecords.slice(0, 3).forEach(record => {
        console.log(`- ID: ${record.id}, 服装ID: ${record.clothingId}, 数量: ${record.quantity}, 日期: ${record.date}`);
      });
    }
    
    // 检查出库记录
    const stockOutRecords = await db.stockOut.toArray();
    console.log(`出库记录数量: ${stockOutRecords.length}`);
    if (stockOutRecords.length > 0) {
      console.log('前3条出库记录:');
      stockOutRecords.slice(0, 3).forEach(record => {
        console.log(`- ID: ${record.id}, 服装ID: ${record.clothingId}, 数量: ${record.quantity}, 日期: ${record.date}`);
      });
    }
    
    // 检查商品数据
    const clothes = await db.clothes.toArray();
    console.log(`商品记录数量: ${clothes.length}`);
    
    db.close();
  } catch (error) {
    console.error('检查记录时出错:', error);
  }
}

checkRecords();