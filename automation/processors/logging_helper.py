"""
日志助手模块
负责处理日志记录和候选人信息跟踪
"""

import time
import os

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
        记录候选人处理信息
        
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
                "link": candidate_data.get("link", "")
            }
            self.processor.candidates_log.append(log_entry)
            
            # 如果日志过长，保留最近的100条
            if len(self.processor.candidates_log) > 100:
                self.processor.candidates_log = self.processor.candidates_log[-100:]
                
            return True
        except Exception as e:
            print(f"记录候选人日志失败: {e}")
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