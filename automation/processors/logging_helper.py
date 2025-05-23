"""
日志助手模块
负责处理日志记录和候选人信息跟踪
"""

import time
import os

# 添加数据库保存功能
from candidate_repository import CandidateRepository
from automation.database.models import CandidateStatus, OperationLog
from automation.database.db import get_db_session
from datetime import datetime

class LoggingHelper:
    """日志助手类，处理日志记录和状态管理"""
    
    def __init__(self, resume_processor):
        """
        初始化日志助手
        
        Args:
            resume_processor: 父简历处理器对象
        """
        self.processor = resume_processor
        self.debug_level = 1  # 默认日志级别: 0=精简, 1=正常, 2=详细, 3=全部
        
    def set_max_process_count(self, count):
        """
        设置最大处理简历数量
        
        Args:
            count: 最大处理数量，0表示不限制
            
        Returns:
            int: 设置后的最大处理数量
        """
        try:
            self.processor.max_process_count = int(count)
            print(f"设置最大处理数量: {self.processor.max_process_count}")
        except ValueError:
            self.processor.max_process_count = 0
            print(f"无效的处理数量，设置为不限制")
        return self.processor.max_process_count
        
    def get_candidates_log(self):
        """
        获取候选人日志
        
        Returns:
            list: 候选人日志列表
        """
        try:
            return self.processor.candidates_log
        except Exception as e:
            # 记录异常但正常返回空列表，不传递异常
            print(f"获取候选人列表失败: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def log_candidate(self, candidate_data, action, reason=""):
        """
        记录候选人处理信息，同时保存到数据库
        
        Args:
            candidate_data: 候选人数据
            action: 执行的操作 ('greet'|'skip')
            reason: 操作原因
            
        Returns:
            bool: 是否成功记录
        """
        try:
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
            log_entry = {
                "timestamp": timestamp,
                "name": candidate_data.get("name", "未知"),
                "position": candidate_data.get("position", "未知"),
                "company": candidate_data.get("company", []),
                "action": action,
                "reason": reason,
                "link": candidate_data.get("link", ""),
                # 新增调试信息
                "has_html_content": bool(candidate_data.get("html_content")),
                "has_full_text": bool(candidate_data.get("fullText")),
                "is_boss_html_resume": candidate_data.get("is_boss_html_resume", False),
                "is_using_card_data_only": candidate_data.get("is_using_card_data_only", False),
                "text_length": len(candidate_data.get("fullText", "")) if candidate_data.get("fullText") else 0
            }
            
            # 打印详细的日志信息到控制台
            print(f"📊 候选人处理记录:")
            print(f"   👤 姓名: {log_entry['name']}")
            print(f"   💼 职位: {log_entry['position']}")
            print(f"   🏢 公司: {log_entry['company']}")
            print(f"   🎯 动作: {log_entry['action']}")
            print(f"   📝 原因: {log_entry['reason']}")
            print(f"   📄 数据类型: HTML={log_entry['has_html_content']}, 文本={log_entry['has_full_text']}, 长度={log_entry['text_length']}")
            print(f"   🔗 链接: {log_entry['link']}")
            
            # 保存到内存日志
            self.processor.candidates_log.append(log_entry)
            
            candidate_id = None
            
            # 保存候选人数据到数据库
            try:
                print(f"💾 正在保存候选人数据到数据库...")
                
                # 处理技能数据
                skills = []
                if candidate_data.get("skills"):
                    if isinstance(candidate_data["skills"], str):
                        skills = [s.strip() for s in candidate_data["skills"].split(",") if s.strip()]
                    elif isinstance(candidate_data["skills"], list):
                        skills = [str(s).strip() for s in candidate_data["skills"] if str(s).strip()]
                
                # 处理公司数据
                company_str = ""
                if candidate_data.get("company"):
                    if isinstance(candidate_data["company"], list):
                        company_str = "; ".join([str(c) for c in candidate_data["company"] if c])
                    else:
                        company_str = str(candidate_data["company"])
                
                # 确定候选人状态
                if action == "greet":
                    status = CandidateStatus.CONTACTED
                else:
                    status = CandidateStatus.NEW
                
                # 创建候选人记录
                candidate = CandidateRepository.create_candidate(
                    name=candidate_data.get("name", "未知"),
                    education=candidate_data.get("education", ""),
                    experience=candidate_data.get("experience", ""),
                    skills=skills,
                    company=company_str,
                    school=candidate_data.get("school", ""),
                    position=candidate_data.get("position", ""),
                    status=status,
                    source="Boss直聘",
                    source_id=candidate_data.get("link", ""),
                    raw_data=candidate_data,
                    detail=candidate_data.get("fullText", ""),
                    match_score=candidate_data.get("score"),
                    greeting=candidate_data.get("greeting", "")
                )
                
                candidate_id = candidate.id
                print(f"✅ 候选人 {candidate_data.get('name')} 已保存到数据库，ID: {candidate.id}")
                
            except Exception as db_error:
                print(f"❌ 保存候选人到数据库失败: {db_error}")
                import traceback
                traceback.print_exc()
                # 即使数据库保存失败，也不影响日志记录的成功
            
            # 保存操作日志到数据库
            try:
                print(f"📝 正在保存操作日志到数据库...")
                
                action_text = "打招呼" if action == "greet" else "跳过"
                details = f"{action_text}候选人: {candidate_data.get('name', '未知')}"
                if reason:
                    details += f" (原因: {reason})"
                
                with get_db_session() as session:
                    db_log = OperationLog(
                        timestamp=datetime.now(),
                        action=action_text,
                        details=details,
                        data_type="candidate",
                        data_id=candidate_id,
                        log_metadata={
                            "candidate_name": candidate_data.get("name", "未知"),
                            "candidate_position": candidate_data.get("position", "未知"),
                            "candidate_company": company_str,
                            "action_reason": reason,
                            "source_url": candidate_data.get("link", "")
                        }
                    )
                    session.add(db_log)
                    session.flush()
                    
                    print(f"✅ 操作日志已保存到数据库，ID: {db_log.id}")
                
            except Exception as log_error:
                print(f"❌ 保存操作日志到数据库失败: {log_error}")
                import traceback
                traceback.print_exc()
                # 即使操作日志保存失败，也不影响候选人记录的成功
            
            # 如果日志过长，保留最近的100条
            if len(self.processor.candidates_log) > 100:
                self.processor.candidates_log = self.processor.candidates_log[-100:]
                
            return True
        except Exception as e:
            print(f"❌ 记录候选人日志失败: {e}")
            import traceback
            traceback.print_exc()
            return False

    def set_debug_level(self, level):
        """
        设置调试日志级别
        
        Args:
            level: 日志级别 (0:精简 1:正常 2:详细 3:全部)
            
        Returns:
            int: 设置后的日志级别
        """
        self.debug_level = level
        print(f"设置调试日志级别为: {level}")
        return level
        
    def save_processing_log(self, filename=None):
        """
        保存处理日志到文件
        
        Args:
            filename: 文件名，不提供则使用时间戳
            
        Returns:
            str: 保存的文件路径
        """
        try:
            if not filename:
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                filename = f"resume_processing_{timestamp}.log"
                
            log_path = os.path.join(self.processor.log_dir, filename)
            
            # 汇总日志内容
            log_content = []
            log_content.append("===== 简历处理日志 =====")
            log_content.append(f"处理时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
            log_content.append(f"总处理数量: {self.processor.processed_count}")
            log_content.append(f"处理规则: {self.processor.rules_engine.get_rule_summary() if hasattr(self.processor.rules_engine, 'get_rule_summary') else '未知'}")
            log_content.append("\n===== 候选人列表 =====")
            
            # 添加候选人记录
            for i, candidate in enumerate(self.processor.candidates_log):
                log_content.append(f"\n[{i+1}] {candidate.get('name', '未知')} - {candidate.get('position', '未知')}")
                log_content.append(f"    操作: {candidate.get('action', '未知')} - 原因: {candidate.get('reason', '未知')}")
                log_content.append(f"    公司: {', '.join(candidate.get('company', []))}")
                log_content.append(f"    时间: {candidate.get('timestamp', '未知')}")
                if candidate.get('link'):
                    log_content.append(f"    链接: {candidate.get('link', '')}")
            
            # 写入文件
            with open(log_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(log_content))
                
            print(f"处理日志已保存到: {log_path}")
            return log_path
            
        except Exception as e:
            print(f"保存处理日志失败: {e}")
            return None 