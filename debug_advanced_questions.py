import sys, os
import json

# 修正路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api-server'))

# 测试高级问题加载函数
def test_load_advanced_questions():
    print("测试高级问题加载功能...")
    
    # 读取高级指数问题文件
    with open("api-server/data/advanced_exponential_questions.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"JSON文件加载成功，数据类型: {type(data)}")
    
    if isinstance(data, dict):
        print(f"字典键: {list(data.keys())}")
        
        # 检查exponential_questions字段
        if 'exponential_questions' in data:
            exp_questions = data['exponential_questions']
            print(f"找到指数问题: {len(exp_questions)} 个")
            
            if exp_questions:
                first_q = exp_questions[0]
                print(f"第一个问题ID: {first_q.get('testId', 'Unknown')}")
                print(f"第一个问题类型: {first_q.get('questionType', 'Unknown')}")
        else:
            print("❌ 未找到exponential_questions字段")
            print("可能存在的字段:", [k for k in data.keys() if 'question' in k.lower() or 'challenge' in k.lower()])
    
    # 检查直接加载路径
    print("\n测试相对路径加载...")
    try:
        # 模拟endpoints目录下的路径
        full_path = os.path.join(os.path.dirname(os.path.join("api-server", "endpoints")), "data", "advanced_exponential_questions.json")
        print(f"构建路径: {full_path}")
        
        with open(full_path, 'r', encoding='utf-8') as f:
            data_alt = json.load(f)
        print("相对路径加载成功！")
        
        # 检查路径修正版本
        import os
        corrected_path = os.path.join(os.path.dirname(os.path.join("api-server", "endpoints")), "data", "advanced_exponential_questions.json")
        corrected_path = os.path.normpath(corrected_path)
        print(f"修正后的路径: {corrected_path}")
        
        with open(corrected_path, 'r', encoding='utf-8') as f:
            data_norm = json.load(f)
        print("规范化路径加载成功！")
        
    except FileNotFoundError as e:
        print(f"路径加载失败: {e}")
        
    print("\n检查函数定义...")
    import importlib.util
    spec = importlib.util.spec_from_file_location("cognitive_tests", os.path.join("api-server", "endpoints", "cognitive_tests.py"))
    ct_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ct_module)
    
    # 直接调用函数
    try:
        print("调用函数...")
        questions_data = ct_module.load_advanced_questions_from_json('../data/advanced_exponential_questions.json')
        print(f"函数返回: {len(questions_data)} 个问题")
        
        if questions_data:
            print(f"第一个问题ID: {questions_data[0].get('testId', 'Unknown') if isinstance(questions_data[0], dict) else 'Not a dict'}")
    except Exception as e:
        print(f"函数调用失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_load_advanced_questions()