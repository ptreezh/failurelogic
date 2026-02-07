/**
 * 修复和优化脚本
 * 解决场景交互、UI/UX和资源管理问题
 */

// 修复场景页面路由
const fixSceneRouting = () => {
    console.log('修复场景页面路由...');
    
    // 重写NavigationManager的路由逻辑
    if (window.NavigationManager) {
        // 修复场景页面路由
        const originalRenderPage = window.NavigationManager.renderPage;
        window.NavigationManager.renderPage = async function(page) {
            console.log('渲染页面:', page);
            
            // 隐藏所有页面
            const allPages = document.querySelectorAll('.page');
            allPages.forEach(p => {
                p.classList.remove('active');
            });
            
            // 显示目标页面
            const targetPage = document.getElementById(`${page}-page`);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // 特殊处理场景页面
                if (page === 'scenarios') {
                    // 确保场景网格可见
                    const grid = document.getElementById('scenarios-grid');
                    if (grid) {
                        grid.style.display = 'grid';
                        grid.style.visibility = 'visible';
                        
                        // 如果没有场景卡片，加载场景
                        if (grid.children.length <= 1) { // 只有加载元素
                            await this.loadScenariosPage();
                        }
                    }
                }
            }
            
            // 更新导航按钮状态
            const navButtons = document.querySelectorAll('.nav-item');
            navButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.page === page) {
                    btn.classList.add('active');
                }
            });
            
            // 记录当前页面
            window.AppState.currentPage = page;
        };
    }
};

// 优化场景卡片UI
const optimizeScenarioCards = () => {
    console.log('优化场景卡片UI...');
    
    // 移除过多的emoji，使用更简洁的设计
    const scenarioCards = document.querySelectorAll('.scenario-card');
    scenarioCards.forEach(card => {
        // 简化卡片设计，移除过多的emoji
        const title = card.querySelector('h3');
        if (title) {
            // 移除标题中的emoji
            const cleanTitle = title.textContent.replace(/[^\w\s\u4e00-\u9fff\-]/gi, '').trim();
            title.textContent = cleanTitle;
        }
        
        // 确保卡片有清晰的交互指示
        const startBtn = card.querySelector('.btn-primary');
        if (startBtn && !startBtn.textContent.includes('开始') && !startBtn.textContent.includes('Start')) {
            startBtn.textContent = '开始挑战';
        }
    });
};

// 修复游戏模态框资源管理
const fixModalResourceManagement = () => {
    console.log('修复模态框资源管理...');
    
    // 重写游戏模态框的显示和隐藏逻辑
    if (window.GameManager) {
        const originalShowGameModal = window.GameManager.showGameModal;
        const originalHideGameModal = window.GameManager.hideGameModal;
        
        // 修复显示逻辑
        window.GameManager.showGameModal = function() {
            const modal = document.getElementById('game-modal');
            if (modal) {
                // 确保模态框内容干净
                const container = document.getElementById('game-container');
                if (container) {
                    // 清理之前的事件监听器
                    container.innerHTML = '';
                }
                
                // 显示模态框
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        };
        
        // 修复隐藏逻辑，确保资源清理
        window.GameManager.hideGameModal = function() {
            const modal = document.getElementById('game-modal');
            if (modal) {
                // 清理模态框内容
                const container = document.getElementById('game-container');
                if (container) {
                    // 移除所有事件监听器
                    const clone = container.cloneNode(true);
                    container.parentNode.replaceChild(clone, container);
                }
                
                // 隐藏模态框
                modal.classList.remove('active');
                document.body.style.overflow = '';
                
                // 清理游戏状态
                if (window.AppState) {
                    window.AppState.currentGame = null;
                    window.AppState.gameSession = null;
                }
            }
        };
    }
};

// 优化决策界面
const optimizeDecisionInterface = () => {
    console.log('优化决策界面...');
    
    // 为决策选项添加更醒目的样式
    const style = document.createElement('style');
    style.textContent = `
        /* 更醒目的决策选项样式 */
        .decision-option, .choice-btn, .option-btn {
            border: 2px solid #2563eb !important;
            border-radius: 8px !important;
            padding: 12px !important;
            margin: 8px 0 !important;
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe) !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        .decision-option:hover, .choice-btn:hover, .option-btn:hover {
            background: linear-gradient(135deg, #dbeafe, #bfdbfe) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
            border-color: #3b82f6 !important;
        }
        
        .decision-option.selected, .choice-btn.selected, .option-btn.selected {
            background: linear-gradient(135deg, #dbeafe, #93c5fd) !important;
            border-color: #1d4ed8 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
        }
        
        /* 清晰的选择指示 */
        .decision-option::before, .choice-btn::before, .option-btn::before {
            content: "○ " !important;
            color: #6b7280 !important;
        }
        
        .decision-option.selected::before, .choice-btn.selected::before, .option-btn.selected::before {
            content: "● " !important;
            color: #2563eb !important;
        }
        
        /* 简化按钮样式，减少emoji */
        .btn {
            border-radius: 6px !important;
            padding: 8px 16px !important;
            font-weight: 500 !important;
        }
        
        /* 清理过多的装饰元素 */
        .cognitive-bubbles, .bubble {
            display: none !important;
        }
    `;
    
    document.head.appendChild(style);
};

// 验证场景完整性
const validateScenarios = () => {
    console.log('验证场景完整性...');
    
    // 检查场景数据中是否有缺失的决策选项
    if (window.NavigationManager && window.AppState && window.AppState.scenarios) {
        const incompleteScenarios = [];
        
        window.AppState.scenarios.forEach(scenario => {
            // 检查场景是否有决策选项
            let hasDecisions = false;
            
            // 检查高级挑战
            if (scenario.advancedChallenges && scenario.advancedChallenges.length > 0) {
                scenario.advancedChallenges.forEach(challenge => {
                    if (challenge.decisionPatterns || challenge.targetPatterns) {
                        hasDecisions = true;
                    }
                });
            }
            
            // 检查其他决策相关字段
            if (scenario.targetPatterns || scenario.decisionPattern || scenario.steps) {
                hasDecisions = true;
            }
            
            if (!hasDecisions) {
                incompleteScenarios.push(scenario.id);
                console.warn(`场景缺少决策选项: ${scenario.id} - ${scenario.name}`);
            }
        });
        
        if (incompleteScenarios.length > 0) {
            console.warn(`发现 ${incompleteScenarios.length} 个场景缺少决策选项:`);
            incompleteScenarios.forEach(id => console.warn(` - ${id}`));
        } else {
            console.log('✅ 所有场景都包含决策选项');
        }
    }
};

// 主修复函数
const performCompleteFix = () => {
    console.log('开始执行完整修复...');
    
    // 应用所有修复
    fixSceneRouting();
    optimizeScenarioCards();
    fixModalResourceManagement();
    optimizeDecisionInterface();
    validateScenarios();
    
    console.log('✅ 完整修复执行完毕！');
    
    // 如果当前在场景页面，重新加载
    if (window.AppState && window.AppState.currentPage === 'scenarios') {
        setTimeout(() => {
            if (window.NavigationManager) {
                window.NavigationManager.loadScenariosPage();
            }
        }, 1000);
    }
};

// 等待页面加载后执行修复
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performCompleteFix);
} else {
    // 如果页面已加载，稍等一下确保其他脚本也加载完成
    setTimeout(performCompleteFix, 1000);
}

console.log('场景修复和优化脚本已注入');