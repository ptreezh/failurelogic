/**
 * 修复脚本 - 确保场景页面正确加载
 */

// 等待页面和应用完全加载后执行修复
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM内容加载完成，准备执行场景页面修复...');
    
    // 等待应用脚本加载
    const waitForAppAndFix = async () => {
        // 等待关键对象可用
        const startTime = Date.now();
        const timeout = 10000; // 10秒超时
        
        while (Date.now() - startTime < timeout) {
            if (window.NavigationManager && window.AppState) {
                console.log('应用对象已加载，执行场景页面修复...');
                
                // 修复场景页面显示逻辑
                const originalShowStaticPage = window.NavigationManager.showStaticPage;
                
                if (originalShowStaticPage) {
                    window.NavigationManager.showStaticPage = function(page) {
                        // 调用原始方法
                        originalShowStaticPage.call(this, page);
                        
                        // 特别处理场景页面
                        if (page === 'scenarios') {
                            console.log('场景页面被激活，确保网格可见...');
                            
                            // 确保场景网格可见
                            const scenariosGrid = document.getElementById('scenarios-grid');
                            if (scenariosGrid) {
                                scenariosGrid.style.display = 'grid';
                                scenariosGrid.style.visibility = 'visible';
                                scenariosGrid.style.opacity = '1';
                                
                                // 检查是否有场景卡片，如果没有则强制加载
                                const scenarioCards = scenariosGrid.querySelectorAll('.scenario-card');
                                if (scenarioCards.length === 0) {
                                    console.log('未发现场景卡片，触发场景加载...');
                                    setTimeout(() => {
                                        if (window.NavigationManager && typeof window.NavigationManager.loadScenariosPage === 'function') {
                                            window.NavigationManager.loadScenariosPage();
                                        }
                                    }, 500);
                                }
                            }
                            
                            // 确保加载指示器正确处理
                            const loadingEl = document.getElementById('scenarios-loading');
                            if (loadingEl) {
                                // 如果已经有场景内容，隐藏加载指示器
                                const hasScenarios = scenariosGrid && scenariosGrid.children.length > 1;
                                if (hasScenarios) {
                                    loadingEl.style.display = 'none';
                                } else {
                                    loadingEl.style.display = 'block';
                                }
                            }
                        }
                    };
                }
                
                // 如果当前页面是场景页面，重新加载
                if (window.AppState && window.AppState.currentPage === 'scenarios') {
                    console.log('当前为场景页面，重新加载...');
                    setTimeout(() => {
                        if (window.NavigationManager && typeof window.NavigationManager.loadScenariosPage === 'function') {
                            window.NavigationManager.loadScenariosPage();
                        }
                    }, 1000);
                }
                
                break;
            }
            
            // 等待100毫秒后重试
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (Date.now() - startTime >= timeout) {
            console.warn('等待应用对象超时');
        }
    };
    
    // 立即开始等待
    waitForAppAndFix();
    
    // 同时设置一个定时器作为后备
    setTimeout(() => {
        if (window.NavigationManager && typeof window.NavigationManager.loadScenariosPage === 'function') {
            console.log('后备机制：尝试加载场景页面...');
            window.NavigationManager.loadScenariosPage();
        }
    }, 2000);
});

// 如果文档已经加载完成
if (document.readyState === 'complete') {
    // 重新触发事件以确保执行
    document.dispatchEvent(new Event('DOMContentLoaded'));
}

console.log('场景页面修复脚本已注入');