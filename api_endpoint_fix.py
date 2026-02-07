"""
API端点修复方案
解决FastAPI路由配置和Railway代理配置问题
"""

import os
import sys
from pathlib import Path

def fix_api_routes():
    """修复API路由配置"""
    print("🔧 修复API路由配置...")
    
    # 修复start.py中的路由配置
    start_py_path = Path("D:/AIDevelop/failureLogic/api-server/start.py")
    
    if not start_py_path.exists():
        print(f"❌ 未找到 {start_py_path}")
        return False
    
    try:
        with open(start_py_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否需要修复CORS配置
        if 'allow_origin_regex=".*"' not in content:
            # 添加更完整的CORS配置
            cors_config = '''
# 配置CORS中间件 - 修复跨域问题
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # 允许所有来源，包括子域名
    allow_origin_regex=r"https?://(?:.+\.)?railway\.app(?:/.*)?",
)
'''
            # 查找middleware配置部分并替换
            if 'CORSMiddleware' in content:
                # 替换现有的CORS配置
                import re
                cors_pattern = r'# 配置CORS中间件.*?app\.add_middleware\(.*?\n.*?\n.*?\n.*?\)'
                content = re.sub(cors_pattern, cors_config.strip(), content, flags=re.DOTALL)
            else:
                # 在app定义后插入CORS配置
                app_def_pos = content.find('app = FastAPI(')
                if app_def_pos != -1:
                    # 找到app定义后的合适位置
                    insert_pos = content.find('\n', app_def_pos)
                    if insert_pos != -1:
                        content = content[:insert_pos+1] + cors_config + content[insert_pos+1:]
        
        # 确保根路径路由存在
        if 'async def serve_home()' not in content:
            # 添加根路径路由
            root_route = '''
@app.get("/")
async def serve_root():
    """根路径路由 - 返回API状态信息"""
    return {
        "status": "success",
        "message": "认知陷阱平台API服务正常运行",
        "version": "2.0.0",
        "endpoints": {
            "scenarios": "/scenarios/",
            "scenario_detail": "/scenarios/{scenario_id}",
            "create_session": "/scenarios/create_game_session",
            "process_turn": "/scenarios/{game_id}/turn",
            "health": "/health"
        }
    }
'''
            # 在app定义后添加根路径路由
            content += "\n" + root_route
        
        # 保存修复后的内容
        with open(start_py_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ API路由配置修复完成")
        return True
        
    except Exception as e:
        print(f"❌ 修复API路由配置失败: {str(e)}")
        return False

def fix_server_runner():
    """修复server_runner.py以确保正确的端口配置"""
    print("🔧 修复server_runner.py配置...")
    
    server_runner_path = Path("D:/AIDevelop/failureLogic/api-server/server_runner.py")
    
    if not server_runner_path.exists():
        print(f"❌ 未找到 {server_runner_path}")
        return False
    
    try:
        with open(server_runner_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 确保使用正确的端口配置
        if 'port = int(os.environ.get("PORT", 8082))' not in content:
            # 更新端口配置以确保使用环境变量
            content = content.replace(
                'uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")',
                '''    # 使用环境变量中的端口，这对于Railway部署至关重要
    port = int(os.environ.get("PORT", 8080))
    logger.info(f"Starting server on port {port} (using environment PORT variable)...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")'''
            )
        
        # 保存修复后的内容
        with open(server_runner_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ server_runner.py配置修复完成")
        return True
        
    except Exception as e:
        print(f"❌ 修复server_runner.py失败: {str(e)}")
        return False

def create_railway_config():
    """创建Railway部署配置"""
    print("🔧 创建Railway部署配置...")
    
    railway_config = '''# Railway配置文件
# 用于部署认知陷阱平台API后端

[build]
builder = "NIXPACKS"

[nixpacks]
phases = {
  setup = {
    nixPkgs = ["python310", "nodejs-18_x", "gcc", "libffi", "openssl"]
  },
  install = {
    cmd = [
      "pip install --upgrade pip",
      "pip install -r requirements.txt"
    ]
  },
  start = {
    cmd = [
      "python -m api-server.server_runner"
    ]
  }
}

[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

# 环境变量
[variables]
PORT = "8080"
'''
    
    config_path = Path("D:/AIDevelop/failureLogic/railway.json")
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(railway_config)
        print("✅ Railway配置文件创建完成")
        return True
    except Exception as e:
        print(f"❌ 创建Railway配置文件失败: {str(e)}")
        return False

def verify_routes():
    """验证路由是否正确注册"""
    print("🔍 验证API路由注册...")
    
    start_py_path = Path("D:/AIDevelop/failureLogic/api-server/start.py")
    
    try:
        with open(start_py_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查关键路由是否存在
        required_routes = [
            '@app.get("/")',
            '@app.get("/scenarios/")',
            '@app.get("/health")',
            'uvicorn.run'
        ]
        
        missing_routes = []
        for route in required_routes:
            if route not in content:
                missing_routes.append(route)
        
        if missing_routes:
            print(f"⚠️  以下路由未找到: {missing_routes}")
            return False
        else:
            print("✅ 所有关键路由均已注册")
            return True
            
    except Exception as e:
        print(f"❌ 验证路由失败: {str(e)}")
        return False

def main():
    """主修复函数"""
    print("🔧 认知陷阱平台 - API端点根治修复")
    print("="*50)
    
    # 执行各项修复
    fixes = [
        ("修复API路由配置", fix_api_routes),
        ("修复server_runner.py", fix_server_runner),
        ("创建Railway配置", create_railway_config),
    ]
    
    success_count = 0
    for name, func in fixes:
        print(f"\n{name}...")
        if func():
            success_count += 1
        else:
            print(f"❌ {name}失败")
    
    # 验证修复结果
    print(f"\n🔍 验证修复结果...")
    routes_ok = verify_routes()
    
    print(f"\n📊 修复结果: {success_count}/{len(fixes)} 项修复成功")
    print(f"路由验证: {'✅ 通过' if routes_ok else '❌ 失败'}")
    
    if success_count == len(fixes) and routes_ok:
        print("\n🎉 API端点修复完成！")
        print("✅ FastAPI路由配置已修复")
        print("✅ CORS配置已更新")
        print("✅ 端口配置已优化")
        print("✅ Railway部署配置已创建")
        print("\n💡 建议重新部署服务以应用更改")
        return True
    else:
        print("\n⚠️  部分修复未成功，请检查错误信息")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)