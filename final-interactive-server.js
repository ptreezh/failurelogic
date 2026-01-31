const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 8080;

// 专门提供minimal-complete-index.html的服务器
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'minimal-complete-index.html');
  res.type('text/html').sendFile(filePath);
});

app.get('/minimal', (req, res) => {
  const filePath = path.join(__dirname, 'minimal-complete-index.html');
  res.type('text/html').sendFile(filePath);
});

app.get('/interactive', (req, res) => {
  const filePath = path.join(__dirname, 'minimal-complete-index.html');
  res.type('text/html').sendFile(filePath);
});

// 提供静态资源
app.use('/minimal-styles.css', express.static(path.join(__dirname, 'minimal-styles.css')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/api', express.static(path.join(__dirname, 'api')));

// 对所有其他请求提供minimal-complete-index.html
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'minimal-complete-index.html');
  res.type('text/html').sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Interactive Server is running on http://localhost:${PORT}`);
  console.log(`All requests now serve the interactive minimal-complete-index.html`);
  console.log(`This version includes:`);
  console.log(`- Full navigation system`);
  console.log(`- 9 cognitive scenarios`);
  console.log(`- Interactive decision making`);
  console.log(`- State management`);
  console.log(`- Responsive design`);
});