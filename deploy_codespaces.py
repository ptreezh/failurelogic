#!/usr/bin/env python3
"""
认知陷阱平台部署脚本
用于在GitHub Codespaces中部署应用
"""

import subprocess
import sys
import os
import time
import threading
import requests
import socket
from pathlib import Path

def check_port(port):
    """检查端口是否可用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

def install_dependencies():
    """安装依赖"""
    print("1. 安装依赖...")
    
    # 进入api-server目录
    os.chdir('api-server')
    
    # 检查是否存在requirements.txt
    req_file = Path("requirements.txt")
    if req_file.exists():
        print("安装requirements.txt中的依赖...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    else:
        print("安装默认依赖...")
        dependencies = [
            "fastapi", 
            "uvicorn[standard]", 
            "python-multipart", 
            "requests", 
            "pydantic[email]", 
            "numpy",
            "pandas"
        ]
        subprocess.run([sys.executable, "-m", "pip", "install"] + dependencies, check=True)
    
    print("✅ 依赖安装完成")

def start_server(port=8000):
    """启动服务器"""
    print(f"2. 启动认知陷阱平台服务在端口 {port}...")
    
    # 使用uvicorn启动服务
    cmd = [
        sys.executable, "-m", "uvicorn", 
        "start:app", 
        "--host", "0.0.0.0", 
        "--port", str(port),
        "--reload"
    ]
    
    process = subprocess.Popen(cmd)
    
    # 等待服务启动
    print("等待服务启动...")
    time.sleep(3)
    
    # 检查服务是否运行
    try:
        response = requests.get(f"http://localhost:{port}/health", timeout=10)
        if response.status_code in [200, 404]:  # 200是健康检查，404表示路由但无此端点
            print(f"✅ 服务在 http://localhost:{port} 启动成功")
            return process
        else:
            print(f"⚠️  服务响应状态码: {response.status_code}")
            return process
    except requests.exceptions.RequestException as e:
        print(f"⚠️  服务启动检查失败: {e}")
        return process

def check_service_availability(port=8000):
    """检查服务可用性"""
    print("3. 检查服务可用性...")
    
    endpoints = [
        f"http://localhost:{port}/docs",
        f"http://localhost:{port}/health", 
        f"http://localhost:{port}/scenarios/"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(endpoint, timeout=5)
            print(f"✅ {endpoint} - 状态码: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"⚠️  {endpoint} - 错误: {e}")

def main():
    """主函数"""
    print("===================================")
    print("认知陷阱平台部署脚本")
    print("GitHub Codespaces 部署")
    print("===================================")
    
    # 检查当前目录
    current_dir = Path.cwd()
    if not (current_dir / "api-server" / "start.py").exists():
        print("错误: 未找到 api-server/start.py 文件")
        sys.exit(1)
    
    print(f"当前目录: {current_dir}")
    
    # 设置环境变量
    os.environ["PYTHONPATH"] = str(current_dir / "api-server")
    os.environ["DEBUG"] = "True"
    
    try:
        # 安装依赖
        install_dependencies()
        
        # 启动服务器
        port = int(os.environ.get("PORT", 8000))
        server_process = start_server(port)
        
        # 检查服务可用性
        time.sleep(3)  # 给服务一些启动时间
        check_service_availability(port)
        
        print("===================================")
        print("部署完成!")
        print("认知陷阱平台已启动")
        print("")
        print(f"访问地址:")
        print(f"- API文档: http://localhost:{port}/docs")
        print(f"- 健康检查: http://localhost:{port}/health")
        print(f"- 场景列表: http://localhost:{port}/scenarios/")
        print("")
        print("服务正在运行...")
        print(f"进程ID: {server_process.pid}")
        print("===================================")
        
        # 保持服务运行
        try:
            server_process.wait()
        except KeyboardInterrupt:
            print("\n停止服务...")
            server_process.terminate()
            server_process.wait()
            print("服务已停止")
        
    except Exception as e:
        print(f"❌ 部署过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()