import asyncio
from playwright.async_api import async_playwright
import sys

async def vercel_login_and_deploy():
    async with async_playwright() as p:
        # 启动Chrome浏览器
        try:
            browser = await p.chromium.launch(channel="chrome", headless=False)
            print("已启动Chrome浏览器")
        except Exception as e:
            print(f"无法启动Chrome浏览器: {e}")
            print("尝试使用默认Chromium浏览器...")
            browser = await p.chromium.launch(headless=False)
            print("已启动Chromium浏览器")
        
        page = await browser.new_page()
        
        # 访问Vercel登录页面
        await page.goto("https://vercel.com/login")
        
        print("Chrome浏览器已打开，请在页面中完成Vercel登录...")
        print("登录成功后，脚本将自动继续...")
        
        # 等待用户登录（最多等待5分钟）
        for i in range(300):  # 300次循环，每次1秒
            await page.wait_for_timeout(1000)  # 等待1秒
            current_url = page.url
            
            # 检查是否已经登录（URL是否已跳转到仪表板）
            if "vercel.com/dashboard" in current_url:
                print("检测到已登录，正在继续...")
                break
        else:
            print("等待登录超时，请手动登录后重新运行脚本")
            await browser.close()
            return
        
        # 访问项目导入页面
        await page.goto("https://vercel.com/new")
        await page.wait_for_timeout(3000)
        
        # 尝试导入Git仓库
        try:
            # 等待页面加载
            await page.wait_for_selector("text=Import Git Repository", timeout=10000)
            
            # 点击导入Git仓库按钮
            import_button = page.locator("text=Import Git Repository")
            if await import_button.count() > 0:
                await import_button.click()
                print("已点击导入Git仓库按钮")
            else:
                # 尝试其他可能的按钮
                github_button = page.locator("text=Continue with GitHub")
                if await github_button.count() > 0:
                    await github_button.click()
                    print("已点击Continue with GitHub按钮")
        except Exception as e:
            print(f"点击导入按钮时出现问题: {e}")
            print("请手动完成导入步骤")
        
        await page.wait_for_timeout(3000)
        
        # 搜索仓库
        try:
            # 等待搜索框出现
            await page.wait_for_selector("input[placeholder*='Search'], input[placeholder*='search']", timeout=10000)
            
            # 搜索我们的仓库
            await page.fill("input[placeholder*='Search'], input[placeholder*='search']", "failurelogic")
            await page.wait_for_timeout(2000)
            
            # 选择仓库
            repo_link = page.locator("a:has-text('ptreezh/failurelogic')")
            if await repo_link.count() > 0:
                await repo_link.click()
                print("已选择仓库: ptreezh/failurelogic")
            else:
                print("未找到仓库，请手动选择")
        except Exception as e:
            print(f"搜索仓库时出现问题: {e}")
            print("请手动完成仓库选择")
        
        await page.wait_for_timeout(5000)
        
        # 等待项目配置页面
        try:
            await page.wait_for_selector("text=Configure Project", timeout=15000)
            print("项目配置页面已加载")
            
            # 等待一段时间让用户查看配置
            await page.wait_for_timeout(3000)
            
            print("自动化流程已完成！")
            print("请在浏览器中检查并完成剩余的部署步骤")
            
        except Exception as e:
            print(f"等待项目配置时出现问题: {e}")
            print("请在浏览器中手动完成部署配置")
        
        # 保持浏览器打开一段时间，让用户完成操作
        print("浏览器将在60秒后自动关闭，如需更多时间请手动操作...")
        await page.wait_for_timeout(60000)
        await browser.close()

if __name__ == "__main__":
    print("开始Vercel自动化部署流程...")
    print("请确保您已连接到互联网")
    asyncio.run(vercel_login_and_deploy())