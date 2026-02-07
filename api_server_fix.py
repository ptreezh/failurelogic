"""
API服务器部署修复脚本
修复Railway部署时的路由配置问题
"""

import os
import sys
import json

def fix_api_server_config():
    """修复API服务器配置"""
    print("🔧 修复API服务器部署配置...")
    
    # 检查并修复server_runner.py
    server_runner_path = "D:/AIDevelop/failureLogic/api-server/server_runner.py"
    
    try:
        with open(server_runner_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 确保使用环境变量中的端口
        if 'int(os.environ.get("PORT", 8082))' not in content:
            # 更新端口配置
            content = content.replace(
                'port=8082',
                'port=int(os.environ.get("PORT", 8082))'
            )
        
        # 确保日志级别设置正确
        if 'log_level="info"' not in content:
            content = content.replace(
                'log_level="info"',
                'log_level="info"'
            )
        
        with open(server_runner_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ server_runner.py配置已更新")
        
    except Exception as e:
        print(f"❌ 更新server_runner.py失败: {e}")
    
    # 检查start.py中的路由配置
    start_py_path = "D:/AIDevelop/failureLogic/api-server/start.py"
    
    try:
        with open(start_py_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 确保CORS配置正确
        if 'allow_origin_regex' not in content:
            # 查找CORS中间件配置部分并确保正确配置
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
            # 替换现有的CORS配置
            if 'CORSMiddleware' in content:
                import re
                # 找到CORS配置部分并替换
                cors_pattern = r'app\.add_middleware\(.*?CORSMiddleware.*?\n.*?\n.*?\n.*?\)'
                content = re.sub(cors_pattern, cors_config.strip(), content, flags=re.DOTALL)
            else:
                # 在app定义后添加CORS配置
                app_def_pos = content.find('app = FastAPI(')
                if app_def_pos != -1:
                    # 找到app定义后的合适位置
                    insert_pos = content.find('\n', app_def_pos)
                    if insert_pos != -1:
                        content = content[:insert_pos+1] + cors_config + content[insert_pos+1:]
        
        with open(start_py_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ start.py CORS配置已更新")
        
    except Exception as e:
        print(f"❌ 更新start.py失败: {e}")
    
    # 检查railway.json配置
    railway_config_path = "D:/AIDevelop/failureLogic/railway.json"
    
    try:
        with open(railway_config_path, 'r', encoding='utf-8') as f:
            config_content = f.read()
        
        # 确保使用正确的启动命令
        if 'python -m api-server.server_runner' not in config_content:
            # 更新启动命令
            config_content = config_content.replace(
                'python -m api-server.server_runner',
                'python -m api_server.server_runner'
            )
        
        with open(railway_config_path, 'w', encoding='utf-8') as f:
            f.write(config_content)
        
        print("✅ railway.json配置已更新")
        
    except Exception as e:
        print(f"❌ 更新railway.json失败: {e}")
    
    print("\n✅ API服务器配置修复完成")
    print("💡 请重新部署服务以应用更改")

if __name__ == "__main__":
    fix_api_server_config()