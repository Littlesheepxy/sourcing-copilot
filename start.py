#!/usr/bin/env python3
"""
Sourcing Copilot 启动脚本
启动API服务并尝试检测或启动浏览器
"""

import os
import sys
import time
import subprocess
import threading
import webbrowser

# 在导入其他模块前导入Playwright配置
# 导入自定义的Playwright配置，设置下载镜像源
try:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    import playwright_config
    print("成功加载Playwright镜像源配置")
except Exception as e:
    print(f"加载Playwright配置时出错: {e}")

# 设置路径
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(CURRENT_DIR)

# 添加当前目录到Python路径
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

def print_banner():
    """打印启动横幅"""
    banner = """
    ╔═══════════════════════════════════════════════╗
    ║                                               ║
    ║          Sourcing Copilot 启动中...           ║
    ║                                               ║
    ╚═══════════════════════════════════════════════╝
    """
    print(banner)

def run_backend_server():
    """启动后端API服务"""
    print("正在启动后端API服务...")
    
    try:
        # 使用Python模块方式启动API服务
        from automation.api.server import main
        main()
    except Exception as e:
        print(f"启动后端服务失败: {e}")
        print("尝试使用命令行方式启动...")
        
        # 如果模块导入失败，尝试通过命令行启动
        try:
            # 确保命令行环境也有我们的配置
            os.environ["PLAYWRIGHT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
            os.environ["PLAYWRIGHT_CHROMIUM_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
            os.environ["PLAYWRIGHT_FIREFOX_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
            os.environ["PLAYWRIGHT_WEBKIT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
            os.environ["PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT"] = "120000"
            
            subprocess.run([sys.executable, "-m", "automation.api.server"])
        except Exception as e:
            print(f"启动后端服务失败: {e}")
            sys.exit(1)

def open_frontend():
    """打开前端Web界面"""
    # 等待后端服务启动
    time.sleep(3)
    
    print("正在打开前端Web界面...")
    try:
        # 尝试打开前端URL
        webbrowser.open("http://localhost:3000")
    except Exception as e:
        print(f"打开前端界面失败: {e}")
        print("请手动访问 http://localhost:3000")

def check_dependencies():
    """检查必要的依赖是否已安装"""
    try:
        import fastapi
        import uvicorn
        import playwright
        import requests
        print("所有必要的依赖已安装")
        return True
    except ImportError as e:
        print(f"缺少必要的依赖: {e}")
        print("正在尝试安装依赖...")
        
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
            print("依赖安装成功")
            return True
        except Exception as e:
            print(f"安装依赖失败: {e}")
            print("请手动安装依赖: pip install -r requirements.txt")
            return False

def check_playwright_browsers():
    """检查并安装Playwright浏览器"""
    try:
        # 设置环境变量以确保使用国内镜像
        os.environ["PLAYWRIGHT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
        os.environ["PLAYWRIGHT_CHROMIUM_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
        os.environ["PLAYWRIGHT_FIREFOX_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
        os.environ["PLAYWRIGHT_WEBKIT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
        os.environ["PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT"] = "120000"
        
        print("检查Playwright浏览器...")
        # 使用subprocess调用playwright install命令
        result = subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"安装Playwright浏览器失败: {result.stderr}")
            return False
        print("Playwright浏览器检查完成")
        return True
    except Exception as e:
        print(f"检查Playwright浏览器出错: {e}")
        return False

def main():
    """主函数"""
    print_banner()
    
    # 检查并安装依赖
    if not check_dependencies():
        return
    
    # 检查Playwright浏览器
    check_playwright_browsers()
    
    # 启动前端界面（在新线程中）
    threading.Thread(target=open_frontend, daemon=True).start()
    
    # 启动后端服务（主线程）
    run_backend_server()

if __name__ == "__main__":
    main() 