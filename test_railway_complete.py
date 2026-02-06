"""
完整的 Railway 部署验证测试
"""

import asyncio
import requests
from playwright.async_api import async_playwright

RAILWAY_API = "https://failure-logic-api-production.up.railway.app"
FRONTEND_URL = "https://ptreezh.github.io/failurelogic/"

print("=" * 80)
print("🧪 Railway 部署完整验证测试")
print("=" * 80)

# 测试 1: API 健康检查
print("\n📡 测试 1: Railway API 健康检查")
try:
    response = requests.get(f"{RAILWAY_API}/health", timeout=10)
    data = response.json()
    print(f"   ✅ API 状态: {data.get('status')}")
    print(f"   📄 消息: {data.get('message')}")
except Exception as e:
    print(f"   ❌ 失败: {e}")

# 测试 2: 前端交互
async def test_frontend_interaction():
    async with async_playwright() as p:
        print("\n🌐 测试 2: 前端交互测试")
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()

        # 监听控制台和 API 请求
        api_requests = []
        def handle_request(request):
            if RAILWAY_API in request.url:
                api_requests.append({
                    'url': request.url,
                    'method': request.method
                })
                print(f"   📡 API 请求: {request.method} {request.url}")

        page.on('request', handle_request)

        # 监听响应
        def log_response(response):
            if RAILWAY_API in response.url:
                print(f"   📥 API 响应: {response.status} {response.url}")

        page.on('response', log_response)

        # 访问首页
        print(f"   📍 访问: {FRONTEND_URL}")
        await page.goto(FRONTEND_URL, wait_until='networkidle')
        await page.wait_for_timeout(3000)
        await page.screenshot(path="railway_final_01_home.png")
        print("   📸 截图: railway_final_01_home.png")

        # 点击场景按钮
        print("   🔍 点击场景按钮...")
        try:
            scenarios_btn = await page.wait_for_selector('button[data-page="scenarios"]', timeout=5000)
            await scenarios_btn.click()
            await page.wait_for_timeout(3000)
            await page.screenshot(path="railway_final_02_scenarios.png")
            print("   ✅ 场景页面加载成功")
            print("   📸 截图: railway_final_02_scenarios.png")
        except Exception as e:
            print(f"   ❌ 场景按钮点击失败: {e}")

        # 查找场景卡片
        print("   🎯 查找场景卡片...")
        try:
            await page.wait_for_selector('.scenario-card', timeout=5000)
            cards = await page.query_selector_all('.scenario-card')
            print(f"   ✅ 找到 {len(cards)} 个场景")

            # 点击第一个场景
            if len(cards) > 0:
                print("   🖱️  点击第一个场景...")
                await cards[0].click()
                await page.wait_for_timeout(3000)

                # 截图弹窗
                await page.screenshot(path="railway_final_03_modal.png", full_page=True)
                print("   📸 弹窗截图: railway_final_03_modal.png")

                # 检查弹窗是否打开
                modal = await page.query_selector('.game-modal')
                if modal:
                    print("   ✅ 游戏弹窗已打开")
                else:
                    print("   ⚠️  游戏弹窗未找到")

        except Exception as e:
            print(f"   ❌ 场景卡片测试失败: {e}")

        # 总结 API 请求
        print(f"\n   📊 API 请求统计:")
        print(f"      - 总请求数: {len(api_requests)}")
        for req in api_requests[:5]:
            print(f"      - {req['method']} {req['url']}")
        if len(api_requests) == 0:
            print("      ⚠️  未检测到 Railway API 请求")

        # 等待用户查看
        print("\n   ⏳ 浏览器将在 10 秒后关闭...")
        await page.wait_for_timeout(10000)

        await browser.close()

asyncio.run(test_frontend_interaction())

print("\n" + "=" * 80)
print("✅ 测试完成！")
print("=" * 80)
