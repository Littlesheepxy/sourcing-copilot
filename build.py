#!/usr/bin/env python3
"""
Sourcing Copilot 打包脚本
用于生成macOS可执行文件
"""

import os
import subprocess
import shutil
import platform
import sys

def main():
    """主函数"""
    print("正在打包 Sourcing Copilot 应用...")
    
    # 确认当前环境
    if platform.system() != "Darwin":
        print("错误: 打包脚本仅支持macOS")
        sys.exit(1)
        
    # 创建构建目录
    if os.path.exists("build"):
        shutil.rmtree("build")
    os.makedirs("build", exist_ok=True)
    
    # 安装依赖
    print("安装依赖...")
    subprocess.run(["pip", "install", "-r", "requirements.txt"], check=True)
    
    # 安装playwright
    print("安装Playwright浏览器...")
    subprocess.run(["python", "-m", "playwright", "install", "chromium"], check=True)
    
    # 使用PyInstaller打包
    print("使用PyInstaller打包应用...")
    subprocess.run([
        "pyinstaller",
        "--name=SourcingCopilot",
        "--onefile",
        "--windowed",
        "--add-data=./automation:automation",
        "--icon=./icon.icns",  # 需要提供图标文件
        "main.py"
    ], check=True)
    
    # 复制必要的文件到dist目录
    print("复制必要文件...")
    os.makedirs("dist/SourcingCopilot.app/Contents/Resources/app", exist_ok=True)
    
    # 创建DMG包
    print("创建DMG安装包...")
    try:
        subprocess.run([
            "hdiutil", "create",
            "-volname", "SourcingCopilot",
            "-srcfolder", "dist/SourcingCopilot.app",
            "-ov", "-format", "UDZO",
            "dist/SourcingCopilot.dmg"
        ], check=True)
        print("DMG安装包已创建: dist/SourcingCopilot.dmg")
    except Exception as e:
        print(f"创建DMG失败: {e}")
        print("跳过DMG创建，可以直接使用应用程序")
    
    print("打包完成!")
    print("可执行文件位于: dist/SourcingCopilot.app")

if __name__ == "__main__":
    main() 