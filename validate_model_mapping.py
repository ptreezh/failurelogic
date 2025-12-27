#!/usr/bin/env python3
"""
验证数据模型和字段映射
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# 导入模型 - 先导入models模块
import importlib.util
model_spec = importlib.util.spec_from_file_location("cognitive_tests_model",
                                                    os.path.join("api-server", "models", "cognitive_tests.py"))
model_module = importlib.util.module_from_spec(model_spec)
model_spec.loader.exec_module(model_module)

CognitiveTestQuestion = model_module.CognitiveTestQuestion
QuestionType = model_module.QuestionType

# 读取数据文件
import json
with open("api-server/data/advanced_exponential_questions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("验证问题数据和模型映射...")

questions_data = data.get('exponential_questions', [])
print(f"找到 {len(questions_data)} 个高级指数问题")

# 检查第一个问题
if questions_data:
    first_question = questions_data[0]
    print(f"第一个问题字段: {list(first_question.keys())}")
    print(f"问题类型值: {first_question.get('questionType')}")
    print(f"类型值类型: {type(first_question.get('questionType'))}")
    
    # 尝试创建模型实例
    try:
        question_model = CognitiveTestQuestion(**first_question)
        print(f"模型创建成功！")
        print(f"模型questionType: {question_model.questionType}")
        print(f"模型questionType类型: {type(question_model.questionType)}")
        
        # 验证是否匹配
        print(f"是否等于QuestionType.exponential: {question_model.questionType == QuestionType.exponential}")
        print(f"isinstance check: {isinstance(question_model.questionType, QuestionType)}")
        
        # 测试过滤逻辑
        all_questions = [CognitiveTestQuestion(**q) for q in questions_data]
        filtered_questions = [q for q in all_questions if q.questionType == QuestionType.exponential]
        print(f"过滤后匹配指数类型的问题数量: {len(filtered_questions)}")
        
    except Exception as e:
        print(f"模型创建失败: {e}")
        import traceback
        traceback.print_exc()
else:
    print("没有找到问题数据")