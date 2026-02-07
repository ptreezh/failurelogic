"""
API服务器验证脚本
验证API服务器是否正确启动并注册了路由
"""

import asyncio
from playwright.async_api import async_playwright
import json

async def validate_api_server():
    """验证API服务器"""
    print("🔍 验证API服务器...")
    
    async with async_playwright() as p:
        try:
            # 启动浏览器
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # 访问API文档端点
            print("  访问 /docs 端点...")
            try:
                await page.goto("https://insightful-enthusiasm-production.up.railway.app/docs", wait_until="domcontentloaded")
                content = await page.content()
                if "swagger" in content.lower() or "fastapi" in content.lower():
                    print("  ✅ /docs 端点正常工作")
                else:
                    print("  ❌ /docs 端点未返回预期内容")
            except Exception as e:
                print(f"  ❌ /docs 端点访问失败: {e}")
            
            # 访问根端点
            print("  访问 / 端点...")
            try:
                await page.goto("https://insightful-enthusiasm-production.up.railway.app/", wait_until="domcontentloaded")
                content = await page.content()
                if "status" in content.lower():
                    print("  ✅ / 端点正常工作")
                else:
                    print("  ❌ / 端点未返回预期内容")
            except Exception as e:
                print(f"  ❌ / 端点访问失败: {e}")
            
            await browser.close()
            
        except Exception as e:
            print(f"❌ API验证失败: {e}")

if __name__ == "__main__":
    asyncio.run(validate_api_server())