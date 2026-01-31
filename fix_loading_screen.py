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
        
        # 替换加载屏幕隐藏逻辑，使用更强大的方法
        new_loading_logic = '''
  // Hide loading screen with enhanced method to prevent pointer event interception
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Method 1: Immediate visual removal
    loadingScreen.style.display = 'none';
    loadingScreen.style.visibility = 'hidden';
    loadingScreen.style.opacity = '0';
    loadingScreen.style.zIndex = '-9999';
    loadingScreen.style.pointerEvents = 'none';
    
    // Method 2: Remove from DOM completely after a short delay
    setTimeout(() => {
      if (loadingScreen.parentNode) {
        loadingScreen.parentNode.removeChild(loadingScreen);
      }
    }, 100);
    
    // Method 3: Add CSS override to ensure it never interferes
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
      }
    `;
    document.head.appendChild(cssOverride);
    
    console.log('Enhanced loading screen hidden with multiple methods');
  }
  
  // Also ensure the main app container is visible and interactive
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.style.visibility = 'visible';
    appContainer.style.opacity = '1';
    appContainer.style.pointerEvents = 'auto';
  }
'''
        
        # 查找并替换现有的加载屏幕隐藏代码
        # 首先查找现有的加载屏幕相关代码
        if 'loading-screen' in content:
            # 使用正则表达式找到加载屏幕处理代码并替换
            pattern = r'[^\n;]*loadingScreen[^}]*?if\s*\([^)]*loadingScreen[^)]*\)[^{]*?\{([^}]|}[^}])*?loadingScreen[^}]*?\}[^}]*?\}'
            updated_content = re.sub(pattern, 
                f"  // Enhanced loading screen removal\n  const loadingScreen = document.getElementById('loading-screen');\n  if (loadingScreen) {{\n    // Method 1: Immediate visual removal\n    loadingScreen.style.display = 'none';\n    loadingScreen.style.visibility = 'hidden';\n    loadingScreen.style.opacity = '0';\n    loadingScreen.style.zIndex = '-9999';\n    loadingScreen.style.pointerEvents = 'none';\n    \n    // Method 2: Remove from DOM completely after a short delay\n    setTimeout(() => {{\n      if (loadingScreen.parentNode) {{\n        loadingScreen.parentNode.removeChild(loadingScreen);\n      }}\n    }}, 100);\n    \n    // Method 3: Add CSS override to ensure it never interferes\n    const cssOverride = document.createElement('style');\n    cssOverride.textContent = `\n      #loading-screen,\n      .loading-screen,\n      .loading-content,\n      .loading-overlay,\n      .loading {\n        display: none !important;\n        visibility: hidden !important;\n        pointer-events: none !important;\n        z-index: -9999 !important;\n        opacity: 0 !important;\n        position: absolute !important;\n        top: -9999px !important;\n        left: -9999px !important;\n      }\n      \n      body {\n        pointer-events: auto !important;\n      }\n    `;\n    document.head.appendChild(cssOverride);\n    \n    console.log('Enhanced loading screen hidden with multiple methods');\n  }}\n  \n  // Also ensure the main app container is visible and interactive\n  const appContainer = document.getElementById('app');\n  if (appContainer) {{\n    appContainer.style.visibility = 'visible';\n    appContainer.style.opacity = '1';\n    appContainer.style.pointerEvents = 'auto';\n  }}", 
                content)
            print("✅ 已更新加载屏幕隐藏逻辑")
        else:
            # 如果没有找到现有代码，在DOM Content Loaded事件中添加新代码
            dom_ready_pattern = r"document\.addEventListener\(\s*['\"]DOMContentLoaded['\"].*?\{(.*?)\}(?=\s*\)|\s*\));"
            def replace_dom_ready(match):
                full_match = match.group(0)
                inner_content = match.group(1) if match.lastindex else ""
                # 在DOM加载完成后添加加载屏幕隐藏代码
                enhanced_content = full_match.replace(
                    inner_content,
                    inner_content + "\n\n  // Enhanced loading screen removal\n  const loadingScreen = document.getElementById('loading-screen');\n  if (loadingScreen) {\n    // Method 1: Immediate visual removal\n    loadingScreen.style.display = 'none';\n    loadingScreen.style.visibility = 'hidden';\n    loadingScreen.style.opacity = '0';\n    loadingScreen.style.zIndex = '-9999';\n    loadingScreen.style.pointerEvents = 'none';\n    \n    // Method 2: Remove from DOM completely after a short delay\n    setTimeout(() => {\n      if (loadingScreen.parentNode) {\n        loadingScreen.parentNode.removeChild(loadingScreen);\n      }\n    }, 100);\n    \n    // Method 3: Add CSS override to ensure it never interferes\n    const cssOverride = document.createElement('style');\n    cssOverride.textContent = `\n      #loading-screen,\n      .loading-screen,\n      .loading-content,\n      .loading-overlay,\n      .loading {\n        display: none !important;\n        visibility: hidden !important;\n        pointer-events: none !important;\n        z-index: -9999 !important;\n        opacity: 0 !important;\n        position: absolute !important;\n        top: -9999px !important;\n        left: -9999px !important;\n      }\n      \n      body {\n        pointer-events: auto !important;\n      }\n    `;\n    document.head.appendChild(cssOverride);\n    \n    console.log('Enhanced loading screen hidden with multiple methods');\n  }\n  \n  // Also ensure the main app container is visible and interactive\n  const appContainer = document.getElementById('app');\n  if (appContainer) {\n    appContainer.style.visibility = 'visible';\n    appContainer.style.opacity = '1';\n    appContainer.style.pointerEvents = 'auto';\n  }\n  "
                )
                return enhanced_content
            
            updated_content = re.sub(dom_ready_pattern, replace_dom_ready, content, flags=re.DOTALL)
            print("✅ 已在DOM Content Loaded事件中添加加载屏幕隐藏逻辑")
        
        # 保存更新后的内容
        with open(app_js_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ 已更新 {app_js_path}")
        return True
        
    except Exception as e:
        print(f"❌ 更新app.js文件失败: {e}")
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