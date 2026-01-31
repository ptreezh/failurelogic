const fs = require('fs');
const path = require('path');

// 读取minimal-complete-index.html的内容
const minimalContent = fs.readFileSync(path.join(__dirname, 'minimal-complete-index.html'), 'utf8');

console.log('minimal-complete-index.html 前500个字符:');
console.log(minimalContent.substring(0, 500));

// 检查是否包含极简版本的关键特征
if (minimalContent.includes('ScenarioManager')) {
  console.log('\n✅ 找到: ScenarioManager (极简版本特征)');
} else {
  console.log('\n❌ 未找到: ScenarioManager (极简版本特征)');
}

if (minimalContent.includes('UIManager')) {
  console.log('✅ 找到: UIManager');
} else {
  console.log('❌ 未找到: UIManager');
}

if (minimalContent.includes('ApiService')) {
  console.log('✅ 找到: ApiService');
} else {
  console.log('❌ 未找到: ApiService');
}