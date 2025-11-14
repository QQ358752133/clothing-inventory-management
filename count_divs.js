const fs = require('fs');

// 读取文件内容
const content = fs.readFileSync('src/pages/ClothingManagement.jsx', 'utf8');

// 统计div标签
const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
const selfClosingDivs = (content.match(/<div[^>]*\/>/g) || []).length;

console.log('=== Div Tag Count ===');
console.log('Open div tags:', openDivs);
console.log('Close div tags:', closeDivs);
console.log('Self-closing div tags:', selfClosingDivs);
console.log('Net div tags:', openDivs - closeDivs - selfClosingDivs);

// 检查return语句的括号
const returnOpen = (content.match(/return\s*\(/g) || []).length;
const returnClose = (content.match(/\)\s*}/g) || []).length;
console.log('\n=== Return Statement ===');
console.log('Return open brackets:', returnOpen);
console.log('Return close brackets:', returnClose);

// 检查条件渲染
const conditionalOpen = (content.match(/\{\s*!editingClothing\s*&&\s*\(/g) || []).length;
const conditionalClose = (content.match(/\)\s*\}/g) || []).length;
console.log('\n=== Conditional Rendering ===');
console.log('Conditional open patterns:', conditionalOpen);
console.log('Conditional close patterns:', conditionalClose);