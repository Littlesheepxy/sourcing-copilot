#!/usr/bin/env python3
"""
Sourcing Copilot 桌面应用
主入口文件
"""

import sys
import os
import asyncio

# 在导入其他模块前导入Playwright配置
# 导入自定义的Playwright配置，设置下载镜像源
try:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    import playwright_config
    print("成功加载Playwright镜像源配置")
except Exception as e:
    print(f"加载Playwright配置时出错: {e}")

from automation.api.server import main as api_main

def main():
    """主函数"""
    print("启动 Sourcing Copilot 桌面应用...")
    
    # 启动API服务
    api_main()

if __name__ == "__main__":
    # 确认环境变量设置
    dl_host = os.environ.get("PLAYWRIGHT_DOWNLOAD_HOST", "")
    if dl_host:
        print(f"使用Playwright下载源: {dl_host}")
    
    main() 