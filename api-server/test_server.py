from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Test Server")

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Server is running"}

if __name__ == "__main__":
    print("Starting test server on port 8082...")
    uvicorn.run(app, host="0.0.0.0", port=8082)