"""
浏览器管理器模块
负责管理Playwright浏览器实例和页面操作
"""

import asyncio
import os
import json
from playwright.async_api import async_playwright

from automation.browser_control.page_detector import PageDetector
from automation.browser_control.browser_detector import BrowserDetector
from automation.processors.resume_processor import ResumeProcessor
from automation.rules_engine.simple_rules_engine import SimpleRulesEngine

class BrowserManager:
    """浏览器管理器类，控制Playwright浏览器实例"""
    
    def __init__(self):
        """初始化浏览器管理器"""
        self.browser = None
        self.page = None
        self.context = None
        self.playwright = None
        
        self.is_running = False
        self.current_page_type = "unknown"
        self.processed_count = 0
        
        self.page_detector = PageDetector()
        self.browser_detector = BrowserDetector()
        self.rules_engine = SimpleRulesEngine()
        self.resume_processor = None
        
        # stealth.min.js路径
        self.stealth_js_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "stealth.min.js")
        
        # 初始化并启用OCR
        try:
            from automation.processors.data_extractor import DataExtractor
            self.data_extractor = DataExtractor()
            ocr_enabled = self.data_extractor.enable_ocr()
            if ocr_enabled:
                print("OCR功能已启用，可识别Canvas和图片格式简历")
            else:
                print("OCR功能启用失败，将使用常规方式提取简历信息")
        except Exception as e:
            print(f"初始化OCR提取功能出错: {e}")
            self.data_extractor = None
        
        # Boss直聘选择器配置
        self.selectors = {
            "resumeCard": ".card-inner.common-wrap",
            "name": ".name",
            "expectPosition": ".join-text-wrap",
            "company": ".timeline-wrap.work-exps",
            "school": ".school,.edu-exp",
            "skills": ".tag-list,.skill-tag",
            "greetButton": ".btn.btn-greet,button[class*='btn-greet']",
            "detailGreetButton": ".btn-v2.btn-sure-v2.btn-greet,button[class*='btn-greet']",
            "closeButton": ".icon-close",
            "detailPage": {
                "container": ".resume-detail-wrap",
                "workExperience": ".work-exp-box,.timeline-wrap.work-exps",
                "educationExperience": ".edu-exp-box",
                "projectExperience": ".project-exp-box",
                "expectation": ".expect-box,.join-text-wrap"
            },
            "greetTextArea": ".chat-editor,textarea",
            "sendButton": ".send-message-btn,button:has-text('发送')"
        }
        
    async def start_browser(self, use_existing=True, connect_cdp=True, cdp_port=9222):
        """
        启动浏览器
        
        Args:
            use_existing: 是否尝试连接已存在的浏览器
            connect_cdp: 是否尝试通过CDP连接到调试模式的Chrome
            cdp_port: CDP调试端口
            
        Returns:
            bool: 是否成功启动或连接浏览器
        """
        try:
            # 如果浏览器已启动，先关闭
            if self.browser:
                await self.close_browser()
            
            # 尝试检测和连接已存在的浏览器
            if use_existing:
                # 1. 首先尝试通过CDP连接到远程调试模式的Chrome (推荐方式)
                if connect_cdp:
                    try:
                        print(f"尝试通过CDP连接到端口 {cdp_port} 的Chrome浏览器...")
                        
                        # 检查端口是否开放
                        import socket
                        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        result = sock.connect_ex(('127.0.0.1', cdp_port))
                        sock.close()
                        
                        if result == 0:  # 端口开放
                            # 获取WebSocket URL
                            ws_url = self._get_chrome_debugging_url(cdp_port)
                            if ws_url:
                                print(f"找到Chrome WebSocket URL: {ws_url}")
                                
                                # 启动Playwright
                                self.playwright = await async_playwright().start()
                                
                                # 通过CDP连接到Chrome
                                self.browser = await self.playwright.chromium.connect_over_cdp(ws_url)
                                
                                # 获取现有的上下文
                                contexts = self.browser.contexts
                                if contexts:
                                    self.context = contexts[0]
                                    
                                    # 获取现有的页面
                                    pages = self.context.pages
                                    if pages:
                                        # 查找Boss直聘页面
                                        for p in pages:
                                            url = p.url
                                            page_type = self.page_detector.get_current_page_type(url)
                                            if page_type != "unknown":
                                                self.page = p
                                                self.current_page_type = page_type
                                                break
                                        
                                        # 如果没有找到Boss直聘页面，使用第一个页面
                                        if not self.page:
                                            self.page = pages[0]
                                            self.current_page_type = self.page_detector.get_current_page_type(self.page.url)
                                    else:
                                        # 不创建新页面，因为这会导致空白窗口
                                        print("未找到页面，但不创建新页面，这可能导致空白窗口")
                                        print("请确保浏览器中已有打开的页面")
                                        return False
                                else:
                                    # 不创建新上下文，因为这可能导致新窗口
                                    print("未找到浏览器上下文，但不创建新上下文，这可能导致新窗口")
                                    print("请确保浏览器已正确启动，并尝试刷新或打开新页面后重试")
                                    return False
                                
                                # 设置页面加载事件
                                self.page.on("load", self._on_page_load)
                                
                                # 注入stealth.min.js脚本
                                try:
                                    if os.path.exists(self.stealth_js_path):
                                        with open(self.stealth_js_path, "r") as f:
                                            stealth_script = f.read()
                                        await self.page.add_init_script(stealth_script)
                                        print("已在页面注入增强版stealth.min.js脚本，提高反爬能力")
                                        
                                        # 为所有页面注入脚本
                                        for p in self.context.pages:
                                            if p != self.page:
                                                await p.add_init_script(stealth_script)
                                    else:
                                        print(f"stealth.min.js脚本文件不存在: {self.stealth_js_path}")
                                except Exception as e:
                                    print(f"注入stealth.min.js脚本失败: {e}")
                                
                                print(f"已通过CDP成功连接到Chrome浏览器，当前页面: {self.page.url}")
                                return True
                    except Exception as e:
                        print(f"通过CDP连接Chrome失败: {e}")
                
                # 2. 尝试通过Browser Detector连接到已打开的Boss直聘页面
                try:
                    browser, context, page, page_type = await self.browser_detector.detect_chrome_with_boss_page()
                    
                    # 如果找到了已打开的Boss直聘页面，使用它
                    if browser and page:
                        self.browser = browser
                        self.context = context
                        self.page = page
                        self.playwright = self.browser_detector.playwright
                        self.current_page_type = page_type
                        
                        # 设置页面加载事件
                        self.page.on("load", self._on_page_load)
                        
                        # 在现有页面注入stealth.min.js脚本
                        try:
                            if os.path.exists(self.stealth_js_path):
                                with open(self.stealth_js_path, "r") as f:
                                    stealth_script = f.read()
                                await self.page.add_init_script(stealth_script)
                                print("已在现有页面注入增强版stealth.min.js脚本，提高反爬能力")
                            else:
                                print(f"stealth.min.js脚本文件不存在: {self.stealth_js_path}")
                        except Exception as e:
                            print(f"注入stealth.min.js脚本失败: {e}")
                        
                        print(f"已连接到现有浏览器，当前页面类型: {self.current_page_type}")
                        return True
                except Exception as e:
                    print(f"通过Browser Detector连接失败: {e}")
            
            # 如果没有找到已存在的浏览器或不使用已存在的浏览器，启动新的浏览器
            # 先检查是否已有Chrome在运行
            try:
                from automation.utils.start_chrome import is_browser_running_with_debugging
                if is_browser_running_with_debugging(9222):
                    print("检测到Chrome浏览器已在运行，但无法连接，请检查Chrome是否正常或关闭正在运行的Chrome")
            except Exception as e:
                print(f"检查Chrome运行状态时出错: {e}")
                
            self.playwright = await async_playwright().start()
            
            # 启动有界面浏览器（方便查看和调试）
            self.browser = await self.playwright.chromium.launch(
                headless=False,  # 有界面模式
                args=[
                    "--start-maximized",            # 最大化窗口
                    "--disable-blink-features=AutomationControlled",  # 禁用自动化控制检测
                    "--disable-features=IsolateOrigins,site-per-process",  # 禁用站点隔离
                    "--disable-extensions",         # 禁用扩展
                    "--disable-component-extensions-with-background-pages",  # 禁用带有后台页面的组件扩展
                    "--disable-default-apps",       # 禁用默认应用
                    "--disable-features=TranslateUI",  # 禁用翻译功能
                    "--disable-background-networking",  # 禁用后台网络
                    "--disable-sync",               # 禁用同步
                    "--metrics-recording-only",     # 仅记录指标
                    "--disable-background-timer-throttling",  # 禁用后台计时器节流
                    "--disable-backgrounding-occluded-windows",  # 禁用背景遮挡窗口
                    "--disable-breakpad",           # 禁用崩溃报告
                    "--disable-component-update",   # 禁用组件更新
                    "--disable-domain-reliability", # 禁用域可靠性
                    "--disable-client-side-phishing-detection"  # 禁用客户端钓鱼检测
                ]
            )
            
            # 创建上下文
            self.context = await self.browser.new_context(
                viewport=None,  # 使用系统窗口大小
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                color_scheme="light",   # 使用浅色模式
                locale="zh-CN",         # 设置中文语言
                timezone_id="Asia/Shanghai"  # 设置中国时区
            )
            
            # 为上下文设置地理位置和权限
            await self.context.grant_permissions(["geolocation"])
            await self.context.set_geolocation({"latitude": 39.9042, "longitude": 116.4074})  # 设置北京位置
            
            # 创建页面
            self.page = await self.context.new_page()
            
            # 加载stealth.min.js脚本，避免被识别为机器人
            try:
                if os.path.exists(self.stealth_js_path):
                    with open(self.stealth_js_path, "r") as f:
                        stealth_script = f.read()
                    await self.page.add_init_script(stealth_script)
                    print("已加载增强版stealth.min.js脚本，提高反爬能力")
                else:
                    print(f"stealth.min.js脚本文件不存在: {self.stealth_js_path}")
            except Exception as e:
                print(f"加载stealth.min.js脚本失败: {e}")
            
            # 设置超时
            self.page.set_default_timeout(30000)
            
            # 添加导航钩子检测页面类型
            self.page.on("load", self._on_page_load)
            
            print("新浏览器已启动")
            return True
            
        except Exception as e:
            print(f"启动浏览器失败: {e}")
            return False
    
    def _get_chrome_debugging_url(self, port=9222):
        """
        获取Chrome远程调试WebSocket URL
        
        Args:
            port: 远程调试端口
            
        Returns:
            str: WebSocket URL
        """
        try:
            import requests
            response = requests.get(f"http://localhost:{port}/json/version")
            if response.status_code == 200:
                data = response.json()
                if "webSocketDebuggerUrl" in data:
                    return data["webSocketDebuggerUrl"]
        except Exception as e:
            print(f"获取Chrome调试URL失败: {e}")
            
        return None

    async def detect_page_type(self):
        """
        检测当前页面类型
        
        Returns:
            str: 页面类型 ('recommend'|'detail'|'unknown')
        """
        if not self.page:
            return "unknown"
            
        try:
            # 先检查URL
            url = self.page.url
            page_type = self.page_detector.get_current_page_type(url)
            
            # 如果URL检测不出来，可能在iframe中
            if page_type == "unknown":
                print("URL检测无法识别页面类型，尝试检查iframe...")
                iframe_page_type, iframe = await self.page_detector.detect_page_with_iframes(self.page)
                
                if iframe_page_type != "unknown" and iframe:
                    page_type = iframe_page_type
                    print(f"在iframe中找到页面类型: {page_type}")
                    
                    # 更新当前页面类型
                    self.current_page_type = page_type
                    return page_type
            
            self.current_page_type = page_type
            return page_type
            
        except Exception as e:
            print(f"检测页面类型失败: {e}")
            return "unknown"
            
    async def close_browser(self):
        """关闭浏览器"""
        try:
            if self.resume_processor:
                self.resume_processor.stop_processing()
                
            if self.page:
                await self.page.close()
                self.page = None
                
            if self.context:
                await self.context.close()
                self.context = None
                
            if self.browser:
                await self.browser.close()
                self.browser = None
                
            if self.playwright:
                await self.playwright.stop()
                self.playwright = None
                
            self.is_running = False
            print("浏览器已关闭")
            return True
            
        except Exception as e:
            print(f"关闭浏览器失败: {e}")
            return False
            
    async def navigate_to(self, url):
        """
        导航到指定URL
        
        Args:
            url: 目标URL
            
        Returns:
            bool: 是否导航成功
        """
        try:
            if not self.page:
                await self.start_browser()
                
            await self.page.goto(url, wait_until="domcontentloaded")
            
            # 等待页面加载完成
            await asyncio.sleep(2)
            
            # 检测页面类型
            self.current_page_type = self.page_detector.get_current_page_type(self.page.url)
            print(f"已导航到 {url}，页面类型: {self.current_page_type}")
            
            return True
            
        except Exception as e:
            print(f"导航失败: {e}")
            return False
            
    async def start_automation(self):
        """启动自动化流程"""
        try:
            # 如果还没有浏览器实例，先尝试连接到已有浏览器
            if not self.browser:
                success = await self.start_browser(use_existing=True)
                if not success:
                    print("无法启动或连接到浏览器")
                    return
                
            # 如果当前不在Boss直聘，则先导航过去
            await self.detect_page_type()
            if self.current_page_type == "unknown":
                await self.navigate_to("https://www.zhipin.com/web/boss/recommend")
                
            # 加载配置
            config = self._load_config()
            
            # 初始化处理器
            if not self.resume_processor:
                # 传递data_extractor给处理器
                self.resume_processor = ResumeProcessor(
                    self, 
                    self.rules_engine, 
                    self.selectors,
                    data_extractor=self.data_extractor
                )
            
            # 重置已处理ID，以便重新处理所有卡片
            self.resume_processor.reset_processed_ids()
                
            # 设置运行状态
            self.is_running = True
            
            # 根据当前页面类型执行不同的处理逻辑
            while self.is_running:
                try:
                    # 检查浏览器是否还活着
                    if not self.browser or not self.page:
                        print("浏览器实例已关闭，尝试重新连接")
                        success = await self.start_browser(use_existing=True)
                        if not success:
                            print("无法重新连接到浏览器，自动化流程停止")
                            self.is_running = False
                            break
                            
                    # 简单测试页面是否响应
                    try:
                        await self.page.evaluate("1")
                    except Exception as e:
                        print(f"页面不响应，尝试重新连接: {e}")
                        await self.close_browser()
                        success = await self.start_browser(use_existing=True)
                        if not success:
                            print("无法重新连接到浏览器，自动化流程停止")
                            self.is_running = False
                            break
                    
                    # 检测页面类型
                    await self.detect_page_type()
                    
                    if self.current_page_type == "recommend":
                        # 处理推荐列表页
                        count = await self.resume_processor.process_recommend_list_page(self.page, config)
                        self.processed_count = self.resume_processor.get_processed_count()
                        print(f"本次处理了 {count} 个简历，总共处理: {self.processed_count}")
                        
                    elif self.current_page_type == "detail":
                        # 处理详情页
                        processed = await self.resume_processor.process_detail_page(self.page, config, None)
                        if processed:
                            self.processed_count = self.resume_processor.get_processed_count()
                            print(f"处理了详情页简历，总共处理: {self.processed_count}")
                        else:
                            # 如果处理失败，尝试通过ESC键退出详情页
                            print("详情页处理失败或未能自动关闭，尝试按ESC键退出详情页...")
                            await self.page.keyboard.press('Escape')
                            await asyncio.sleep(1)  # 等待ESC键生效
                            # 重新检测页面类型
                            await self.detect_page_type()
                            print(f"按ESC键后，当前页面类型: {self.current_page_type}")
                    
                except Exception as e:
                    print(f"处理页面时出错: {e}")
                    import traceback
                    traceback.print_exc()
                    
                    # 尝试恢复连接
                    try:
                        await self.close_browser()
                        print("尝试重新启动浏览器...")
                        success = await self.start_browser(use_existing=True)
                        if not success:
                            print("无法重新连接到浏览器，自动化流程停止")
                            self.is_running = False
                            break
                    except Exception as conn_error:
                        print(f"重新连接失败: {conn_error}")
                        self.is_running = False
                        break
                        
                # 等待用户导航或交互
                await asyncio.sleep(5)
                
                # 如果不再运行，退出循环
                if not self.is_running:
                    break
                    
            print("自动化流程已停止")
            
        except Exception as e:
            print(f"自动化流程出错: {e}")
            import traceback
            traceback.print_exc()
            self.is_running = False
            
    def stop_automation(self):
        """停止自动化流程"""
        print("🛑 收到停止自动化指令...")
        
        # 设置全局停止标志
        self.is_running = False
        
        # 停止简历处理器
        if self.resume_processor:
            print("🛑 停止简历处理器...")
            self.resume_processor.stop_processing()
            
            # 如果详情页正在处理，强制停止
            if hasattr(self.resume_processor, 'detail_processor') and self.resume_processor.detail_processor.processing_detail:
                print("🛑 强制停止详情页处理...")
                self.resume_processor.detail_processor.processing_detail = False
        
        print("✅ 自动化流程已停止")
        
        # 记录停止时间
        try:
            import time
            stop_time = time.strftime("%Y-%m-%d %H:%M:%S")
            print(f"📅 停止时间: {stop_time}")
        except Exception as e:
            print(f"记录停止时间失败: {e}")
        
    async def _on_page_load(self):
        """页面加载事件处理"""
        try:
            # 检测页面类型
            await self.detect_page_type()
            print(f"页面加载完成，当前页面类型: {self.current_page_type}")
            
        except Exception as e:
            print(f"页面加载事件处理出错: {e}")
            
    def _load_config(self):
        """加载规则配置"""
        config_path = os.path.expanduser("~/Library/Application Support/SourcingCopilot/config.json")
        
        # 如果配置文件存在，加载配置
        if os.path.exists(config_path):
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    config = json.load(f)
                    print(f"成功加载配置文件: {config_path}")
                    
                    # 提取并打印岗位规则
                    position_rules = [r for r in config.get("rules", []) if r.get("type") == "岗位" and r.get("enabled")]
                    if position_rules:
                        print("已启用的岗位规则:")
                        for rule in position_rules:
                            print(f"  - 关键词: {rule.get('keywords', [])}")
                            print(f"    必须匹配: {rule.get('mustMatch', False)}")
                    else:
                        print("警告: 未找到已启用的岗位规则，所有候选人将通过岗位筛选")
                    
                    return config
            except Exception as e:
                print(f"加载配置失败: {e}")
                
        # 返回默认配置
        print("未找到配置文件或加载失败，将使用默认配置")
        return self.rules_engine.create_default_config()
    
    def get_greeted_candidates(self, limit=100):
        """
        获取已打招呼的候选人列表，用于前端展示
        
        Args:
            limit: 返回的最大记录数
            
        Returns:
            list: 候选人记录列表
        """
        try:
            # 首先尝试读取JSON格式的候选人数据
            json_file = os.path.expanduser("~/Library/Application Support/SourcingCopilot/candidates.json")
            if os.path.exists(json_file):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        candidates = json.load(f)
                    
                    # 返回最新的limit条记录
                    return candidates[:limit]
                except Exception as e:
                    print(f"读取JSON候选人数据失败: {e}")
            
            # 如果JSON文件不存在或读取失败，尝试读取CSV格式
            if not self.resume_processor:
                return []
                
            log_file = self.resume_processor.candidates_log
            if not os.path.exists(log_file):
                return []
                
            # 读取CSV文件
            import csv
            candidates = []
            
            with open(log_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    candidates.append(row)
                    if len(candidates) >= limit:
                        break
                        
            # 返回最新的记录（倒序）
            return list(reversed(candidates))
            
        except Exception as e:
            print(f"获取候选人列表失败: {e}")
            return []
    
    def get_status(self):
        """
        获取当前状态信息，用于前端展示
        
        Returns:
            dict: 状态信息
        """
        status = {
            "isRunning": self.is_running,
            "pageType": self.current_page_type,
            "processedCount": self.processed_count,
            "activeCandidates": self.get_greeted_candidates(10),  # 最近10条记录
            "config": self._load_config()
        }
        
        return status
    
    async def test_bot_detection(self, test_url="https://bot.sannysoft.com/"):
        """
        测试机器人检测，访问一个检测机器人的网站来验证stealth.js是否有效
        
        Args:
            test_url: 用于测试机器人检测的URL
            
        Returns:
            bool: 是否通过机器人检测
        """
        if not self.page:
            print("浏览器未启动，无法测试")
            return False
            
        try:
            # 访问测试网站
            print(f"正在访问机器人检测测试网站: {test_url}")
            await self.page.goto(test_url, wait_until="networkidle")
            
            # 等待页面完全加载
            await self.page.wait_for_load_state("domcontentloaded")
            
            # 截图记录测试结果
            screenshot_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "bot_detection_test.png")
            await self.page.screenshot(path=screenshot_path, full_page=True)
            print(f"已保存测试截图至: {screenshot_path}")
            
            # 检查常见的机器人检测项目
            webdriver_value = await self.page.evaluate("() => navigator.webdriver")
            plugins_length = await self.page.evaluate("() => navigator.plugins.length")
            languages = await self.page.evaluate("() => navigator.languages")
            user_agent = await self.page.evaluate("() => navigator.userAgent")
            
            # 打印测试结果
            print("\n====== 机器人检测测试结果 ======")
            print(f"WebDriver属性: {webdriver_value} (应该为false或undefined)")
            print(f"浏览器插件数量: {plugins_length} (真实浏览器应该>0)")
            print(f"语言设置: {languages}")
            print(f"用户代理: {user_agent}")
            print("================================\n")
            
            # 判断是否通过了基本检测
            if webdriver_value == False and plugins_length > 0:
                print("基本机器人检测已通过！")
                return True
            else:
                print("未通过基本机器人检测，stealth.js可能未正确加载或未生效")
                return False
                
        except Exception as e:
            print(f"测试机器人检测失败: {e}")
            return False