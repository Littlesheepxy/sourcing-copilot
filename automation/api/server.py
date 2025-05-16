"""
Sourcing Copilot API服务
提供REST API管理规则和自动化操作
"""

import os
import json
import asyncio
import uvicorn
import time
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

from automation.browser_control.browser_manager import BrowserManager
from automation.rules_engine.simple_rules_engine import SimpleRulesEngine
from automation.utils.start_chrome import start_chrome_with_debugging, is_browser_running_with_debugging
from automation.utils.screenshot_manager import ScreenshotManager

# 创建FastAPI应用
app = FastAPI(title="Sourcing Copilot API")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头
)

# 全局实例
browser_manager = BrowserManager()
rules_engine = SimpleRulesEngine()

# 配置文件路径
CONFIG_DIR = os.path.expanduser("~/Library/Application Support/SourcingCopilot")
CONFIG_PATH = os.path.join(CONFIG_DIR, "config.json")

# 确保配置目录存在
os.makedirs(CONFIG_DIR, exist_ok=True)

# 数据模型
class Rule(BaseModel):
    id: str
    type: str
    keywords: List[str]
    importance: int
    mustMatch: bool
    enabled: bool
    order: Optional[int] = 0
    passScore: Optional[int] = None

class RulesConfig(BaseModel):
    rules: List[Rule]
    autoMode: bool
    passScore: Optional[int] = None
    
class LaunchBrowserRequest(BaseModel):
    url: Optional[str] = "https://www.zhipin.com/web/boss/recommend"
    port: Optional[int] = 9222
    force_new: Optional[bool] = False

# API路由
@app.get("/api/config")
async def get_config():
    """获取规则配置"""
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"读取配置文件失败: {e}")
    
    # 返回默认配置
    return rules_engine.create_default_config()

@app.post("/api/config")
async def save_config(config: Dict[str, Any]):
    """保存规则配置"""
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        return {"success": True, "message": "配置已保存"}
    except Exception as e:
        print(f"保存配置文件失败: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/automation/start")
async def start_automation(background_tasks: BackgroundTasks):
    """启动自动化任务"""
    if browser_manager.is_running:
        return {"success": False, "message": "自动化任务已在运行"}
    
    # 在后台启动自动化任务
    background_tasks.add_task(browser_manager.start_automation)
    return {"success": True, "message": "自动化任务已启动"}

@app.post("/api/automation/stop")
async def stop_automation():
    """停止自动化任务"""
    browser_manager.stop_automation()
    return {"success": True, "message": "自动化任务已停止"}

@app.get("/api/status")
async def get_status():
    """获取当前状态"""
    status = browser_manager.get_status()
    
    return {
        "running": browser_manager.is_running,
        "pageType": browser_manager.current_page_type,
        "processedCount": browser_manager.processed_count,
        "candidates": browser_manager.get_greeted_candidates(10)[::-1]  # 返回最近10条记录，倒序
    }

@app.get("/api/candidates")
async def get_candidates(limit: int = 100):
    """获取已打招呼的候选人列表"""
    candidates = browser_manager.get_greeted_candidates(limit)
    return {"success": True, "candidates": candidates}

@app.post("/api/candidates/reset")
async def reset_candidates():
    """重置候选人处理状态，允许重新处理所有卡片"""
    if not browser_manager.resume_processor:
        return {"success": False, "message": "处理器未初始化"}
        
    count = browser_manager.resume_processor.reset_processed_ids()
    return {"success": True, "message": f"已重置处理状态，清除了 {count} 个已处理ID"}

@app.post("/api/detect")
async def detect_browser():
    """检测浏览器并返回状态"""
    try:
        # 如果浏览器已经在运行，获取当前状态
        if browser_manager.browser and browser_manager.page:
            # 更新页面类型
            await browser_manager.detect_page_type()
            return {
                "success": True,
                "connected": True,
                "pageType": browser_manager.current_page_type,
                "message": f"已连接浏览器，当前页面类型：{browser_manager.current_page_type}"
            }
        
        # 先检查是否有浏览器在调试模式下运行
        debug_mode_running = is_browser_running_with_debugging(9222)
        if not debug_mode_running:
            return {
                "success": True,
                "connected": False,
                "pageType": "unknown",
                "message": "未发现以调试模式运行的Chrome浏览器，请使用启动浏览器功能"
            }
            
        # 尝试检测和连接到已打开的浏览器
        browser, context, page, page_type = await browser_manager.browser_detector.detect_chrome_with_boss_page()
        
        if browser and page:
            # 关闭之前的连接
            if browser_manager.browser:
                await browser_manager.close_browser()
            
            # 设置浏览器管理器
            browser_manager.browser = browser
            browser_manager.context = context
            browser_manager.page = page
            browser_manager.playwright = browser_manager.browser_detector.playwright
            browser_manager.current_page_type = page_type
            
            # 设置页面加载事件
            browser_manager.page.on("load", browser_manager._on_page_load)
            
            return {
                "success": True,
                "connected": True,
                "pageType": page_type,
                "message": f"已连接到浏览器，当前页面类型：{page_type}"
            }
        else:
            return {
                "success": True,
                "connected": False,
                "pageType": "unknown",
                "message": "未检测到已打开的Boss直聘页面，请前往Boss直聘"
            }
    except Exception as e:
        print(f"检测浏览器出错: {e}")
        return {
            "success": False,
            "connected": False,
            "error": str(e),
            "message": "检测浏览器失败"
        }

@app.post("/api/browser/launch")
async def launch_browser(request: LaunchBrowserRequest = LaunchBrowserRequest()):
    """启动Chrome浏览器"""
    try:
        # 如果强制启动新浏览器，则关闭现有的连接
        if request.force_new and browser_manager.browser:
            await browser_manager.close_browser()
        
        # 检查端口是否已被占用
        if is_browser_running_with_debugging(request.port) and not request.force_new:
            print(f"端口 {request.port} 已被占用，尝试连接到现有浏览器")
            
            # 尝试连接到现有浏览器
            browser, context, page, page_type = await browser_manager.browser_detector.detect_chrome_with_boss_page()
            
            if browser and page:
                # 关闭之前的连接
                if browser_manager.browser:
                    await browser_manager.close_browser()
                
                # 设置浏览器管理器
                browser_manager.browser = browser
                browser_manager.context = context
                browser_manager.page = page
                browser_manager.playwright = browser_manager.browser_detector.playwright
                browser_manager.current_page_type = page_type
                
                # 设置页面加载事件
                browser_manager.page.on("load", browser_manager._on_page_load)
                
                # 导航到目标URL（如果不是Boss直聘页面）
                if page_type not in ["recommend", "detail"]:
                    await browser_manager.navigate_to(request.url)
                    await browser_manager.detect_page_type()
                
                return {
                    "success": True,
                    "connected": True,
                    "pageType": browser_manager.current_page_type,
                    "message": f"已连接到现有浏览器，当前页面类型：{browser_manager.current_page_type}"
                }
        
        # 启动Chrome浏览器
        success = start_chrome_with_debugging(url=request.url, port=request.port)
        
        if success:
            # 等待浏览器启动
            for attempt in range(5):  # 最多尝试5次，每次等待2秒
                print(f"等待浏览器启动，尝试 {attempt+1}/5")
                await asyncio.sleep(2)
                
                # 尝试连接到浏览器
                browser, context, page, page_type = await browser_manager.browser_detector.detect_chrome_with_boss_page()
                
                if browser and page:
                    # 关闭之前的连接
                    if browser_manager.browser:
                        await browser_manager.close_browser()
                    
                    # 设置浏览器管理器
                    browser_manager.browser = browser
                    browser_manager.context = context
                    browser_manager.page = page
                    browser_manager.playwright = browser_manager.browser_detector.playwright
                    browser_manager.current_page_type = page_type
                    
                    # 设置页面加载事件
                    browser_manager.page.on("load", browser_manager._on_page_load)
                    
                    return {
                        "success": True,
                        "connected": True,
                        "pageType": page_type,
                        "message": f"已启动并连接到浏览器，当前页面类型：{page_type}"
                    }
            
            # 尝试多次后仍未成功连接
            return {
                "success": True,
                "connected": False,
                "message": "已启动浏览器，但未能连接到目标页面，请稍后重试检测"
            }
        else:
            return {
                "success": False,
                "message": "启动浏览器失败，请确保Chrome浏览器已安装"
            }
    except Exception as e:
        print(f"启动浏览器出错: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "启动浏览器失败"
        }

@app.get("/api/selectors")
async def get_selectors():
    """获取选择器配置"""
    return browser_manager.selectors

@app.post("/api/selectors")
async def update_selectors(selectors: Dict[str, Any]):
    """更新选择器配置"""
    browser_manager.selectors.update(selectors)
    return {"success": True, "message": "选择器已更新"}

# 初始化截图管理器
screenshot_manager = ScreenshotManager()

# 添加截图浏览API端点
@app.get("/api/screenshots")
async def get_screenshots():
    """获取所有截图"""
    try:
        screenshots = screenshot_manager.get_all_screenshots()
        return {"success": True, "data": screenshots}
    except Exception as e:
        return {"success": False, "message": f"获取截图失败: {e}"}

@app.get("/api/screenshots/report")
async def generate_screenshots_report():
    """生成HTML截图报告"""
    try:
        report_path = screenshot_manager.generate_html_report()
        if report_path:
            return {
                "success": True, 
                "message": "截图报告生成成功", 
                "path": report_path,
                "url": f"file://{report_path}"
            }
        else:
            return {"success": False, "message": "截图报告生成失败"}
    except Exception as e:
        return {"success": False, "message": f"生成截图报告失败: {e}"}

@app.post("/api/screenshots/clean")
async def clean_screenshots(days: int = 30):
    """清理旧截图"""
    try:
        count = screenshot_manager.clean_old_screenshots(days)
        return {"success": True, "message": f"已清理 {count} 个旧截图"}
    except Exception as e:
        return {"success": False, "message": f"清理截图失败: {e}"}

@app.get("/api/screenshots/scan")
async def scan_screenshots_directory():
    """扫描截图目录"""
    try:
        count = screenshot_manager.scan_directory()
        return {"success": True, "message": f"已扫描并注册 {count} 个新截图"}
    except Exception as e:
        return {"success": False, "message": f"扫描截图目录失败: {e}"}

# 应用启动和关闭事件
@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    print("API服务已启动")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    # 确保浏览器关闭
    if browser_manager.browser:
        asyncio.create_task(browser_manager.close_browser())
    print("API服务已关闭")

# 主函数
def main():
    """主函数"""
    # 启动FastAPI应用
    uvicorn.run(
        "automation.api.server:app", 
        host="127.0.0.1", 
        port=8000,
        reload=False
    )

if __name__ == "__main__":
    main() 