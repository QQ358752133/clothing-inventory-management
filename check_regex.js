const fs = require('fs');
const path = require('path');

// 读取文件内容
const filePath = path.join(__dirname, 'src', 'pages', 'ClothingManagement.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// 按行拆分文件
const lines = content.split('\n');

// 查找可能的正则表达式
console.log('查找可能的正则表达式模式：');
lines.forEach((line, index) => {
  // 查找包含斜杠的行，可能是正则表达式
  if (line.includes('/')) {
    // 排除注释、字符串中的斜杠、路径等
    if (!line.trim().startsWith('//') && !line.includes("'/") && !line.includes('"/')) {
      // 查找可能的正则表达式字面量
      const regexMatch = line.match(/\/[^\/\n]*\//g);
      if (regexMatch) {
        console.log(`第 ${index + 1} 行: ${line.trim()}`);
        console.log(`  发现正则表达式: ${regexMatch.join(', ')}`);
      }
    }
  }
});

// 检查第676行附近的内容
console.log('\n第670-681行内容：');
for (let i = Math.max(0, 669); i < Math.min(lines.length, 681); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// 检查是否有未闭合的正则表达式
console.log('\n检查未闭合的正则表达式：');
let inRegex = false;
let regexStartLine = 0;
let regexContent = '';

lines.forEach((line, index) => {
  if (inRegex) {
    regexContent += line;
    // 检查是否有闭合的斜杠
    const closeSlashIndex = line.indexOf('/');
    if (closeSlashIndex !== -1) {
      console.log(`第 ${regexStartLine + 1}-${index + 1} 行: ${regexContent}`);
      inRegex = false;
      regexContent = '';
    }
  } else {
    // 查找可能的正则表达式开始
    const regexMatch = line.match(/(^|[^\w\\])\/(?!\/)/);
    if (regexMatch) {
      const startIndex = regexMatch.index + regexMatch[0].length;
      regexContent = line.substring(startIndex);
      regexStartLine = index;
      
      // 检查是否在同一行闭合
      const closeSlashIndex = regexContent.indexOf('/');
      if (closeSlashIndex === -1) {
        inRegex = true;
      } else {
        // 在同一行闭合的正则表达式
        regexContent = line.substring(startIndex, startIndex + closeSlashIndex + 1);
        console.log(`第 ${index + 1} 行: ${regexContent}`);
        regexContent = '';
      }
    }
  }
});

if (inRegex) {
  console.log(`发现未闭合的正则表达式，从第 ${regexStartLine + 1} 行开始: ${regexContent}`);
}