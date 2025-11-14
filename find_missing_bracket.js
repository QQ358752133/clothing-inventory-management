const fs = require('fs');

// 读取文件内容
const filePath = 'src/pages/ClothingManagement.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// 跟踪括号的栈
const stack = [];

// 遍历每个字符
for (let i = 0; i < content.length; i++) {
  const char = content[i];
  
  // 处理开括号
  if (char === '(' || char === '{' || char === '[') {
    stack.push({ type: char, index: i });
  }
  
  // 处理闭括号
  else if (char === ')' || char === '}' || char === ']') {
    if (stack.length === 0) {
      // 找到多余的闭括号
      const line = content.substring(0, i).split('\n').length;
      console.log(`❌ 第 ${line} 行发现多余的闭括号: ${char}`);
    } else {
      const last = stack.pop();
      // 检查括号类型是否匹配
      if (
        (last.type === '(' && char !== ')') ||
        (last.type === '{' && char !== '}') ||
        (last.type === '[' && char !== ']')
      ) {
        const line = content.substring(0, i).split('\n').length;
        console.log(`❌ 第 ${line} 行括号类型不匹配: 期望 ${getMatchingBracket(last.type)}，但找到 ${char}`);
      }
    }
  }
}

// 检查未闭合的括号
if (stack.length > 0) {
  console.log(`\n❌ 发现 ${stack.length} 个未闭合的括号:`);
  stack.forEach(bracket => {
    const line = content.substring(0, bracket.index).split('\n').length;
    console.log(`   第 ${line} 行的 ${bracket.type}`);
  });
} else {
  console.log('✅ 所有括号都正确匹配!');
}

// 辅助函数：获取匹配的括号
function getMatchingBracket(bracket) {
  switch (bracket) {
    case '(': return ')';
    case '{': return '}';
    case '[': return ']';
    default: return '';
  }
}