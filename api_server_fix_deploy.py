"""
API服务器修复脚本
修复部署环境中API路由未注册的问题
"""

import os
import sys
import importlib.util

def fix_api_server():
    """修复API服务器部署问题"""
    print("🔧 修复API服务器部署配置...")
    
    # 确保正确的路径被添加到Python路径
    project_root = os.path.dirname(os.path.abspath(__file__))
    api_server_path = os.path.join(project_root, 'api-server')
    
    # 检查API服务器文件是否存在
    start_py_path = os.path.join(api_server_path, 'start.py')
    if not os.path.exists(start_py_path):
        print(f"❌ API服务器启动文件不存在: {start_py_path}")
        return False
    
    print(f"✅ 找到API服务器文件: {start_py_path}")
    
    # 读取start.py文件
    with open(start_py_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否需要修复导入路径
    if "sys.path.append(os.path.join(os.path.dirname(__file__)))" not in content:
        # 添加路径修复代码
        import_section = '''import os
import sys
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
import uvicorn
import json
import random
from datetime import datetime
from pydantic import BaseModel
from collections import defaultdict

# 修复部署环境中的模块导入路径
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# 添加项目根目录到路径
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# 添加utils目录到路径
utils_dir = os.path.join(current_dir, 'utils')
if utils_dir not in sys.path:
    sys.path.insert(0, utils_dir)
'''
        
        # 替换导入部分
        lines = content.split('\n')
        new_lines = []
        replaced = False
        
        for line in lines:
            if line.strip().startswith('import os') and not replaced:
                new_lines.append(import_section)
                replaced = True
            elif line.strip().startswith('from fastapi import FastAPI') and not replaced:
                # 如果已经到了FastAPI导入行但还没替换，则跳过这一行（因为它会被包含在import_section中）
                continue
            elif (line.strip().startswith('from fastapi.middleware.cors import CORSMiddleware') or
                  line.strip().startswith('from typing import Optional') or
                  line.strip().startswith('import uvicorn') or
                  line.strip().startswith('import json') or
                  line.strip().startswith('from datetime import datetime') or
                  line.strip().startswith('from pydantic import BaseModel') or
                  line.strip().startswith('from collections import defaultdict')):
                # 跳过这些行，因为它们已包含在import_section中
                continue
            else:
                new_lines.append(line)
        
        content = '\n'.join(new_lines)
    
    # 检查是否需要修复数据文件路径
    if "os.path.join(_project_root, 'data'" in content:
        # 确保数据文件路径正确
        content = content.replace(
            "os.path.join(_project_root, 'data'",
            "os.path.join(os.path.dirname(__file__), 'data'"
        )
    
    # 保存修复后的内容
    with open(start_py_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ API服务器文件已修复")
    
    # 检查server_runner.py是否正确
    server_runner_path = os.path.join(api_server_path, 'server_runner.py')
    if os.path.exists(server_runner_path):
        with open(server_runner_path, 'r', encoding='utf-8') as f:
            server_content = f.read()
        
        # 确保使用正确的导入方式
        if 'from start import app' in server_content:
            # 添加路径修复
            path_fix = '''import sys
import os

# 修复部署环境中的路径问题
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

'''
            server_content = server_content.replace(
                'import sys\nimport os\n',
                path_fix
            )
        
        with open(server_runner_path, 'w', encoding='utf-8') as f:
            f.write(server_content)
        
        print("✅ 服务器启动文件已修复")
    
    return True

def main():
    """主函数"""
    print("🚀 认知陷阱平台 - API服务器部署修复")
    print("="*60)
    
    success = fix_api_server()
    
    if success:
        print("\n✅ API服务器修复完成！")
        print("💡 请重新部署服务以应用更改")
        print("📋 部署命令: railway up")
    else:
        print("\n❌ API服务器修复失败！")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)