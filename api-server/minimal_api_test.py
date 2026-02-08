"""
最小化API测试应用
用于验证FastAPI在部署环境中是否正常工作
"""

from fastapi import FastAPI
import uvicorn
import os

app = FastAPI(title="Minimal API Test")

@app.get("/")
async def root():
    return {"message": "Minimal API is working", "status": "ok"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint is working", "routes_count": len(app.routes)}

@app.get("/scenarios/")
async def scenarios():
    return {"scenarios": [{"id": "test", "name": "Test Scenario"}], "status": "success"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Starting minimal API test on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")