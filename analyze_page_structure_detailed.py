from playwright.sync_api import sync_playwright
import time
import json


def analyze_page_structure_detailed():
    """
    详细分析 http://localhost:8081 页面的HTML结构，
    特别关注难度选择器和场景卡片的可见性条件。
    """
    
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 使用非headless模式以便观察
        page = browser.new_page()
        
        print("正在访问 http://localhost:8081...")
        page.goto("http://localhost:8081")
        time.sleep(3)  # 等待页面加载
        
        # 检查所有页面元素的初始状态
        print("\n=== 初始页面状态分析 ===")
        analyze_initial_state(page)
        
        # 尝试通过JavaScript直接导航到场景页面
        print("\n=== 尝试通过JavaScript导航 ===")
        navigate_via_js(page)
        
        # 再次检查页面状态
        print("\n=== 导航后页面状态分析 ===")
        analyze_after_navigation(page)
        
        # 检查难度选择器
        print("\n=== 难度选择器检查 ===")
        check_difficulty_selector_detailed(page)
        
        # 检查场景卡片
        print("\n=== 场景卡片检查 ===")
        check_scenario_cards_detailed(page)
        
        # 尝试交互
        print("\n=== 交互尝试 ===")
        attempt_interactions_detailed(page)
        
        # 关闭浏览器
        browser.close()


def analyze_initial_state(page):
    """分析初始页面状态"""
    print("当前URL:", page.url)
    print("页面标题:", page.title())
    
    # 检查所有页面元素的状态
    page_elements = page.query_selector_all('.page')
    print(f"页面总数: {len(page_elements)}")
    
    for element in page_elements:
        page_id = element.get_attribute('id')
        page_classes = element.get_attribute('class')
        is_active = 'active' in page_classes if page_classes else False
        is_visible = element.is_visible()
        print(f"  - {page_id}: active={is_active}, visible={is_visible}, classes='{page_classes}'")
    
    # 检查导航按钮状态
    nav_buttons = page.query_selector_all('.nav-item')
    print(f"导航按钮数量: {len(nav_buttons)}")
    for btn in nav_buttons:
        text = btn.inner_text()
        data_page = btn.get_attribute('data-page')
        btn_classes = btn.get_attribute('class')
        is_active = 'active' in btn_classes if btn_classes else False
        print(f"  - {text} (data-page='{data_page}'): active={is_active}, classes='{btn_classes}'")


def navigate_via_js(page):
    """通过JavaScript导航到场景页面"""
    try:
        # 使用JavaScript直接调用导航函数
        result = page.evaluate("""
            () => {
                if (typeof NavigationManager !== 'undefined' && typeof NavigationManager.navigateTo === 'function') {
                    NavigationManager.navigateTo('scenarios');
                    return { success: true, message: 'NavigationManager used successfully' };
                } else {
                    return { success: false, message: 'NavigationManager not available' };
                }
            }
        """)
        print(f"JavaScript导航结果: {result}")
        
        # 等待页面切换
        time.sleep(3)
        
        # 检查是否有错误
        js_errors = page.evaluate("() => window.lastError || null")
        if js_errors:
            print(f"JavaScript错误: {js_errors}")
        
    except Exception as e:
        print(f"JavaScript导航失败: {str(e)}")
        
        # 尝试另一种方法：直接点击导航按钮并等待
        try:
            print("尝试点击场景导航按钮...")
            scenarios_btn = page.query_selector('button[data-page="scenarios"]')
            if scenarios_btn:
                scenarios_btn.click(force=True)  # 使用force参数强制点击
                time.sleep(3)
        except Exception as click_error:
            print(f"点击导航按钮也失败: {str(click_error)}")


def analyze_after_navigation(page):
    """导航后分析页面状态"""
    # 检查所有页面元素的状态
    page_elements = page.query_selector_all('.page')
    print(f"导航后页面总数: {len(page_elements)}")
    
    for element in page_elements:
        page_id = element.get_attribute('id')
        page_classes = element.get_attribute('class')
        is_active = 'active' in page_classes if page_classes else False
        is_visible = element.is_visible()
        print(f"  - {page_id}: active={is_active}, visible={is_visible}, classes='{page_classes}'")
    
    # 特别检查场景页面
    scenarios_page = page.query_selector('#scenarios-page')
    if scenarios_page:
        classes = scenarios_page.get_attribute('class')
        is_active = 'active' in classes if classes else False
        is_visible = scenarios_page.is_visible()
        print(f"场景页面状态: active={is_active}, visible={is_visible}, classes='{classes}'")
        
        # 检查内部内容
        inner_content = scenarios_page.inner_html()
        print(f"场景页面内部内容长度: {len(inner_content)} 字符")
        print(f"内容预览: {inner_content[:300]}...")


def check_difficulty_selector_detailed(page):
    """详细检查难度选择器"""
    # 检查难度选择器是否存在
    difficulty_selectors = page.query_selector_all('[id*="difficulty"], [class*="difficulty"]')
    print(f"找到 {len(difficulty_selectors)} 个可能的难度相关元素")
    
    for i, elem in enumerate(difficulty_selectors):
        tag = elem.get_attribute('tag')
        id_attr = elem.get_attribute('id')
        class_attr = elem.get_attribute('class')
        is_visible = elem.is_visible()
        is_enabled = elem.is_enabled()
        
        print(f"\n难度元素 {i+1}:")
        print(f"  - Tag: {tag}")
        print(f"  - ID: {id_attr}")
        print(f"  - Class: {class_attr}")
        print(f"  - 可见: {is_visible}")
        print(f"  - 启用: {is_enabled}")
        
        if id_attr == 'difficulty-level':
            print("  - 这是主要的难度选择器!")
            
            # 尝试获取选项
            try:
                options = page.query_selector_all('#difficulty-level option')
                print(f"  - 选项数量: {len(options)}")
                for j, option in enumerate(options):
                    value = option.get_attribute('value')
                    text = option.inner_text()
                    print(f"    - 选项 {j+1}: value='{value}', text='{text}'")
            except Exception as e:
                print(f"  - 获取选项失败: {str(e)}")
                
            # 检查父容器
            parent = elem.query_selector('..')  # 获取父元素
            if parent:
                parent_id = parent.get_attribute('id')
                parent_class = parent.get_attribute('class')
                parent_visible = parent.is_visible()
                print(f"  - 父容器: id='{parent_id}', class='{parent_class}', visible={parent_visible}")


def check_scenario_cards_detailed(page):
    """详细检查场景卡片"""
    # 检查场景网格
    scenarios_grid = page.query_selector('#scenarios-grid')
    if scenarios_grid:
        print(f"场景网格存在，可见: {scenarios_grid.is_visible()}")
        inner_html = scenarios_grid.inner_html()
        print(f"场景网格内容长度: {len(inner_html)}")
        print(f"内容预览: {inner_html[:200]}...")
    
    # 检查场景卡片
    scenario_cards = page.query_selector_all('.scenario-card, .card.scenario-card, [class*="scenario"]')
    print(f"找到 {len(scenario_cards)} 个可能的场景卡片元素")
    
    for i, card in enumerate(scenario_cards):
        card_id = card.get_attribute('id')
        card_class = card.get_attribute('class')
        is_visible = card.is_visible()
        inner_text_preview = card.inner_text()[:100]
        
        print(f"\n场景卡片 {i+1}:")
        print(f"  - ID: {card_id}")
        print(f"  - Class: {card_class}")
        print(f"  - 可见: {is_visible}")
        print(f"  - 文本预览: {inner_text_preview}...")


def attempt_interactions_detailed(page):
    """尝试详细交互"""
    print("尝试与页面元素交互...")
    
    # 检查是否有可用的JavaScript函数
    try:
        has_nav_manager = page.evaluate("() => typeof NavigationManager !== 'undefined'")
        print(f"NavigationManager 可用: {has_nav_manager}")
        
        if has_nav_manager:
            # 检查NavigationManager的方法
            has_nav_to_method = page.evaluate("() => typeof NavigationManager.navigateTo !== 'undefined'")
            print(f"NavigationManager.navigateTo 可用: {has_nav_to_method}")
            
            if has_nav_to_method:
                # 尝试再次导航到场景页面
                print("再次尝试通过NavigationManager导航到场景页面...")
                nav_result = page.evaluate("() => NavigationManager.navigateTo('scenarios')")
                print(f"导航结果: {nav_result}")
                time.sleep(2)
    except Exception as e:
        print(f"检查JavaScript函数时出错: {str(e)}")
    
    # 检查页面是否已更新
    print("\n检查页面更新后状态...")
    scenarios_page = page.query_selector('#scenarios-page')
    if scenarios_page:
        is_active = 'active' in (scenarios_page.get_attribute('class') or '')
        is_visible = scenarios_page.is_visible()
        print(f"场景页面: active={is_active}, visible={is_visible}")
    
    # 尝试与难度选择器交互（如果可见）
    difficulty_selector = page.query_selector('#difficulty-level')
    if difficulty_selector and difficulty_selector.is_visible():
        print("难度选择器可见，尝试交互...")
        try:
            # 获取当前值
            current_val = page.input_value('#difficulty-level')
            print(f"当前难度值: {current_val}")
            
            # 尝试更改值
            page.select_option('#difficulty-level', 'intermediate')
            time.sleep(1)
            
            new_val = page.input_value('#difficulty-level')
            print(f"更改后的难度值: {new_val}")
            
        except Exception as interaction_error:
            print(f"与难度选择器交互失败: {str(interaction_error)}")
    else:
        print("难度选择器不可见，跳过交互")


if __name__ == "__main__":
    analyze_page_structure_detailed()