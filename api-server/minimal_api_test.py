from fastapi import FastAPI
import uvicorn
import os

app = FastAPI(title="Minimal Test API")

@app.get("/")
async def root():
    return {"message": "Minimal API is working", "status": "ok"}

@app.get("/scenarios/")
async def get_scenarios():
    return {"scenarios": [{"id": "test", "name": "Test Scenario"}], "status": "success"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)