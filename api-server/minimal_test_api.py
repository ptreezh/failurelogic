from fastapi import FastAPI
import uvicorn
import os

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "API服务器正常运行", "status": "ok"}

@app.get("/scenarios/")
async def get_scenarios():
    return {"scenarios": [{"id": "test", "name": "测试场景"}], "status": "success"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)