// 从app.js中移除恋爱关系相关代码的修复脚本

const fs = require('fs');
const path = require('path');

// 读取app.js文件
const appJsPath = path.join(__dirname, 'assets', 'js', 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

// 移除所有与恋爱关系相关的代码
// 1. 移除路由映射中的love-relationship（已处理）
// 2. 移除switch语句中的love-relationship case（已处理）
// 3. 移除文件末尾的getLoveRelationshipPage函数

// 移除文件末尾的love-relationship相关代码
const loveRelationshipRegex = /\/\/ 添加恋爱关系场景页面[\s\S]*?};[\s\n\r]*$/;
content = content.replace(loveRelationshipRegex, '');

// 保存文件
fs.writeFileSync(appJsPath, content);
console.log('✅ 已移除app.js中的恋爱关系相关代码');