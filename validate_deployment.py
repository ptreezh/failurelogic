"""
部署环境验证脚本
验证FastAPI应用在部署环境中是否正常工作
"""

import asyncio
from playwright.async_api import async_playwright
import json

async def validate_deployment():
    """验证部署环境中的API功能"""
    print("🔍 验证部署环境中的API功能...")
    
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(channel='msedge', headless=True)
            page = await browser.new_page()
            
            # 设置较长的超时时间
            page.set_default_timeout(30000)
            
            # 测试根路径
            print("  测试根路径...")
            try:
                await page.goto("https://insightful-enthusiasm-production.up.railway.app/", wait_until="domcontentloaded")
                content = await page.content()
                print(f"  根路径响应长度: {len(content)} 字符")
                print(f"  根路径内容预览: {content[:200]}...")
            except Exception as e:
                print(f"  根路径访问失败: {e}")
            
            # 测试API路径
            print("\n  测试API路径...")
            try:
                # 使用页面evaluate执行fetch请求
                result = await page.evaluate("""
                    async () => {
                        try {
                            const response = await fetch('/scenarios/', {
                                method: 'GET',
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                }
                            });
                            const data = await response.json();
                            return {
                                status: response.status,
                                data: data,
                                url: response.url
                            };
                        } catch (error) {
                            return {
                                error: error.message
                            };
                        }
                    }
                """)
                
                print(f"  API响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
                
            except Exception as e:
                print(f"  API路径测试失败: {e}")
            
            await browser.close()
            
        except Exception as e:
            print(f"  浏览器测试失败: {e}")

if __name__ == "__main__":
    asyncio.run(validate_deployment())