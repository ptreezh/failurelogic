from playwright.sync_api import sync_playwright
import time
import json


def analyze_page_structure():
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
        time.sleep(2)  # 等待页面加载
        
        # 1. 访问主页
        print("\n=== 1. 主页分析 ===")
        analyze_home_page(page)
        
        # 2. 导航到场景页面
        print("\n=== 2. 导航到场景页面 ===")
        navigate_to_scenarios_page(page)
        
        # 3. 检查难度选择器是否可见
        print("\n=== 3. 难度选择器检查 ===")
        check_difficulty_selector(page)
        
        # 4. 检查场景卡片是否可点击
        print("\n=== 4. 场景卡片可点击性检查 ===")
        check_scenario_cards_clickable(page)
        
        # 5. 尝试进行交互
        print("\n=== 5. 交互尝试 ===")
        attempt_interactions(page)
        
        # 关闭浏览器
        browser.close()


def analyze_home_page(page):
    """分析主页结构"""
    print("当前URL:", page.url)
    print("页面标题:", page.title())
    
    # 检查导航栏
    nav_items = page.query_selector_all('.nav-item')
    print(f"导航项数量: {len(nav_items)}")
    for item in nav_items:
        text = item.inner_text()
        data_page = item.get_attribute('data-page')
        print(f"  - {text} -> {data_page}")
    
    # 检查主页内容
    home_page = page.query_selector('#home-page')
    if home_page and 'active' in home_page.get_attribute('class'):
        print("主页当前处于活动状态")
    else:
        print("主页当前不处于活动状态")


def navigate_to_scenarios_page(page):
    """导航到场景页面"""
    # 查找并点击场景导航按钮
    scenarios_nav_button = page.query_selector('button[data-page="scenarios"]')
    if scenarios_nav_button:
        print("找到场景导航按钮，点击...")
        scenarios_nav_button.click()

        # 等待场景页面变为活动状态
        try:
            page.wait_for_selector('#scenarios-page.active', state='visible', timeout=10000)
            print("场景页面当前处于活动状态")
        except Exception as e:
            print(f"场景页面未在预期时间内变为活动状态: {str(e)}")

        # 额外等待场景内容加载
        time.sleep(3)
        print("已导航到场景页面")
    else:
        print("未找到场景导航按钮")

    # 确认场景页面是否激活
    scenarios_page = page.query_selector('#scenarios-page')
    if scenarios_page and 'active' in scenarios_page.get_attribute('class'):
        print("场景页面当前处于活动状态")
    else:
        print("场景页面当前不处于活动状态")


def check_difficulty_selector(page):
    """检查难度选择器"""
    # 查找难度选择器
    try:
        # 等待难度选择器变得可见
        page.wait_for_selector('#difficulty-level', state='visible', timeout=5000)
        difficulty_selector = page.query_selector('#difficulty-level')
    except:
        difficulty_selector = page.query_selector('#difficulty-level')

    if difficulty_selector:
        print("✅ 找到难度选择器")
        print(f"  - 选择器ID: {difficulty_selector.get_attribute('id')}")
        print(f"  - 选择器标签: {difficulty_selector.get_attribute('tag')}")

        # 检查元素是否可见
        is_visible = difficulty_selector.is_visible()
        print(f"  - 元素是否可见: {is_visible}")

        # 检查元素是否启用
        is_enabled = difficulty_selector.is_enabled()
        print(f"  - 元素是否启用: {is_enabled}")

        # 获取当前值
        try:
            current_value = page.input_value('#difficulty-level')
            print(f"  - 当前难度值: {current_value}")
        except:
            print("  - 无法获取当前难度值")
            current_value = None

        # 获取所有选项
        options = page.query_selector_all('#difficulty-level option')
        print(f"  - 可用难度选项: {[opt.inner_text() for opt in options]}")

        # 尝试更改难度（如果元素可见且启用）
        if is_visible and is_enabled:
            print("  - 尝试更改难度...")
            try:
                page.select_option('#difficulty-level', 'intermediate')
                time.sleep(1)
                new_value = page.input_value('#difficulty-level')
                print(f"  - 更改后的难度值: {new_value}")
            except Exception as e:
                print(f"  - 更改难度失败: {str(e)}")
        else:
            print("  - 由于元素不可见或不可用，跳过难度更改")

        # 检查难度显示元素
        difficulty_display = page.query_selector('#current-difficulty')
        if difficulty_display:
            print(f"  - 难度显示文本: {difficulty_display.inner_text()}")

    else:
        print("❌ 未找到难度选择器")

        # 检查是否有其他可能的难度选择器
        possible_selectors = [
            '[id*="difficulty"]',
            '[class*="difficulty"]',
            '[name*="difficulty"]',
            'select'
        ]

        for selector in possible_selectors:
            elements = page.query_selector_all(selector)
            if elements:
                print(f"  - 发现可能的难度相关元素 ({selector}): {len(elements)} 个")
                for elem in elements:
                    is_elem_visible = elem.is_visible()
                    is_elem_enabled = elem.is_enabled()
                    print(f"    - {elem.get_attribute('tag')}#{elem.get_attribute('id')} "
                          f"class='{elem.get_attribute('class')}' "
                          f"visible={is_elem_visible} enabled={is_elem_enabled} "
                          f"text='{elem.inner_text()[:50]}'")

        # 检查整个场景页面的内容
        scenarios_page = page.query_selector('#scenarios-page')
        if scenarios_page:
            print(f"\n场景页面HTML内容预览:")
            inner_html = scenarios_page.inner_html()
            print(f"  - 内容长度: {len(inner_html)} 字符")
            print(f"  - 内容预览: {inner_html[:500]}...")


def check_scenario_cards_clickable(page):
    """检查场景卡片是否可点击"""
    # 查找场景卡片
    scenario_cards = page.query_selector_all('.scenario-card, .card.scenario-card')
    print(f"发现 {len(scenario_cards)} 个场景卡片")
    
    for i, card in enumerate(scenario_cards):
        print(f"\n卡片 {i+1}:")
        print(f"  - 内部文本 (前100字符): {card.inner_text()[:100]}...")
        
        # 检查卡片是否有点击事件
        onclick_attr = card.get_attribute('onclick')
        if onclick_attr:
            print(f"  - onclick 属性: {onclick_attr}")
        
        # 检查卡片内的按钮
        buttons = card.query_selector_all('button')
        if buttons:
            print(f"  - 卡片内按钮数量: {len(buttons)}")
            for btn in buttons:
                btn_text = btn.inner_text()
                btn_onclick = btn.get_attribute('onclick')
                print(f"    - 按钮文本: '{btn_text}', onclick: {btn_onclick}")
        
        # 检查卡片是否可点击（通过样式）
        cursor_style = card.get_attribute('style')
        if cursor_style and 'pointer' in cursor_style:
            print("  - 卡片具有指针样式，可能可点击")
        else:
            # 检查CSS类
            classes = card.get_attribute('class')
            if classes and ('clickable' in classes or 'interactive' in classes):
                print("  - 卡片具有可点击类名")
            else:
                print("  - 卡片可能不可点击")


def attempt_interactions(page):
    """尝试进行交互"""
    print("\n尝试与第一个场景卡片交互...")
    
    # 尝试点击第一个场景卡片
    scenario_cards = page.query_selector_all('.scenario-card, .card.scenario-card')
    if scenario_cards:
        first_card = scenario_cards[0]
        print("点击第一个场景卡片...")
        
        try:
            # 先尝试点击卡片本身
            first_card.click()
            time.sleep(2)
            print("成功点击场景卡片")
            
            # 检查是否有模态框弹出
            modal = page.query_selector('#game-modal')
            if modal and 'active' in modal.get_attribute('class'):
                print("游戏模态框已打开")
            else:
                print("游戏模态框未打开")
                
        except Exception as e:
            print(f"点击场景卡片失败: {str(e)}")
            
            # 尝试点击卡片内的按钮
            buttons = first_card.query_selector_all('button')
            if buttons:
                print("尝试点击卡片内的第一个按钮...")
                try:
                    buttons[0].click()
                    time.sleep(2)
                    print("成功点击卡片内按钮")
                    
                    # 检查是否有模态框弹出
                    modal = page.query_selector('#game-modal')
                    if modal and 'active' in modal.get_attribute('class'):
                        print("游戏模态框已打开")
                    else:
                        print("游戏模态框未打开")
                        
                except Exception as btn_error:
                    print(f"点击卡片内按钮失败: {str(btn_error)}")
    
    # 尝试更改难度并观察变化
    print("\n更改难度并观察场景卡片变化...")
    original_card_count = len(page.query_selector_all('.scenario-card'))
    print(f"原始场景卡片数量: {original_card_count}")
    
    # 更改难度到高级
    page.select_option('#difficulty-level', 'advanced')
    time.sleep(2)
    
    new_card_count = len(page.query_selector_all('.scenario-card'))
    print(f"更改难度后的场景卡片数量: {new_card_count}")
    
    if new_card_count != original_card_count:
        print(f"难度更改影响了场景卡片显示 (变化: {new_card_count - original_card_count})")
    else:
        print("难度更改似乎未影响场景卡片显示")


if __name__ == "__main__":
    analyze_page_structure()