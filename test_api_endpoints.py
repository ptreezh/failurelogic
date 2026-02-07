import requests

# 测试API的不同端点
base_url = "https://insightful-enthusiasm-production.up.railway.app"

endpoints = [
    "/",
    "/scenarios/",
    "/health",
    "/docs",
    "/openapi.json"
]

print("Testing API endpoints:")
print("="*50)

for endpoint in endpoints:
    try:
        response = requests.get(f"{base_url}{endpoint}", timeout=10)
        print(f"{endpoint:20} : {response.status_code} ({len(response.content)} bytes)")
    except Exception as e:
        print(f"{endpoint:20} : ERROR - {str(e)}")

print("="*50)