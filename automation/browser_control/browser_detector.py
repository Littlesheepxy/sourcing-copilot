"""
浏览器检测器模块
负责检测并连接到已打开的Chrome浏览器实例
"""

import os
import json
import subprocess
import asyncio
import platform
import time
import requests
from playwright.async_api import async_playwright

from automation.browser_control.page_detector import PageDetector

class BrowserDetector:
    """浏览器检测器类，用于检测和连接已打开的浏览器"""
    
    def __init__(self):
        """初始化浏览器检测器"""
        self.playwright = None
        self.page_detector = PageDetector()
        
    async def find_existing_browsers(self):
        """
        查找系统中已经打开的Chrome浏览器
        
        Returns:
            list: 已打开浏览器的调试端口列表
        """
        # Mac系统下查找Chrome进程
        if platform.system() == "Darwin":  # macOS
            try:
                # 查找所有Chrome进程
                result = subprocess.run(
                    ["ps", "-ax", "-o", "pid,command"],
                    capture_output=True,
                    text=True
                )
                
                # 查找指定了远程调试端口的Chrome进程
                debug_ports = []
                for line in result.stdout.splitlines():
                    if "Google Chrome" in line and "--remote-debugging-port=" in line:
                        try:
                            # 提取调试端口
                            port_part = line.split("--remote-debugging-port=")[1].split()[0]
                            debug_ports.append(int(port_part))
                        except Exception:
                            continue
                
                return debug_ports
                
            except Exception as e:
                print(f"查找Chrome进程失败: {e}")
                return []
                
        # Windows系统下查找Chrome进程
        elif platform.system() == "Windows":
            try:
                # 使用tasklist和findstr查找Chrome进程
                result = subprocess.run(
                    ["tasklist", "/fi", "imagename eq chrome.exe", "/v"],
                    capture_output=True,
                    text=True
                )
                
                # 查找命令行参数
                chrome_pids = []
                for line in result.stdout.splitlines():
                    if "chrome.exe" in line:
                        parts = line.split()
                        if len(parts) > 1:
                            try:
                                chrome_pids.append(int(parts[1]))
                            except ValueError:
                                continue
                
                # 对每个PID查询命令行参数
                debug_ports = []
                for pid in chrome_pids:
                    try:
                        # 使用wmic查询命令行
                        wmic_result = subprocess.run(
                            ["wmic", "process", "where", f"ProcessId={pid}", "get", "CommandLine"],
                            capture_output=True,
                            text=True
                        )
                        
                        for line in wmic_result.stdout.splitlines():
                            if "--remote-debugging-port=" in line:
                                port_part = line.split("--remote-debugging-port=")[1].split()[0]
                                debug_ports.append(int(port_part))
                                break
                    except Exception:
                        continue
                        
                return debug_ports
                
            except Exception as e:
                print(f"查找Chrome进程失败: {e}")
                return []
                
        # Linux系统下查找Chrome进程
        elif platform.system() == "Linux":
            try:
                # 查找所有Chrome进程
                result = subprocess.run(
                    ["ps", "-ax", "-o", "pid,command"],
                    capture_output=True,
                    text=True
                )
                
                # 查找指定了远程调试端口的Chrome进程
                debug_ports = []
                for line in result.stdout.splitlines():
                    if ("google-chrome" in line or "chromium" in line) and "--remote-debugging-port=" in line:
                        try:
                            # 提取调试端口
                            port_part = line.split("--remote-debugging-port=")[1].split()[0]
                            debug_ports.append(int(port_part))
                        except Exception:
                            continue
                
                return debug_ports
                
            except Exception as e:
                print(f"查找Chrome进程失败: {e}")
                return []
                
        return []
    
    def get_chrome_debugging_url(self, port=9222):
        """
        获取Chrome远程调试WebSocket URL
        
        Args:
            port: Chrome远程调试端口
            
        Returns:
            str: WebSocket URL
        """
        try:
            # 尝试获取调试信息
            response = requests.get(f"http://localhost:{port}/json/version")
            if response.status_code == 200:
                data = response.json()
                if "webSocketDebuggerUrl" in data:
                    return data["webSocketDebuggerUrl"]
        except Exception as e:
            print(f"获取调试URL失败: {e}")
            
        return None
    
    async def connect_to_browser(self, port=9222):
        """
        连接到指定调试端口的Chrome浏览器
        
        Args:
            port: Chrome远程调试端口
            
        Returns:
            tuple: (browser, context, page) 浏览器实例、上下文和页面
        """
        try:
            # 验证端口是否开放
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            
            if result != 0:
                print(f"端口 {port} 未开放，无法连接到Chrome")
                return None, None, None
                
            # 获取WebSocket URL
            ws_url = self.get_chrome_debugging_url(port)
            if not ws_url:
                print(f"无法获取Chrome调试WebSocket URL")
                return None, None, None
            
            print(f"正在连接到浏览器，WebSocket URL: {ws_url}")
            
            # 启动Playwright
            self.playwright = await async_playwright().start()
            
            # 使用WebSocket URL连接
            browser = await self.playwright.chromium.connect_over_cdp(ws_url)
            
            # 获取现有的上下文
            contexts = browser.contexts
            if not contexts:
                # 如果没有上下文，创建一个新的
                context = await browser.new_context()
            else:
                context = contexts[0]
                
            # 获取现有的页面
            pages = context.pages
            if not pages:
                # 如果没有页面，创建一个新的
                page = await context.new_page()
            else:
                page = pages[0]
                
            return browser, context, page
            
        except Exception as e:
            print(f"连接到浏览器失败: {e}")
            
            # 清理资源
            if self.playwright:
                try:
                    await self.playwright.stop()
                except:
                    pass
                self.playwright = None
                
            return None, None, None
    
    async def detect_chrome_with_boss_page(self):
        """
        检测已打开的Chrome浏览器中是否有Boss直聘推荐页面
        
        Returns:
            tuple: (browser, context, page, page_type) 浏览器实例、上下文、页面和页面类型
        """
        # 先尝试连接到默认端口9222
        print("尝试连接到默认端口9222")
        browser, context, page = await self.connect_to_browser(9222)
        
        if browser and page:
            try:
                # 检查页面URL
                url = page.url
                page_type = self.page_detector.get_current_page_type(url)
                
                # 如果是Boss直聘推荐页面或详情页，返回该页面
                if page_type in ["recommend", "detail"]:
                    print(f"成功连接到浏览器，发现Boss直聘页面，类型: {page_type}")
                    return browser, context, page, page_type
                    
                # 尝试检查所有打开的标签页
                pages = context.pages
                for p in pages:
                    url = p.url
                    page_type = self.page_detector.get_current_page_type(url)
                    if page_type in ["recommend", "detail"]:
                        print(f"成功连接到浏览器，发现Boss直聘页面，类型: {page_type}")
                        return browser, context, p, page_type
                
                # 如果没有找到Boss直聘页面，关闭连接
                print("已连接到浏览器，但未找到Boss直聘页面")
                await browser.close()
                if self.playwright:
                    await self.playwright.stop()
                    self.playwright = None
                    
            except Exception as e:
                print(f"检查页面失败: {e}")
                if browser:
                    await browser.close()
                if self.playwright:
                    await self.playwright.stop()
                    self.playwright = None
        
        # 查找其他可能的Chrome实例
        ports = await self.find_existing_browsers()
        ports = [p for p in ports if p != 9222]  # 排除已经检查过的端口
        
        # 如果没有找到其他已打开的浏览器，返回None
        if not ports:
            print("未检测到其他已打开的Chrome浏览器")
            return None, None, None, "unknown"
            
        # 尝试连接每个浏览器并检查页面
        for port in ports:
            print(f"尝试连接到端口 {port}")
            browser, context, page = await self.connect_to_browser(port)
            
            if not browser or not page:
                continue
                
            try:
                # 获取所有页面
                pages = context.pages
                
                # 检查每个页面是否是Boss直聘页面
                for p in pages:
                    url = p.url
                    page_type = self.page_detector.get_current_page_type(url)
                    
                    # 如果是Boss直聘推荐页面或详情页，返回该页面
                    if page_type in ["recommend", "detail"]:
                        print(f"成功连接到浏览器，发现Boss直聘页面，类型: {page_type}")
                        return browser, context, p, page_type
                        
                # 如果没有找到Boss直聘页面，关闭连接
                print(f"已连接到端口 {port}，但未找到Boss直聘页面")
                await browser.close()
                if self.playwright:
                    await self.playwright.stop()
                    self.playwright = None
                    
            except Exception as e:
                print(f"检查页面失败: {e}")
                if browser:
                    await browser.close()
                if self.playwright:
                    await self.playwright.stop()
                    self.playwright = None
                    
        # 如果所有浏览器都没有Boss直聘页面，返回None
        print("未检测到已打开的Boss直聘页面")
        return None, None, None, "unknown" 