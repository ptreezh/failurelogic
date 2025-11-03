# Vercel FastAPI入口点
# 从api-server目录导入API应用

import sys
import os

# 添加api-server到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api-server'))

# 导入FastAPI应用
from start import app

# Vercel需要一个名为app的可调用对象
app = app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)