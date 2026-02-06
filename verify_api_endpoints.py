#!/usr/bin/env python3
"""
API 端点验证脚本
验证所有 API 端点是否正确注册并可访问
"""

import requests
import sys
import time
from typing import List, Tuple

def check_endpoint(base_url: str, endpoint: str, method: str = "GET", payload: dict = None) -> Tuple[bool, str, float]:
    """
    检查单个端点
    返回: (是否成功, 响应消息, 响应时间)
    """
    url = f"{base_url}{endpoint}"
    start_time = time.time()
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=payload or {}, timeout=10)
        else:
            return False, f"不支持的方法: {method}", 0
            
        response_time = time.time() - start_time
        
        if response.status_code in [200, 201, 400, 404, 422]:  # 400和422也是正常的API响应
            return True, f"HTTP {response.status_code}", response_time
        else:
            return False, f"HTTP {response.status_code}", response_time
            
    except requests.exceptions.Timeout:
        return False, "请求超时", 10.0
    except requests.exceptions.ConnectionError:
        return False, "连接错误", 0
    except Exception as e:
        return False, str(e), 0

def validate_all_endpoints(base_url: str) -> List[Tuple[str, str, str, float]]:
    """
    验证所有端点
    返回: [(端点, 方法, 结果, 响应时间), ...]
    """
    endpoints = [
        ("/health", "GET", None),
        ("/scenarios/", "GET", None),
        ("/api/exponential/questions", "GET", None),
        ("/api/exponential/advanced-questions", "GET", None),
        ("/api/exponential/calculate/exponential", "POST", {"base": 2, "exponent": 10}),
        ("/api/exponential/calculate/granary", "POST", {}),
        ("/api/exponential/calculate/rabbit-growth", "POST", {}),
        ("/api/exponential/calculate/complex-system-failure", "POST", {}),
        ("/api/exponential/calculate/nano-replication", "POST", {}),
        ("/api/exponential/calculate/social-network-growth", "POST", {}),
        ("/api/exponential/calculate/compare-linear-exponential", "POST", {"initial_amount": 100, "rate_percent": 10, "time_periods": 10}),
        ("/api/compound/questions", "GET", None),
        ("/api/compound/advanced-questions", "GET", None),
        ("/api/compound/calculate/interest", "POST", {"principal": 10000, "annual_rate": 8, "time_years": 30, "compounding_frequency": 1}),
        ("/api/compound/calculate/with-contributions", "POST", {}),
        ("/api/compound/calculate/with-inflation", "POST", {}),
        ("/api/compound/calculate/tax-affected", "POST", {}),
        ("/api/compound/calculate/variable-rates", "POST", {"rates_schedule": "5,6,7,8,9"}),
        ("/api/compound/calculate/double-compound", "POST", {}),
        ("/api/historical/scenarios", "GET", None),
        ("/api/historical/advanced-scenarios", "GET", None),
        ("/api/game/scenarios", "GET", None),
        ("/api/game/advanced-scenarios", "GET", None),
        ("/api/results/submit", "POST", {"questionId": "test", "userEstimation": 1000, "questionType": "exponential"}),
        ("/api/results/test-user/test-session", "GET", None),
        ("/api/explanations/linear_thinking", "GET", None),
        ("/api/explanations/exponential_misconception", "GET", None),
        ("/api/explanations/compound_interest_misunderstanding", "GET", None),
        ("/api/interactive/health", "GET", None),
        ("/api/interactive/chat", "POST", {"user_input": "hello", "test_type": "general"}),
        ("/api/interactive/analyze-decision", "POST", {"user_input": "I think the first option is best because it's the most popular"}),
        ("/api/interactive/guided-tour", "GET", None),
    ]
    
    results = []
    print(f"🔍 开始验证 {len(endpoints)} 个 API 端点...")
    print(f"🌐 目标 URL: {base_url}\n")
    
    for i, (endpoint, method, payload) in enumerate(endpoints, 1):
        print(f"[{i:2d}/{len(endpoints)}] 检查 {method} {endpoint}...", end="", flush=True)
        
        success, message, response_time = check_endpoint(base_url, endpoint, method, payload)
        
        if success:
            status = "✅"
        else:
            status = "❌"
            
        results.append((f"{method} {endpoint}", status, message, response_time))
        
        print(f" {status} {message} ({response_time:.2f}s)")
    
    return results

def print_summary(results: List[Tuple[str, str, str, float]]):
    """打印验证摘要"""
    total = len(results)
    successful = len([r for r in results if r[1] == "✅"])
    failed = total - successful
    
    print(f"\n📊 验证摘要:")
    print(f"   总端点数: {total}")
    print(f"   成功: {successful}")
    print(f"   失败: {failed}")
    print(f"   成功率: {(successful/total)*100:.1f}%")
    
    if failed > 0:
        print(f"\n❌ 失败的端点:")
        for endpoint, status, message, response_time in results:
            if status == "❌":
                print(f"   {endpoint} - {message}")

def main():
    # 默认测试本地服务器
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:8000"  # 默认本地测试
    
    print("🧪 API 端点验证工具")
    print("="*60)
    
    try:
        results = validate_all_endpoints(base_url)
        print_summary(results)
        
        # 如果有失败的端点，返回非零退出码
        failed = len([r for r in results if r[1] == "❌"])
        return 1 if failed > 0 else 0
        
    except KeyboardInterrupt:
        print("\n⚠️  验证被用户中断")
        return 1
    except Exception as e:
        print(f"\n💥 验证过程中发生错误: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())