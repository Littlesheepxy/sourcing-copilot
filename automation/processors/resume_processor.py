"""
简历处理器模块
负责自动化处理Boss直聘简历
"""

import random
import asyncio
import time
import os
import re

from automation.processors.data_extractor import DataExtractor
from automation.processors.evaluation_helper import EvaluationHelper
from automation.processors.card_extractor import CardExtractor
from automation.processors.interaction_handler import InteractionHandler

# 导入拆分后的模块
from automation.processors.resume_page_processor import ResumePageProcessor
from automation.processors.resume_card_processor import ResumeCardProcessor
from automation.processors.resume_detail_processor import ResumeDetailProcessor
from automation.processors.navigation_helper import NavigationHelper
from automation.processors.logging_helper import LoggingHelper

class ResumeProcessor:
    """简历处理器类，用于自动化处理Boss直聘简历"""
    
    def __init__(self, browser, rules_engine, selectors=None, data_extractor=None):
        """
        初始化简历处理器
        
        Args:
            browser: 浏览器管理器
            rules_engine: 规则引擎
            selectors: 选择器配置
            data_extractor: 数据提取器，用于OCR提取
        """
        self.browser = browser
        self.rules_engine = rules_engine
        self.selectors = selectors or {}
        self.is_processing = False
        self.processed_count = 0
        self.processed_ids = set()  # 已处理ID集合，避免重复处理
        self.max_process_count = 0  # 添加最大处理数量属性，0表示不限制
        self.candidates_log = []    # 添加候选人日志记录
        
        # 设置数据提取器
        if data_extractor:
            self.data_extractor = data_extractor
            print("已设置数据提取器，可使用OCR提取canvas和图片格式简历")
        else:
            self.data_extractor = DataExtractor()
            print("已创建默认数据提取器")
            
        # 确保日志目录存在
        self.log_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/logs")
        os.makedirs(self.log_dir, exist_ok=True)
        
        # 初始化交互处理器
        self.interaction_handler = InteractionHandler(self.log_dir)
        
        # 初始化拆分后的处理器模块 - 注意初始化顺序，先初始化详情页处理器
        self.detail_processor = ResumeDetailProcessor(self)
        self.card_processor = ResumeCardProcessor(self)
        self.page_processor = ResumePageProcessor(self)
        self.navigation_helper = NavigationHelper(self)
        self.logging_helper = LoggingHelper(self)
        
        # 加载并打印规则配置
        self._print_rule_config()
        
    def _print_rule_config(self):
        """打印当前规则配置"""
        try:
            config = self.browser._load_config()
            
            # 提取岗位关键词
            position_rules = [r for r in config.get("rules", []) if r.get("type") == "岗位" and r.get("enabled")]
            position_keywords = []
            for rule in position_rules:
                position_keywords.extend(rule.get("keywords", []))
            
            # 提取竞对公司关键词
            company_rules = [r for r in config.get("rules", []) if r.get("type") == "公司" and r.get("enabled")]
            company_keywords = []
            for rule in company_rules:
                company_keywords.extend(rule.get("keywords", []))
            
            # 提取岗位核心关键词
            keyword_rules = [r for r in config.get("rules", []) if r.get("type") == "岗位核心关键词" and r.get("enabled")]
            keywords = []
            pass_score = 60
            if keyword_rules:
                pass_score = keyword_rules[0].get("passScore", 60)
                for rule in keyword_rules:
                    keywords.extend(rule.get("keywords", []))
            
            # 打印规则配置摘要
            print("\n===== 当前规则配置 =====")
            print(f"🔍 期望职位: {', '.join(position_keywords)}")
            print(f"🏢 竞对公司: {', '.join(company_keywords)}")
            print(f"📝 关键词评分阈值: {pass_score}")
            print(f"📝 关键词: {', '.join(keywords)}")
            print("规则逻辑: 期望职位不匹配直接淘汰，期望职位匹配且是竞对公司直接打招呼，否则查看详情页进行关键词评分")
            print("=========================\n")
            
        except Exception as e:
            print(f"打印规则配置失败: {e}")
    
    def reset_processed_ids(self):
        """重置已处理ID，允许重新处理所有卡片"""
        old_count = len(self.processed_ids)
        self.processed_ids.clear()
        print(f"已重置处理状态，清除了 {old_count} 个已处理ID")
        return old_count
        
    async def process_recommend_list_page(self, page, config):
        """处理推荐列表页"""
        return await self.page_processor.process_recommend_list_page(page, config)
        
    async def process_resume_card(self, page, card, config):
        """处理单个简历卡片"""
        return await self.card_processor.process_resume_card(page, card, config)
        
    async def process_detail_page(self, page, config, card_resume_data=None):
        """处理简历详情页"""
        return await self.detail_processor.process_detail_page(page, config, card_resume_data)
        
    async def process_detail_page_iframe(self, iframe, parent_page, config, card_resume_data=None):
        """处理在iframe中的简历详情页"""
        return await self.detail_processor.process_detail_page_iframe(iframe, parent_page, config, card_resume_data)
        
    async def _go_to_next_page(self, page):
        """通过滚动加载更多卡片"""
        return await self.navigation_helper.go_to_next_page(page)
        
    async def _try_close_detail_page(self, page):
        """尝试关闭详情页"""
        return await self.navigation_helper.try_close_detail_page(page)
        
    def stop_processing(self):
        """停止处理"""
        self.is_processing = False
        
    def get_processed_count(self):
        """获取已处理数量"""
        return self.processed_count 

    def set_max_process_count(self, count):
        """设置最大处理简历数量"""
        return self.logging_helper.set_max_process_count(count)

    def get_candidates_log(self):
        """获取候选人日志"""
        return self.logging_helper.get_candidates_log()
    
    def log_candidate(self, candidate_data, action, reason=""):
        """记录候选人处理信息"""
        return self.logging_helper.log_candidate(candidate_data, action, reason)

    def set_debug_level(self, level):
        """设置调试日志级别"""
        return self.logging_helper.set_debug_level(level)
        
    def save_processing_log(self, filename=None):
        """保存处理日志到文件"""
        return self.logging_helper.save_processing_log(filename)
        
    def is_detail_page_processing(self):
        """检查详情页是否正在处理中"""
        return self.detail_processor.processing_detail