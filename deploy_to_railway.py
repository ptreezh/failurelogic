"""
Railway 自动化部署脚本
一键部署 Failure Logic 项目到 Railway
"""

import os
import sys
import subprocess
import json
import time
from pathlib import Path

class RailwayDeployer:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.api_server_dir = self.project_root / "api-server"
        self.required_files = [
            "railway.json",
            "nixpacks.toml",
            "api-server/requirements.txt",
            "api-server/start.py"
        ]
    
    def check_prerequisites(self):
        """检查部署先决条件"""
        print("🔍 检查部署先决条件...")
        
        # 检查 Railway CLI
        try:
            result = subprocess.run(["railway", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"   ✅ Railway CLI 已安装: {result.stdout.strip()}")
            else:
                print("   ❌ Railway CLI 未正确安装")
                return False
        except FileNotFoundError:
            print("   ❌ Railway CLI 未安装")
            print("   💡 安装命令: npm i -g @railway/cli")
            return False
        
        # 检查必要文件
        all_files_exist = True
        for file_path in self.required_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                print(f"   ✅ {file_path} 存在")
            else:
                print(f"   ❌ {file_path} 不存在")
                all_files_exist = False
        
        # 检查 Git
        try:
            subprocess.run(["git", "--version"], capture_output=True, check=True)
            print("   ✅ Git 已安装")
        except:
            print("   ❌ Git 未安装")
            return False
        
        # 检查是否在 Git 仓库中
        if (self.project_root / ".git").exists():
            print("   ✅ 项目在 Git 仓库中")
        else:
            print("   ❌ 项目不在 Git 仓库中")
            return False
        
        return all_files_exist
    
    def login_to_railway(self):
        """登录到 Railway"""
        print("\n🔐 检查 Railway 登录状态...")
        
        try:
            result = subprocess.run(
                ["railway", "whoami"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
            
            if result.returncode == 0:
                print(f"   ✅ 已登录: {result.stdout.strip()}")
                return True
            else:
                print("   ⚠️  未登录到 Railway")
                print("\n📝 请运行以下命令登录:")
                print("   railway login")
                print("\n   或使用浏览器登录:")
                print("   railway login --browser")
                return False
        except Exception as e:
            print(f"   ❌ 检查登录状态时出错: {e}")
            return False
    
    def create_railway_project(self):
        """创建 Railway 项目"""
        print("\n🚀 创建 Railway 项目...")
        
        # 检查是否已有 Railway 项目
        try:
            result = subprocess.run(
                ["railway", "status"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
            
            if result.returncode == 0 and "Project:" in result.stdout:
                project_name = result.stdout.split("Project:")[1].split("\n")[0].strip()
                print(f"   ✅ 已连接到 Railway 项目: {project_name}")
                return True
        except:
            pass
        
        # 创建新项目
        print("   创建新的 Railway 项目...")
        
        try:
            result = subprocess.run(
                ["railway", "init", "--name", "failure-logic-api", "--description", "Failure Logic 认知陷阱教育平台 API"],
                capture_output=True,
                text=True,
                cwd=self.project_root,
                input="\n"  # 确认创建
            )
            
            if result.returncode == 0:
                print("   ✅ Railway 项目创建成功")
                return True
            else:
                print(f"   ❌ 创建项目失败: {result.stderr}")
                return False
        except Exception as e:
            print(f"   ❌ 创建项目时出错: {e}")
            return False
    
    def configure_environment(self):
        """配置环境变量"""
        print("\n⚙️  配置环境变量...")
        
        env_vars = {
            "PYTHON_VERSION": "3.12",
            "PORT": "8000",
            "PYTHONPATH": "/app/api-server"
        }
        
        for key, value in env_vars.items():
            try:
                result = subprocess.run(
                    ["railway", "variables", "set", key, value],
                    capture_output=True,
                    text=True,
                    cwd=self.project_root
                )
                
                if result.returncode == 0:
                    print(f"   ✅ 设置 {key}={value}")
                else:
                    print(f"   ⚠️  设置 {key} 失败: {result.stderr}")
            except Exception as e:
                print(f"   ⚠️  设置 {key} 时出错: {e}")
        
        return True
    
    def deploy(self):
        """部署到 Railway"""
        print("\n📦 部署到 Railway...")
        print("   这可能需要几分钟时间...")
        
        try:
            result = subprocess.run(
                ["railway", "up", "--detach"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
            
            if result.returncode == 0:
                print("   ✅ 部署命令已发送")
                print("   📋 部署日志:")
                for line in result.stdout.split("\n"):
                    if line.strip():
                        print(f"      {line}")
                return True
            else:
                print(f"   ❌ 部署失败: {result.stderr}")
                return False
        except Exception as e:
            print(f"   ❌ 部署时出错: {e}")
            return False
    
    def check_deployment_status(self):
        """检查部署状态"""
        print("\n🔍 检查部署状态...")
        
        try:
            result = subprocess.run(
                ["railway", "status"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
            
            if result.returncode == 0:
                print("   📋 部署状态:")
                for line in result.stdout.split("\n"):
                    if line.strip():
                        print(f"      {line}")
                
                # 检查部署URL
                if "URL:" in result.stdout:
                    url = result.stdout.split("URL:")[1].split("\n")[0].strip()
                    print(f"\n   🌐 部署URL: {url}")
                    print(f"   📝 请将此URL配置到前端API配置中")
                    return url
                return True
            else:
                print(f"   ❌ 检查状态失败: {result.stderr}")
                return False
        except Exception as e:
            print(f"   ❌ 检查状态时出错: {e}")
            return False
    
    def update_frontend_config(self, api_url):
        """更新前端API配置"""
        print("\n📝 更新前端API配置...")
        
        config_file = self.project_root / "assets" / "js" / "api-config-manager.js"
        
        if not config_file.exists():
            print(f"   ❌ 配置文件不存在: {config_file}")
            return False
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 添加Railway端点到配置中
            if "railway:" not in content:
                # 找到API_ENDPOINTS定义的位置
                if "const API_ENDPOINTS" in content:
                    # 添加Railway配置
                    new_config = content.replace(
                        "const API_ENDPOINTS = {",
                        f"const API_ENDPOINTS = {{\n  railway: '{api_url}',"
                    )
                    
                    with open(config_file, 'w', encoding='utf-8') as f:
                        f.write(new_config)
                    
                    print(f"   ✅ 已添加 Railway API 配置")
                    print(f"   📄 文件: {config_file}")
                    return True
                else:
                    print(f"   ⚠️  无法找到 API_ENDPOINTS 定义")
                    return False
            else:
                print(f"   ℹ️  Railway 配置已存在")
                return True
        except Exception as e:
            print(f"   ❌ 更新配置时出错: {e}")
            return False
    
    def run_full_deployment(self):
        """运行完整部署流程"""
        print("=" * 80)
        print("🚀 Failure Logic - Railway 自动化部署")
        print("=" * 80)
        print(f"项目路径: {self.project_root}")
        print(f"API 服务器路径: {self.api_server_dir}")
        print("=" * 80)
        
        # 步骤1: 检查先决条件
        if not self.check_prerequisites():
            print("\n❌ 先决条件检查失败，请解决上述问题后重试")
            return False
        
        # 步骤2: 登录检查
        if not self.login_to_railway():
            response = input("\n是否继续部署？(y/N): ")
            if response.lower() != 'y':
                return False
        
        # 步骤3: 创建/连接项目
        if not self.create_railway_project():
            print("\n❌ 项目创建失败")
            return False
        
        # 步骤4: 配置环境变量
        self.configure_environment()
        
        # 步骤5: 部署
        if not self.deploy():
            print("\n❌ 部署失败")
            return False
        
        # 步骤6: 检查状态
        api_url = self.check_deployment_status()
        
        if api_url:
            # 步骤7: 更新前端配置
            self.update_frontend_config(api_url)
            
            print("\n" + "=" * 80)
            print("🎉 部署完成！")
            print("=" * 80)
            print(f"\n📡 API URL: {api_url}")
            print(f"🌐 前端 URL: https://ptreezh.github.io/failurelogic/")
            print("\n⚙️  配置说明:")
            print("   1. Railway 后端已部署")
            print("   2. GitHub Pages 前端已配置")
            print("   3. API 配置已更新")
            print("\n📝 下一步:")
            print("   1. 等待部署完全启动（2-3分钟）")
            print("   2. 访问 Railway 仪表板查看日志")
            print("   3. 测试 API 是否正常工作")
            print("   4. 测试前端与后端的连接")
            print("\n🔧 管理命令:")
            print("   railway logs      # 查看日志")
            print("   railway status    # 查看状态")
            print("   railway variables # 管理环境变量")
            print("   railway connect   # 连接到项目")
            print("=" * 80)
        
        return True
    
    def print_usage_instructions(self):
        """打印使用说明"""
        print("""
Railway 自动化部署脚本 - 使用说明

前置条件:
1. 安装 Railway CLI: npm i -g @railway/cli
2. 注册 Railway 账户: https://railway.app
3. 确保项目在 Git 仓库中
4. 确保所有必要文件存在

使用方法:

1. 交互式部署:
   python deploy_to_railway.py

2. 命令行参数:
   python deploy_to_railway.py --deploy    # 直接部署
   python deploy_to_railway.py --status    # 查看状态
   python deploy_to_railway.py --help      # 查看帮助

部署步骤:
1. 检查先决条件
2. 登录到 Railway
3. 创建/连接 Railway 项目
4. 配置环境变量
5. 部署到 Railway
6. 检查部署状态
7. 更新前端配置

故障排除:
- 如果 Railway CLI 未安装: npm i -g @railway/cli
- 如果未登录: railway login
- 如果部署失败: 检查 railway logs
- 如果 API 无法访问: 检查环境变量

配置说明:
- railway.json: Railway 部署配置
- nixpacks.toml: 构建配置
- api-server/requirements.txt: Python 依赖
- api-server/start.py: 启动脚本
""")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='部署 Failure Logic 到 Railway')
    parser.add_argument('--deploy', action='store_true', help='直接运行完整部署')
    parser.add_argument('--status', action='store_true', help='检查部署状态')
    parser.add_argument('--help-deploy', action='store_true', help='显示部署帮助')
    
    args = parser.parse_args()
    
    deployer = RailwayDeployer()
    
    if args.help_deploy:
        deployer.print_usage_instructions()
    elif args.status:
        deployer.check_deployment_status()
    elif args.deploy:
        deployer.run_full_deployment()
    else:
        # 交互模式
        print("=" * 80)
        print("Railway 自动化部署工具")
        print("=" * 80)
        print("\n选项:")
        print("1. 运行完整部署")
        print("2. 检查部署状态")
        print("3. 显示使用说明")
        print("4. 退出")
        
        choice = input("\n请选择 (1-4): ")
        
        if choice == "1":
            deployer.run_full_deployment()
        elif choice == "2":
            deployer.check_deployment_status()
        elif choice == "3":
            deployer.print_usage_instructions()
        else:
            print("退出")

if __name__ == "__main__":
    main()
