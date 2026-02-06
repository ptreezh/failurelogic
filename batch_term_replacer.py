#!/usr/bin/env python3
"""
批量修复脚本 - 替换所有文件中的认知偏差术语
"""

import os
import re
from pathlib import Path

def replace_terms_in_file(file_path, replacements):
    """在单个文件中替换术语"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # 执行所有替换
        for old_term, new_term in replacements.items():
            if old_term in content:
                content = content.replace(old_term, new_term)
                count = original_content.count(old_term)
                print(f"  🔄 在 {file_path.name} 中替换了 {count} 个 '{old_term}' 为 '{new_term}'")
                modified = True
        
        # 如果内容被修改，写回文件
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        else:
            return False
            
    except Exception as e:
        print(f"  ❌ 无法处理文件 {file_path}: {e}")
        return False

def main():
    # 定义术语替换映射
    replacements = {
        # 认知偏差相关术语
        '认知偏误': '决策模式',
        '确认偏误': '信息处理偏向',
        '线性思维': '线性效应思维',
        '线性思维陷阱': '线性效应挑战',
        '线性思维局限': '线性效应局限',
        '线性思维期待': '线性效应预期',
        '线性思维警告': '线性效应提醒',
        '线性期望': '线性预期',
        '损失厌恶': '损失规避',
        '过度自信': '自信过度',
        '锚定效应': '锚定倾向',
        '可得性启发': '可得性倾向',
        '现状偏见': '现状倾向',
        '群体思维': '一致性压力',
        '即时满足偏误': '即时满足倾向',
        '规划偏误': '规划倾向',
        '赢家诅咒': '赢家困境',
        '替代方案谬误': '替代方案倾向',
        '认知陷阱': '认知挑战',
        '思维陷阱': '思维挑战',
        '偏误': '倾向',
        '认知偏差': '认知模式',
        '指数增长误区': '指数增长认知',
        '复利思维陷阱': '复利认知挑战',
        '复杂系统思维': '复杂系统认知',
        '时间延迟偏误': '时间延迟认知',
        '线性关系': '线性关联',
        '线性效应': '线性影响',
        '线性增长': '线性增加',
        '线性模式': '线性模式',
        '线性思维': '线性效应思维',
        '线性期望': '线性预期',
    }
    
    # 指定要处理的目录和文件扩展名
    root_dir = "D:\\AIDevelop\\failureLogic\\"
    file_extensions = {'.js', '.py', '.html', '.json', '.md', '.txt'}
    
    total_files_processed = 0
    total_files_modified = 0
    
    print("🔄 开始批量替换术语...")
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if any(file.lower().endswith(ext) for ext in file_extensions):
                file_path = os.path.join(root, file)
                print(f"处理文件: {file}")
                if replace_terms_in_file(file_path, replacements):
                    total_files_modified += 1
                total_files_processed += 1
    
    print(f"\n✅ 批量替换完成!")
    print(f"📊 统计信息:")
    print(f"   - 处理文件数: {total_files_processed}")
    print(f"   - 修改文件数: {total_files_modified}")
    print(f"   - 术语替换映射已应用到所有匹配的文件")

if __name__ == "__main__":
    main()