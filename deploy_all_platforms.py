#!/usr/bin/env python3
"""
认知陷阱平台 - 统一部署脚本
支持部署到 GitHub Pages、GitHub Codespaces 和 Vercel 的完整自动化部署流程
"""

import os
import sys
import subprocess
import argparse
import asyncio
from pathlib import Path
import shutil
from typing import Dict, List, Optional

def print_header(title: str):
    """打印带格式的标题"""
    print("\n" + "="*60)
    print(f"🚀 {title}")
    print("="*60)

def print_step(step: str):
    """打印步骤信息"""
    print(f"\n📋 {step}")

def print_success(message: str):
    """打印成功信息"""
    print(f"✅ {message}")

def print_warning(message: str):
    """打印警告信息"""
    print(f"⚠️  {message}")

def print_error(message: str):
    """打印错误信息"""
    print(f"❌ {message}")

def run_command(cmd: str, cwd: Optional[str] = None, shell: bool = True) -> tuple:
    """执行命令并返回结果"""
    try:
        result = subprocess.run(
            cmd,
            shell=shell,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=False
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)

def check_prerequisites():
    """检查前置条件"""
    print_step("检查前置条件")
    
    # 检查 Git
    ret, _, _ = run_command("git --version")
    if ret != 0:
        print_error("Git 未安装或未添加到 PATH")
        return False
    else:
        print_success("Git 已安装")
    
    # 检查 Python
    ret, _, _ = run_command("python --version")
    if ret != 0:
        print_error("Python 未安装或未添加到 PATH")
        return False
    else:
        print_success("Python 已安装")
    
    # 检查 Node.js (用于 Vercel CLI)
    ret, _, _ = run_command("node --version")
    if ret != 0:
        print_warning("Node.js 未安装 - Vercel 部署将受限")
    else:
        print_success("Node.js 已安装")
        
    # 检查 Vercel CLI
    ret, _, _ = run_command("vercel --version")
    if ret != 0:
        print_warning("Vercel CLI 未安装 - 运行: npm install -g vercel")
    else:
        print_success("Vercel CLI 已安装")
    
    return True

def deploy_to_github_pages():
    """部署到 GitHub Pages"""
    print_step("部署到 GitHub Pages")
    
    # 检查 GitHub CLI
    ret, _, _ = run_command("gh --version")
    if ret != 0:
        print_error("GitHub CLI 未安装 - 请先安装 GitHub CLI")
        print_warning("访问 https://cli.github.com/ 安装 GitHub CLI")
        return False
    
    # 检查是否在 Git 仓库中
    if not os.path.exists(".git"):
        print_error("当前目录不是 Git 仓库")
        return False
    
    # 检查 .github/workflows/pages.yml 是否存在
    pages_workflow_path = ".github/workflows/pages.yml"
    if not os.path.exists(pages_workflow_path):
        print_warning(f"GitHub Pages 工作流文件不存在: {pages_workflow_path}")
        print_step("创建 GitHub Pages 工作流文件")
        
        # 创建目录结构
        os.makedirs(os.path.dirname(pages_workflow_path), exist_ok=True)
        
        # 创建工作流文件
        pages_workflow_content = """name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
"""
        with open(pages_workflow_path, "w", encoding="utf-8") as f:
            f.write(pages_workflow_content)
        
        print_success(f"已创建 GitHub Pages 工作流文件: {pages_workflow_path}")
    
    # 检查 GitHub Pages 是否已启用
    print_step("检查 GitHub Pages 设置")
    print("请确保在 GitHub 仓库设置中启用了 GitHub Pages")
    print("路径: Settings → Pages → Source → GitHub Actions")
    
    # 提交工作流文件
    print_step("提交 GitHub Pages 工作流文件")
    run_command("git add .github/workflows/pages.yml")
    run_command("git commit -m 'feat: 添加 GitHub Pages 部署工作流'")
    run_command("git push origin main")
    
    print_success("GitHub Pages 部署配置完成")
    print("访问 https://github.com/ptreezh/failurelogic/actions 查看部署状态")
    
    return True

def deploy_to_codespaces():
    """配置 GitHub Codespaces"""
    print_step("配置 GitHub Codespaces")
    
    # 检查 .devcontainer.json 是否存在
    devcontainer_path = ".devcontainer.json"
    if not os.path.exists(devcontainer_path):
        print_warning(f"Codespaces 配置文件不存在: {devcontainer_path}")
        print_step("创建 Codespaces 配置文件")
        
        devcontainer_content = """{
  "name": "认知陷阱平台API",
  "image": "mcr.microsoft.com/devcontainers/python:3.9",
  "features": {
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.9"
    }
  },
  "forwardPorts": [8000],
  "portsAttributes": {
    "8000": {
      "label": "认知陷阱API",
      "onAutoForward": "notify"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance"
      ]
    }
  },
  "postCreateCommand": "pip install -r api-server/requirements.txt",
  "remoteUser": "vscode"
}
"""
        with open(devcontainer_path, "w", encoding="utf-8") as f:
            f.write(devcontainer_content)
        
        print_success(f"已创建 Codespaces 配置文件: {devcontainer_path}")
    
    # 提交配置文件
    print_step("提交 Codespaces 配置文件")
    run_command("git add .devcontainer.json")
    run_command("git commit -m 'feat: 添加 GitHub Codespaces 配置'")
    run_command("git push origin main")
    
    print_success("GitHub Codespaces 配置完成")
    print("访问 https://github.com/ptreezh/failurelogic/codespaces 创建新的 Codespace")
    
    return True

def deploy_to_vercel():
    """部署到 Vercel"""
    print_step("部署到 Vercel")
    
    # 检查 Vercel CLI
    ret, _, _ = run_command("vercel --version")
    if ret != 0:
        print_error("Vercel CLI 未安装")
        print_warning("运行以下命令安装 Vercel CLI:")
        print("npm install -g vercel")
        return False
    
    # 检查 vercel.json 配置文件
    vercel_config_path = "vercel.json"
    if not os.path.exists(vercel_config_path):
        print_warning(f"Vercel 配置文件不存在: {vercel_config_path}")
        print_step("创建 Vercel 配置文件")
        
        vercel_config_content = """{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.py"
    }
  ],
  "functions": {
    "api/index.py": {
      "runtime": "python3.9"
    }
  }
}
"""
        with open(vercel_config_path, "w", encoding="utf-8") as f:
            f.write(vercel_config_content)
        
        print_success(f"已创建 Vercel 配置文件: {vercel_config_path}")
    
    # 检查 api/index.py 是否存在
    api_index_path = "api/index.py"
    if not os.path.exists(api_index_path):
        print_warning(f"Vercel 入口文件不存在: {api_index_path}")
        print_step("创建 Vercel 入口文件")
        
        # 创建 api 目录
        os.makedirs("api", exist_ok=True)
        
        api_index_content = """# Vercel FastAPI入口点
# 从api-server目录导入API应用

import sys
import os

# 添加api-server到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api-server'))

# 导入FastAPI应用
from start import app as fastapi_app

# Vercel需要一个名为app的可调用对象
app = fastapi_app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
"""
        with open(api_index_path, "w", encoding="utf-8") as f:
            f.write(api_index_content)
        
        print_success(f"已创建 Vercel 入口文件: {api_index_path}")
    
    # 登录 Vercel (如果需要)
    print_step("检查 Vercel 登录状态")
    ret, stdout, stderr = run_command("vercel whoami")
    if ret != 0:
        print_warning("未登录 Vercel 账户，需要登录")
        print("运行 'vercel login' 登录您的 Vercel 账户")
        return False
    else:
        print_success(f"已登录 Vercel: {stdout.strip()}")
    
    # 部署到 Vercel
    print_step("部署到 Vercel")
    print("注意: 首次部署需要选择项目和组织")
    ret, stdout, stderr = run_command("vercel --prod", cwd=".")
    
    if ret == 0:
        print_success("Vercel 部署成功!")
        print(f"部署 URL: {stdout}")
        return True
    else:
        print_error(f"Vercel 部署失败: {stderr}")
        return False

def deploy_to_all():
    """部署到所有平台"""
    print_header("开始部署到所有平台")
    
    results = {}
    
    # 部署到 GitHub Pages
    print_header("部署到 GitHub Pages")
    results['github_pages'] = deploy_to_github_pages()
    
    # 部署到 Codespaces
    print_header("配置 GitHub Codespaces")
    results['codespaces'] = deploy_to_codespaces()
    
    # 部署到 Vercel
    print_header("部署到 Vercel")
    results['vercel'] = deploy_to_vercel()
    
    # 输出总结
    print_header("部署总结")
    print(f"GitHub Pages: {'✅ 成功' if results['github_pages'] else '❌ 失败'}")
    print(f"Codespaces: {'✅ 成功' if results['codespaces'] else '❌ 失败'}")
    print(f"Vercel: {'✅ 成功' if results['vercel'] else '❌ 失败'}")
    
    successful_deploys = sum(results.values())
    total_deploys = len(results)
    
    print(f"\n总计: {successful_deploys}/{total_deploys} 个平台部署成功")
    
    if successful_deploys == total_deploys:
        print_success("🎉 所有平台部署成功!")
        return True
    else:
        print_warning("⚠️  部分平台部署失败，请检查错误信息")
        return False

def main():
    parser = argparse.ArgumentParser(description="认知陷阱平台统一部署脚本")
    parser.add_argument(
        "--target",
        choices=["github-pages", "codespaces", "vercel", "all"],
        default="all",
        help="部署目标 (默认: all)"
    )
    parser.add_argument(
        "--skip-prerequisites",
        action="store_true",
        help="跳过前置条件检查"
    )
    
    args = parser.parse_args()
    
    print_header("认知陷阱平台 - 统一部署脚本")
    print(f"目标平台: {args.target}")
    
    # 检查前置条件
    if not args.skip_prerequisites:
        if not check_prerequisites():
            print_error("前置条件检查失败，无法继续部署")
            sys.exit(1)
    
    # 根据目标执行部署
    if args.target == "github-pages":
        success = deploy_to_github_pages()
    elif args.target == "codespaces":
        success = deploy_to_codespaces()
    elif args.target == "vercel":
        success = deploy_to_vercel()
    else:  # all
        success = deploy_to_all()
    
    if success:
        print("\n" + "="*60)
        print("🎉 部署完成!")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("⚠️  部署过程中出现问题，请检查错误信息")
        print("="*60)
        sys.exit(1)

if __name__ == "__main__":
    main()