# API Contracts: 认知陷阱测试扩展

**Feature**: 001-cognitive-trap-tests  
**Date**: 2025-11-09  
**Status**: Design

## 1. 指数增长误区测试相关接口

### GET /api/exponential/questions
**描述**: 获取指数增长相关的测试问题列表

**请求参数**:
- None

**响应**:
```
{
  "questions": [
    {
      "questionId": "exp-001",
      "questionType": "exponential",
      "topic": "exponential-growth",
      "questionText": "2^200粒米需要多大仓库？",
      "options": [
        "1万个足球场",
        "100万个足球场", 
        "1亿个足球场",
        "以上都不对，不需要这么大",
        "以上都不对，这些都不够"
      ],
      "explanation": "2^200粒米的数量是1.6×10^60，远超宇宙中的原子总数，因此即使是1亿个足球场也不够存储。"
    }
  ],
  "total_count": 1,
  "title": "指数增长误区专项测试"
}
```

### POST /api/exponential/calculate/compound
**描述**: 计算复利结果

**请求体**:
```
{
  "principal": 100000,
  "rate": 8,
  "time": 30
}
```

**响应**:
```
{
  "principal": 100000,
  "rate": 8,
  "time": 30,
  "compound_amount": 1006265.69,
  "linear_amount": 340000,
  "compound_advantage": 666265.69,
  "explanation": "复利计算：100,000 × (1.08)^30 = 1,006,266元。这展示了复利的惊人力量，远超线性增长估算。"
}
```

### POST /api/exponential/calculate/exponential
**描述**: 计算指数增长结果

**请求体**:
```
{
  "base": 2,
  "exponent": 200
}
```

**响应**:
```
{
  "base": 2,
  "exponent": 200,
  "result": 1.6069380442589903e+60,
  "result_scientific": "1.61e+60",
  "comparison": "这个数字是天文数字，比全宇宙的原子总数（约10^80）还要大，超出了人类的直观理解范围。",
  "error": false
}
```

### POST /api/exponential/check-answer/{question_id}
**描述**: 检查用户答案是否正确

**路径参数**:
- question_id: 问题唯一ID

**请求体**:
```
{
  "answer": 4
}
```

**响应**:
```
{
  "question_id": "exp-001",
  "is_correct": true,
  "correct_answer": 4,
  "explanation": "2^200粒米的数量是1.6×10^60，远超宇宙中的原子总数，因此即使是1亿个足球场也不够存储。"
}
```

## 2. 复利思维陷阱测试相关接口

### GET /api/compound/questions
**描述**: 获取复利相关测试问题

**请求参数**:
- None

**响应**:
```
{
  "questions": [
    {
      "questionId": "comp-001",
      "questionType": "compound",
      "topic": "compound-interest",
      "questionText": "如果你投资10万元，年复利8%，30年后大约会变成多少？",
      "options": [
        "34万元（线性估算）",
        "100万元", 
        "317万元",
        "500万元"
      ],
      "explanation": "复利计算：100,000 × (1.08)^30 = 1,006,266元。这展示了复利的惊人力量，远超线性增长估算。"
    }
  ]
}
```

## 3. 历史决策重现测试接口

### GET /api/historical/scenarios
**描述**: 获取历史经典决策失败案例

**请求参数**:
- None

**响应**:
```
{
  "scenarios": [
    {
      "scenarioId": "hist-001",
      "title": "挑战者号航天飞机灾难",
      "description": "1986年挑战者号发射决策过程分析",
      "decisionPoints": [
        {
          "point": "O型环低温脆弱性",
          "options": ["推迟发射", "按计划发射"],
          "historicalOutcome": "按计划发射导致灾难"
        }
      ],
      "lessons": ["确认偏误在决策中的作用", "风险被低估", "专家意见被忽视"],
      "pyramidAnalysis": {
        "coreConclusion": "系统性认知偏差导致了灾难性决策",
        "supportingArguments": [
          "确认偏误让管理层忽视警告信号",
          "群体思维压制了异议声音"
        ],
        "examples": ["类似偏误在其他组织决策中反复出现"],
        "actionableAdvice": ["建立多元化决策机制", "鼓励质疑声音"]
      }
    }
  ]
}
```

## 4. 互动式推理游戏接口

### GET /api/game/scenarios
**描述**: 获取推理游戏场景

**请求参数**:
- None

**响应**:
```
{
  "scenarios": [
    {
      "scenarioId": "game-001",
      "title": "商业战略推理",
      "description": "模拟商业决策推理过程",
      "gameType": "reasoning-game",
      "steps": [
        {
          "step": 1,
          "situation": "市场出现新产品",
          "options": ["跟进研发", "观望", "收购对方"]
        }
      ]
    }
  ]
}
```

## 5. 测试结果和用户反馈接口

### POST /api/results/submit
**描述**: 提交用户回答结果

**请求体**:
```
{
  "userId": "user123",
  "sessionId": "session456",
  "responses": [
    {
      "questionId": "exp-001",
      "userChoice": 4,
      "userEstimation": 100000000,
      "responseTime": "2025-11-09T10:30:00Z",
      "confidence": "medium"
    }
  ]
}
```

**响应**:
```
{
  "success": true,
  "sessionId": "session456",
  "summary": {
    "userId": "user123",
    "testType": "exponential",
    "score": 85,
    "biasScores": {
      "linear_thinking": 20,
      "exponential_misconception": 30
    },
    "estimationErrors": [99.999],
    "improvementAreas": ["指数增长认知误区", "数量级估算能力"],
    "pyramidExplanations": [
      "核心结论：人类大脑难以理解指数增长的真实含义",
      "支撑论据：2^200远超宇宙原子总数",
      "实例：实际计算结果vs用户估算",
      "建议：加强指数增长相关训练"
    ]
  }
}
```

### GET /api/results/{userId}/{sessionId}
**描述**: 获取特定用户会话的详细结果

**路径参数**:
- userId: 用户唯一ID
- sessionId: 会话唯一ID

**响应**:
```
{
  "userId": "user123",
  "sessionId": "session456", 
  "testType": "exponential",
  "responses": [
    {
      "questionId": "exp-001",
      "userChoice": 4,
      "correctAnswer": 4,
      "isCorrect": true,
      "deviation": 99.999,
      "timeTaken": 45
    }
  ],
  "summary": {
    "score": 85,
    "estimationAccuracy": 0.001,
    "biasIdentification": ["linear_thinking", "exponential_misconception"]
  }
}
```

## 6. 认知偏差解释接口

### GET /api/explanations/{biasType}
**描述**: 获取特定认知偏差的详细解释

**路径参数**:
- biasType: 认知偏差类型

**响应**:
```
{
  "explanationId": "bias-exp-001",
  "biasType": "linear_thinking",
  "coreConclusion": "人类倾向于认为原因和结果之间存在直接的、成比例的关系",
  "supportingArguments": [
    "在复杂系统中，这种思维方式往往会导致错误的决策",
    "线性思维无法捕捉到非线性反馈和延迟效应"
  ],
  "examples": [
    "2^200规模的误解",
    "技术发展速度的误判",
    "流行病传播的误判"
  ],
  "actionableAdvice": [
    "考虑非线性效应",
    "关注系统中的反馈循环",
    "避免简单的线性外推"
  ],
  "relatedTests": ["exponential-growth", "compound-interest"]
}
```

## 错误响应格式

所有接口在发生错误时返回统一格式：
```
{
  "error": {
    "code": 404,
    "message": "找不到指定的资源",
    "details": "questionId 'xyz' not found"
  }
}
```

## HTTP状态码

- 200: 请求成功
- 201: 资源创建成功
- 400: 请求参数错误
- 401: 未授权
- 404: 资源不存在
- 500: 服务器内部错误