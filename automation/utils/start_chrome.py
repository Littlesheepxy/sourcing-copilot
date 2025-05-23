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

def get_default_chrome_profile_path():
    """
    获取用户默认的Chrome配置文件路径
    
    Returns:
        str: 默认Chrome配置文件路径
    """
    system = platform.system()
    
    if system == "Darwin":  # macOS
        return os.path.expanduser("~/Library/Application Support/Google/Chrome")
    elif system == "Windows":
        return os.path.expanduser("~/AppData/Local/Google/Chrome/User Data")
    elif system == "Linux":
        return os.path.expanduser("~/.config/google-chrome")
    
    return None

def start_chrome_with_debugging(url="https://www.zhipin.com/web/boss/recommend", port=9222, 
                                user_data_dir=None, use_default_profile=False):
    """
    以远程调试模式启动Chrome浏览器
    
    Args:
        url: 启动URL
        port: 远程调试端口
        user_data_dir: 用户数据目录，如果为None则根据use_default_profile参数确定
        use_default_profile: 是否使用用户默认Chrome配置文件（保留登录信息）
        
    Returns:
        tuple: (是否成功启动, 实际使用的端口号)
    """
    chrome_path = get_chrome_path()
    
    if not chrome_path:
        print("未找到Chrome浏览器")
        return False, port
        
    try:
        # 检查端口是否已被使用
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        
        port_occupied = result == 0
        final_port = port
        
        # 如果端口被占用，寻找可用端口
        if port_occupied:
            print(f"端口 {port} 已被占用，寻找可用的替代端口...")
            for test_port in range(port + 1, port + 10):  # 测试后续10个端口
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                test_result = sock.connect_ex(('127.0.0.1', test_port))
                sock.close()
                if test_result != 0:  # 端口可用
                    final_port = test_port
                    print(f"将使用端口 {final_port} 启动新的Chrome实例")
                    break
            else:
                print(f"无法找到可用端口（尝试了 {port+1} 到 {port+10}），将尝试使用原端口 {port}")
                final_port = port
        
        # 确定用户数据目录 - 强制使用独立配置文件以避免与现有Chrome冲突
        if user_data_dir is None:
            if use_default_profile:
                # 即使用户要求使用默认配置文件，我们也创建一个独立的副本
                # 这样可以保留登录信息，但不会与现有Chrome实例冲突
                default_profile = get_default_chrome_profile_path()
                if default_profile and os.path.exists(default_profile):
                    user_data_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/ChromeProfile_Default")
                    print(f"创建独立的Chrome配置文件副本: {user_data_dir}")
                    print("✅ 这将保留您的登录状态，但使用独立实例避免冲突")
                    
                    # 如果目录不存在，从默认配置文件复制重要数据
                    if not os.path.exists(user_data_dir):
                        os.makedirs(user_data_dir, exist_ok=True)
                        try:
                            # 复制登录相关的关键文件（如果存在）
                            import shutil
                            default_dir = os.path.join(default_profile, "Default")
                            target_default_dir = os.path.join(user_data_dir, "Default")
                            
                            if os.path.exists(default_dir):
                                os.makedirs(target_default_dir, exist_ok=True)
                                
                                # 复制登录状态和cookie相关文件
                                important_files = [
                                    "Cookies", "Login Data", "Web Data", 
                                    "Local Storage", "Session Storage"
                                ]
                                
                                for file_name in important_files:
                                    src_path = os.path.join(default_dir, file_name)
                                    dst_path = os.path.join(target_default_dir, file_name)
                                    
                                    if os.path.exists(src_path):
                                        try:
                                            if os.path.isfile(src_path):
                                                shutil.copy2(src_path, dst_path)
                                            elif os.path.isdir(src_path):
                                                shutil.copytree(src_path, dst_path, dirs_exist_ok=True)
                                            print(f"已复制: {file_name}")
                                        except Exception as e:
                                            print(f"复制 {file_name} 时出错: {e}")
                                            
                        except Exception as e:
                            print(f"复制配置文件时出错: {e}")
                else:
                    print("⚠️  未找到默认Chrome配置文件，创建新的配置文件")
                    user_data_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/ChromeProfile")
                    os.makedirs(user_data_dir, exist_ok=True)
            else:
                # 使用独立的配置文件
                user_data_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/ChromeProfile")
                os.makedirs(user_data_dir, exist_ok=True)
                print(f"使用独立Chrome配置文件: {user_data_dir}")
        else:
            # 使用指定的用户数据目录
            os.makedirs(user_data_dir, exist_ok=True)
            print(f"使用指定Chrome用户数据目录: {user_data_dir}")
        
        # 如果使用不同端口，需要使用不同的用户数据目录避免冲突
        if final_port != 9222:
            user_data_dir = f"{user_data_dir}_port_{final_port}"
            os.makedirs(user_data_dir, exist_ok=True)
            print(f"使用端口特定的用户数据目录: {user_data_dir}")
        
        # 启动参数 - 简化参数以确保页面正确加载
        args = [
            chrome_path,
            f"--remote-debugging-port={final_port}",
            f"--user-data-dir={user_data_dir}",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-popup-blocking",
            "--disable-infobars",
            "--disable-translate"
        ]
        
        # 如果使用默认配置文件，保留扩展程序
        if not use_default_profile:
            args.append("--disable-extensions")
        
        # 添加URL作为最后一个参数
        args.append(url)
        
        # 启动Chrome
        print(f"启动独立Chrome实例，命令: {' '.join(args[:10])}... {url}")
        process = subprocess.Popen(args)
        print(f"✅ Chrome已启动，进程ID: {process.pid}, 调试端口: {final_port}")
        
        # 等待Chrome启动完成并验证调试端口，增加重试机制
        wait_time = 5 if use_default_profile else 3
        print(f"等待Chrome启动完成（{wait_time}秒）...")
        time.sleep(wait_time)
        
        # 验证Chrome是否成功启动并监听端口，增加重试机制
        max_retries = 5
        for retry in range(max_retries):
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            verify_result = sock.connect_ex(('127.0.0.1', final_port))
            sock.close()
            
            if verify_result == 0:
                print(f"✅ 验证成功: Chrome正在端口 {final_port} 监听调试连接")
                return True, final_port
            else:
                if retry < max_retries - 1:
                    print(f"⏱️  第{retry+1}次验证失败，等待2秒后重试...")
                    time.sleep(2)
                else:
                    print(f"❌ 验证失败: 经过{max_retries}次尝试，Chrome可能未能在端口 {final_port} 启动调试模式")
                    print(f"   进程ID: {process.pid}，请检查Chrome是否正常启动")
                    return False, final_port
        
    except Exception as e:
        print(f"启动Chrome失败: {e}")
        import traceback
        traceback.print_exc()
        return False, port

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
    success, actual_port = start_chrome_with_debugging(url, port)
    if success:
        print(f"Chrome启动成功，实际使用端口: {actual_port}")
    else:
        print("Chrome启动失败") 