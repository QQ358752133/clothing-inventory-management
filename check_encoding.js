const fs = require('fs');
const path = require('path');

// 读取文件内容
const filePath = path.join(__dirname, 'src', 'pages', 'ClothingManagement.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// 检查文件编码
console.log('=== 文件编码信息 ===');
console.log('文件大小:', content.length, '字符');
console.log('文件行号:', content.split('\n').length, '行');

// 检查不可见字符
console.log('\n=== 检查不可见字符 ===');
const invisibleChars = [];

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const charCode = char.charCodeAt(0);
  
  // 查找不可见字符（除了空格、制表符、换行符、回车符）
  if (charCode > 0 && charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
    invisibleChars.push({
      position: i,
      charCode: charCode,
      char: char,
      line: content.substring(0, i).split('\n').length
    });
  }
}

if (invisibleChars.length > 0) {
  console.log('发现不可见字符:');
  invisibleChars.forEach(charInfo => {
    console.log(`  位置: ${charInfo.position}, 行: ${charInfo.line}, 字符码: ${charInfo.charCode}`);
  });
} else {
  console.log('未发现不可见字符');
}

// 检查第676行附近的内容（转换为十六进制查看）
console.log('\n=== 第670-681行内容（十六进制）===');
const lines = content.split('\n');
for (let i = 669; i < Math.min(lines.length, 681); i++) {
  const line = lines[i];
  const hex = Buffer.from(line).toString('hex');
  console.log(`${i + 1}: ${line}`);
  console.log(`   十六进制: ${hex}`);
}

// 尝试使用不同的编码重新读取文件
console.log('\n=== 尝试使用不同编码读取文件 ===');
try {
  const contentUtf16 = fs.readFileSync(filePath, 'utf16le');
  console.log('UTF-16 LE 读取成功');
  console.log('文件大小:', contentUtf16.length, '字符');
} catch (error) {
  console.log('UTF-16 LE 读取失败:', error.message);
}

try {
  const contentAscii = fs.readFileSync(filePath, 'ascii');
  console.log('ASCII 读取成功');
  console.log('文件大小:', contentAscii.length, '字符');
} catch (error) {
  console.log('ASCII 读取失败:', error.message);
}