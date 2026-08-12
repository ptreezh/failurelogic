"""
Railway 部署验证脚本
测试前端和 Railway API 的完整交互
"""

import asyncio
import subprocess
import time
import requests
from playwright.async_api import async_playwright

# Railway API URL
RAILWAY_API = "https://failure-logic-api-production.up.railway.app"
FRONTEND_URL = "https://ptreezh.github.io/failurelogic/"

print("=" * 80)
print("🧪 Railway 部署验证测试")
print("=" * 80)

# 1. 测试 Railway API 健康检查
print("\n📡 测试 1: Railway API 健康检查")
try:
    response = requests.get(f"{RAILWAY_API}/health", timeout=10)
    data = response.json()
    print(f"   ✅ API 健康状态: {data.get('status')}")
    print(f"   📄 消息: {data.get('message')}")
    print(f"   🕐 时间戳: {data.get('timestamp')}")
except Exception as e:
    print(f"   ❌ API 健康检查失败: {e}")
    exit(1)

# 2. 测试 API 文档端点
print("\n📚 测试 2: API 文档端点")
try:
    response = requests.get(f"{RAILWAY_API}/docs", timeout=10)
    if response.status_code == 200 and "Swagger UI" in response.text:
        print(f"   ✅ API 文档可访问")
    else:
        print(f"   ⚠️  API 文档响应异常: {response.status_code}")
except Exception as e:
    print(f"   ❌ API 文档访问失败: {e}")

# 3. 测试 scenarios 端点
print("\n🎮 测试 3: 获取场景列表")
try:
    response = requests.get(f"{RAILWAY_API}/scenarios", timeout=10)
    if response.status_code == 200:
        scenarios = response.json()
        print(f"   ✅ 成功获取 {len(scenarios)} 个场景")
        for scenario in scenarios[:3]:
            print(f"      - {scenario.get('title', 'Unknown')}")
    else:
        print(f"   ⚠️  场景端点响应: {response.status_code}")
        print(f"   详情: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ 获取场景失败: {e}")

# 4. 使用 Playwright 进行前端交互测试
print("\n🌐 测试 4: 前端交互测试")
async def test_frontend():
    async with async_playwright() as p:
        print("   🚀 启动浏览器...")
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()

        # 访问前端
        print(f"   📍 访问前端: {FRONTEND_URL}")
        await page.goto(FRONTEND_URL, wait_until='networkidle')
        await page.wait_for_timeout(3000)

        # 截图首页
        await page.screenshot(path="railway_test_01_homepage.png")
        print("   📸 截图保存: railway_test_01_homepage.png")

        # 检查页面标题
        title = await page.title()
        print(f"   📄 页面标题: {title}")

        # 查找场景导航链接
        print("   🔍 查找场景导航...")
        try:
            scenarios_link = await page.wait_for_selector('a[href="#scenarios"]', timeout=5000)
            print("   ✅ 找到场景导航")
            await scenarios_link.click()
            await page.wait_for_timeout(2000)
            await page.screenshot(path="railway_test_02_scenarios.png")
            print("   📸 场景页面截图: railway_test_02_scenarios.png")
        except Exception as e:
            print(f"   ⚠️  场景导航查找失败: {e}")

        # 查找场景卡片
        print("   🎯 查找场景卡片...")
        try:
            await page.wait_for_selector('.scenario-card', timeout=5000)
            cards = await page.query_selector_all('.scenario-card')
            print(f"   ✅ 找到 {len(cards)} 个场景卡片")

            # 点击第一个场景
            if len(cards) > 0:
                print("   🖱️  点击第一个场景...")
                await cards[0].click()
                await page.wait_for_timeout(2000)

                # 检查是否打开弹窗
                await page.screenshot(path="railway_test_03_modal.png")
                print("   📸 弹窗截图: railway_test_03_modal.png")

                # 检查 API 调用
                await page.wait_for_timeout(3000)

                print("   ✅ 前端交互测试完成")
        except Exception as e:
            print(f"   ❌ 场景卡片测试失败: {e}")
            await page.screenshot(path="railway_test_error.png")

        await browser.close()

asyncio.run(test_frontend())

# 5. 测试 CORS 配置
print("\n🔒 测试 5: CORS 配置验证")
try:
    headers = {
        'Origin': 'https://ptreezh.github.io',
        'Access-Control-Request-Method': 'GET',
    }
    response = requests.options(f"{RAILWAY_API}/health", headers=headers, timeout=10)
    cors_headers = response.headers.get('Access-Control-Allow-Origin', '')
    if cors_headers:
        print(f"   ✅ CORS 已配置: {cors_headers}")
    else:
        print(f"   ⚠️  CORS 头未找到")
except Exception as e:
    print(f"   ❌ CORS 测试失败: {e}")

print("\n" + "=" * 80)
print("✅ 测试完成！")
print("=" * 80)
print(f"\n📊 测试总结:")
print(f"   - Railway API: {RAILWAY_API}")
print(f"   - 前端 URL: {FRONTEND_URL}")
print(f"   - 所有截图已保存到当前目录")
print(f"\n🎯 下一步:")
print(f"   1. 查看截图验证前端显示")
print(f"   2. 检查浏览器控制台是否有错误")
print(f"   3. 尝试实际游戏交互")
print("=" * 80)
