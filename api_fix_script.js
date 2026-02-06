/**
 * API配置修复脚本
 * 解决前端与API服务器的连接问题
 */

// 修复API基础URL配置
const fixAPIConfig = () => {
    // 检查当前API配置
    console.log('当前API配置:', window.APP_CONFIG?.apiBaseUrl);
    
    // 修复API基础URL - 优先使用本地API服务器
    if (window.APP_CONFIG) {
        // 如果当前配置指向GitHub Codespaces或其他远程地址，改为本地
        if (window.APP_CONFIG.apiBaseUrl.includes('github.dev') || 
            window.APP_CONFIG.apiBaseUrl.includes('vercel.app')) {
            console.log('检测到远程API配置，切换到本地API...');
            window.APP_CONFIG.apiBaseUrl = 'http://localhost:8082'; // API服务器端口
            console.log('API配置已更新为本地服务器:', window.APP_CONFIG.apiBaseUrl);
        }
    }
    
    // 如果全局对象不存在，创建它
    if (!window.APP_CONFIG) {
        window.APP_CONFIG = {
            apiBaseUrl: 'http://localhost:8082', // 指向本地API服务器
            version: '2.0.0',
            debug: true,
            animationDuration: 300,
            toastDuration: 5000,
            syncInterval: 30000
        };
        console.log('创建了新的API配置:', window.APP_CONFIG);
    }
};

// 修复API服务配置
const fixApiService = () => {
    // 确保API服务配置管理器存在
    if (window.ApiService && window.ApiService.configManager) {
        // 更新API基础URL
        window.ApiService.configManager.baseUrl = window.APP_CONFIG.apiBaseUrl;
        console.log('API服务配置已更新');
    }
};

// 修复场景加载函数
const fixScenarioLoading = async () => {
    console.log('尝试修复场景加载...');
    
    try {
        // 直接从API获取场景数据
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/scenarios/`);
        if (response.ok) {
            const data = await response.json();
            console.log('成功从API获取场景数据:', data.scenarios?.length || 0, '个场景');
            
            // 更新应用状态
            if (window.AppState) {
                window.AppState.scenarios = data.scenarios || [];
            }
            
            // 如果场景页面已加载，重新渲染
            if (window.NavigationManager) {
                const container = document.getElementById('scenarios-grid');
                if (container && Array.isArray(window.AppState?.scenarios)) {
                    window.NavigationManager.renderScenarios(window.AppState.scenarios, container);
                    
                    // 隐藏加载状态
                    const loadingEl = document.getElementById('scenarios-loading');
                    if (loadingEl) {
                        loadingEl.style.display = 'none';
                    }
                    
                    console.log('场景已重新渲染');
                }
            }
            
            return true;
        } else {
            console.warn('API响应失败:', response.status);
            return false;
        }
    } catch (error) {
        console.error('API调用失败:', error);
        return false;
    }
};

// 修复导航管理器
const fixNavigationManager = () => {
    if (window.NavigationManager) {
        // 确保路由方法存在
        if (!window.NavigationManager.originalLoadScenariosPage) {
            // 保存原始方法
            window.NavigationManager.originalLoadScenariosPage = window.NavigationManager.loadScenariosPage;
            
            // 重写场景加载方法以使用修复后的API配置
            window.NavigationManager.loadScenariosPage = async function() {
                console.log('使用修复后的场景加载方法');
                return await fixScenarioLoading();
            };
        }
    }
};

// 主修复函数
const performAPIFix = async () => {
    console.log('开始执行API连接修复...');
    
    // 执行各项修复
    fixAPIConfig();
    fixApiService();
    fixNavigationManager();
    
    // 尝试加载场景
    const success = await fixScenarioLoading();
    
    if (success) {
        console.log('✅ API连接修复成功！');
    } else {
        console.log('⚠️ API连接修复部分成功，将继续使用模拟数据');
    }
    
    // 触发页面重新渲染
    if (window.NavigationManager && window.AppState?.currentPage) {
        await window.NavigationManager.renderPage(window.AppState.currentPage);
    }
    
    return success;
};

// 等待页面和应用加载完成后执行修复
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM内容已加载，准备执行API修复...');
    
    // 等待应用脚本加载
    const waitForApp = async (timeout = 10000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (window.NavigationManager && window.AppState) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return false;
    };
    
    const appLoaded = await waitForApp();
    if (appLoaded) {
        console.log('应用已加载，执行API修复...');
        await performAPIFix();
    } else {
        console.log('应用未在预期时间内加载，稍后重试...');
        // 设置定时器稍后重试
        setTimeout(async () => {
            await performAPIFix();
        }, 2000);
    }
});

// 如果页面已经加载完成，立即执行
if (document.readyState === 'loading') {
    // DOM仍在加载中，上面的事件监听器会处理
} else {
    // DOM已加载完成，立即执行
    setTimeout(async () => {
        await performAPIFix();
    }, 500);
}

console.log('API修复脚本已注入并开始执行...');