const fs = require('fs');
const path = require('path');

// 读取文件内容
const filePath = path.join(__dirname, 'src', 'pages', 'ClothingManagement.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// 按行拆分文件
const lines = content.split('\n');

// 显示第200-210行，包括行号
console.log('第200-210行内容（行号从1开始）：');
for (let i = 199; i < Math.min(lines.length, 210); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// 显示第670-681行，包括行号
console.log('\n第670-681行内容（行号从1开始）：');
for (let i = 669; i < Math.min(lines.length, 681); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// 查找所有包含斜杠的行
console.log('\n\n所有包含斜杠的行（排除注释和路径）：');
lines.forEach((line, index) => {
  if (line.includes('/') && !line.trim().startsWith('//') && !line.includes("'/") && !line.includes('"/')) {
    console.log(`${index + 1}: ${line}`);
  }
});