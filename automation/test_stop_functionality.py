#!/usr/bin/env python3
"""
测试停止功能的脚本
用于验证终止按钮是否能正确停止自动化流程
"""

import requests
import time
import json

def test_stop_functionality():
    """测试停止功能"""
    base_url = "http://localhost:8000"
    
    print("🧪 开始测试停止功能...")
    
    # 1. 检查当前状态
    try:
        response = requests.get(f"{base_url}/api/status")
        if response.status_code == 200:
            status = response.json()
            print(f"📊 当前状态: 运行中={status.get('running', False)}")
        else:
            print("❌ 无法获取当前状态")
            return False
    except Exception as e:
        print(f"❌ 连接API失败: {e}")
        return False
    
    # 2. 如果没有运行，先启动自动化
    if not status.get('running', False):
        print("🚀 自动化未运行，先启动...")
        try:
            response = requests.post(f"{base_url}/api/automation/start")
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print("✅ 自动化已启动")
                    time.sleep(2)  # 等待启动
                else:
                    print(f"❌ 启动失败: {result.get('message')}")
                    return False
        except Exception as e:
            print(f"❌ 启动失败: {e}")
            return False
    
    # 3. 等待几秒钟让自动化运行
    print("⏳ 等待自动化运行...")
    time.sleep(5)
    
    # 4. 检查是否正在运行
    try:
        response = requests.get(f"{base_url}/api/status")
        if response.status_code == 200:
            status = response.json()
            if status.get('running', False):
                print("✅ 确认自动化正在运行")
            else:
                print("⚠️ 自动化可能没有正常启动")
        else:
            print("❌ 无法确认运行状态")
    except Exception as e:
        print(f"❌ 检查运行状态失败: {e}")
    
    # 5. 发送停止请求
    print("🛑 发送停止请求...")
    try:
        response = requests.post(f"{base_url}/api/automation/stop")
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ 停止请求已发送")
            else:
                print(f"❌ 停止请求失败: {result.get('message')}")
                return False
        else:
            print(f"❌ 停止请求失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 发送停止请求失败: {e}")
        return False
    
    # 6. 等待并检查是否已停止
    print("⏳ 等待停止生效...")
    for i in range(10):  # 等待最多10秒
        time.sleep(1)
        try:
            response = requests.get(f"{base_url}/api/status")
            if response.status_code == 200:
                status = response.json()
                if not status.get('running', True):
                    print(f"✅ 自动化已成功停止 (用时 {i+1} 秒)")
                    return True
                else:
                    print(f"⏳ 等待停止... ({i+1}/10 秒)")
            else:
                print(f"❌ 检查状态失败，状态码: {response.status_code}")
        except Exception as e:
            print(f"❌ 检查停止状态失败: {e}")
    
    print("❌ 停止功能测试失败：自动化在10秒内未能停止")
    return False

if __name__ == "__main__":
    success = test_stop_functionality()
    if success:
        print("🎉 停止功能测试通过！")
    else:
        print("💥 停止功能测试失败！")
        print("请检查：")
        print("1. 后端服务是否在运行 (http://localhost:8000)")
        print("2. 终止按钮的API调用是否正确")
        print("3. BrowserManager的停止逻辑是否工作正常") 