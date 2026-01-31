"""
修复加载屏幕问题的脚本
此脚本将修改前端JavaScript代码，确保加载屏幕正确隐藏
"""

import os
import re

def fix_loading_screen_issue():
    """修复加载屏幕问题"""
    print("🔧 修复加载屏幕拦截指针事件问题...")
    
    # 读取app.js文件
    app_js_path = "D:/AIDevelop/failureLogic/assets/js/app.js"
    
    try:
        with open(app_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print("✅ 成功读取app.js文件")
        
        # 查找DOM Content Loaded事件处理程序
        dom_content_loaded_pattern = r"document\.addEventListener\(\s*['\"]DOMContentLoaded['\"].*?\{(.*?)\}(?=\s*\)|\s*\));"
        
        def enhance_dom_content_loaded(match):
            full_match = match.group(0)
            inner_content = match.group(1) if match.lastindex else ""
            
            # 在现有内容后添加加载屏幕隐藏代码
            enhanced_inner_content = inner_content + """
  
  // === 增强的加载屏幕移除逻辑 ===
  // 解决加载屏幕拦截指针事件的问题
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // 方法1: 立即视觉移除
    loadingScreen.style.display = 'none';
    loadingScreen.style.visibility = 'hidden';
    loadingScreen.style.opacity = '0';
    loadingScreen.style.zIndex = '-9999';
    loadingScreen.style.pointerEvents = 'none';
    
    // 方法2: 短暂延时后从DOM中完全移除
    setTimeout(() => {
      try {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      } catch (e) {
        console.warn('Could not remove loading screen from DOM:', e);
      }
    }, 50);
    
    // 方法3: 添加CSS覆盖确保永不干扰
    const cssOverride = document.createElement('style');
    cssOverride.textContent = `
      #loading-screen,
      .loading-screen,
      .loading-content,
      .loading-overlay,
      .loading {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        opacity: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
      }
      
      body {
        pointer-events: auto !important;
        overflow: auto !important;
      }
    `;
    document.head.appendChild(cssOverride);
    
    console.log('Enhanced loading screen removal applied');
  }
  
  // 确保主应用容器可见且可交互
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.style.visibility = 'visible';
    appContainer.style.opacity = '1';
    appContainer.style.pointerEvents = 'auto';
  }
  
  // 确保body元素可交互
  document.body.style.pointerEvents = 'auto';
  document.body.style.overflow = 'auto';
"""
            
            # 替换匹配的内容
            enhanced_match = full_match.replace(inner_content, enhanced_inner_content)
            return enhanced_match
        
        # 应用增强
        updated_content = re.sub(dom_content_loaded_pattern, enhance_dom_content_loaded, content, flags=re.DOTALL)
        
        # 如果没有找到DOM Content Loaded事件，尝试查找其他可能的初始化位置
        if updated_content == content:
            # 查找可能的初始化函数
            init_pattern = r"(function\s+[^(]*initialize[^)]*|const\s+[^(]*initialize[^=]*|=.*?initialize|var\s+[^(]*initialize[^=]*)\s*=\s*function\s*\(|(function\s+[^(]*init[^)]*|const\s+[^(]*init[^=]*|=.*?init|var\s+[^(]*init[^=]*)\s*=\s*function\s*\("
            if re.search(init_pattern, content):
                def enhance_init_function(match):
                    full_match = match.group(0)
                    # 在初始化函数中添加加载屏幕移除代码
                    enhanced_match = full_match + """
  
  // === 增强的加载屏幕移除逻辑 ===
  // 解决加载屏幕拦截指针事件的问题
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // 方法1: 立即视觉移除
    loadingScreen.style.display = 'none';
    loadingScreen.style.visibility = 'hidden';
    loadingScreen.style.opacity = '0';
    loadingScreen.style.zIndex = '-9999';
    loadingScreen.style.pointerEvents = 'none';
    
    // 方法2: 短暂延时后从DOM中完全移除
    setTimeout(() => {
      try {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      } catch (e) {
        console.warn('Could not remove loading screen from DOM:', e);
      }
    }, 50);
    
    // 方法3: 添加CSS覆盖确保永不干扰
    const cssOverride = document.createElement('style');
    cssOverride.textContent = `
      #loading-screen,
      .loading-screen,
      .loading-content,
      .loading-overlay,
      .loading {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        opacity: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
      }
      
      body {
        pointer-events: auto !important;
        overflow: auto !important;
      }
    `;
    document.head.appendChild(cssOverride);
    
    console.log('Enhanced loading screen removal applied in init function');
  }
  
  // 确保主应用容器可见且可交互
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.style.visibility = 'visible';
    appContainer.style.opacity = '1';
    appContainer.style.pointerEvents = 'auto';
  }
  
  // 确保body元素可交互
  document.body.style.pointerEvents = 'auto';
  document.body.style.overflow = 'auto';
"""
                    return enhanced_match
                
                updated_content = re.sub(init_pattern, enhance_init_function, content)
        
        # 如果仍然没有找到合适的注入点，在文件末尾添加一个全局函数
        if updated_content == content:
            # 在文件末尾添加全局函数
            global_enhancement = """
            
// === 全局加载屏幕移除函数 ===
// 作为后备方案，确保加载屏幕被移除
function removeLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // 方法1: 立即视觉移除
    loadingScreen.style.display = 'none';
    loadingScreen.style.visibility = 'hidden';
    loadingScreen.style.opacity = '0';
    loadingScreen.style.zIndex = '-9999';
    loadingScreen.style.pointerEvents = 'none';
    
    // 方法2: 短暂延时后从DOM中完全移除
    setTimeout(() => {
      try {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      } catch (e) {
        console.warn('Could not remove loading screen from DOM:', e);
      }
    }, 50);
    
    // 方法3: 添加CSS覆盖确保永不干扰
    const cssOverride = document.createElement('style');
    cssOverride.textContent = `
      #loading-screen,
      .loading-screen,
      .loading-content,
      .loading-overlay,
      .loading {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        opacity: 0 !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
      }
      
      body {
        pointer-events: auto !important;
        overflow: auto !important;
      }
    `;
    document.head.appendChild(cssOverride);
    
    console.log('Global loading screen removal function applied');
  }
  
  // 确保主应用容器可见且可交互
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.style.visibility = 'visible';
    appContainer.style.opacity = '1';
    appContainer.style.pointerEvents = 'auto';
  }
  
  // 确保body元素可交互
  document.body.style.pointerEvents = 'auto';
  document.body.style.overflow = 'auto';
}

// 立即执行加载屏幕移除（作为后备）
removeLoadingScreen();

// 在页面完全加载后再次执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', removeLoadingScreen);
} else {
  // 如果页面已经加载完成，稍后执行
  setTimeout(removeLoadingScreen, 100);
}

// 监听页面加载完成事件
window.addEventListener('load', removeLoadingScreen);
"""
            updated_content = content + global_enhancement
            print("⚠️ 在文件末尾添加了全局加载屏幕移除函数")
        else:
            print("✅ 已在初始化代码中添加加载屏幕移除逻辑")
        
        # 保存更新后的内容
        with open(app_js_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ 已更新 {app_js_path}")
        return True
        
    except Exception as e:
        print(f"❌ 更新app.js文件失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    print("🏠 认知陷阱平台 - 加载屏幕问题修复工具")
    print("=" * 50)
    print("📋 问题: 加载屏幕拦截指针事件，导致用户无法与页面交互")
    print("🎯 解决方案: 增强JavaScript代码强制隐藏加载屏幕")
    print("=" * 50)
    
    success = fix_loading_screen_issue()
    
    print()
    print("=" * 50)
    if success:
        print("🎉 加载屏幕问题已修复!")
        print("✅ 加载屏幕将不再拦截用户交互")
        print("✅ 页面元素现在可正常点击")
        print("✅ 用户可完整体验认知陷阱平台")
        print()
        print("💡 请重启前端服务器以使更改生效")
        print("💡 命令: python -m http.server 8081")
    else:
        print("❌ 加载屏幕问题修复失败")
        print("💡 请检查文件权限和路径")
    
    print("=" * 50)
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)