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
import asyncio
import platform

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

def get_chrome_path():
    """获取系统Chrome路径"""
    system = platform.system()
    
    if system == "Darwin":  # macOS
        paths = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            os.path.expanduser("~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
        ]
        for path in paths:
            if os.path.exists(path):
                return path
                
    elif system == "Windows":
        paths = [
            os.path.join(os.environ.get("PROGRAMFILES", "C:\\Program Files"), "Google\\Chrome\\Application\\chrome.exe"),
            os.path.join(os.environ.get("PROGRAMFILES(X86)", "C:\\Program Files (x86)"), "Google\\Chrome\\Application\\chrome.exe"),
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Google\\Chrome\\Application\\chrome.exe")
        ]
        for path in paths:
            if os.path.exists(path):
                return path
                
    elif system == "Linux":
        chrome_names = ["google-chrome", "chrome", "chromium", "chromium-browser"]
        for name in chrome_names:
            try:
                path = subprocess.check_output(["which", name], text=True).strip()
                if path:
                    return path
            except subprocess.SubprocessError:
                continue
    
    return None

def is_chrome_running_with_debugging(port=9222):
    """检查Chrome是否以调试模式运行"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result == 0

def get_default_chrome_profile_path():
    """获取用户默认的Chrome配置文件路径"""
    system = platform.system()
    
    if system == "Darwin":  # macOS
        return os.path.expanduser("~/Library/Application Support/Google/Chrome")
    elif system == "Windows":
        return os.path.expanduser("~/AppData/Local/Google/Chrome/User Data")
    elif system == "Linux":
        return os.path.expanduser("~/.config/google-chrome")
    
    return None

def start_system_chrome(url="https://www.zhipin.com/web/boss/recommend", port=9222, use_default_profile=True):
    """启动系统Chrome浏览器（调试模式）"""
    # 获取Chrome路径
    chrome_path = get_chrome_path()
    if not chrome_path:
        print("❌ 错误: 未找到系统Chrome浏览器")
        return False
    
    print(f"📌 找到系统Chrome浏览器: {chrome_path}")
    
    # 检查端口
    if is_chrome_running_with_debugging(port):
        print(f"✅ 端口 {port} 已被占用，Chrome可能已经以调试模式运行")
        return True
    
    # 准备用户数据目录
    if use_default_profile:
        # 使用用户默认的Chrome配置文件
        user_data_dir = get_default_chrome_profile_path()
        if user_data_dir and os.path.exists(user_data_dir):
            print(f"📁 使用用户默认Chrome配置文件: {user_data_dir}")
            print("✅ 这将保留您的登录状态、书签和扩展等个人数据")
        else:
            print(f"⚠️  未找到默认Chrome配置文件，创建新的配置文件")
            user_data_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/ChromeProfile")
            os.makedirs(user_data_dir, exist_ok=True)
    else:
        # 使用独立的配置文件（原有逻辑）
        user_data_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/ChromeProfile")
        os.makedirs(user_data_dir, exist_ok=True)
        print(f"📁 使用独立Chrome配置文件: {user_data_dir}")
    
    # 准备启动参数
    args = [
        chrome_path,
        f"--remote-debugging-port={port}",
        f"--user-data-dir={user_data_dir}",
        "--no-first-run",
        "--no-default-browser-check",
        # 移除 --disable-extensions，这样可以保留用户的扩展
        # "--disable-extensions",  
        "--no-sandbox",
        "--disable-popup-blocking",
        "--disable-infobars",
        "--disable-translate",
        url
    ]
    
    try:
        # 启动Chrome
        process = subprocess.Popen(args)
        print(f"🚀 系统Chrome已启动 (PID: {process.pid}, 调试端口: {port})")
        print(f"🌐 正在打开页面: {url}")
        
        # 等待Chrome启动
        time.sleep(5)  # 增加等待时间，因为加载默认配置文件可能需要更长时间
        
        # 验证Chrome是否成功启动并监听端口
        if is_chrome_running_with_debugging(port):
            print("✅ 验证成功: Chrome正在以调试模式运行")
            return True
        else:
            print("❌ 验证失败: Chrome可能未能正确启动调试模式")
            return False
            
    except Exception as e:
        print(f"❌ 启动Chrome失败: {e}")
        return False

async def prepare_browser(use_default_profile=True):
    """
    检查或启动Chrome浏览器，避免产生空白窗口
    确保使用系统Chrome而非Playwright内置浏览器
    """
    print("\n==== 准备系统Chrome浏览器 ====")
    
    # 首先检查Chrome是否已在调试模式运行
    if is_chrome_running_with_debugging(9222):
        print("✅ 检测到系统Chrome已在调试模式下运行，将使用此实例")
        return True
    
    # 如果Chrome未以调试模式运行，启动它
    print("🔍 未检测到调试模式下的Chrome，正在启动...")
    success = start_system_chrome(
        url="https://www.zhipin.com/web/boss/recommend", 
        port=9222,
        use_default_profile=use_default_profile
    )
    
    if success:
        print("✅ 系统Chrome已成功启动，稍后Playwright将连接到此浏览器")
        # 给浏览器一些额外时间完全加载
        await asyncio.sleep(3)
        return True
    else:
        print("❌ 启动系统Chrome失败，请手动启动Chrome后再试")
        print("   命令示例: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9222'")
        return False

def run_backend_server():
    """启动后端API服务"""
    print("\n==== 启动后端API服务 ====")
    
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
    
    print("\n==== 打开前端Web界面 ====")
    try:
        # 尝试打开前端URL
        webbrowser.open("http://localhost:3000")
    except Exception as e:
        print(f"打开前端界面失败: {e}")
        print("请手动访问 http://localhost:3000")

def check_dependencies():
    """检查必要的依赖是否已安装"""
    print("\n==== 检查依赖 ====")
    try:
        import fastapi
        import uvicorn
        import playwright
        import requests
        print("✅ 所有必要的依赖已安装")
        return True
    except ImportError as e:
        print(f"❌ 缺少必要的依赖: {e}")
        print("正在尝试安装依赖...")
        
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
            print("✅ 依赖安装成功")
            return True
        except Exception as e:
            print(f"❌ 安装依赖失败: {e}")
            print("请手动安装依赖: pip install -r requirements.txt")
            return False

def check_playwright_browsers():
    """检查并安装Playwright浏览器"""
    print("\n==== 检查Playwright环境 ====")
    try:
        # 设置环境变量以确保使用国内镜像
        os.environ["PLAYWRIGHT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
        os.environ["PLAYWRIGHT_CHROMIUM_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
        os.environ["PLAYWRIGHT_FIREFOX_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
        os.environ["PLAYWRIGHT_WEBKIT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
        os.environ["PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT"] = "120000"
        
        print("🔍 检查Playwright浏览器...")
        # 使用subprocess调用playwright install命令
        result = subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"❌ 安装Playwright浏览器失败: {result.stderr}")
            return False
        print("✅ Playwright环境检查完成")
        return True
    except Exception as e:
        print(f"❌ 检查Playwright浏览器出错: {e}")
        return False

async def async_main():
    """异步主函数，用于启动浏览器"""
    # 检查并准备浏览器
    return await prepare_browser()

def main():
    """主函数"""
    print_banner()
    
    # 检查并安装依赖
    if not check_dependencies():
        return
    
    # 检查Playwright浏览器
    check_playwright_browsers()
    
    # 删除自动启动浏览器的逻辑，改为只提示用户
    print("\n✅ 系统准备就绪，即将启动服务...")
    print("💡 提示: 启动后请通过Web界面手动启动浏览器")
    
    # 启动前端界面（在新线程中）
    threading.Thread(target=open_frontend, daemon=True).start()
    
    # 启动后端服务（主线程）
    run_backend_server()

if __name__ == "__main__":
    print("""
    ===== Sourcing Copilot 启动工具 =====
    
    工作原理:
    1. 先检查并使用系统Chrome浏览器（以调试模式启动）
    2. Playwright将连接到这个系统Chrome而非使用内置浏览器
    3. 这种方式能有效绕过Boss直聘的反爬虫机制
    4. 启动后端API服务和前端界面
    
    优势:
    - 使用真实的系统Chrome，而非Playwright内置浏览器
    - 避免创建多个浏览器实例和空白窗口
    - 可以保持登录状态和Cookie
    
    如果您的Chrome浏览器有问题，请手动启动Chrome:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9222'
    """)
    main() 