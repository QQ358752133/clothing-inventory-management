const fs = require('fs');

// 读取文件内容
const content = fs.readFileSync('src/pages/ClothingManagement.jsx', 'utf8');

// 检查括号匹配
function checkBrackets(text) {
    const stack = [];
    const brackets = { '(': ')', '{': '}', '[': ']' };
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (brackets[char]) {
            stack.push({ char, index: i });
        } else if (Object.values(brackets).includes(char)) {
            const last = stack.pop();
            if (!last || brackets[last.char] !== char) {
                return { error: true, message: `Unmatched closing bracket '${char}' at index ${i}` };
            }
        }
    }
    
    if (stack.length > 0) {
        return { error: true, message: `Unmatched opening brackets: ${stack.map(b => b.char).join(', ')}`, stack };
    }
    
    return { error: false, message: 'All brackets matched' };
}

// 检查JSX标签
function checkJsxTags(text) {
    const openTags = [];
    const tagRegex = /<\/?([a-zA-Z0-9-_]+)([^>]*)>/g;
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
        const fullTag = match[0];
        const tagName = match[1];
        const isClosing = fullTag.startsWith('</');
        const isSelfClosing = fullTag.endsWith('/>');
        
        if (isSelfClosing) {
            continue;
        } else if (isClosing) {
            const lastOpen = openTags.pop();
            if (!lastOpen || lastOpen !== tagName) {
                return { error: true, message: `Unmatched closing tag </${tagName}> at index ${match.index}` };
            }
        } else {
            // 忽略React.Fragment等特殊标签
            if (!['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName.toLowerCase())) {
                openTags.push(tagName);
            }
        }
    }
    
    if (openTags.length > 0) {
        return { error: true, message: `Unclosed tags: ${openTags.join(', ')}` };
    }
    
    return { error: false, message: 'All JSX tags matched' };
}

// 检查return语句
function checkReturnStatement(text) {
    const returnRegex = /return\s*\(([\s\S]*)\)/;
    const match = text.match(returnRegex);
    
    if (!match) {
        return { error: true, message: 'No return statement found' };
    }
    
    const returnContent = match[1];
    const result = checkBrackets(returnContent);
    
    if (result.error) {
        return { error: true, message: `Bracket error in return statement: ${result.message}` };
    }
    
    return { error: false, message: 'Return statement brackets matched' };
}

// 执行检查
console.log('=== Checking ClothingManagement.jsx ===');

const bracketResult = checkBrackets(content);
console.log('Bracket check:', bracketResult.message);

const jsxResult = checkJsxTags(content);
console.log('JSX tag check:', jsxResult.message);

const returnResult = checkReturnStatement(content);
console.log('Return statement check:', returnResult.message);

// 输出文件最后几行
console.log('\n=== Last 20 lines of file ===');
const lines = content.split('\n');
const lastLines = lines.slice(-20);
lastLines.forEach((line, index) => {
    console.log(`${lines.length - 20 + index + 1}: ${line}`);
});