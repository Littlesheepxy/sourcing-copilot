"""
Sourcing Copilot API服务
提供REST API管理规则和自动化操作
"""

import os
import json
import asyncio
import uvicorn
import time
import uuid
import glob
import logging
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, WebSocket, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from sqlalchemy.orm import Session

from automation.browser_control.browser_manager import BrowserManager
from automation.rules_engine.simple_rules_engine import SimpleRulesEngine
from automation.utils.start_chrome import start_chrome_with_debugging, is_browser_running_with_debugging
from automation.utils.screenshot_manager import ScreenshotManager

# 导入数据库相关模块
from automation.database.db import get_db_session, init_db, check_db_connection
from automation.database.models import Candidate, CandidateStatus, OperationLog as DBOperationLog
from candidate_repository import CandidateRepository

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
LOGS_PATH = os.path.join(CONFIG_DIR, "logs.json")

# 确保配置目录存在
os.makedirs(CONFIG_DIR, exist_ok=True)

# 初始化数据库
print("正在初始化数据库...")
if init_db():
    print("数据库初始化成功")
    if check_db_connection():
        print("数据库连接测试成功")
    else:
        print("警告：数据库连接测试失败")
else:
    print("错误：数据库初始化失败")

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
    # 新增AI智能筛选字段
    jobDescription: Optional[str] = None  # 职位描述
    talentProfile: Optional[str] = None   # 人才画像
    filterCriteria: Optional[str] = None  # AI生成的筛选标准
    strictLevel: Optional[str] = "balanced"  # 筛选严格程度：relaxed, balanced, strict
    focusAreas: Optional[List[str]] = []     # 重点关注领域
    customPrompts: Optional[List[str]] = []  # 自定义提示词
    aiEnabled: Optional[bool] = False        # 是否启用AI智能筛选
    
class LaunchBrowserRequest(BaseModel):
    url: Optional[str] = "https://www.zhipin.com/web/boss/recommend"
    port: Optional[int] = 9222
    force_new: Optional[bool] = False
    use_default_profile: Optional[bool] = True
    wait_for_pages: Optional[bool] = True

class LogEntry(BaseModel):
    id: str
    timestamp: str
    action: str
    details: str
    dataType: Optional[str] = None
    dataId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# 日志存储
logs_data = []

# 辅助函数
def load_logs():
    """从文件加载日志"""
    global logs_data
    if os.path.exists(LOGS_PATH):
        try:
            with open(LOGS_PATH, "r", encoding="utf-8") as f:
                logs_data = json.load(f)
        except Exception as e:
            print(f"读取日志文件失败: {e}")
            logs_data = []
    else:
        logs_data = []

def save_logs():
    """保存日志到文件"""
    try:
        with open(LOGS_PATH, "w", encoding="utf-8") as f:
            json.dump(logs_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存日志文件失败: {e}")

# 加载日志数据
load_logs()

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
async def get_candidates(limit: int = 100, offset: int = 0):
    """获取候选人列表"""
    try:
        print(f"DEBUG: 从数据库获取候选人列表，limit={limit}, offset={offset}")
        
        # 使用数据库获取候选人
        candidates = CandidateRepository.get_candidates(limit=limit, offset=offset)
        
        # 转换为API响应格式
        candidates_data = []
        for candidate in candidates:
            # 处理技能数据
            skills = []
            if hasattr(candidate, 'skills') and candidate.skills:
                for candidate_skill in candidate.skills:
                    if hasattr(candidate_skill, 'skill') and candidate_skill.skill:
                        skills.append(candidate_skill.skill.name)
            
            # 处理标签数据
            tags = []
            if hasattr(candidate, 'tags') and candidate.tags:
                for tag in candidate.tags:
                    tags.append(tag.name)
            
            candidate_dict = {
                "id": candidate.id,
                "name": candidate.name or "",
                "education": candidate.education or "",
                "experience": candidate.experience or "",
                "skills": skills,
                "company": candidate.company or "",
                "school": candidate.school or "",
                "position": candidate.position or "",
                "detail": candidate.detail or "",
                "status": candidate.status.value if candidate.status else "new",
                "createdAt": candidate.created_at.isoformat() if candidate.created_at else "",
                "updatedAt": candidate.updated_at.isoformat() if candidate.updated_at else "",
                "matchScore": candidate.match_score,
                "match": candidate.match,
                "greeting": candidate.greeting or "",
                "tags": tags,
                "source": candidate.source or "",
                "sourceId": candidate.source_id or ""
            }
            candidates_data.append(candidate_dict)
        
        print(f"DEBUG: 成功获取{len(candidates_data)}个候选人")
        return {"success": True, "data": candidates_data}
        
    except Exception as e:
        print(f"获取候选人列表失败: {e}")
        import traceback
        traceback.print_exc()
        
        # 如果数据库查询失败，尝试从JSON文件读取
        try:
            print("DEBUG: 数据库查询失败，尝试从JSON文件读取候选人数据")
            
            json_file = os.path.expanduser("~/Library/Application Support/SourcingCopilot/candidates.json")
            if os.path.exists(json_file):
                print(f"DEBUG: 尝试读取候选人数据文件: {json_file}")
                print(f"DEBUG: 文件是否存在: {os.path.exists(json_file)}")
                
                with open(json_file, 'r', encoding='utf-8') as f:
                    raw_data = json.load(f)
                
                print(f"DEBUG: 从文件读取到的原始数据: {raw_data}")
                print(f"DEBUG: 原始数据类型: {type(raw_data)}")
                print(f"DEBUG: 原始数据长度: {len(raw_data) if isinstance(raw_data, list) else 'N/A'}")
                
                # 标准化数据格式
                candidates_data = []
                for i, item in enumerate(raw_data):
                    print(f"DEBUG: 处理第{i+1}个候选人: {item.get('name', '未知')}")
                    
                    # 确保所有必需字段都存在
                    candidate = {
                        "id": item.get("id", f"temp_{i}"),
                        "name": item.get("name", ""),
                        "education": item.get("education", ""),
                        "experience": item.get("experience", ""),
                        "skills": item.get("skills", []),
                        "company": item.get("company", ""),
                        "school": item.get("school", ""),
                        "position": item.get("position", ""),
                        "detail": item.get("detail"),
                        "status": item.get("status", "new"),
                        "createdAt": item.get("createdAt", ""),
                        "updatedAt": item.get("updatedAt", ""),
                        "matchScore": item.get("matchScore"),
                        "match": item.get("match"),
                        "greeting": item.get("greeting")
                    }
                    candidates_data.append(candidate)
                    print(f"DEBUG: 成功标准化候选人: {candidate['name']}")
                
                print(f"DEBUG: 成功读取JSON文件，包含{len(candidates_data)}条记录")
                print(f"DEBUG: 标准化后的数据: {candidates_data}")
                
                return {"success": True, "data": candidates_data}
            else:
                print("DEBUG: JSON文件不存在，返回空列表")
                return {"success": True, "data": []}
                
        except Exception as json_error:
            print(f"从JSON文件读取候选人数据也失败: {json_error}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e), "data": []}

@app.post("/api/candidates")
async def create_candidate(candidate_data: Dict[str, Any]):
    """创建新候选人"""
    try:
        print(f"DEBUG: 创建新候选人: {candidate_data.get('name', 'unknown')}")
        
        # 创建候选人
        candidate = CandidateRepository.create_candidate(
            name=candidate_data.get("name", ""),
            education=candidate_data.get("education"),
            experience=candidate_data.get("experience"),
            skills=candidate_data.get("skills", []),
            company=candidate_data.get("company"),
            school=candidate_data.get("school"),
            position=candidate_data.get("position"),
            status=CandidateStatus.NEW,
            source=candidate_data.get("source", "manual"),
            raw_data=candidate_data
        )
        
        # 转换为API响应格式
        candidate_dict = {
            "id": candidate.id,
            "name": candidate.name,
            "education": candidate.education,
            "experience": candidate.experience,
            "company": candidate.company,
            "school": candidate.school,
            "position": candidate.position,
            "status": candidate.status.value,
            "createdAt": candidate.created_at.isoformat(),
            "updatedAt": candidate.updated_at.isoformat(),
            "matchScore": candidate.match_score,
            "greeting": candidate.greeting,
            "skills": candidate_data.get("skills", [])
        }
        
        print(f"DEBUG: 成功创建候选人: {candidate.name}")
        return {"success": True, "data": candidate_dict}
        
    except Exception as e:
        print(f"创建候选人失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@app.get("/api/candidates/{candidate_id}")
async def get_candidate_by_id(candidate_id: str):
    """获取单个候选人详情"""
    try:
        print(f"DEBUG: 获取候选人详情: {candidate_id}")
        
        candidate = CandidateRepository.get_candidate_by_id(candidate_id)
        if not candidate:
            return {"success": False, "error": "候选人不存在", "data": None}
        
        # 转换为API响应格式
        candidate_dict = {
            "id": candidate.id,
            "name": candidate.name,
            "education": candidate.education,
            "experience": candidate.experience,
            "company": candidate.company,
            "school": candidate.school,
            "position": candidate.position,
            "status": candidate.status.value if candidate.status else "new",
            "createdAt": candidate.created_at.isoformat() if candidate.created_at else None,
            "updatedAt": candidate.updated_at.isoformat() if candidate.updated_at else None,
            "matchScore": candidate.match_score,
            "greeting": candidate.greeting,
            "skills": [cs.skill.name for cs in candidate.skills] if candidate.skills else [],
            # 添加详细信息
            "detail": {
                "workExperience": "\n".join([
                    f"{we.company} | {we.position} | {we.start_date.strftime('%Y-%m') if we.start_date else '未知'}-{we.end_date.strftime('%Y-%m') if we.end_date else '至今'}\n{we.description or ''}"
                    for we in candidate.work_experiences
                ]) if candidate.work_experiences else None,
                "educationExperience": "\n".join([
                    f"{edu.school} | {edu.degree or ''} {edu.major or ''} | {edu.start_date.strftime('%Y-%m') if edu.start_date else '未知'}-{edu.end_date.strftime('%Y-%m') if edu.end_date else '至今'}"
                    for edu in candidate.educations
                ]) if candidate.educations else None,
                "projectExperience": "\n".join([
                    f"{proj.name} | {proj.role or ''} | {proj.start_date.strftime('%Y-%m') if proj.start_date else '未知'}-{proj.end_date.strftime('%Y-%m') if proj.end_date else '至今'}\n{proj.description or ''}"
                    for proj in candidate.projects
                ]) if candidate.projects else None
            }
        }
        
        return {"success": True, "data": candidate_dict}
        
    except Exception as e:
        print(f"获取候选人详情失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": None}

@app.put("/api/candidates/{candidate_id}/status")
async def update_candidate_status(candidate_id: str, status_data: Dict[str, Any]):
    """更新候选人状态"""
    try:
        status_str = status_data.get("status")
        if not status_str:
            return {"success": False, "error": "缺少状态参数", "data": None}
        
        print(f"DEBUG: 更新候选人状态: {candidate_id} -> {status_str}")
        
        # 转换状态字符串为枚举
        try:
            status = CandidateStatus(status_str)
        except ValueError:
            return {"success": False, "error": f"无效的状态值: {status_str}", "data": None}
        
        # 更新状态
        candidate = CandidateRepository.update_candidate_status(candidate_id, status)
        if not candidate:
            return {"success": False, "error": "候选人不存在", "data": None}
        
        # 转换为API响应格式
        candidate_dict = {
            "id": candidate.id,
            "name": candidate.name,
            "education": candidate.education,
            "experience": candidate.experience,
            "company": candidate.company,
            "school": candidate.school,
            "position": candidate.position,
            "status": candidate.status.value,
            "createdAt": candidate.created_at.isoformat() if candidate.created_at else None,
            "updatedAt": candidate.updated_at.isoformat() if candidate.updated_at else None,
            "matchScore": candidate.match_score,
            "greeting": candidate.greeting,
            "skills": [cs.skill.name for cs in candidate.skills] if candidate.skills else []
        }
        
        print(f"DEBUG: 成功更新候选人状态: {candidate.name} -> {status.value}")
        return {"success": True, "data": candidate_dict}
        
    except Exception as e:
        print(f"更新候选人状态失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": None}

# 日志API端点
@app.get("/api/logs")
async def get_logs(limit: int = 100, offset: int = 0):
    """获取操作日志列表"""
    try:
        print(f"DEBUG: 从数据库获取日志列表，limit={limit}, offset={offset}")
        
        # 使用数据库获取日志
        with get_db_session() as session:
            logs = session.query(DBOperationLog)\
                .order_by(DBOperationLog.timestamp.desc())\
                .offset(offset)\
                .limit(limit)\
                .all()
        
        # 转换为API响应格式
        logs_data = []
        for log in logs:
            log_dict = {
                "id": str(log.id),
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "action": log.action,
                "details": log.details,
                "dataType": log.data_type,
                "dataId": log.data_id,
                "metadata": log.log_metadata
            }
            logs_data.append(log_dict)
        
        print(f"DEBUG: 成功从数据库获取{len(logs_data)}条日志记录")
        return {"success": True, "data": logs_data}
        
    except Exception as e:
        print(f"获取日志数据失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}

@app.post("/api/logs")
async def add_log(log: LogEntry):
    """添加操作日志"""
    try:
        print(f"DEBUG: 添加日志: {log.action}")
        
        # 创建数据库日志记录
        with get_db_session() as session:
            db_log = DBOperationLog(
                timestamp=datetime.fromisoformat(log.timestamp) if log.timestamp else datetime.now(),
                action=log.action,
                details=log.details,
                data_type=log.dataType,
                data_id=log.dataId,
                log_metadata=log.metadata
            )
            session.add(db_log)
            session.flush()
            
            # 转换为API响应格式
            log_dict = {
                "id": str(db_log.id),
                "timestamp": db_log.timestamp.isoformat(),
                "action": db_log.action,
                "details": db_log.details,
                "dataType": db_log.data_type,
                "dataId": db_log.data_id,
                "metadata": db_log.log_metadata
            }
        
        print(f"DEBUG: 成功添加日志: {log.action}")
        return {"success": True, "data": log_dict}
        
    except Exception as e:
        print(f"添加日志失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@app.delete("/api/logs")
async def clear_logs():
    """清空日志"""
    try:
        print("DEBUG: 清空所有日志")
        
        with get_db_session() as session:
            deleted_count = session.query(DBOperationLog).delete()
            
        print(f"DEBUG: 成功删除{deleted_count}条日志记录")
        return {"success": True, "message": f"已清空{deleted_count}条日志"}
        
    except Exception as e:
        print(f"清空日志失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@app.get("/api/logs/export")
async def export_logs():
    """导出日志"""
    try:
        print("DEBUG: 导出所有日志")
        
        with get_db_session() as session:
            logs = session.query(DBOperationLog)\
                .order_by(DBOperationLog.timestamp.desc())\
                .all()
        
        # 转换为导出格式
        export_data = []
        for log in logs:
            log_dict = {
                "id": str(log.id),
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "action": log.action,
                "details": log.details,
                "dataType": log.data_type,
                "dataId": log.data_id,
                "metadata": log.log_metadata
            }
            export_data.append(log_dict)
        
        print(f"DEBUG: 成功导出{len(export_data)}条日志记录")
        return {"success": True, "data": json.dumps(export_data, ensure_ascii=False)}
        
    except Exception as e:
        print(f"导出日志失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

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
        url = request.url
        port = request.port
        force_new = request.force_new
        use_default_profile = request.use_default_profile
        wait_for_pages = request.wait_for_pages
        
        # 先检查是否已经有我们管理的浏览器在运行
        if not force_new and browser_manager.browser and browser_manager.page:
            try:
                # 检查浏览器是否还活着
                await browser_manager.page.evaluate("1")  # 简单测试页面是否响应
                
                # 如果已经连接到浏览器，只需要导航到指定URL
                await browser_manager.page.goto(url, wait_until="domcontentloaded")
                await browser_manager.detect_page_type()
                
                return {
                    "success": True,
                    "message": f"浏览器已经在运行，已导航到 {url}",
                    "pageType": browser_manager.current_page_type
                }
            except Exception as e:
                print(f"浏览器可能已关闭，需要重新启动: {e}")
                # 关闭已失效的浏览器连接
                await browser_manager.close_browser()
        
        # 检查指定端口是否已有调试模式Chrome在运行
        debug_mode_running = is_browser_running_with_debugging(port)
        
        if debug_mode_running and not force_new:
            print(f"检测到端口 {port} 上已有调试模式Chrome，尝试连接...")
            # 尝试连接到现有的调试模式浏览器
            success = await browser_manager.start_browser(use_existing=True)
            
            if success:
                # 导航到指定URL
                await browser_manager.page.goto(url, wait_until="domcontentloaded")
                await browser_manager.detect_page_type()
                
                return {
                    "success": True,
                    "message": f"已连接到现有调试模式浏览器并导航到 {url}",
                    "pageType": browser_manager.current_page_type
                }
            else:
                print(f"连接到端口 {port} 的Chrome失败，将启动新的Chrome实例")
        
        # 启动新的Chrome实例（带调试模式）
        print(f"启动新的Chrome浏览器实例，调试端口: {port}")
        success, actual_port = start_chrome_with_debugging(
            url=url, 
            port=port, 
            use_default_profile=use_default_profile
        )
        
        if success:
            # 等待Chrome启动
            print("等待Chrome启动完成...")
            await asyncio.sleep(3)  # 增加等待时间
            
            # 连接到新启动的浏览器，使用实际端口
            browser_success = await browser_manager.start_browser(use_existing=True, cdp_port=actual_port)
            
            if browser_success:
                # 导航到指定URL（如果还没有打开的话）
                current_url = await browser_manager.page.url
                if not current_url.startswith("https://www.zhipin.com"):
                    await browser_manager.page.goto(url, wait_until="domcontentloaded")
                    
                await browser_manager.detect_page_type()
                
                return {
                    "success": True,
                    "message": f"已启动新的Chrome浏览器并导航到 {url} (端口: {actual_port})",
                    "pageType": browser_manager.current_page_type,
                    "port": actual_port
                }
            else:
                return {
                    "success": False,
                    "message": f"Chrome启动成功（端口: {actual_port}），但无法建立Playwright连接，请重试或刷新页面"
                }
        else:
            return {
                "success": False,
                "message": "启动Chrome浏览器失败，请确保Chrome浏览器已安装且端口未被占用"
            }
            
    except Exception as e:
        print(f"启动浏览器出错: {e}")
        import traceback
        traceback.print_exc()
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
    try:
        browser_manager.selectors = selectors
        return {"success": True, "message": "选择器配置已更新"}
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "更新选择器配置失败"
        }

@app.get("/api/screenshots")
async def get_screenshots():
    """获取截图列表"""
    screenshot_manager = ScreenshotManager()
    screenshots = screenshot_manager.list_screenshots()
    return {"success": True, "data": screenshots}

@app.get("/api/screenshots/report")
async def generate_screenshots_report():
    """生成截图报告"""
    try:
        screenshot_manager = ScreenshotManager()
        report_path = screenshot_manager.generate_html_report()
        
        return {
            "success": True,
            "message": "截图报告已生成",
            "path": report_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "生成截图报告失败"
        }

@app.post("/api/screenshots/clean")
async def clean_screenshots(days: int = 30):
    """清理旧截图"""
    screenshot_manager = ScreenshotManager()
    removed_count = screenshot_manager.clean_old_screenshots(days)
    return {"success": True, "message": f"已清理 {removed_count} 个超过 {days} 天的截图"}

@app.get("/api/screenshots/scan")
async def scan_screenshots_directory():
    """扫描截图目录"""
    screenshot_manager = ScreenshotManager()
    screenshots = screenshot_manager.scan_directory()
    return {"success": True, "data": screenshots}

# 事件处理
@app.on_event("startup")
async def startup_event():
    """应用启动时执行"""
    print("API服务已启动")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行"""
    print("API服务已关闭")
    if browser_manager:
        browser_manager.stop_automation()
        asyncio.create_task(browser_manager.close_browser())

# 主函数
def main():
    """主入口函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Sourcing Copilot API服务")
    parser.add_argument("--host", default="127.0.0.1", help="监听主机")
    parser.add_argument("--port", type=int, default=8000, help="监听端口")
    
    args = parser.parse_args()
    
    # 启动FastAPI应用
    uvicorn.run(app, host=args.host, port=args.port)

if __name__ == "__main__":
    main() 