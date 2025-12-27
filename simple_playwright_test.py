"""
简化版前端交互测试
"""
import asyncio
from playwright.async_api import async_playwright
import time

async def simplified_test():
    """简化前端交互测试"""
    print("启动前端交互测试...")
    
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        # 设置较长的超时时间
        page.set_default_timeout(30000)
        
        try:
            print("正在加载页面...")
            await page.goto("http://localhost:8082/index.html")
            
            # 等待页面加载
            await page.wait_for_timeout(5000)
            
            print("检查页面标题...")
            title = await page.title()
            print(f"页面标题: {title}")
            
            # 检查页面是否加载了主要内容区域
            print("检查页面内容区域...")
            content_loaded = await page.evaluate("() => document.body.innerText.length > 100")
            if content_loaded:
                print("✓ 页面主体内容已加载")
            else:
                print("❌ 页面内容似乎未正确加载")
            
            # 查找所有按钮元素
            print("查找按钮元素...")
            buttons = await page.query_selector_all("button")
            print(f"找到 {len(buttons)} 个按钮")
            
            for i, button in enumerate(buttons[:5]):  # 只检查前5个
                text = await button.text_content()
                print(f"  按钮 {i+1}: '{text}'")
            
            # 检查是否包含导航链接
            print("查找导航链接...")
            links = await page.query_selector_all("a")
            print(f"找到 {len(links)} 个链接")
            
            for i, link in enumerate(links[:5]):  # 只检查前5个
                text = await link.text_content()
                href = await link.get_attribute("href")
                print(f"  链接 {i+1}: '{text}' -> {href}")
            
            # 尝试查找和点击场景相关的元素
            print("查找场景相关元素...")
            scenario_elements = await page.query_selector_all(".scenario-card, .card, [id*='scenario'], [class*='scenario']")
            print(f"找到 {len(scenario_elements)} 个场景相关元素")
            
            if scenario_elements:
                for i, element in enumerate(scenario_elements[:3]):  # 只尝试前3个
                    try:
                        tag_name = await element.evaluate("el => el.tagName")
                        class_name = await element.evaluate("el => el.className")
                        text = await element.text_content()
                        print(f"  场景元素 {i+1}: <{tag_name}> class='{class_name}', text='{text[:50]}...'")
                        
                        # 检查元素是否可见
                        is_visible = await element.is_visible()
                        print(f"    可见性: {is_visible}")
                        
                    except Exception as e:
                        print(f"    ❌ 获取元素信息失败: {e}")
            
            # 尝试查找和与难度选择器交互
            print("查找难度选择器...")
            difficulty_selectors = await page.query_selector_all("#difficulty-level, [id*='difficulty'], [class*='difficulty']")
            print(f"找到 {len(difficulty_selectors)} 个难度相关元素")
            
            for i, selector in enumerate(difficulty_selectors):
                try:
                    tag_name = await selector.evaluate("el => el.tagName")
                    is_visible = await selector.is_visible()
                    is_enabled = await selector.is_enabled()
                    print(f"  难度元素 {i+1}: <{tag_name}>, 可见: {is_visible}, 可用: {is_enabled}")
                    
                    if is_visible and is_enabled:
                        # 尝试选择一个选项
                        try:
                            await selector.evaluate("el => el.style.border = '2px solid green'")
                            print(f"    ✓ 标记难度选择器")
                            
                            # 尝试选择一个选项
                            await selector.select_option("beginner")
                            print(f"    ✓ 选择初级难度成功")
                        except Exception as e:
                            print(f"    ⚠ 与难度选择器交互失败: {e}")
                except Exception as e:
                    print(f"    ❌ 获取难度元素信息失败: {e}")
            
            # 查找API连接状态指示器（如果有的话）
            print("检查API连接状态...")
            try:
                # 尝试调用API以验证连接
                api_result = await page.evaluate("""async () => {
                    try {
                        const response = await fetch('http://localhost:8003/scenarios/', {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            return { connected: true, scenarios: data.scenarios.length };
                        } else {
                            return { connected: false, status: response.status };
                        }
                    } catch (error) {
                        return { connected: false, error: error.message };
                    }
                }""")
                
                if api_result.get('connected'):
                    print(f"✓ API连接正常，返回 {api_result.get('scenarios')} 个场景")
                else:
                    print(f"❌ API连接失败: {api_result}")
            except Exception as e:
                print(f"⚠ API连接检查失败: {e}")
            
            print("\n前端交互测试完成！")
            print("页面已加载，浏览器将保持打开状态供手动检查...")
            
            # 保持浏览器打开供手动检查
            await page.wait_for_timeout(20000)
            
        except Exception as e:
            print(f"❌ 测试过程出错: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(simplified_test())