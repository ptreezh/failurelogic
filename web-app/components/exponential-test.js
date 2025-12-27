/**
 * 指数增长误区测试组件
 * 实现2^200规模、兔子繁殖问题等具体化测试内容
 */
class ExponentialTestComponent {
  constructor(apiUrl = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  async initialize() {
    try {
      const response = await fetch(`${this.apiUrl}/api/exponential/questions`);
      const data = await response.json();
      this.questions = data.questions;
      this.render();
    } catch (error) {
      console.error('Failed to load exponential test questions:', error);
      this.renderError();
    }
  }

  render() {
    const appContainer = document.getElementById('app') || document.createElement('div');
    appContainer.className = 'exponential-test-container';
    
    appContainer.innerHTML = `
      <div class="test-header">
        <h1>指数增长误区专项测试</h1>
        <p>揭示线性思维在面对指数增长时的局限性</p>
      </div>
      
      <main class="test-main">
        <div class="test-intro">
          <h2>为什么我们需要理解指数增长？</h2>
          <p>人类大脑习惯于线性思维，但很多现实世界的现象（如病毒传播、技术发展、复利增长）都遵循指数模式。理解指数增长的力量有助于我们更好地进行长期规划和风险评估。</p>
          <p>本测试将通过几个经典例子帮助您体验指数增长的惊人效果。</p>
        </div>
        
        <div class="test-questions">
          <h2>测试题</h2>
          <div class="question-container">
            ${this.questions.length > 0 
              ? this.renderQuestion(this.questions[this.currentQuestionIndex])
              : '<p>正在加载测试题...</p>'
            }
          </div>
          
          <div class="navigation-controls">
            <button id="prev-question" ${this.currentQuestionIndex <= 0 ? 'disabled' : ''}>上一题</button>
            <button id="next-question" ${this.currentQuestionIndex >= this.questions.length - 1 ? 'disabled' : ''}>下一题</button>
          </div>
        </div>
        
        <div class="compound-calculator">
          <h2>复利计算器</h2>
          <div class="calculator-controls">
            <div class="input-group">
              <label for="principal">本金 (元):</label>
              <input type="number" id="principal" value="100000" min="0">
            </div>
            
            <div class="input-group">
              <label for="rate">年利率 (%):</label>
              <input type="number" id="rate" value="8" min="0" max="100" step="0.1">
            </div>
            
            <div class="input-group">
              <label for="time">时间 (年):</label>
              <input type="number" id="time" value="30" min="1" max="50">
            </div>
            
            <button id="calculate-btn" class="btn btn-primary">计算复利</button>
          </div>
          
          <div id="compound-result" class="result-container">
            <!-- 结果将在这里显示 -->
          </div>
        </div>
        
        <div class="exponential-calculator">
          <h2>指数计算器</h2>
          <div class="calculator-controls">
            <div class="input-group">
              <label for="base">底数:</label>
              <input type="number" id="base" value="2" step="0.1">
            </div>
            
            <div class="input-group">
              <label for="exponent">指数:</label>
              <input type="number" id="exponent" value="200" min="0">
            </div>
            
            <button id="calculate-exp-btn" class="btn btn-primary">计算指数</button>
          </div>
          
          <div id="exponential-result" class="result-container">
            <!-- 结果将在这里显示 -->
          </div>
        </div>
      </main>
    `;

    this.attachEventListeners();
    this.updateNavigationButtons();
  }

  renderQuestion(question) {
    return `
      <div class="question-card">
        <h3>${this.currentQuestionIndex + 1}. ${question.questionText}</h3>
        <div class="options">
          ${question.options.map((option, idx) => `
            <div class="option">
              <input type="radio" name="question-${question.testId}" id="opt-${question.testId}-${idx}" value="${idx}">
              <label for="opt-${question.testId}-${idx}">${String.fromCharCode(65 + idx)}. ${option}</label>
            </div>
          `).join('')}
        </div>
        <div class="user-estimation">
          <label for="estimation-${question.testId}">请输入您的估算值:</label>
          <input type="number" id="estimation-${question.testId}" placeholder="例如：您认为2^200大约是多少">
        </div>
        <button class="btn btn-outline check-answer-btn" data-question-id="${question.testId}">检查答案</button>
        <div class="explanation" id="explanation-${question.testId}" style="display: none;">
          ${question.explanation}
        </div>
      </div>
    `;
  }

  renderError() {
    const appContainer = document.getElementById('app') || document.createElement('div');
    appContainer.className = 'error-container';
    
    appContainer.innerHTML = `
      <div class="error-content">
        <h1>加载测试失败</h1>
        <p>无法连接到后端API服务器，请确保服务器正在运行。</p>
        <p>如果您是开发者，请检查后端服务是否在 ${this.apiUrl} 上运行。</p>
      </div>
    `;
  }

  attachEventListeners() {
    // 上一题按钮事件
    document.getElementById('prev-question')?.addEventListener('click', () => {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.render();
      }
    });

    // 下一题按钮事件
    document.getElementById('next-question')?.addEventListener('click', () => {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
        this.render();
      }
    });

    // 检查答案按钮事件
    document.querySelectorAll('.check-answer-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const questionId = e.target.dataset.questionId;
        const selectedOption = document.querySelector(`input[name="question-${questionId}"]:checked`);
        const estimationInput = document.getElementById(`estimation-${questionId}`);
        
        if (!selectedOption) {
          alert('请选择一个答案');
          return;
        }
        
        const userChoice = parseInt(selectedOption.value);
        const userEstimation = estimationInput ? parseFloat(estimationInput.value) : null;
        
        await this.submitAnswer(questionId, userChoice, userEstimation);
      });
    });

    // 复利计算按钮事件
    document.getElementById('calculate-btn')?.addEventListener('click', async () => {
      const principal = parseFloat(document.getElementById('principal').value);
      const rate = parseFloat(document.getElementById('rate').value);
      const time = parseInt(document.getElementById('time').value);

      if (isNaN(principal) || isNaN(rate) || isNaN(time)) {
        alert('请输入有效的数值');
        return;
      }

      await this.calculateCompoundInterest(principal, rate, time);
    });

    // 指数计算按钮事件
    document.getElementById('calculate-exp-btn')?.addEventListener('click', async () => {
      const base = parseFloat(document.getElementById('base').value);
      const exponent = parseInt(document.getElementById('exponent').value);

      if (isNaN(base) || isNaN(exponent)) {
        alert('请输入有效的数值');
        return;
      }

      await this.calculateExponential(base, exponent);
    });
  }

  async submitAnswer(questionId, userChoice, userEstimation) {
    try {
      const response = await fetch(`${this.apiUrl}/api/results/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-session-' + Date.now(),
          sessionId: 'session-' + Date.now(),
          questionId: questionId,
          userChoice: userChoice,
          userEstimation: userEstimation,
          responseTime: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const explanationEl = document.getElementById(`explanation-${questionId}`);
      
      explanationEl.style.display = 'block';
      if (data.analysis) {
        explanationEl.innerHTML = `<strong>分析:</strong> ${data.analysis.explanation}`;
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('提交答案失败，请稍后再试');
    }
  }

  async calculateCompoundInterest(principal, rate, time) {
    try {
      const response = await fetch(`${this.apiUrl}/api/compound/calculate/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ principal, annual_rate: rate, time_years: time })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const resultEl = document.getElementById('compound-result');
      
      resultEl.innerHTML = `
        <h3>计算结果</h3>
        <p><strong>本金:</strong> ${data.principal.toLocaleString()} 元</p>
        <p><strong>年利率:</strong> ${data.annual_rate}%</p>
        <p><strong>时间:</strong> ${data.time_years} 年</p>
        <p><strong>复利结果:</strong> <span class="highlight">${data.compound_amount.toLocaleString(undefined, {maximumFractionDigits: 2})} 円</span></p>
        <p><strong>线性增长结果:</strong> ${data.linear_amount.toLocaleString(undefined, {maximumFractionDigits: 2})} 円</p>
        <p><strong>复利优势:</strong> ${data.difference.toLocaleString(undefined, {maximumFractionDigits: 2})} 円</p>
        <p><strong>优势百分比:</strong> ${data.advantage_percentage.toFixed(2)}%</p>
        <div class="explanation-text">${data.explanation}</div>
      `;
    } catch (error) {
      console.error('Failed to calculate compound interest:', error);
      document.getElementById('compound-result').innerHTML = `<p class="error">计算复利失败: ${error.message}</p>`;
    }
  }

  async calculateExponential(base, exponent) {
    try {
      const response = await fetch(`${this.apiUrl}/api/exponential/calculate/exponential`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base, exponent })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const resultEl = document.getElementById('exponential-result');
      
      if (data.error) {
        resultEl.innerHTML = `<p class="error">${data.result}</p>`;
      } else {
        resultEl.innerHTML = `
          <h3>计算结果</h3>
          <p><strong>${data.base} ^ ${data.exponent} =</strong></p>
          <p class="large-result">${data.result}</p>
          <p class="scientific-notation">科学计数法: ${data.scientific_notation}</p>
          <p class="comparison">${data.comparison}</p>
          <p>这个例子说明了我们的线性思维如何难以理解指数增长的真实规模。</p>
        `;
      }
    } catch (error) {
      console.error('Failed to calculate exponential:', error);
      document.getElementById('exponential-result').innerHTML = `<p class="error">计算指数增长失败: ${error.message}</p>`;
    }
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-question');
    const nextBtn = document.getElementById('next-question');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentQuestionIndex <= 0;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentQuestionIndex >= this.questions.length - 1;
    }
  }
}

// 导出组件以便在其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExponentialTestComponent;
} else {
  window.ExponentialTestComponent = ExponentialTestComponent;
}