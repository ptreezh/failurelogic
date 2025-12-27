#!/usr/bin/env python3
"""
更新index.html文件以添加难度选择功能
"""

def update_index_html():
    # 读取文件
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 添加CSS样式到<style>标签
    if "</style>" in content:
        style_end_pos = content.rfind("</style>")
        css_styles = """
        /* 难度控制面板样式 */
        .difficulty-control-panel {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-top: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            flex-wrap: wrap;
        }
        
        .difficulty-control-panel label {
            font-weight: bold;
            color: white;
            font-size: 1.1em;
        }
        
        .difficulty-control-panel select {
            padding: 10px 15px;
            border-radius: 8px;
            border: none;
            background: white;
            color: #333;
            font-size: 1em;
            min-width: 180px;
        }
        
        .current-difficulty {
            color: #3498db;
            font-weight: bold;
            font-style: italic;
            font-size: 1.1em;
        }
        
        /* 难度标签样式 */
        .difficulty-tag {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 0.85em;
            font-weight: bold;
            margin-left: 8px;
        }
        
        .difficulty-tag.beginner { background-color: #2ecc71; color: white; }
        .difficulty-tag.intermediate { background-color: #3498db; color: white; }
        .difficulty-tag.advanced { background-color: #e74c3c; color: white; }
        
"""
        content = content[:style_end_pos] + css_styles + content[style_end_pos:]
        print("✓ CSS样式已添加")
    
    # 添加JavaScript到</body>标签前
    if "</body>" in content:
        body_end_pos = content.rfind("</body>")
        js_code = """
    <script>
    // 难度选择功能
    function updateDifficultyDisplay(difficulty) {
        const displayElement = document.getElementById("current-difficulty");
        const difficultyNames = {
            "beginner": "初级",
            "intermediate": "中级", 
            "advanced": "高级"
        };
        displayElement.textContent = `当前: ${difficultyNames[difficulty]}`;
        
        // 在游戏中使用选择的难度
        if (window.GameManager && typeof window.GameManager.setDifficulty === "function") {
            window.GameManager.setDifficulty(difficulty);
        }
        
        // 保存难度选择到本地存储
        localStorage.setItem("selectedDifficulty", difficulty);
    }
    
    // 页面加载完成后初始化难度
    document.addEventListener("DOMContentLoaded", function() {
        const savedDifficulty = localStorage.getItem("selectedDifficulty");
        if (savedDifficulty) {
            const selector = document.getElementById("difficulty-level");
            if (selector) {
                selector.value = savedDifficulty;
                updateDifficultyDisplay(savedDifficulty);
            }
        }
    });
    </script>
"""
        content = content[:body_end_pos] + js_code + content[body_end_pos:]
        print("✓ JavaScript功能已添加")
    
    # 保存更新
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(content)
    
    print("✓ index.html文件更新完成")

if __name__ == "__main__":
    update_index_html()