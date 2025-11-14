const fs = require('fs');
const path = require('path');

// 读取文件内容
const filePath = path.join(__dirname, 'src', 'pages', 'ClothingManagement.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// 按行拆分文件
const lines = content.split('\n');

// 尝试使用V8的语法解析器来检查每行
console.log('开始检查每行语法...');

let currentContent = '';
for (let i = 0; i < lines.length; i++) {
  currentContent += lines[i] + '\n';
  
  try {
    // 尝试解析当前内容
    require('vm').runInNewContext(currentContent, {}, { filename: 'test.jsx', displayErrors: true });
  } catch (e) {
    // 如果在第676行附近出错，输出详细信息
    if (i >= 670 && i <= 680) {
      console.log(`\n在第 ${i + 1} 行发现错误:`);
      console.log(`行内容: ${lines[i]}`);
      console.log(`错误信息: ${e.message}`);
      console.log(`上下文: ${lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 6)).join('\n')}`);
    }
  }
}

// 尝试使用更严格的方式检查整个文件的一部分
console.log('\n\n尝试检查第600-681行的内容:');
const suspectContent = lines.slice(599, 681).join('\n');

try {
  // 简单检查括号是否匹配
  let brackets = [];
  for (let i = 0; i < suspectContent.length; i++) {
    const char = suspectContent[i];
    if (char === '{' || char === '(' || char === '[') {
      brackets.push(char);
    } else if (char === '}' || char === ')' || char === ']') {
      const last = brackets.pop();
      if ((char === '}' && last !== '{') || (char === ')' && last !== '(') || (char === ']' && last !== '[')) {
        console.log(`括号不匹配在位置 ${i}: ${char}`);
      }
    }
  }
  if (brackets.length > 0) {
    console.log(`未闭合的括号: ${brackets.join(', ')}`);
  }
  
  // 检查引号是否匹配
  let inString = false;
  let quoteChar = '';
  for (let i = 0; i < suspectContent.length; i++) {
    const char = suspectContent[i];
    if ((char === '"' || char === "'") && suspectContent[i-1] !== '\\') {
      if (!inString) {
        inString = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inString = false;
      }
    }
  }
  if (inString) {
    console.log(`未闭合的字符串，使用引号: ${quoteChar}`);
  }
  
  // 检查注释是否匹配
  let inComment = false;
  for (let i = 0; i < suspectContent.length - 1; i++) {
    if (suspectContent[i] === '/' && suspectContent[i+1] === '*') {
      inComment = true;
    } else if (suspectContent[i] === '*' && suspectContent[i+1] === '/' && inComment) {
      inComment = false;
    }
  }
  if (inComment) {
    console.log('未闭合的多行注释');
  }
  
} catch (e) {
  console.log(`检查时出错: ${e.message}`);
}

console.log('\n\n检查完成!');