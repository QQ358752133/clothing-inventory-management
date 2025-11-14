const fs = require('fs');

// 读取文件内容
const content = fs.readFileSync('src/pages/ClothingManagement.jsx', 'utf8');

// 查找return语句
const returnIndex = content.indexOf('return');
if (returnIndex === -1) {
  console.log('没有找到return语句');
  process.exit(1);
}

// 查看return语句附近的内容
const returnContext = content.slice(returnIndex, returnIndex + 1000);
console.log('=== Return Statement Context ===');
console.log(returnContext);
console.log('\n=== End of Return Context ===\n');

// 检查文件末尾的内容
const endContent = content.slice(content.length - 200);
console.log('=== File End Context ===');
console.log(endContent);
console.log('=== End of File End Context ===');