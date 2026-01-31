import asyncio
import threading
import time
from playwright.async_api import async_playwright
import subprocess
import requests
import signal
import sys
import os

# 全局变量存储服务进程
backend_process = None
frontend_process = None

def start_backend_service():
    """启动后端服务"""
    global backend_process
    try:
        backend_process = subprocess.Popen(
            ["python", "api-server/start.py"],
            cwd=r"D:\AIDevelop\failureLogic",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("✅ 后端服务启动中...")
        time.sleep(3)  # 等待服务启动
        return True
    except Exception as e:
        print(f"❌ 启动后端服务失败: {e}")
        return False

def start_frontend_service():
    """启动前端服务"""
    global frontend_process
    try:
        frontend_process = subprocess.Popen(
            ["npm", "start"],
            cwd=r"D:\AIDevelop\failureLogic",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("✅ 前端服务启动中...")
        time.sleep(3)  # 等待服务启动
        return True
    except Exception as e:
        print(f"❌ 启动前端服务失败: {e}")
        return False

def check_services():
    """检查服务是否正常运行"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ 后端服务运行正常")
        else:
            print("❌ 后端服务响应异常")
            return False
    except Exception as e:
        print(f"❌ 后端服务不可达: {e}")
        return False
    
    try:
        response = requests.get("http://localhost:8080/", timeout=5)
        if response.status_code == 200:
            print("✅ 前端服务运行正常")
            return True
        else:
            print("❌ 前端服务响应异常")
            return False
    except Exception as e:
        print(f"❌ 前端服务不可达: {e}")
        return False

async def run_playwright_test(agent_id):
    """使用Playwright进行用户交互演示"""
    print(f"🤖 子智能体 {agent_id} 开始执行任务...")
    
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=False)  # 设置为False以便观看演示
        page = await browser.new_page()
        
        # 访问前端应用
        print(f"🤖 子智能体 {agent_id}: 正在访问前端应用...")
        await page.goto("http://localhost:8080/")
        await page.wait_for_timeout(2000)
        
        print(f"🤖 子智能体 {agent_id}: 页面加载完成")
        
        # 点击"开始认知之旅"
        try:
            start_button = page.locator("#start-journey")
            await start_button.click()
            await page.wait_for_timeout(2000)
            print(f"🤖 子智能体 {agent_id}: 已点击'开始认知之旅'")
        except Exception as e:
            print(f"🤖 子智能体 {agent_id}: 点击开始按钮失败 - {e}")
        
        # 点击"场景"导航
        try:
            scenarios_link = page.locator('button[data-page="scenarios"]')
            await scenarios_link.click()
            await page.wait_for_timeout(2000)
            print(f"🤖 子智能体 {agent_id}: 已导航到场景页面")
        except Exception as e:
            print(f"🤖 子智能体 {agent_id}: 导航到场景页面失败 - {e}")
        
        # 选择一个场景（例如咖啡店场景）
        try:
            coffee_shop_button = page.locator('button:has-text("开始挑战")').first
            await coffee_shop_button.click()
            await page.wait_for_timeout(3000)
            print(f"🤖 子智能体 {agent_id}: 已开始场景")
        except Exception as e:
            print(f"🤖 子智能体 {agent_id}: 开始场景失败 - {e}")
        
        # 进行第一个决策
        try:
            decision_button = page.locator('button.decision-btn').first
            if await decision_button.count() > 0:
                await decision_button.click()
                await page.wait_for_timeout(2000)
                print(f"🤖 子智能体 {agent_id}: 已做出第一个决策")
        except Exception as e:
            print(f"🤖 子智能体 {agent_id}: 做出决策失败 - {e}")
        
        print(f"🤖 子智能体 {agent_id} 完成任务!")
        
        # 保持浏览器打开一段时间以便观察
        await page.wait_for_timeout(3000)
        
        # 关闭浏览器
        await browser.close()

async def run_concurrent_agents(num_agents=3):
    """运行并发子智能体"""
    print(f"🚀 启动 {num_agents} 个并发子智能体...")
    
    # 创建并发任务
    tasks = []
    for i in range(num_agents):
        task = asyncio.create_task(run_playwright_test(i+1))
        tasks.append(task)
        await asyncio.sleep(1)  # 错开启动时间
    
    # 等待所有任务完成
    await asyncio.gather(*tasks)
    print("🎉 所有子智能体任务完成!")

def cleanup_services():
    """清理服务进程"""
    global backend_process, frontend_process
    try:
        if backend_process:
            backend_process.terminate()
            backend_process.wait(timeout=5)
            print("✅ 后端服务已停止")
    except:
        try:
            backend_process.kill()
            print("✅ 后端服务已强制停止")
        except:
            pass
    
    try:
        if frontend_process:
            frontend_process.terminate()
            frontend_process.wait(timeout=5)
            print("✅ 前端服务已停止")
    except:
        try:
            frontend_process.kill()
            print("✅ 前端服务已强制停止")
        except:
            pass

def signal_handler(sig, frame):
    """处理中断信号"""
    print('\n🚨 收到中断信号，正在清理...')
    cleanup_services()
    sys.exit(0)

if __name__ == "__main__":
    # 注册信号处理器
    signal.signal(signal.SIGINT, signal_handler)
    
    print("🎯 开始验证整个系统...")
    
    try:
        # 启动后端服务
        if not start_backend_service():
            print("❌ 无法启动后端服务")
            sys.exit(1)
        
        # 启动前端服务
        if not start_frontend_service():
            print("❌ 无法启动前端服务")
            sys.exit(1)
        
        # 等待服务启动
        time.sleep(5)
        
        # 检查服务状态
        if not check_services():
            print("❌ 服务未正常运行")
            cleanup_services()
            sys.exit(1)
        
        print("\n🚀 开始并发子智能体演示...")
        
        # 运行并发智能体
        asyncio.run(run_concurrent_agents(3))
        
        print("\n✅ 演示完成!")
        
    except KeyboardInterrupt:
        print('\n🚨 用户中断操作')
    except Exception as e:
        print(f"\n❌ 执行过程中发生错误: {e}")
    finally:
        # 清理服务
        cleanup_services()