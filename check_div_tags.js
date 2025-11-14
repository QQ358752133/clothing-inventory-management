const fs = require('fs');

// 读取文件内容
const filePath = 'src/pages/ClothingManagement.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// 跟踪div标签的栈
const divStack = [];

// 逐行检查div标签
const lines = content.split('\n');
lines.forEach((line, index) => {
  const lineNumber = index + 1;
  
  // 检查开div标签（不包括自闭合标签）
  const openDivRegex = /<div(?!\/)\b[^>]*>/g;
  let match;
  while ((match = openDivRegex.exec(line)) !== null) {
    divStack.push(lineNumber);
  }
  
  // 检查闭div标签
  const closeDivRegex = /<\/div>/g;
  while ((match = closeDivRegex.exec(line)) !== null) {
    if (divStack.length === 0) {
      console.log(`❌ 第 ${lineNumber} 行发现多余的闭div标签`);
    } else {
      divStack.pop();
    }
  }
});

// 检查未闭合的div标签
if (divStack.length > 0) {
  console.log(`\n❌ 发现 ${divStack.length} 个未闭合的div标签，位于以下行:`);
  divStack.forEach(lineNumber => {
    console.log(`   第 ${lineNumber} 行`);
  });
} else {
  console.log('✅ 所有div标签都正确匹配!');
}

console.log('\n检查完成!');