"""
检查前端页面元素可见性
"""
import requests

# 检查后端API响应
print("检查后端API响应...")
try:
    response = requests.get("http://localhost:8083/scenarios/", timeout=10)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ API返回正常，包含{len(data.get('scenarios', []))}个场景")
        for scenario in data['scenarios']:
            print(f"  - {scenario.get('id', 'unknown')}: {scenario.get('name', 'unnamed')}")
    else:
        print(f"❌ API请求失败: {response.status_code}")
except Exception as e:
    print(f"❌ API请求异常: {e}")

print()

# 检查前端页面内容
print("检查前端HTML内容...")
try:
    response = requests.get("http://localhost:8082/index.html", timeout=10)
    if response.status_code == 200:
        content = response.text
        print("✓ 前端页面可以访问")
        
        # 检查关键元素是否存在
        elements_to_check = [
            'scenarios-grid',
            'difficulty-level',
            'scenario-card',
            'game-container',
            'navigation'
        ]
        
        for element in elements_to_check:
            if f'id="{element}"' in content or f'class="{element}"' in content or f'class=".*{element}' in content or f'id=.*{element}' in content:
                print(f"✓ 发现元素: {element}")
            else:
                # 使用更灵活的搜索
                import re
                pattern = rf'[\s\'"][\w\-]*{element}[\w\-]*[\s\'"]'
                if re.search(pattern, content):
                    print(f"✓ 发现元素 (模式匹配): {element}")
                else:
                    print(f"⚠ 未找到元素: {element}")
        
        # 检查是否有JavaScript错误相关的文本
        if "error" in content.lower():
            print("⚠ 页面中发现'error'文本，可能存在问题")
        else:
            print("✓ 未在页面源码中发现明显错误信息")
            
    else:
        print(f"❌ 前端页面请求失败: {response.status_code}")
except Exception as e:
    print(f"❌ 前端页面请求异常: {e}")
    
print()

# 检查API配置管理器是否正确设置
print("检查API配置管理器...")
try:
    response = requests.get("http://localhost:8082/assets/js/api-config-manager.js", timeout=10)
    if response.status_code == 200:
        js_content = response.text
        if "8003" in js_content:
            print("✓ API配置管理器已正确指向后端端口8003")
        elif "8080" in js_content:
            print("⚠ API配置管理器仍指向端口8080，需要更新")
        else:
            print("? 未在API配置管理器中找到明确的端口配置")
    else:
        print(f"❌ 无法获取API配置管理器: {response.status_code}")
except Exception as e:
    print(f"❌ 无法检查API配置管理器: {e}")
    
print()

print("检查完成。如果前端页面加载但元素不可见，可能是以下原因之一：")
print("1. CSS样式将元素设置为display:none或visibility:hidden")
print("2. JavaScript错误导致页面渲染中断")
print("3. API响应正确但前端未正确解析和显示数据")
print("4. 页面布局样式导致内容被隐藏在视窗之外")