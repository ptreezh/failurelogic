/**
 * 修复API配置和编码问题
 */

// 修复API基础URL配置
const fixAPIConfig = () => {
    console.log('修复API配置...');
    
    // 更新全局APP_CONFIG
    if (window.APP_CONFIG) {
        window.APP_CONFIG.apiBaseUrl = 'http://localhost:8082';
        console.log('API基础URL已更新为本地服务器');
    }
    
    // 修复API服务配置
    if (window.ApiService && window.ApiService.configManager) {
        // 更新基础URL
        window.ApiService.configManager.baseUrl = window.APP_CONFIG.apiBaseUrl;
        
        // 重写请求方法以确保正确的编码
        const originalRequest = window.ApiService.configManager.request;
        window.ApiService.configManager.request = async function(endpoint, options = {}) {
            // 确保请求头包含正确的编码
            options.headers = {
                'Content-Type': 'application/json; charset=utf-8',
                ...options.headers
            };
            
            // 添加请求拦截器以处理编码
            try {
                const url = `${this.baseUrl}${endpoint}`;
                console.log(`请求URL: ${url}`);
                
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        ...options.headers
                    }
                });
                
                // 确保响应以正确的编码解析
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const text = await response.text();
                    // 尝試修復編碼問題
                    try {
                        const data = JSON.parse(text);
                        console.log('API響應數據:', data);
                        return data;
                    } catch (parseError) {
                        console.error('JSON解析錯誤:', parseError);
                        console.log('響應文本:', text.substring(0, 200) + '...');
                        throw parseError;
                    }
                } else {
                    return await response.text();
                }
            } catch (error) {
                console.error('API請求失敗:', error);
                throw error;
            }
        };
    }
    
    console.log('API配置修復完成');
};

// 修復場景加載函數
const fixScenarioLoading = async () => {
    console.log('修復場景加載...');
    
    if (window.NavigationManager) {
        // 保存原始方法
        const originalLoadScenariosPage = window.NavigationManager.loadScenariosPage;
        
        // 重寫場景加載方法
        window.NavigationManager.loadScenariosPage = async function() {
            console.log('使用修復後的場景加載方法');
            
            // 顯示加載狀態
            const loadingEl = document.getElementById('scenarios-loading');
            if (loadingEl) {
                loadingEl.style.display = 'block';
                loadingEl.innerHTML = '<p>正在加載場景數據...</p>';
            }
            
            try {
                // 直接從API獲取場景數據
                const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/scenarios/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                });
                
                if (response.ok) {
                    // 以文本形式讀取響應，然後手動解析以處理編碼
                    const textResponse = await response.text();
                    console.log('原始響應文本長度:', textResponse.length);
                    
                    try {
                        const data = JSON.parse(textResponse);
                        console.log('解析後的場景數量:', data.scenarios ? data.scenarios.length : 0);
                        
                        // 更新應用狀態
                        if (window.AppState) {
                            window.AppState.scenarios = data.scenarios || [];
                        }
                        
                        // 渲染場景到頁面
                        const container = document.getElementById('scenarios-grid');
                        if (container && Array.isArray(window.AppState?.scenarios)) {
                            console.log('開始渲染', window.AppState.scenarios.length, '個場景');
                            window.NavigationManager.renderScenarios(window.AppState.scenarios, container);
                            
                            // 隱藏加載狀態
                            if (loadingEl) {
                                loadingEl.style.display = 'none';
                            }
                            
                            // 更新統計顯示
                            const statsEl = document.querySelector('.stat-number[data-target="12"]');
                            if (statsEl) {
                                statsEl.textContent = String(window.AppState.scenarios.length);
                            }
                            
                            console.log('場景已成功渲染');
                            return true;
                        } else {
                            console.error('場景容器或場景數據不存在');
                            return false;
                        }
                    } catch (parseError) {
                        console.error('響應解析失敗:', parseError);
                        console.log('響應內容預覽:', textResponse.substring(0, 500));
                        
                        // 如果解析失敗，嘗試使用備用數據
                        if (window.NavigationManager.getMockScenarios) {
                            const mockScenarios = window.NavigationManager.getMockScenarios();
                            window.AppState.scenarios = mockScenarios;
                            
                            const container = document.getElementById('scenarios-grid');
                            if (container) {
                                window.NavigationManager.renderScenarios(mockScenarios, container);
                                if (loadingEl) {
                                    loadingEl.style.display = 'none';
                                }
                                console.log('使用模擬數據渲染場景');
                                return true;
                            }
                        }
                        
                        return false;
                    }
                } else {
                    console.error('API響應失敗:', response.status, response.statusText);
                    
                    // 使用模擬數據作為備用
                    if (window.NavigationManager.getMockScenarios) {
                        const mockScenarios = window.NavigationManager.getMockScenarios();
                        window.AppState.scenarios = mockScenarios;
                        
                        const container = document.getElementById('scenarios-grid');
                        if (container) {
                            window.NavigationManager.renderScenarios(mockScenarios, container);
                            if (loadingEl) {
                                loadingEl.style.display = 'none';
                            }
                            console.log('使用模擬數據渲染場景（API失敗備用）');
                            return true;
                        }
                    }
                    
                    return false;
                }
            } catch (error) {
                console.error('場景加載失敗:', error);
                
                // 使用模擬數據作為最終備用
                if (window.NavigationManager.getMockScenarios) {
                    const mockScenarios = window.NavigationManager.getMockScenarios();
                    window.AppState.scenarios = mockScenarios;
                    
                    const container = document.getElementById('scenarios-grid');
                    if (container) {
                        window.NavigationManager.renderScenarios(mockScenarios, container);
                        if (loadingEl) {
                            loadingEl.style.display = 'none';
                        }
                        console.log('使用模擬數據渲染場景（異常備用）');
                        return true;
                    }
                }
                
                return false;
            }
        };
    }
    
    console.log('場景加載修復完成');
};

// 執行修復
const performFix = async () => {
    console.log('開始執行前端修復...');
    
    // 修復API配置
    fixAPIConfig();
    
    // 修復場景加載
    await fixScenarioLoading();
    
    // 如果當前頁面是場景頁面，重新加載
    if (window.AppState?.currentPage === 'scenarios' && window.NavigationManager) {
        await window.NavigationManager.loadScenariosPage();
    }
    
    console.log('前端修復完成！');
};

// 等待頁面加載後執行修復
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performFix);
} else {
    // 如果頁面已經加載，延遲執行以確保其他腳本已加載
    setTimeout(performFix, 1000);
}

console.log('前端修復腳本已注入');