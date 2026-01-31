const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 8080;

// 提供完整的9场景版本
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'complete-nine-scenario-version.html');
  console.log('提供文件:', filePath);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('文件不存在:', err);
      res.status(500).send('文件不存在');
      return;
    }
    
    res.setHeader('Content-Type', 'text/html');
    fs.createReadStream(filePath).pipe(res);
  });
});

// 提供API端点
app.get('/scenarios/', (req, res) => {
  console.log('收到/scenarios/请求');
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
      },
      {
        id: "business-strategy-reasoning",
        name: "商业战略推理游戏",
        description: "商业决策推理场景",
        difficulty: "intermediate"
      },
      {
        id: "public-policy-making",
        name: "公共政策制定模拟",
        description: "政策制定场景",
        difficulty: "intermediate"
      },
      {
        id: "personal-finance-decision",
        name: "个人财务决策模拟",
        description: "财务决策场景",
        difficulty: "beginner"
      },
      {
        id: "climate-change-policy",
        name: "全球气候变化政策制定博弈",
        description: "气候政策场景",
        difficulty: "advanced"
      },
      {
        id: "ai-governance-regulation",
        name: "AI治理与监管决策模拟",
        description: "AI治理场景",
        difficulty: "advanced"
      },
      {
        id: "financial-crisis-response",
        name: "复杂金融市场危机应对模拟",
        description: "金融危机场景",
        difficulty: "advanced"
      }
    ]
  });
});

// 提供CSS样式
app.get('/minimal-styles.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.send(`
    /* 基础样式 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
    }

    #app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header and Navigation */
    header {
      background-color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
    }

    .nav-brand {
      font-size: 1.5rem;
      font-weight: bold;
      color: #2563eb;
    }

    .nav-menu {
      display: flex;
      list-style: none;
      gap: 2rem;
    }

    .nav-link {
      text-decoration: none;
      color: #64748b;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
    }

    .nav-link:hover, .nav-link.active {
      color: #2563eb;
      background-color: rgba(37, 99, 235, 0.1);
    }

    /* Main Content */
    main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    /* Page Styles */
    .page {
      display: none;
    }

    .page.active {
      display: block;
    }

    .hero {
      text-align: center;
      padding: 3rem 0;
    }

    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #2563eb;
    }

    .hero p {
      font-size: 1.25rem;
      color: #64748b;
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.2s ease;
    }

    .btn:hover {
      background-color: #1d4ed8;
    }

    .btn-outline {
      background-color: transparent;
      border: 2px solid #2563eb;
      color: #2563eb;
    }

    .btn-outline:hover {
      background-color: #2563eb;
      color: white;
    }

    /* Card Styles */
    .card {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .card h3 {
      color: #2563eb;
      margin-bottom: 0.75rem;
    }

    /* Grid Layout */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }

    /* Scenario Styles */
    .scenario-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .scenario-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background-color: #f8fafc;
      border-radius: 0.5rem;
    }

    .scenario-header h2 {
      color: #2563eb;
      margin-bottom: 0.5rem;
    }

    .scenario-state {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .state-item {
      background-color: #f1f5f9;
      padding: 1rem;
      border-radius: 0.5rem;
      text-align: center;
    }

    .state-item span {
      display: block;
    }

    .state-item strong {
      font-size: 1.25rem;
      color: #2563eb;
    }

    .step-card {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .step-card h3 {
      color: #2563eb;
      margin-bottom: 1rem;
    }

    .decisions-container {
      margin-top: 1.5rem;
    }

    .decisions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .decision-btn {
      width: 100%;
      padding: 1rem;
      font-size: 1rem;
      text-align: center;
    }

    .completion-card {
      text-align: center;
      padding: 2rem;
      background-color: #f0fdf4;
      border-radius: 0.5rem;
      border: 2px solid #10b981;
    }

    .completion-card h3 {
      color: #10b981;
      margin-bottom: 1rem;
    }

    .completion-actions {
      margin-top: 1.5rem;
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    /* Difficulty Control */
    .difficulty-control {
      margin: 1.5rem 0;
      padding: 1rem;
      background-color: #f8fafc;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* Footer */
    footer {
      background-color: #64748b;
      color: white;
      text-align: center;
      padding: 1.5rem;
      margin-top: auto;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      nav {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .nav-menu {
        gap: 1rem;
      }

      main {
        padding: 1rem;
      }

      .hero h1 {
        font-size: 2rem;
      }

      .grid {
        grid-template-columns: 1fr;
      }

      .scenario-state {
        grid-template-columns: 1fr 1fr;
      }

      .decisions-grid {
        grid-template-columns: 1fr;
      }

      .completion-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Complete Nine Scenario Server is running on http://localhost:${PORT}`);
  console.log('This version includes all 9 cognitive scenarios with full interactivity');
  console.log('All scenarios and interactions should now work properly');
});