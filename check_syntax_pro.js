const fs = require('fs');
const path = require('path');

// 读取文件内容
const filePath = path.join(__dirname, 'src', 'pages', 'ClothingManagement.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// 使用正则表达式检查基本语法结构
console.log('=== 检查JSX语法结构 ===');

// 检查括号匹配的更准确方法
const checkBrackets = (str, open, close, name) => {
  let count = 0;
  let lineNumber = 1;
  
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\n') {
      lineNumber++;
    }
    if (str[i] === open) {
      count++;
    } else if (str[i] === close) {
      count--;
      if (count < 0) {
        console.log(`第${lineNumber}行: 多余的${name}闭合符号`);
        return false;
      }
    }
  }
  
  if (count > 0) {
    console.log(`文件结束: 缺少${count}个${name}闭合符号`);
    return false;
  }
  
  return true;
};

// 检查各种括号
const parensOk = checkBrackets(content, '(', ')', '圆括号');
const bracesOk = checkBrackets(content, '{', '}', '大括号');
const bracketsOk = checkBrackets(content, '[', ']', '方括号');

// 检查JSX标签
console.log('\n=== 检查JSX标签 ===');
const jsxTags = content.match(/<\/?[A-Za-z][^>]*>/g) || [];
const tagStack = [];
let lineNumber = 1;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '\n') {
    lineNumber++;
  }
  
  // 查找标签
  if (content[i] === '<') {
    let tagEnd = content.indexOf('>', i);
    if (tagEnd > i) {
      let tag = content.substring(i, tagEnd + 1);
      
      // 检查是否是自闭合标签
      if (!tag.endsWith('/>')) {
        // 检查是否是闭合标签
        if (tag.startsWith('</')) {
          const tagName = tag.match(/<\/(\w+)/)[1];
          const lastTag = tagStack.pop();
          
          if (!lastTag || lastTag.name !== tagName) {
            console.log(`第${lineNumber}行: 标签不匹配，期望 </${lastTag?.name || '未知'}>，但找到 ${tag}`);
          }
        } else {
          // 开标签
          const tagName = tag.match(/<(\w+)/)[1];
          tagStack.push({ name: tagName, line: lineNumber });
        }
      }
      
      i = tagEnd;
    }
  }
}

// 检查未闭合的标签
if (tagStack.length > 0) {
  console.log('\n=== 未闭合的标签 ===');
  tagStack.forEach(tag => {
    console.log(`第${tag.line}行: <${tag.name}>`);
  });
} else {
  console.log('所有JSX标签都已正确闭合');
}

// 检查基本的JavaScript语法错误（使用简单的正则检查）
console.log('\n=== 检查基本JavaScript语法 ===');

// 检查分号和括号
const semiIssues = content.match(/\{[^\}]*\)[^\);]*$/gm);
if (semiIssues) {
  console.log('可能缺少分号的地方:');
  semiIssues.forEach((issue, index) => {
    const lineNum = content.slice(0, content.indexOf(issue)).split('\n').length;
    console.log(`第${lineNum}行: ${issue.trim()}`);
  });
}

// 总结
console.log('\n=== 语法检查总结 ===');
if (parensOk && bracesOk && bracketsOk && tagStack.length === 0) {
  console.log('✅ 没有发现明显的语法错误');
} else {
  console.log('❌ 发现语法问题，需要进一步检查');
}

// 尝试使用简单的方法检查第733行附近
console.log('\n=== 检查第730-740行 ===');
const lines = content.split('\n');
for (let i = 729; i < Math.min(740, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}