"""
Chrome启动器
以远程调试模式启动Chrome浏览器
"""

import os
import sys
import platform
import subprocess
import time
from pathlib import Path

def get_chrome_path():
    """
    获取系统Chrome浏览器路径
    
    Returns:
        str: Chrome可执行文件路径
    """
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

def start_chrome_with_debugging(url="https://www.zhipin.com/web/boss/recommend", port=9222):
    """
    以远程调试模式启动Chrome浏览器
    
    Args:
        url: 启动URL
        port: 远程调试端口
        
    Returns:
        bool: 是否成功启动
    """
    chrome_path = get_chrome_path()
    
    if not chrome_path:
        print("未找到Chrome浏览器")
        return False
        
    try:
        # 先检查端口是否已被使用
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', port))
        if result == 0:  # 端口已被占用
            print(f"端口 {port} 已被占用，可能Chrome已经启动了远程调试模式")
            sock.close()
            return True
        sock.close()
        
        # 创建用户数据目录
        user_data_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/ChromeProfile")
        os.makedirs(user_data_dir, exist_ok=True)
        
        # 启动参数
        args = [
            chrome_path,
            f"--remote-debugging-port={port}",
            f"--user-data-dir={user_data_dir}",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-extensions",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-popup-blocking",
            "--disable-infobars",
            "--disable-translate",
            url
        ]
        
        # 启动Chrome
        process = subprocess.Popen(args)
        print(f"Chrome已启动，进程ID: {process.pid}, 调试端口: {port}")
        
        # 等待Chrome启动完成
        time.sleep(3)
        
        return True
        
    except Exception as e:
        print(f"启动Chrome失败: {e}")
        return False

def is_browser_running_with_debugging(port=9222):
    """
    检查是否有浏览器正在以远程调试模式运行
    
    Args:
        port: 远程调试端口
        
    Returns:
        bool: 是否发现运行中的远程调试浏览器
    """
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result == 0

if __name__ == "__main__":
    # 获取URL参数
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.zhipin.com/web/boss/recommend"
    
    # 获取端口参数
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 9222
    
    # 启动Chrome
    start_chrome_with_debugging(url, port) 