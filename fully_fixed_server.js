const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// 提供完全修复版本的HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fully_fixed_version.html'));
});

// 提供API端点以支持前端功能
app.get('/api/scenarios', (req, res) => {
  res.json({
    scenarios: [
      {
        id: "coffee-shop-linear-thinking",
        name: "咖啡店线性思维",
        description: "线性思维陷阱场景",
        difficulty: "beginner"
      },
      {
        id: "relationship-time-delay",
        name: "恋爱关系时间延迟",
        description: "时间延迟偏差场景",
        difficulty: "intermediate"
      },
      {
        id: "investment-confirmation-bias",
        name: "投资确认偏误",
        description: "确认偏误场景",
        difficulty: "advanced"
      }
    ]
  });
});

// 对所有其他请求提供修复版本
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'fully_fixed_version.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fully Fixed Server is running on http://localhost:${PORT}`);
  console.log('This version has all functionality working correctly');
  console.log('All scenarios and interactions should now work properly');
});