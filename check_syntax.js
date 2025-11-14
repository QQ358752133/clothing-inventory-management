const fs = require('fs');
const path = require('path');

// 读取文件内容
const filePath = path.join(__dirname, 'src', 'pages', 'ClothingManagement.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// 检查正则表达式
console.log('=== 检查可能的正则表达式 ===');
const regexPattern = /\/[^\s"'\/\\]*\//g;
let match;
while ((match = regexPattern.exec(content)) !== null) {
  const line = content.substring(0, match.index).split('\n').length;
  console.log(`第${line}行找到可能的正则表达式: ${match[0]}`);
}

// 检查括号匹配
console.log('\n=== 检查括号匹配 ===');
const brackets = '{}[]()';
const stack = [];
let lineNumber = 1;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  
  if (char === '\n') {
    lineNumber++;
    continue;
  }
  
  const bracketIndex = brackets.indexOf(char);
  if (bracketIndex === -1) continue;
  
  if (bracketIndex % 2 === 0) {
    // 左括号
    stack.push({ char, lineNumber });
  } else {
    // 右括号
    const last = stack.pop();
    if (!last) {
      console.log(`第${lineNumber}行: 多余的右括号 '${char}'`);
    } else if (last.char !== brackets[bracketIndex - 1]) {
      console.log(`第${lineNumber}行: 括号不匹配，期望 '${brackets[bracketIndex - 1]}'，但找到 '${char}'`);
    }
  }
}

// 检查未闭合的左括号
stack.forEach(bracket => {
  console.log(`第${bracket.lineNumber}行: 未闭合的左括号 '${bracket.char}'`);
});

// 检查字符串闭合
console.log('\n=== 检查字符串闭合 ===');
let inString = false;
let stringChar = '';
let escape = false;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  
  if (char === '\n') {
    lineNumber++;
    continue;
  }
  
  if (escape) {
    escape = false;
    continue;
  }
  
  if (char === '\\') {
    escape = true;
    continue;
  }
  
  if (!inString && (char === '"' || char === "'")) {
    inString = true;
    stringChar = char;
  } else if (inString && char === stringChar) {
    inString = false;
  }
}

if (inString) {
  console.log(`文件末尾: 未闭合的字符串，使用的引号是 '${stringChar}'`);
}

// 显示文件的最后50行
console.log('\n=== 文件最后50行 ===');
const lines = content.split('\n');
const startLine = Math.max(0, lines.length - 50);
for (let i = startLine; i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}