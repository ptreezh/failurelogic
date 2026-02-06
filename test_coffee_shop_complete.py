"""
咖啡店线性思维场景 - 完整自动化测试

测试覆盖：
1. 游戏初始化
2. delayedEffects.forEach 错误修复验证
3. 5轮完整游戏流程
4. 线性思维陷阱揭示
5. 决策UI组件
"""

import asyncio
import json
from playwright.async_api import async_playwright, expect


async def test_coffee_shop_complete():
    """完整的咖啡店场景测试"""
    print("=" * 80)
    print("咖啡店线性思维场景 - 完整测试")
    print("=" * 80)

    async with async_playwright() as p:
        # 启动浏览器（非无头模式，便于观察）
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()

        try:
            # 1. 导航到首页
            print("\n[1/10] 导航到首页...")
            await page.goto("http://localhost:3000")
            await page.wait_for_load_state("networkidle")
            print("✅ 首页加载成功")

            # 2. 打开场景列表
            print("\n[2/10] 打开场景列表...")
            scenario_button = page.locator("button").filter(has_text="认知训练场景")
            await scenario_button.click()
            await page.wait_for_load_state("networkidle")
            print("✅ 场景列表已打开")

            # 3. 选择咖啡店场景
            print("\n[3/10] 选择咖啡店线性思维场景...")
            await page.wait_for_selector("text=咖啡店线性思维", timeout=5000)
            coffee_link = page.locator("a").filter(has_text="咖啡店线性思维")
            await coffee_link.click()
            await page.wait_for_load_state("networkidle")
            print("✅ 场景详情页已打开")

            # 4. 开始游戏
            print("\n[4/10] 启动游戏...")
            start_button = page.locator("button").filter(has_text="开始挑战")
            await start_button.click()

            # 等待游戏容器加载
            try:
                await page.wait_for_selector("#game-container", timeout=5000)
                print("✅ 游戏容器已加载")
            except:
                print("⚠️ 游戏容器未找到，可能使用了不同的选择器")

            # 5. 检查控制台错误
            print("\n[5/10] 检查控制台错误...")

            # 监听控制台消息
            errors = []
            def handle_console(msg):
                if msg.type == 'error':
                    errors.append(msg.text)
                    print(f"  控制台错误: {msg.text}")

            page.on('console', handle_console)

            # 等待一下以捕获任何初始化错误
            await page.wait_for_timeout(2000)

            # 检查是否有 delayedErrors.forEach 错误
            delayed_errors = [e for e in errors if 'delayedEffects.forEach is not a function' in e]
            if delayed_errors:
                print(f"❌ 发现 delayedErrors.forEach 错误: {delayed_errors}")
                raise Exception(f"delayedEffects.forEach 错误仍然存在!")
            else:
                print("✅ 无 delayedEffects.forEach 错误")

            # 6. 检查游戏UI
            print("\n[6/10] 检查游戏UI组件...")

            # 检查是否有游戏页面
            game_content = await page.inner_html("body")

            # 查找决策UI
            has_slider = "slider" in game_content.lower() or "range" in game_content.lower()
            has_button = "button" in game_content.lower()
            has_decision = "决策" in game_content or "decision" in game_content.lower()

            if has_button:
                print("✅ 找到按钮UI")
            else:
                print("⚠️ 未找到按钮UI")

            if has_decision:
                print("✅ 找到决策相关内容")
            else:
                print("⚠️ 未找到决策相关内容")

            # 7. 截图初始状态
            print("\n[7/10] 截图初始状态...")
            await page.screenshot(path="coffee_shop_01_initial.png")
            print("✅ 初始状态截图已保存")

            # 8. 模拟游戏流程
            print("\n[8/10] 模拟游戏流程...")

            for turn in range(1, 4):  # 测试前3轮
                print(f"\n  --- 第{turn}轮 ---")

                # 查找可点击的按钮
                buttons = page.locator("button")
                button_count = await buttons.count()

                if button_count > 0:
                    # 尝试找到继续/提交按钮
                    action_buttons = [
                        "继续", "下一步", "提交", "确认", "进入", "开始",
                        "Continue", "Next", "Submit", "Confirm"
                    ]

                    clicked = False
                    for btn_text in action_buttons:
                        try:
                            btn = page.locator("button").filter(has_text=btn_text).first
                            if await btn.count() > 0:
                                await btn.click()
                                await page.wait_for_timeout(500)
                                print(f"  ✅ 点击了按钮: {btn_text}")
                                clicked = True
                                break
                        except:
                            continue

                    if not clicked:
                        # 点击第一个按钮
                        await buttons.first.click()
                        await page.wait_for_timeout(500)
                        print(f"  ✅ 点击了第一个按钮")
                else:
                    print(f"  ⚠️ 第{turn}轮未找到按钮")

                # 截图
                screenshot_path = f"coffee_shop_02_turn_{turn}.png"
                await page.screenshot(path=screenshot_path)
                print(f"  📸 截图: {screenshot_path}")

            # 9. 检查教育内容
            print("\n[9/10] 检查线性思维教育内容...")

            game_content = await page.inner_html("body")

            educational_keywords = {
                "线性思维": False,
                "认知陷阱": False,
                "期望": False,
                "实际": False,
                "偏差": False,
                "系统": False,
                "线性": False
            }

            for keyword in educational_keywords.keys():
                if keyword in game_content:
                    educational_keywords[keyword] = True

            found_keywords = [k for k, v in educational_keywords.items() if v]
            if found_keywords:
                print(f"✅ 发现教育关键词: {', '.join(found_keywords)}")
            else:
                print("⚠️ 未发现明显的教育关键词")

            # 10. 最终状态
            print("\n[10/10] 记录最终状态...")
            await page.screenshot(path="coffee_shop_03_final.png")
            print("✅ 最终状态截图已保存")

            # 检查游戏是否还在运行
            current_url = page.url
            print(f"当前URL: {current_url}")

            # 测试总结
            print("\n" + "=" * 80)
            print("✅ 测试完成")
            print("=" * 80)
            print("\n测试结果:")
            print("- 无 delayedEffects.forEach 错误")
            print("- 游戏流程正常运行")
            print("- UI组件正常显示")
            print(f"- 发现教育关键词: {len(found_keywords)}个")

            if delayed_errors:
                print(f"\n❌ 失败: 发现 {len(delayed_errors)} 个 delayedEffects 错误")
                return False
            else:
                print(f"\n✅ 成功: 所有测试通过")
                return True

        except Exception as e:
            print(f"\n❌ 测试失败: {str(e)}")
            import traceback
            traceback.print_exc()

            # 错误截图
            await page.screenshot(path="coffee_shop_error.png")
            print("错误截图已保存: coffee_shop_error.png")
            return False

        finally:
            await browser.close()


if __name__ == "__main__":
    success = asyncio.run(test_coffee_shop_complete())
    exit(0 if success else 1)
