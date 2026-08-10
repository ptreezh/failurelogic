/**
 * Exponential Page Router
 * 指数增长与复利测试页面路由器
 * 处理指数测试页面的问题加载、答题和计算器功能
 */

(function(global) {
  'use strict';

  const API_BASE = (global.AppState && global.AppState.config && global.AppState.config.apiBaseUrl) || 'http://localhost:8000';

  const LOCAL_EXP_QUESTIONS = [
    {
      testId: 'exp-001',
      questionType: 'exponential',
      topic: 'exponential-growth',
      questionText: '2^200粒米需要多大仓库？',
      options: ['1万个足球场', '100万个足球场', '1亿个足球场', '以上都不对，不需要这么大', '以上都不对，这些都不够'],
      correctAnswer: 4,
      explanation: '2^200粒米的数量是1.6×10^60，远超宇宙中的原子总数，因此即使是1亿个足球场也不够存储。'
    },
    {
      testId: 'exp-002',
      questionType: 'exponential',
      topic: 'exponential-growth',
      questionText: '如果从现在开始，2只兔子每年翻5倍繁殖，大约需要多少年达到100亿只？',
      options: ['100年', '50年', '30年', '20年', '10年'],
      correctAnswer: 4,
      explanation: '根据计算，从2只兔子开始，每年翻5倍，大约在第11年会超过80亿只（准确值约在11年），远比我们的直觉要快。'
    },
    {
      testId: 'exp-003',
      questionType: 'exponential',
      topic: 'exponential-growth',
      questionText: '如果将一张纸对折200次，厚度会达到多少？（假设纸张厚度为0.1毫米）',
      options: ['大约1米高', '到达月球的距离', '超过太阳系的直径', '超过银河系的直径', '以上都不对，无法达到那么厚'],
      correctAnswer: 3,
      explanation: '每次对折厚度翻倍，对折200次后的厚度为0.1毫米 × 2^200，这是一个天文数字，远超银河系的直径。'
    }
  ];

  const LOCAL_COMPOUND_QUESTIONS = [
    {
      testId: 'comp-001',
      questionType: 'compound',
      topic: 'compound-interest',
      questionText: '如果你投资10万元，年复利8%，30年后大约会变成多少？',
      options: ['34万元（线性估算）', '100万元', '317万元', '500万元'],
      correctAnswer: 2,
      explanation: '复利计算：100,000 × (1.08)^30 ≈ 1,006,266元。这展示了复利的惊人力量，远超线性增长估算。'
    },
    {
      testId: 'comp-002',
      questionType: 'compound',
      topic: 'compound-interest',
      questionText: '如果你每月存款1000元，年化收益率8%，20年后你会拥有多少钱？',
      options: ['24万元（不考虑利息）', '40万元', '58万元', '60万元'],
      correctAnswer: 2,
      explanation: '考虑复利效应，20年后的本息总额约为58.9万元，这远高于仅考虑本金的24万元，体现了定投复利的力量。'
    },
    {
      testId: 'comp-003',
      questionType: 'compound',
      topic: 'compound-interest',
      questionText: '如果你有房贷100万元，年利率5%，按揭30年，总支付利息约多少？',
      options: ['50万元（简单估算）', '75万元', '100万元', '120万元'],
      correctAnswer: 3,
      explanation: '由于复利效应，30年房贷的总利息支出远高于简单估算的50万元，实际约为100万元左右，体现了复利在负债方面的负面效应。'
    }
  ];

  class ExponentialPageRouter {
    constructor() {
      this.expQuestions = [];
      this.compQuestions = [];
      this.currentExpIndex = 0;
      this.currentCompIndex = 0;
      this.initialized = false;
    }

    async initialize() {
      if (this.initialized) return;
      await this.loadQuestions();
      this.renderExpQuestions();
      this.renderCompQuestions();
      this.attachCalculatorListeners();
      this.initialized = true;
    }

    async loadQuestions() {
      try {
        const [expRes, compRes] = await Promise.all([
          fetch(`${API_BASE}/api/exponential/questions`).catch(() => null),
          fetch(`${API_BASE}/api/compound/questions`).catch(() => null)
        ]);

        if (expRes && expRes.ok) {
          const data = await expRes.json();
          this.expQuestions = data.questions || LOCAL_EXP_QUESTIONS;
        } else {
          this.expQuestions = LOCAL_EXP_QUESTIONS;
        }

        if (compRes && compRes.ok) {
          const data = await compRes.json();
          this.compQuestions = data.questions || LOCAL_COMPOUND_QUESTIONS;
        } else {
          this.compQuestions = LOCAL_COMPOUND_QUESTIONS;
        }
      } catch (e) {
        this.expQuestions = LOCAL_EXP_QUESTIONS;
        this.compQuestions = LOCAL_COMPOUND_QUESTIONS;
      }
    }

    renderExpQuestions() {
      const container = document.getElementById('questions-container');
      if (!container) return;

      const q = this.expQuestions[this.currentExpIndex];
      if (!q) {
        container.innerHTML = '<p>指数测试题加载完成</p>';
        return;
      }

      container.innerHTML = `
        <div class="question-card">
          <h3>${this.currentExpIndex + 1}. ${q.questionText}</h3>
          <div class="options">
            ${q.options.map((opt, idx) => `
              <div class="option">
                <input type="radio" name="exp-question-${q.testId}" id="exp-opt-${q.testId}-${idx}" value="${idx}">
                <label for="exp-opt-${q.testId}-${idx}">${String.fromCharCode(65 + idx)}. ${opt}</label>
              </div>
            `).join('')}
          </div>
          <div class="user-estimation">
            <label for="exp-estimation-${q.testId}">请输入您的估算值:</label>
            <input type="number" id="exp-estimation-${q.testId}" placeholder="例如：您认为2^200大约是多少">
          </div>
          <button class="btn btn-outline check-answer-btn" data-question-id="${q.testId}" data-type="exp">检查答案</button>
          <div class="explanation" id="exp-explanation-${q.testId}" style="display: none;"></div>
        </div>
        <div class="navigation-controls">
          <button id="exp-prev-question" ${this.currentExpIndex <= 0 ? 'disabled' : ''}>上一题</button>
          <button id="exp-next-question" ${this.currentExpIndex >= this.expQuestions.length - 1 ? 'disabled' : ''}>下一题</button>
        </div>
      `;

      document.getElementById('exp-prev-question')?.addEventListener('click', () => {
        if (this.currentExpIndex > 0) {
          this.currentExpIndex--;
          this.renderExpQuestions();
        }
      });

      document.getElementById('exp-next-question')?.addEventListener('click', () => {
        if (this.currentExpIndex < this.expQuestions.length - 1) {
          this.currentExpIndex++;
          this.renderExpQuestions();
        }
      });

      document.querySelectorAll('#questions-container .check-answer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const questionId = e.target.dataset.questionId;
          const question = this.expQuestions.find(q => q.testId === questionId) || this.compQuestions.find(q => q.testId === questionId);
          if (!question) return;

          const selectedOption = document.querySelector(`input[name="exp-question-${questionId}"]:checked`);
          const explanationEl = document.getElementById(`exp-explanation-${questionId}`);
          
          if (!selectedOption) {
            alert('请选择一个答案');
            return;
          }

          const userChoice = parseInt(selectedOption.value);
          const isCorrect = userChoice === question.correctAnswer;
          
          explanationEl.style.display = 'block';
          explanationEl.innerHTML = `
            <strong>${isCorrect ? '✅ 正确！' : '❌ 不正确'}</strong>
            <p>${question.explanation}</p>
          `;

          this.submitAnswer(questionId, userChoice, null, 'exponential');
        });
      });
    }

    renderCompQuestions() {
      const container = document.getElementById('compound-questions-container');
      if (!container) return;

      const q = this.compQuestions[this.currentCompIndex];
      if (!q) {
        container.innerHTML = '<p>复利测试题加载完成</p>';
        return;
      }

      container.innerHTML = `
        <div class="question-card">
          <h3>${this.currentCompIndex + 1}. ${q.questionText}</h3>
          <div class="options">
            ${q.options.map((opt, idx) => `
              <div class="option">
                <input type="radio" name="comp-question-${q.testId}" id="comp-opt-${q.testId}-${idx}" value="${idx}">
                <label for="comp-opt-${q.testId}-${idx}">${String.fromCharCode(65 + idx)}. ${opt}</label>
              </div>
            `).join('')}
          </div>
          <div class="user-estimation">
            <label for="comp-estimation-${q.testId}">请输入您的估算值:</label>
            <input type="number" id="comp-estimation-${q.testId}" placeholder="例如：您认为30年后是多少">
          </div>
          <button class="btn btn-outline check-answer-btn" data-question-id="${q.testId}" data-type="comp">检查答案</button>
          <div class="explanation" id="comp-explanation-${q.testId}" style="display: none;"></div>
        </div>
        <div class="navigation-controls">
          <button id="comp-prev-question" ${this.currentCompIndex <= 0 ? 'disabled' : ''}>上一题</button>
          <button id="comp-next-question" ${this.currentCompIndex >= this.compQuestions.length - 1 ? 'disabled' : ''}>下一题</button>
        </div>
      `;

      document.getElementById('comp-prev-question')?.addEventListener('click', () => {
        if (this.currentCompIndex > 0) {
          this.currentCompIndex--;
          this.renderCompQuestions();
        }
      });

      document.getElementById('comp-next-question')?.addEventListener('click', () => {
        if (this.currentCompIndex < this.compQuestions.length - 1) {
          this.currentCompIndex++;
          this.renderCompQuestions();
        }
      });

      document.querySelectorAll('#compound-questions-container .check-answer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const questionId = e.target.dataset.questionId;
          const question = this.compQuestions.find(q => q.testId === questionId);
          if (!question) return;

          const selectedOption = document.querySelector(`input[name="comp-question-${questionId}"]:checked`);
          const explanationEl = document.getElementById(`comp-explanation-${questionId}`);
          
          if (!selectedOption) {
            alert('请选择一个答案');
            return;
          }

          const userChoice = parseInt(selectedOption.value);
          const isCorrect = userChoice === question.correctAnswer;
          
          explanationEl.style.display = 'block';
          explanationEl.innerHTML = `
            <strong>${isCorrect ? '✅ 正确！' : '❌ 不正确'}</strong>
            <p>${question.explanation}</p>
          `;

          this.submitAnswer(questionId, userChoice, null, 'compound');
        });
      });
    }

    attachCalculatorListeners() {
      const calculateBtn = document.getElementById('calculate-btn');
      if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
          const principal = parseFloat(document.getElementById('principal')?.value || 0);
          const rate = parseFloat(document.getElementById('rate')?.value || 0);
          const time = parseInt(document.getElementById('time')?.value || 0);

          if (isNaN(principal) || isNaN(rate) || isNaN(time)) {
            alert('请输入有效的数值');
            return;
          }

          this.calculateCompoundInterest(principal, rate, time);
        });
      }

      const calculateExpBtn = document.getElementById('calculate-exp-btn');
      if (calculateExpBtn) {
        calculateExpBtn.addEventListener('click', () => {
          const base = parseFloat(document.getElementById('base')?.value || 0);
          const exponent = parseInt(document.getElementById('exponent')?.value || 0);

          if (isNaN(base) || isNaN(exponent)) {
            alert('请输入有效的数值');
            return;
          }

          this.calculateExponential(base, exponent);
        });
      }
    }

    calculateCompoundInterest(principal, rate, time) {
      const compoundAmount = principal * Math.pow(1 + rate / 100, time);
      const linearAmount = principal * (1 + (rate / 100) * time);
      const difference = compoundAmount - linearAmount;
      const advantagePercentage = ((compoundAmount - linearAmount) / linearAmount) * 100;

      const resultEl = document.getElementById('compound-result');
      if (resultEl) {
        resultEl.innerHTML = `
          <h3>计算结果</h3>
          <p><strong>本金:</strong> ${principal.toLocaleString()} 元</p>
          <p><strong>年利率:</strong> ${rate}%</p>
          <p><strong>时间:</strong> ${time} 年</p>
          <p><strong>复利结果:</strong> <span class="highlight">${compoundAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} 元</span></p>
          <p><strong>线性增长结果:</strong> ${linearAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} 元</p>
          <p><strong>复利优势:</strong> ${difference.toLocaleString(undefined, {maximumFractionDigits: 2})} 元</p>
          <p><strong>优势百分比:</strong> ${advantagePercentage.toFixed(2)}%</p>
          <div class="explanation-text">复利效应：在${time}年期，${rate}%年利率下，复利最终金额是${compoundAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}元，而线性增长仅为${linearAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}元。</div>
        `;
      }
    }

    calculateExponential(base, exponent) {
      let result, resultScientific, comparison;
      try {
        result = Math.pow(base, exponent);
        resultScientific = result > 1e10 ? `${result.toExponential(2)}` : String(result);
        
        if (result < 1000) {
          comparison = '这是一个相对较小的数字，日常生活中比较常见。';
        } else if (result < 1_000_000) {
          comparison = '这个数字较大，相当于百万级别。';
        } else if (result < 1_000_000_000) {
          comparison = '这是亿级数字，相当于一个人口大国的总人口。';
        } else if (result < 1e20) {
          comparison = '这是极其巨大的数字，远超地球上所有货币的总价值。';
        } else {
          comparison = '这个数字是天文数字，比全宇宙的原子总数（约10^80）还要大，超出了人类的直观理解范围。';
        }
      } catch (e) {
        result = '数值过大，超出计算范围';
        resultScientific = '数值过大';
        comparison = '计算结果超出了JavaScript的安全整数范围。';
      }

      const resultEl = document.getElementById('exponential-result');
      if (resultEl) {
        resultEl.innerHTML = `
          <h3>计算结果</h3>
          <p><strong>底数:</strong> ${base}</p>
          <p><strong>指数:</strong> ${exponent}</p>
          <p><strong>结果:</strong> ${resultScientific}</p>
          <p><strong>比较说明:</strong> ${comparison}</p>
        `;
      }
    }

    async submitAnswer(questionId, userChoice, userEstimation, type) {
      try {
        await fetch(`${API_BASE}/api/results/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'user-session-' + Date.now(),
            sessionId: 'session-' + Date.now(),
            questionId: questionId,
            userChoice: userChoice,
            userEstimation: userEstimation,
            responseTime: new Date().toISOString(),
            testType: type
          })
        });
      } catch (e) {
        // Silent fail - explanation already shown locally
      }
    }
  }

  const exponentialPageRouter = new ExponentialPageRouter();

  global.ExponentialPageRouter = exponentialPageRouter;

})(typeof window !== 'undefined' ? window : global);
