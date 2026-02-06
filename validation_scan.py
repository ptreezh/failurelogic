#!/usr/bin/env python3
"""
修复验证脚本
检查项目中是否还有认知偏差术语
"""

import os
import re

def scan_for_bias_terms():
    """扫描项目中包含认知偏差术语的文件"""
    bias_terms = [
        '线性思维', '认知偏误', '确认偏误', '损失厌恶', '过度自信', 
        '认知陷阱', '思维陷阱', '偏误', '认知偏差', '线性期望',
        '线性思维陷阱', '时间延迟偏误', '群体思维', '锚定效应',
        '可得性启发', '现状偏见', '即时满足偏误', '指数增长误区',
        '复利思维陷阱', '复杂系统思维', '规划偏误', '赢家诅咒',
        '替代方案谬误', '即时满足', '线性思维期待', '线性思维警告',
        '线性思维陷阱', '线性思维局限', '线性关系', '线性效应',
        '线性增长', '线性模式'
    ]
    
    problematic_files = []
    
    for root, dirs, files in os.walk("D:\\AIDevelop\\failureLogic\\"):
        for file in files:
            if file.endswith(('.py', '.js', '.html', '.json')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                    found_terms = []
                    for term in bias_terms:
                        if term in content:
                            matches = re.findall(re.escape(term), content)
                            found_terms.append((term, len(matches)))
                    
                    if found_terms:
                        problematic_files.append((filepath, found_terms))
                        
                except Exception as e:
                    print(f"无法读取文件 {filepath}: {e}")
    
    return problematic_files

def main():
    print("🔍 扫描项目中的认知偏差术语...")
    
    problematic_files = scan_for_bias_terms()
    
    if problematic_files:
        print(f"\n❌ 发现 {len(problematic_files)} 个文件包含认知偏差术语:")
        for filepath, found_terms in problematic_files:
            print(f"\n📄 文件: {os.path.basename(filepath)}")
            for term, count in found_terms:
                print(f"   - '{term}': {count} 次")
            print(f"     路径: {filepath}")
    else:
        print("\n✅ 未发现包含认知偏差术语的文件")
    
    print(f"\n扫描完成，共检查了项目中的Python、JS、HTML、JSON文件")
    
    return len(problematic_files) == 0

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 所有修复验证通过！平台不再包含认知偏差术语。")
    else:
        print("\n⚠️  发现问题文件，需要进一步修复。")