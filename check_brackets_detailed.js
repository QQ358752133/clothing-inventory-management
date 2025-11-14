const fs = require('fs');
const path = require('path');

// 读取文件内容
const filePath = 'src/pages/ClothingManagement.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// 初始化计数器
const brackets = {
  '(': [],
  ')': [],
  '{': [],
  '}': [],
  '[': [],
  ']': [],
  '<div': [],
  '</div>': []
};

// 逐行检查
const lines = content.split('\n');
lines.forEach((line, index) => {
  const lineNumber = index + 1;
  
  // 检查括号
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (brackets[char]) {
      brackets[char].push(lineNumber);
    }
  }
  
  // 检查div标签
  let pos = 0;
  while ((pos = line.indexOf('<div', pos)) !== -1) {
    brackets['<div'].push(lineNumber);
    pos += 4;
  }
  
  pos = 0;
  while ((pos = line.indexOf('</div>', pos)) !== -1) {
    brackets['</div>'].push(lineNumber);
    pos += 6;
  }
});

// 输出结果
console.log('括号匹配检查结果:');
console.log(`( : ${brackets['('].length} 个`);
console.log(`) : ${brackets[')'].length} 个`);
console.log(`{ : ${brackets['{'].length} 个`);
console.log(`} : ${brackets['}'].length} 个`);
console.log(`[ : ${brackets['['].length} 个`);
console.log(`] : ${brackets[']'].length} 个`);
console.log(`<div : ${brackets['<div'].length} 个`);
console.log(`</div> : ${brackets['</div>'].length} 个`);

// 检查不匹配
if (brackets['('].length !== brackets[')'].length) {
  console.log('❌ 圆括号不匹配!');
  console.log(`   开括号位置: ${brackets['('].join(', ')}`);
  console.log(`   闭括号位置: ${brackets[')'].join(', ')}`);
}

if (brackets['{'].length !== brackets['}'].length) {
  console.log('❌ 大括号不匹配!');
  console.log(`   开括号位置: ${brackets['{'].join(', ')}`);
  console.log(`   闭括号位置: ${brackets['}'].join(', ')}`);
}

if (brackets['['].length !== brackets[']'].length) {
  console.log('❌ 方括号不匹配!');
  console.log(`   开括号位置: ${brackets['['].join(', ')}`);
  console.log(`   闭括号位置: ${brackets[']'].join(', ')}`);
}

if (brackets['<div'].length !== brackets['</div>'].length) {
  console.log('❌ div标签不匹配!');
  console.log(`   开标签位置: ${brackets['<div'].slice(0, 5).join(', ')}${brackets['<div'].length > 5 ? '...' : ''}`);
  console.log(`   闭标签位置: ${brackets['</div>'].slice(0, 5).join(', ')}${brackets['</div>'].length > 5 ? '...' : ''}`);
}

console.log('\n详细检查完成!');