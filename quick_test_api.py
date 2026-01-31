#!/usr/bin/env python3
"""
快速测试服务器，验证API功能
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api-server'))

from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Cognitive Trap Platform API is running"}

@app.get("/test-scenarios")
async def test_scenarios():
    return {
        "status": "success",
        "scenarios": [
            {"id": "coffee-shop-linear-thinking", "name": "咖啡店线性思维", "type": "business"},
            {"id": "relationship-time-delay", "name": "恋爱关系时间延迟", "type": "relationship"},
            {"id": "investment-confirmation-bias", "name": "投资确认偏误", "type": "investment"}
        ],
        "total": 3
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)