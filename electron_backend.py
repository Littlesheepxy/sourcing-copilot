#!/usr/bin/env python3
"""
Sourcing Copilot Electron 后端启动脚本
专门用于Electron应用的后端服务启动
"""

import os
import sys
import asyncio

# 在导入其他模块前导入Playwright配置
try:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    import playwright_config
    print("成功加载Playwright镜像源配置")
except Exception as e:
    print(f"加载Playwright配置时出错: {e}")

def main():
    """主函数 - 只启动API服务，不启动浏览器"""
    print("启动 Sourcing Copilot 后端服务 (Electron模式)...")
    
    # 设置环境变量
    os.environ["PLAYWRIGHT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
    os.environ["PLAYWRIGHT_CHROMIUM_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
    os.environ["PLAYWRIGHT_FIREFOX_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
    os.environ["PLAYWRIGHT_WEBKIT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
    os.environ["PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT"] = "120000"
    
    try:
        # 直接启动uvicorn服务器，而不是调用main函数
        import uvicorn
        from automation.api.server import app
        
        print("正在启动API服务器...")
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    except Exception as e:
        print(f"启动API服务失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 