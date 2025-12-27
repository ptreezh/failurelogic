"""
认知陷阱测试平台 - 用户体验验证脚本
快速验证所有功能是否正常工作
"""

import requests
import webbrowser
import time
import sys
import os

def start_server():
    """
    启动API服务器
    """
    print("🚀 启动认知陷阱测试平台API服务器...")
    import subprocess
    import threading
    
    def run_server():
        try:
            # 检查是否端口已被占用
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = s.connect_ex(('localhost', 8000))
            if result == 0:
                print("⚠️  端口8000已被占用，请先停止其他服务")
                s.close()
                return False
            s.close()
            
            # 启动服务器
            os.chdir("api-server")
            subprocess.run([sys.executable, "start.py", "8000"], check=False)
        except Exception as e:
            print(f"❌ 服务器启动失败: {e}")
            return False
    
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()
    
    # 等待服务器启动
    time.sleep(8)
    return True


def verify_api_endpoints():
    """
    验证所有API端点功能
    """
    print("\\n🔍 验证API端点功能...")
    
    endpoints = [
        ("/", "主页"),
        ("/scenarios/", "场景列表"),
        ("/api/exponential/questions", "指数增长问题"),
        ("/api/compound/questions", "复利问题"),
        ("/api/historical/scenarios", "历史案例"),
        ("/api/game/scenarios", "推理游戏")
    ]
    
    success_count = 0
    total_count = len(endpoints)
    
    for path, name in endpoints:
        try:
            response = requests.get(f"http://localhost:8000{path}", timeout=10)
            if response.status_code == 200:
                print(f"✅ {name} - 正常运行")
                success_count += 1
            else:
                print(f"❌ {name} - 状态码: {response.status_code}")
        except Exception as e:
            print(f"❌ {name} - 连接失败: {e}")
    
    return success_count == total_count


def verify_calculations():
    """
    验证关键计算功能
    """
    print("\\n🧮 验证计算逻辑...")
    
    calc_success = True
    
    # 测试指数计算
    try:
        resp = requests.post(
            "http://localhost:8000/api/exponential/calculate/exponential",
            json={"base": 2, "exponent": 10},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("result") == 1024:
                print("✅ 指数计算: 2^10 = 1024 (正确)")
            else:
                print(f"❌ 指数计算结果异常: 期望1024, 得到{data.get('result')}")
                calc_success = False
        else:
            print(f"❌ 指数计算端点返回: {resp.status_code}")
            calc_success = False
    except Exception as e:
        print(f"❌ 指数计算功能异常: {e}")
        calc_success = False
    
    # 测试兔子增长模拟
    try:
        resp = requests.post(
            "http://localhost:8000/api/exponential/calculate/rabbit-growth",
            json={"starting_rabbits": 2, "years": 11, "growth_multiplier": 5},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            expected = 2 * (5 ** 11)  # 2 * 48,828,125 = 97,656,250
            actual = data.get("final_population", 0)
            if abs(actual - expected) < 1:
                print(f"✅ 兔子增长模拟: 2只11年翻5倍 = {actual:,}只 (正确)")
            else:
                print(f"❌ 兔子增长模拟异常: 期望{expected:,}, 得到{actual:,}")
                calc_success = False
        else:
            print(f"❌ 兔子增长端点返回: {resp.status_code}")
            calc_success = False
    except Exception as e:
        print(f"❌ 兔子增长模拟功能异常: {e}")
        calc_success = False
    
    return calc_success


def main():
    """
    主函数 - 启动服务器并验证功能
    """
    print("🎯 认知陷阱测试平台 - 用户体验准备")
    print("=" * 50)
    print("📋 正在启动服务器并验证功能...")
    
    # 启动服务器
    if not start_server():
        print("❌ 服务器启动失败")
        return False
    
    # 等待服务器准备就绪
    time.sleep(5)
    
    # 验证API端点
    api_ok = verify_api_endpoints()
    
    # 验证计算逻辑
    calc_ok = verify_calculations()
    
    print("\\n" + "=" * 50)
    print("📱 您现在可以体验认知陷阱测试平台:")
    print("🌐 访问: http://localhost:8000")
    print()
    print("🎯 已实现的交互场景:")
    print("   🔢 指数增长误区测试 (2^200规模问题)")
    print("   💰 复利思维陷阱测试 (银行利息比较)")
    print("   📜 历史决策失败重现 (挑战者号案例)")
    print("   🎮 互动推理游戏 (暴露思维局限)")
    print()
    print("💡 探索这些认知陷阱，发现思维局限:")
    print("   - 2^200粒米需要多大仓库？")
    print("   - 2只兔子每年翻5倍多久达到100亿只？") 
    print("   - 10万本金30年8%复利变成多少？")
    print("   - 挑战者号发射决策中的认知偏差")
    print()
    print("🔔 享受您的认知探索之旅！")
    
    # 自动打开浏览器
    try:
        webbrowser.open("http://localhost:8000")
        print("\\n✅ 浏览器已自动打开平台主页")
    except Exception as e:
        print(f"\\n⚠️  浏览器自动打开失败: {e}")
        print("   手动访问: http://localhost:8000")
    
    return api_ok and calc_ok


if __name__ == "__main__":
    success = main()
    if success:
        print("\\n🎉 平台已准备就绪，开始您的认知陷阱探索之旅！")
    else:
        print("\\n⚠️  部分功能验证失败，但平台仍可体验")