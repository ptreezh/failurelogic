"""
模拟真实用户行为脚本
启动Microsoft Edge浏览器访问 http://localhost:8081，然后执行以下操作：
1) 点击导航菜单（首页、场景等）
2) 在场景页面选择难度
3) 点击场景卡片
4) 进行交互操作
"""
import asyncio
from playwright.async_api import async_playwright
import time

async def simulate_user_behavior():
    print("🚀 开始模拟真实用户行为...")
    print("🌐 启动Microsoft Edge浏览器访问 http://localhost:8081")
    
    async with async_playwright() as p:
        # 启动Microsoft Edge浏览器（非headless模式）
        browser = await p.chromium.launch(
            channel='msedge',  # 使用Microsoft Edge
            headless=False,    # 非headless模式，可以看到浏览器
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox"
            ]
        )
        
        page = await browser.new_page()
        page.set_default_timeout(30000)  # 30秒超时
        
        try:
            # 步骤1: 访问网站
            print("🔍 步骤1: 访问 http://localhost:8081")
            await page.goto("http://localhost:8081", wait_until="domcontentloaded")
            print("✅ 成功访问网站")
            
            # 等待页面加载
            await page.wait_for_timeout(3000)
            
            # 获取页面标题
            title = await page.title()
            print(f"📄 页面标题: {title}")
            
            # 检查页面内容
            content = await page.content()
            print(f"📏 页面内容长度: {len(content)} 字符")
            
            # 步骤2: 点击导航菜单（首页、场景等）
            print("\\n🖱️ 步骤2: 寻找并点击导航菜单")
            
            # 定义可能的导航元素选择器
            nav_selectors = [
                "nav a",                    # 导航中的链接
                ".nav-item a",              # 导航项中的链接
                ".navbar a",                # 导航栏中的链接
                "[role='navigation'] a",    # 具有导航角色的链接
                "header a",                 # 页眉中的链接
                ".menu-item a",             # 菜单项中的链接
                "a:has-text('首页')",       # 包含'首页'文本的链接
                "a:has-text('场景')",       # 包含'场景'文本的链接
                "a:has-text('Home')",       # 包含'Home'文本的链接
                "a:has-text('Scenarios')",  # 包含'Scenarios'文本的链接
                "text=首页",                # '首页'文本
                "text=场景",                # '场景'文本
                "text=Home",                # 'Home'文本
                "text=Scenarios"            # 'Scenarios'文本
            ]
            
            nav_clicked = False
            for selector in nav_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        print(f"🔍 找到导航元素: {selector} (共{len(elements)}个)")
                        
                        # 尝试点击第一个元素
                        for i, element in enumerate(elements):
                            try:
                                # 滚动到元素位置
                                await element.scroll_into_view_if_needed()
                                
                                # 检查元素是否可见且可点击
                                is_visible = await element.is_visible()
                                is_enabled = await element.is_enabled()
                                
                                if is_visible and is_enabled:
                                    print(f"🖱️  点击第{i+1}个导航元素: {await element.inner_text()}")
                                    await element.click()
                                    
                                    # 等待页面变化
                                    await page.wait_for_timeout(2000)
                                    
                                    # 检查URL是否发生变化
                                    current_url = page.url
                                    print(f"🔗 当前URL: {current_url}")
                                    
                                    nav_clicked = True
                                    break
                                else:
                                    print(f"⚠️  第{i+1}个元素不可点击 (可见: {is_visible}, 可用: {is_enabled})")
                            except Exception as e:
                                print(f"⚠️  点击第{i+1}个元素失败: {str(e)}")
                                continue
                        
                        if nav_clicked:
                            break
                except Exception as e:
                    print(f"⚠️  尝试选择器 {selector} 时出错: {str(e)}")
                    continue
            
            if not nav_clicked:
                print("⚠️  未找到可点击的导航菜单项，继续下一步")
            
            # 步骤3: 在场景页面选择难度
            print("\\n🎚️ 步骤3: 寻找并选择难度")
            
            # 等待页面加载
            await page.wait_for_timeout(2000)
            
            difficulty_selectors = [
                ".difficulty",              # 难度类
                "[class*='difficulty']",    # 包含'difficulty'的类
                "[data-difficulty]",        # data-difficulty属性
                "select[name*='difficulty']", # 难度下拉选择
                ".level",                   # 级别类
                "[class*='level']",         # 包含'level'的类
                "button:has-text('简单')",  # 包含'简单'的按钮
                "button:has-text('中等')",  # 包含'中等'的按钮
                "button:has-text('困难')",  # 包含'困难'的按钮
                "button:has-text('Easy')",  # 包含'Easy'的按钮
                "button:has-text('Medium')",# 包含'Medium'的按钮
                "button:has-text('Hard')",  # 包含'Hard'的按钮
                "text=简单",               # '简单'文本
                "text=中等",               # '中等'文本
                "text=困难",               # '困难'文本
                "text=Easy",               # 'Easy'文本
                "text=Medium",             # 'Medium'文本
                "text=Hard"                # 'Hard'文本
            ]
            
            difficulty_selected = False
            for selector in difficulty_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        print(f"🔍 找到难度元素: {selector} (共{len(elements)}个)")
                        
                        # 尝试点击第一个元素
                        for i, element in enumerate(elements):
                            try:
                                # 滚动到元素位置
                                await element.scroll_into_view_if_needed()
                                
                                # 检查元素是否可见且可点击
                                is_visible = await element.is_visible()
                                is_enabled = await element.is_enabled()
                                
                                if is_visible and is_enabled:
                                    print(f"🖱️  点击第{i+1}个难度元素: {await element.inner_text()}")
                                    await element.click()
                                    
                                    # 等待页面变化
                                    await page.wait_for_timeout(2000)
                                    
                                    difficulty_selected = True
                                    break
                                else:
                                    print(f"⚠️  第{i+1}个难度元素不可点击 (可见: {is_visible}, 可用: {is_enabled})")
                            except Exception as e:
                                print(f"⚠️  点击第{i+1}个难度元素失败: {str(e)}")
                                continue
                        
                        if difficulty_selected:
                            break
                except Exception as e:
                    print(f"⚠️  尝试难度选择器 {selector} 时出错: {str(e)}")
                    continue
            
            if not difficulty_selected:
                print("⚠️  未找到可选择的难度选项")
            
            # 步骤4: 点击场景卡片
            print("\\n🃏 步骤4: 寻找并点击场景卡片")
            
            # 等待页面加载
            await page.wait_for_timeout(2000)
            
            card_selectors = [
                ".scenario-card",           # 场景卡片类
                "[class*='scenario'][class*='card']", # 包含'scenario'和'card'的类
                ".card.scenario",           # 场景卡片类（组合）
                "[data-scenario]",          # data-scenario属性
                ".scenario-item",           # 场景项
                "[class*='scenario']",      # 包含'scenario'的类
                "div:has-text('场景')",     # 包含'场景'文本的div
                "div:has-text('Scenario')", # 包含'Scenario'文本的div
                ".grid-item",               # 网格项（通常用于卡片布局）
                ".tile"                     # 瓷砖（另一种卡片样式）
            ]
            
            card_clicked = False
            for selector in card_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        print(f"🔍 找到场景卡片: {selector} (共{len(elements)}个)")
                        
                        # 尝试点击第一个元素
                        for i, element in enumerate(elements):
                            try:
                                # 滚动到元素位置
                                await element.scroll_into_view_if_needed()
                                
                                # 检查元素是否可见且可点击
                                is_visible = await element.is_visible()
                                is_enabled = await element.is_enabled()
                                
                                if is_visible and is_enabled:
                                    print(f"🖱️  点击第{i+1}张场景卡片")
                                    await element.click()
                                    
                                    # 等待页面变化
                                    await page.wait_for_timeout(3000)
                                    
                                    card_clicked = True
                                    break
                                else:
                                    print(f"⚠️  第{i+1}张场景卡片不可点击 (可见: {is_visible}, 可用: {is_enabled})")
                            except Exception as e:
                                print(f"⚠️  点击第{i+1}张场景卡片失败: {str(e)}")
                                continue
                        
                        if card_clicked:
                            break
                except Exception as e:
                    print(f"⚠️  尝试卡片选择器 {selector} 时出错: {str(e)}")
                    continue
            
            if not card_clicked:
                print("⚠️  未找到可点击的场景卡片")
                
                # 尝试更通用的选择器
                print("🔄 尝试通用卡片选择器...")
                generic_card_selectors = [
                    "[class*='card']",      # 任何包含'card'的元素
                    "[class*='item']",      # 任何包含'item'的元素
                    "[class*='scenario']",  # 任何包含'scenario'的元素
                    "article",              # 文章元素（常用于卡片）
                    "section"              # 区段元素（常用于卡片）
                ]
                
                for selector in generic_card_selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        if elements:
                            print(f"🔍 找到通用元素: {selector} (共{len(elements)}个)")
                            
                            # 尝试点击第一个看起来像卡片的元素
                            for i, element in enumerate(elements):
                                try:
                                    # 获取元素的文本内容
                                    text_content = await element.inner_text()
                                    
                                    # 如果元素包含场景相关关键词，则点击
                                    if any(keyword in text_content for keyword in ['场景', 'Scenario', '场景卡', 'scenario']):
                                        # 滚动到元素位置
                                        await element.scroll_into_view_if_needed()
                                        
                                        # 检查元素是否可见且可点击
                                        is_visible = await element.is_visible()
                                        is_enabled = await element.is_enabled()
                                        
                                        if is_visible and is_enabled:
                                            print(f"🖱️  点击场景相关元素: '{text_content[:50]}...'")
                                            await element.click()
                                            
                                            # 等待页面变化
                                            await page.wait_for_timeout(3000)
                                            
                                            card_clicked = True
                                            break
                                except Exception as e:
                                    print(f"⚠️  检查元素内容时出错: {str(e)}")
                                    continue
                            
                            if card_clicked:
                                break
                    except Exception as e:
                        print(f"⚠️  尝试通用选择器 {selector} 时出错: {str(e)}")
                        continue
            
            # 步骤5: 进行交互操作
            print("\\n🎮 步骤5: 进行交互操作")
            
            # 等待页面加载
            await page.wait_for_timeout(2000)
            
            # 寻找交互元素（按钮、输入框、滑块等）
            interaction_selectors = [
                "button",                   # 所有按钮
                "input[type='button']",     # 按钮类型的输入
                "input[type='submit']",     # 提交类型的输入
                "[role='button']",          # 具有按钮角色的元素
                ".btn",                     # 按钮类
                "[class*='button']",        # 包含'button'的类
                "input[type='range']",      # 滑块
                "input[type='number']",     # 数字输入框
                "input[type='text']",       # 文本输入框
                "textarea",                 # 文本域
                "select",                   # 下拉选择框
                "[onclick]",                # 有点击事件的元素
                "[data-action]"             # 有动作数据属性的元素
            ]
            
            interactions_performed = 0
            max_interactions = 5  # 最多进行5次交互
            
            for selector in interaction_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements and interactions_performed < max_interactions:
                        print(f"🔍 找到交互元素: {selector} (共{len(elements)}个)")
                        
                        # 尝试与多个元素交互
                        for i, element in enumerate(elements):
                            if interactions_performed >= max_interactions:
                                break
                                
                            try:
                                # 滚动到元素位置
                                await element.scroll_into_view_if_needed()
                                
                                # 检查元素是否可见且可点击
                                is_visible = await element.is_visible()
                                is_enabled = await element.is_enabled()
                                
                                if is_visible and is_enabled:
                                    element_tag = await element.get_attribute("tag_name")
                                    element_text = await element.inner_text()
                                    
                                    print(f"🖱️  与第{i+1}个元素交互: {element_tag}")
                                    
                                    if element_tag.lower() == "button" or "button" in selector.lower():
                                        # 点击按钮
                                        await element.click()
                                        print(f"   ✓ 按钮点击成功: '{element_text[:30]}...'")
                                    elif element_tag.lower() == "input":
                                        input_type = await element.get_attribute("type") or "text"
                                        
                                        if input_type == "button" or input_type == "submit":
                                            # 点击输入按钮
                                            await element.click()
                                            print(f"   ✓ 输入按钮点击成功: '{element_text[:30]}...'")
                                        elif input_type == "range":
                                            # 移动滑块到中间位置
                                            await element.focus()
                                            await page.keyboard.press("ArrowRight")
                                            await page.keyboard.press("ArrowRight")
                                            await page.keyboard.press("ArrowRight")
                                            print(f"   ✓ 滑块移动成功")
                                        elif input_type == "number" or input_type == "text":
                                            # 输入一些值
                                            await element.focus()
                                            await element.fill("42")
                                            print(f"   ✓ 输入框填入值: '42'")
                                        else:
                                            # 对其他输入类型点击
                                            await element.click()
                                            print(f"   ✓ 输入元素点击成功")
                                    elif element_tag.lower() == "select":
                                        # 选择下拉框的第一个选项
                                        options = await element.query_selector_all("option")
                                        if options:
                                            await options[0].click()
                                            print(f"   ✓ 下拉框选择成功")
                                    else:
                                        # 对其他元素尝试点击
                                        await element.click()
                                        print(f"   ✓ 元素点击成功: '{element_text[:30]}...'")
                                    
                                    interactions_performed += 1
                                    
                                    # 等待页面响应
                                    await page.wait_for_timeout(1000)
                                    
                                    if interactions_performed >= max_interactions:
                                        break
                                else:
                                    print(f"⚠️  第{i+1}个交互元素不可操作 (可见: {is_visible}, 可用: {is_enabled})")
                            except Exception as e:
                                print(f"⚠️  与第{i+1}个元素交互失败: {str(e)}")
                                continue
                                
                        if interactions_performed >= max_interactions:
                            break
                except Exception as e:
                    print(f"⚠️  尝试交互选择器 {selector} 时出错: {str(e)}")
                    continue
            
            print(f"\\n✅ 交互操作完成，共进行了 {interactions_performed} 次交互")
            
            # 总结
            print("\\n📋 操作总结:")
            print(f"- 访问网站: {'✅ 成功' if 'localhost:8081' in page.url else '⚠️  未知'}")
            print(f"- 点击导航菜单: {'✅ 成功' if nav_clicked else '❌ 失败'}")
            print(f"- 选择难度: {'✅ 成功' if difficulty_selected else '❌ 失败'}")
            print(f"- 点击场景卡片: {'✅ 成功' if card_clicked else '❌ 失败'}")
            print(f"- 交互操作: {'✅ 完成' if interactions_performed > 0 else '❌ 未进行'}")
            
            if interactions_performed > 0:
                print("\\n🎯 模拟用户行为执行成功！浏览器将保持开启状态以便查看结果。")
            else:
                print("\\n⚠️  部分交互操作未能执行，可能是因为页面结构与预期不同。")
            
            # 保持浏览器开启一段时间，以便用户查看
            print("\\n⏰ 浏览器将在60秒后自动关闭，或您可以手动关闭。")
            await page.wait_for_timeout(60000)
            
        except Exception as e:
            print(f"❌ 模拟用户行为过程中发生错误: {str(e)}")
            import traceback
            traceback.print_exc()
            
        finally:
            print("\\n🔄 关闭浏览器...")
            await browser.close()
            print("✅ 浏览器已关闭")

if __name__ == "__main__":
    print(".Microsoft Edge浏览器用户行为模拟脚本")
    print("="*60)
    asyncio.run(simulate_user_behavior())