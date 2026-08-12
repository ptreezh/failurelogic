const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// 提供修复版本的HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fixed-version.html'));
});

// 提供样式文件
app.use('/minimal-styles.css', express.static(path.join(__dirname, 'minimal-styles.css')));

// 对所有其他请求提供修复版本
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'fixed-version.html'));
});

app.listen(PORT, () => {
  console.log(`Fixed Server is running on http://localhost:${PORT}`);
  console.log('This version has fixed the APIConfigManager issue');
  console.log('All functionality should now work correctly');
});