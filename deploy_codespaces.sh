#!/bin/bash
# 认知陷阱平台部署脚本
# 用于在GitHub Codespaces中部署应用

set -e  # 遇到错误时退出

echo "==================================="
echo "认知陷阱平台部署脚本"
echo "GitHub Codespaces 部署"
echo "==================================="

# 检查是否在正确的目录
if [ ! -f "api-server/start.py" ]; then
    echo "错误: 未找到 api-server/start.py 文件"
    exit 1
fi

echo "1. 设置环境变量..."
export PYTHONPATH="${PYTHONPATH}:$(pwd)/api-server"
export FLASK_ENV=development
export DEBUG=True

echo "2. 检查Python版本..."
python_version=$(python --version)
echo "Python版本: $python_version"

echo "3. 安装依赖..."
cd api-server
pip install --upgrade pip

# 如果存在requirements.txt则安装
if [ -f "requirements.txt" ]; then
    echo "安装requirements.txt中的依赖..."
    pip install -r requirements.txt
else
    echo "安装默认依赖..."
    pip install fastapi uvicorn python-multipart requests pydantic[email]
fi

echo "4. 验证依赖安装..."
pip list | grep -E "(fastapi|uvicorn|requests|pydantic)"

echo "5. 检查应用文件..."
ls -la start.py
ls -la logic/
ls -la endpoints/
ls -la models/

echo "6. 启动认知陷阱平台服务..."

# 在后台启动服务
PORT=${PORT:-8000}  # 使用Codespaces提供的PORT或默认8000
echo "启动服务在端口 $PORT..."

# 使用uvicorn启动FastAPI应用
uvicorn start:app --host 0.0.0.0 --port $PORT --reload &

SERVER_PID=$!
echo "服务启动，PID: $SERVER_PID"

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 检查服务是否正常运行
if curl -f http://localhost:$PORT/health >/dev/null 2>&1; then
    echo "✅ 服务在 http://localhost:$PORT 正常运行"
elif curl -f http://localhost:$PORT/docs >/dev/null 2>&1; then
    echo "✅ 服务在 http://localhost:$PORT/docs 可用"
else
    echo "⚠️  服务可能未在预期端口运行，检查可用端口..."
    netstat -tlnp | grep python || echo "未找到Python服务"
fi

echo "7. 设置Codespaces端口转发..."
# 在Codespaces中，端口会自动公开，但我们可以指定端口配置
if command -v code >/dev/null 2>&1; then
    echo "配置VS Code端口转发..."
    code --bind-socket 0.0.0.0 --port $PORT
fi

echo "==================================="
echo "部署完成!"
echo "认知陷阱平台已启动"
echo ""
echo "访问地址:"
echo "- API文档: http://localhost:$PORT/docs"
echo "- 健康检查: http://localhost:$PORT/health"
echo "- 场景列表: http://localhost:$PORT/scenarios/"
echo ""
echo "服务将在后台继续运行"
echo "PID: $SERVER_PID"
echo "==================================="

# 保持脚本运行
wait $SERVER_PID