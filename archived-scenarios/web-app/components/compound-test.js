/**
 * 复利思维陷阱测试组件
 */
class CompoundTestComponent {
  constructor(apiUrl = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  async initialize() {
    try {
      const response = await fetch(`${this.apiUrl}/api/compound/questions`);
      const data = await response.json();
      this.questions = data.questions;
      this.render();
    } catch (error) {
      console.error('Failed to load compound test questions:', error);
      this.renderError();
    }
  }

  render() {
    const appContainer = document.getElementById('app') || document.createElement('div');
    appContainer.className = 'compound-test-container';
    
    appContainer.innerHTML = `
      <div class="test-header">
        <h1>复利思维陷阱专项测试</h1>
        <p>揭示线性思维在面对复利效应时的局限性</p>
      </div>
      
      <main class="test-main">
        <div class="test-intro">
          <h2>为什么复利思维很重要？</h2>
          <p>复利是一种强大的财富增长方式，但人们往往用线性思维来预测复利结果，这会导致巨大的预测偏差。理解复利效应有助于我们更好地进行财务规划和投资决策。</p>
          <p>本测试将通过实际计算帮助您感受复利与线性增长的巨大差异。</p>
        </div>
        
        <div class="test-questions">
          <h2>复利测试题</h2>
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
          <p>比较复利增长与线性增长的差异</p>
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
          <input type="number" id="estimation-${question.testId}" placeholder="例如：您认为30年后是多少">
        </div>
        <button class="btn btn-outline check-answer-btn" data-question-id="${question.testId}">检查答案</button>
        <div class="explanation" id="explanation-${question.testId}" style="display: none;">
          ${question.explanation}
        </div>
      </div>
    `;
  }

  async calculateCompoundInterest() {
    const principal = parseFloat(document.getElementById('principal').value);
    const rate = parseFloat(document.getElementById('rate').value);
    const time = parseInt(document.getElementById('time').value);

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
        <p><strong>复利结果:</strong> <span class="highlight">${data.compound_amount.toLocaleString(undefined, {maximumFractionDigits: 2})} 元</span></p>
        <p><strong>线性增长结果:</strong> ${data.linear_amount.toLocaleString(undefined, {maximumFractionDigits: 2})} 元</p>
        <p><strong>复利优势:</strong> ${data.difference.toLocaleString(undefined, {maximumFractionDigits: 2})} 元</p>
        <p><strong>优势百分比:</strong> ${data.advantage_percentage.toFixed(2)}%</p>
        <div class="explanation-text">${data.explanation}</div>
      `;
    } catch (error) {
      console.error('Failed to calculate compound interest:', error);
      const resultEl = document.getElementById('compound-result');
      resultEl.innerHTML = `<p class="error">计算复利失败: ${error.message}</p>`;
    }
  }

  attachEventListeners() {
    // 导航按钮事件
    document.getElementById('prev-question')?.addEventListener('click', () => {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.render();
      }
    });

    document.getElementById('next-question')?.addEventListener('click', () => {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
        this.render();
      }
    });

    // 答案检查按钮事件
    document.querySelectorAll('.check-answer-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const questionId = e.currentTarget.dataset.questionId;
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
    document.getElementById('calculate-btn')?.addEventListener('click', () => {
      this.calculateCompoundInterest();
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
          questionType: 'compound',
          responseTime: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const explanationEl = document.getElementById(`explanation-${questionId}`);
      
      explanationEl.style.display = 'block';
      if (data.analysis) {
        explanationEl.innerHTML = `
          <strong>分析:</strong> ${data.analysis.explanation}
          <div class="pyramid-explanation">
            <h4>金字塔原理解释：</h4>
            <ul>
              <li><strong>核心结论:</strong> ${data.analysis.pyramid_explanation?.core_conclusion || '复利的威力远超线性思维的预期'}</li>
              <li><strong>支持论据:</strong> ${data.analysis.pyramid_explanation?.supporting_arguments?.join(', ') || '复利效应在长期表现出惊人的威力'}</li>
              <li><strong>实例:</strong> ${data.analysis.pyramid_explanation?.examples?.join(', ') || '30年8%的复利能让投资增长约10倍以上'}</li>
              <li><strong>建议:</strong> ${data.analysis.pyramid_explanation?.actionable_advice?.join(', ') || '长期投资时充分考虑复利效应'}</li>
            </ul>
          </div>
        `;
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('提交答案失败，请稍后再试');
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
}

// 导出组件以便在其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompoundTestComponent;
} else {
  window.CompoundTestComponent = CompoundTestComponent;
}