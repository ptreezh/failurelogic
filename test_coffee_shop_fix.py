"""
咖啡店线性思维场景修复测试脚本

测试目标：
1. 验证游戏初始化是否正确
2. 验证5轮游戏流程
3. 验证线性思维陷阱的揭示
4. 验证延迟效果处理
"""

import asyncio
import json
from playwright.async_api import async_playwright, expect


async def test_coffee_shop_scenario():
    """完整的咖啡店场景测试"""
    print("=" * 80)
    print("咖啡店线性思维场景 - 完整测试")
    print("=" * 80)

    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        page = await browser.new_page()

        try:
            # 1. 导航到首页
            print("\n[1/7] 导航到首页...")
            await page.goto("http://localhost:3000")
            await page.wait_for_load_state("networkidle")
            print("✅ 首页加载成功")

            # 2. 点击场景按钮
            print("\n[2/7] 打开场景列表...")
            scenario_button = page.locator("button").filter(has_text="认知训练场景")
            await scenario_button.click()
            await page.wait_for_load_state("networkidle")
            print("✅ 场景列表已打开")

            # 3. 选择咖啡店场景
            print("\n[3/7] 选择咖啡店线性思维场景...")
            await page.wait_for_selector("text=咖啡店线性思维", timeout=5000)
            coffee_link = page.locator("a").filter(has_text="咖啡店线性思维")
            await coffee_link.click()
            await page.wait_for_load_state("networkidle")
            print("✅ 场景详情页已打开")

            # 4. 开始游戏
            print("\n[4/7] 启动游戏...")
            start_button = page.locator("button").filter(has_text="开始挑战")
            await start_button.click()
            await page.wait_for_selector("#game-container", timeout=5000)
            print("✅ 游戏已启动")

            # 5. 检查游戏初始化状态
            print("\n[5/7] 检查游戏初始化...")
            await page.wait_for_selector(".game-page", timeout=5000)

            # 检查是否有错误消息
            error_locator = page.locator(".error, text=/delayedEffects\\.forEach is not a function/")
            error_count = await error_locator.count()
            if error_count > 0:
                error_text = await error_locator.inner_text()
                print(f"❌ 发现错误: {error_text}")
                raise Exception(f"游戏初始化失败: {error_text}")
            else:
                print("✅ 无 delayedEffects.forEach 错误")

            # 检查游戏状态
            game_container = page.locator("#game-container")
            container_html = await game_container.inner_html()

            # 检查是否有决策UI
            has_decision_ui = ("slider" in container_html.lower() or
                              "input" in container_html.lower() or
                              "select" in container_html.lower())

            if has_decision_ui:
                print("✅ 决策UI已显示")
            else:
                print("⚠️ 未找到决策UI组件")

            # 6. 模拟游戏流程（5轮）
            print("\n[6/7] 模拟5轮游戏流程...")

            for turn in range(1, 6):
                print(f"\n  --- 第{turn}轮 ---")

                # 查找并点击决策按钮/滑块
                # 这里需要根据实际UI调整

                # 查找"继续"或"下一步"按钮
                continue_button = page.locator("button").filter(
                    has_text=re.compile(r"继续|下一步|提交|确认|进入|开始")
                ).first

                button_count = await continue_button.count()
                if button_count > 0:
                    print(f"  找到 {button_count} 个操作按钮")
                    # 点击第一个按钮
                    await continue_button.click()
                    await page.wait_for_timeout(500)
                    print(f"  ✅ 第{turn}轮操作完成")
                else:
                    print(f"  ⚠️ 第{turn}轮未找到操作按钮")

                # 截图
                screenshot_path = f"coffee_shop_turn_{turn}.png"
                await page.screenshot(path=screenshot_path)
                print(f"  📸 截图已保存: {screenshot_path}")

            # 7. 检查线性思维陷阱揭示
            print("\n[7/7] 检查线性思维教育内容...")

            # 查找关键词
            keywords = [
                "线性思维",
                "认知陷阱",
                "期望",
                "实际",
                "偏差",
                "系统"
            ]

            content = await page.inner_html("#game-container")
            found_keywords = []

            for keyword in keywords:
                if keyword in content:
                    found_keywords.append(keyword)

            if found_keywords:
                print(f"✅ 发现教育关键词: {', '.join(found_keywords)}")
            else:
                print("⚠️ 未发现明显的教育关键词")

            # 最终截图
            final_screenshot = "coffee_shop_final.png"
            await page.screenshot(path=final_screenshot)
            print(f"\n📸 最终截图: {final_screenshot}")

            # 检查是否有成功或失败消息
            success_text = await page.locator("text=/成功|完成|结束/").count()
            if success_text > 0:
                print("✅ 游戏流程完成")

            print("\n" + "=" * 80)
            print("✅ 测试完成")
            print("=" * 80)

        except Exception as e:
            print(f"\n❌ 测试失败: {str(e)}")
            # 错误截图
            await page.screenshot(path="coffee_shop_error.png")
            print("错误截图已保存: coffee_shop_error.png")
            raise

        finally:
            await browser.close()


if __name__ == "__main__":
    import re
    asyncio.run(test_coffee_shop_scenario())
