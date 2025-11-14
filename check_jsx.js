const fs = require('fs');

// 读取文件内容
const content = fs.readFileSync('src/pages/ClothingManagement.jsx', 'utf8');

// 检查括号匹配
const checkBrackets = (str) => {
  const brackets = { '(': ')', '{': '}', '[': ']', '<div': '</div>' };
  const stack = [];
  
  for (let i = 0; i < str.length; i++) {
    // 检查div标签
    if (str.substr(i, 4) === '<div') {
      stack.push({ type: '<div', index: i });
    } else if (str.substr(i, 6) === '</div>') {
      if (stack.length === 0) {
        return { error: '多余的 </div>', index: i };
      }
      const last = stack.pop();
      if (last.type !== '<div') {
        return { error: `标签不匹配: ${last.type} 和 </div>`, index: i };
      }
    }
    
    // 检查括号
    const char = str[i];
    if (char === '(' || char === '{' || char === '[') {
      stack.push({ type: char, index: i });
    } else if (char === ')' || char === '}' || char === ']') {
      if (stack.length === 0) {
        return { error: `多余的 ${char}`, index: i };
      }
      const last = stack.pop();
      const expected = brackets[last.type];
      if (expected !== char) {
        return { error: `括号不匹配: ${last.type} 和 ${char}`, index: i };
      }
    }
  }
  
  if (stack.length > 0) {
    return { error: `未闭合的 ${stack[stack.length - 1].type}`, index: stack[stack.length - 1].index };
  }
  
  return { success: true };
};

// 执行检查
const result = checkBrackets(content);
if (result.success) {
  console.log('✅ 所有括号和标签匹配正常');
} else {
  console.log(`❌ 结构错误: ${result.error}`);
  // 显示错误位置附近的内容
  const start = Math.max(0, result.index - 100);
  const end = Math.min(content.length, result.index + 100);
  console.log('错误位置附近的内容:');
  console.log(content.slice(start, end));
}

// 检查条件渲染
console.log('\n=== 检查条件渲染结构 ===');
const conditionalOpen = (content.match(/\{!editingClothing\s*&&\s*\(/g) || []).length;
const conditionalClose = (content.match(/\)\s*\}/g) || []).length;
console.log(`{!editingClothing && ( 数量: ${conditionalOpen}`);
console.log(`)\} 数量: ${conditionalClose}`);

const editingOpen = (content.match(/\{editingClothing\s*&&\s*\(/g) || []).length;
const editingClose = (content.match(/\)\s*\}/g) || []).length;
console.log(`{editingClothing && ( 数量: ${editingOpen}`);
console.log(`)\} 数量: ${editingClose}`);