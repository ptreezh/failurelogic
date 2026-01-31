"""
API连接和数据同步测试报告生成器
基于实际测试结果填充测试报告模板
"""
import datetime
import json
import os
from pathlib import Path

def generate_test_report(results):
    """根据测试结果生成报告"""
    template_path = Path(__file__).parent / "API_DATA_SYNC_TEST_REPORT_TEMPLATE.md"
    report_path = Path(__file__).parent / "API_DATA_SYNC_TEST_REPORT.md"
    
    # 读取模板
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
    
    # 替换占位符为实际结果
    report = template
    
    # 填充测试结果
    test_names = [
        "前端与后端API连接",
        "数据同步功能", 
        "API端点可用性",
        "数据传输验证",
        "错误处理机制"
    ]
    
    for i, test_name in enumerate(test_names):
        test_key = [
            "frontend_backend_connection",
            "data_synchronization", 
            "api_endpoint_availability",
            "data_transfer_verification",
            "error_handling_mechanism"
        ][i]
        
        if test_key in results:
            status = results[test_key]['status']
            result = results[test_key]['result']
            details = results[test_key]['details']
            timestamp = results[test_key]['timestamp']
            
            # 替换对应部分
            report = report.replace(
                f"- **状态**: [PENDING | IN_PROGRESS | COMPLETED]",
                f"- **状态**: {status}",
                1
            ).replace(
                f"- **结果**: [PASS | FAIL | ERROR]",
                f"- **结果**: {result}",
                1
            ).replace(
                f"- **详细信息**: ",
                f"- **详细信息**: {details}",
                1
            ).replace(
                f"- **时间戳**: ",
                f"- **时间戳**: {timestamp}",
                1
            )
    
    # 计算总体结果
    total_tests = len([k for k in results.keys() if k in [
        "frontend_backend_connection", "data_synchronization", 
        "api_endpoint_availability", "data_transfer_verification", 
        "error_handling_mechanism"
    ]])
    passed_tests = len([k for k, v in results.items() if v['result'] == 'PASS'])
    failed_tests = total_tests - passed_tests
    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    # 填充总体结果
    report = report.replace(
        f"- **总测试数**: 5",
        f"- **总测试数**: {total_tests}"
    ).replace(
        f"- **通过测试数**: ",
        f"- **通过测试数**: {passed_tests}"
    ).replace(
        f"- **失败测试数**: ",
        f"- **失败测试数**: {failed_tests}"
    ).replace(
        f"- **成功率**: ",
        f"- **成功率**: {success_rate:.1f}%"
    )
    
    # 写入最终报告
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"测试报告已生成: {report_path}")
    return report_path

def create_sample_results():
    """创建示例测试结果（用于演示）"""
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    sample_results = {
        "frontend_backend_connection": {
            "status": "COMPLETED",
            "result": "PENDING",  # 实际测试时会被更新
            "details": "",
            "timestamp": now
        },
        "data_synchronization": {
            "status": "PENDING",
            "result": "PENDING",
            "details": "",
            "timestamp": now
        },
        "api_endpoint_availability": {
            "status": "PENDING",
            "result": "PENDING",
            "details": "",
            "timestamp": now
        },
        "data_transfer_verification": {
            "status": "PENDING",
            "result": "PENDING",
            "details": "",
            "timestamp": now
        },
        "error_handling_mechanism": {
            "status": "PENDING",
            "result": "PENDING",
            "details": "",
            "timestamp": now
        }
    }
    
    return sample_results

if __name__ == "__main__":
    # 创建示例结果并生成报告
    results = create_sample_results()
    report_path = generate_test_report(results)
    print(f"报告模板已准备就绪: {report_path}")