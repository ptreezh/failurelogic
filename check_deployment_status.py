"""
检查GitHub Pages部署状态
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import time

async def check_deployment_status():
    """检查部署状态"""
    print("🚀 检查GitHub Pages部署状态")
    print("=" * 70)
    print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    url = "https://ptreezh.github.io/failurelogic/"
    max_retries = 10
    retry_interval = 30  # 30秒检查一次
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=True)
        page = await browser.new_page()
        
        try:
            for attempt in range(1, max_retries + 1):
                print(f"\n📡 检查尝试 {attempt}/{max_retries}")
                print(f"⏰ 时间: {datetime.now().strftime('%H:%M:%S')}")
                
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    await page.wait_for_timeout(2000)
                    
                    # 检查页面标题
                    title = await page.title()
                    print(f"📄 页面标题: {title}")
                    
                    # 检查关键元素
                    scenarios_nav = await page.locator("[data-page='scenarios']").count()
                    print(f"🎯 场景导航元素: {'✅ 存在' if scenarios_nav > 0 else '❌ 不存在'}")
                    
                    if scenarios_nav > 0:
                        # 导航到场景页面
                        await page.click("[data-page='scenarios']")
                        await page.wait_for_timeout(2000)
                        
                        # 检查场景卡片
                        scenario_cards = await page.locator(".scenario-card").count()
                        print(f"📊 场景卡片数量: {scenario_cards}")
                        
                        if scenario_cards > 0:
                            print(f"\n🎉 部署成功！")
                            print(f"✅ 网站可正常访问")
                            print(f"✅ 场景页面加载正常")
                            print(f"✅ 找到 {scenario_cards} 个场景卡片")
                            
                            # 测试打开一个场景
                            print(f"\n🧪 测试打开场景...")
                            await page.locator(".scenario-card").first.click()
                            await page.wait_for_timeout(3000)
                            
                            modal_visible = await page.locator("#game-modal").is_visible()
                            print(f"   弹窗打开: {'✅ 成功' if modal_visible else '❌ 失败'}")
                            
                            if modal_visible:
                                print(f"\n💡 部署验证完成！")
                                print(f"   网站URL: {url}")
                                print(f"   部署时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                                print(f"   状态: ✅ 在线并正常运行")
                                
                                return True
                            else:
                                print(f"   ⚠️  弹窗功能可能需要进一步验证")
                        else:
                            print(f"   ⚠️  场景卡片未加载，可能还在部署中...")
                    else:
                        print(f"   ⚠️  关键元素未找到，可能还在部署中...")
                    
                except Exception as e:
                    print(f"   ❌ 访问失败: {str(e)[:100]}...")
                
                if attempt < max_retries:
                    print(f"\n⏳ 等待 {retry_interval} 秒后重试...")
                    await asyncio.sleep(retry_interval)
            
            print(f"\n❌ 部署检查失败")
            print(f"   网站可能还在部署中，或存在其他问题")
            print(f"   请手动访问 {url} 检查")
            
            return False
            
        finally:
            await browser.close()
            print(f"\n✅ 浏览器已关闭")

if __name__ == "__main__":
    success = asyncio.run(check_deployment_status())
    exit(0 if success else 1)
