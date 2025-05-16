#!/usr/bin/env python3
"""
简历截图报告生成器
生成HTML报告并打开
"""

import os
import sys
import webbrowser
import time
from automation.utils.screenshot_manager import ScreenshotManager

def main():
    """主函数"""
    print("正在生成简历截图报告...")
    
    # 初始化截图管理器
    manager = ScreenshotManager()
    
    # 扫描目录
    print("扫描截图目录...")
    new_count = manager.scan_directory()
    print(f"已扫描并索引 {new_count} 个新截图")
    
    # 生成报告
    print("生成HTML报告...")
    report_path = manager.generate_html_report()
    
    if not report_path:
        print("生成报告失败")
        return
        
    print(f"报告已生成: {report_path}")
    
    # 打开浏览器查看报告
    print("正在打开浏览器...")
    webbrowser.open(f"file://{report_path}")
    
    print("完成!")

if __name__ == "__main__":
    # 导入配置
    try:
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        import playwright_config
        print("已加载Playwright配置")
    except Exception as e:
        print(f"加载配置失败: {e}")
    
    main() 