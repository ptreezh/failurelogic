const http = require('http');

// 发送HTTP请求以检查页面内容
const options = {
  host: 'localhost',
  port: 8080,
  path: '/',
  method: 'GET'
};

console.log('正在检查服务器响应...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应长度:', data.length);
    console.log('前500个字符:');
    console.log(data.substring(0, 500));
    
    // 检查是否包含极简版本的关键特征
    if (data.includes('ScenarioManager')) {
      console.log('\n✅ 找到: ScenarioManager (极简版本特征)');
    } else {
      console.log('\n❌ 未找到: ScenarioManager (极简版本特征)');
    }
    
    if (data.includes('NavigationManager')) {
      console.log('✅ 找到: NavigationManager');
    } else {
      console.log('❌ 未找到: NavigationManager');
    }
    
    if (data.includes('nav-link')) {
      console.log('✅ 找到: nav-link');
    } else {
      console.log('❌ 未找到: nav-link');
    }
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
});

req.end();