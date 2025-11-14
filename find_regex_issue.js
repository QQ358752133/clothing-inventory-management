const fs = require('fs');
const path = require('path');

// 读取文件内容
const filePath = path.join(__dirname, 'src', 'pages', 'ClothingManagement.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// 按行拆分文件
const lines = content.split('\n');

// 查找可能被误解为正则表达式的模式
console.log('=== 查找可能被误解为正则表达式的模式 ===');

// 检查可能的正则表达式模式
const suspiciousPatterns = [
  /\s\/[^\s"'\/\\]*\//g,  // 空格后跟斜杠，可能被误解为正则
  /\)[\s]*\/[^\s"'\/\\]*\//g,  // 右括号后跟斜杠
  /\][\s]*\/[^\s"'\/\\]*\//g,  // 右方括号后跟斜杠
  /\}[\s]*\/[^\s"'\/\\]*\//g,  // 右花括号后跟斜杠
  /,\s*\/[^\s"'\/\\]*\//g,  // 逗号后跟斜杠
  /;\s*\/[^\s"'\/\\]*\//g  // 分号后跟斜杠
];

lines.forEach((line, lineIndex) => {
  const currentLine = lineIndex + 1;
  
  suspiciousPatterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(line)) !== null) {
      console.log(`第${currentLine}行: 可能的问题模式 '${match[0]}'`);
      console.log(`   完整行: ${line}`);
    }
  });
  
  // 检查字符串中的斜杠
  if ((line.includes('"') || line.includes("'")) && line.includes('/')) {
    // 检查是否有未转义的斜杠在字符串中
    const inString = [];
    let escape = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (escape) {
        escape = false;
        continue;
      }
      
      if (char === '\\') {
        escape = true;
        continue;
      }
      
      if (char === '"' || char === "'") {
        if (inString.length === 0) {
          inString.push(char);
        } else if (inString[inString.length - 1] === char) {
          inString.pop();
        }
      }
    }
    
    if (inString.length > 0) {
      console.log(`第${currentLine}行: 未闭合的字符串`);
      console.log(`   行内容: ${line}`);
    }
  }
});

// 显示文件的第670-681行
console.log('\n=== 第670-681行内容 ===');
for (let i = 669; i < Math.min(lines.length, 681); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// 检查第204行内容（之前ESLint报错的位置）
console.log('\n=== 第200-210行内容 ===');
for (let i = 199; i < Math.min(lines.length, 210); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}