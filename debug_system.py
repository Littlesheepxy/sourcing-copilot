#!/usr/bin/env python3
"""
系统调试脚本
用于检查和解决候选人管理和操作日志的数据同步问题
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from typing import Dict, Any

# 添加项目路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from automation.database.db import get_db_session, init_db, check_db_connection
from automation.database.models import Candidate, CandidateStatus, OperationLog as DBOperationLog
from candidate_repository import CandidateRepository

class SystemDebugger:
    """系统调试器"""
    
    def __init__(self):
        self.config_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot")
        self.config_path = os.path.join(self.config_dir, "config.json")
        self.logs_path = os.path.join(self.config_dir, "logs.json")
        
    def print_header(self, title):
        """打印标题"""
        print(f"\n{'='*50}")
        print(f" {title}")
        print(f"{'='*50}")
    
    def check_database_status(self):
        """检查数据库状态"""
        self.print_header("数据库状态检查")
        
        try:
            # 检查数据库连接
            if check_db_connection():
                print("✅ 数据库连接正常")
            else:
                print("❌ 数据库连接失败")
                return False
            
            # 检查候选人数量
            with get_db_session() as session:
                candidate_count = session.query(Candidate).count()
                log_count = session.query(DBOperationLog).count()
                
                print(f"📊 候选人数量: {candidate_count}")
                print(f"📊 操作日志数量: {log_count}")
                
                if candidate_count == 0:
                    print("⚠️ 数据库中没有候选人数据")
                
                if log_count == 0:
                    print("⚠️ 数据库中没有操作日志")
            
            return True
            
        except Exception as e:
            print(f"❌ 数据库检查失败: {e}")
            return False
    
    def check_configuration(self):
        """检查配置文件"""
        self.print_header("配置文件检查")
        
        try:
            if not os.path.exists(self.config_path):
                print("❌ 配置文件不存在")
                print(f"   路径: {self.config_path}")
                
                # 创建默认配置
                self.create_default_config()
                return False
            
            with open(self.config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
            
            print("✅ 配置文件存在")
            print(f"   路径: {self.config_path}")
            
            # 检查关键配置
            ai_enabled = config.get("aiEnabled", False)
            auto_mode = config.get("autoMode", False)
            rules = config.get("rules", [])
            
            print(f"🤖 AI智能筛选: {'启用' if ai_enabled else '未启用'}")
            print(f"🔄 自动模式: {'启用' if auto_mode else '未启用'}")
            print(f"📝 规则数量: {len(rules)}")
            
            # 检查规则配置
            enabled_rules = [r for r in rules if r.get("enabled", False)]
            if not enabled_rules and not ai_enabled:
                print("⚠️ 警告: 没有启用的规则且AI筛选未启用")
                print("   建议启用AI智能筛选或配置传统规则")
            
            return True
            
        except Exception as e:
            print(f"❌ 配置文件检查失败: {e}")
            return False
    
    def create_default_config(self):
        """创建默认配置"""
        print("🔧 正在创建默认配置...")
        
        default_config = {
            "autoMode": True,
            "aiEnabled": True,
            "passScore": 70,
            "basicPosition": "前端工程师",
            "basicCompanies": ["腾讯", "阿里巴巴", "字节跳动", "美团", "京东"],
            "basicKeywords": ["Vue", "React", "JavaScript", "TypeScript", "前端"],
            "filterCriteria": "候选人需要有前端开发经验，熟悉Vue、React等前端框架，具备良好的JavaScript/TypeScript基础。",
            "strictLevel": "balanced",
            "rules": [
                {
                    "id": "rule_1",
                    "type": "岗位",
                    "keywords": ["前端工程师", "前端开发", "Web开发"],
                    "importance": 10,
                    "mustMatch": True,
                    "enabled": True,
                    "order": 1
                },
                {
                    "id": "rule_2", 
                    "type": "岗位核心关键词",
                    "keywords": ["Vue", "React", "JavaScript", "TypeScript", "前端"],
                    "importance": 8,
                    "mustMatch": False,
                    "enabled": True,
                    "order": 2,
                    "passScore": 70
                }
            ]
        }
        
        try:
            os.makedirs(self.config_dir, exist_ok=True)
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(default_config, f, ensure_ascii=False, indent=2)
            print("✅ 默认配置创建成功")
            return True
        except Exception as e:
            print(f"❌ 创建默认配置失败: {e}")
            return False
    
    def create_test_data(self):
        """创建测试数据"""
        self.print_header("创建测试数据")
        
        try:
            # 创建测试候选人
            test_candidates = [
                {
                    "name": "张三",
                    "education": "本科",
                    "experience": "3年",
                    "skills": ["Vue", "React", "JavaScript"],
                    "company": "阿里巴巴",
                    "school": "清华大学",
                    "position": "前端工程师",
                    "status": CandidateStatus.NEW,
                    "source": "Boss直聘",
                    "match_score": 85
                },
                {
                    "name": "李四",
                    "education": "硕士",
                    "experience": "5年",
                    "skills": ["React", "TypeScript", "Node.js"],
                    "company": "腾讯",
                    "school": "北京大学",
                    "position": "高级前端工程师",
                    "status": CandidateStatus.CONTACTED,
                    "source": "Boss直聘",
                    "match_score": 92
                }
            ]
            
            created_count = 0
            for candidate_data in test_candidates:
                try:
                    candidate_id = CandidateRepository.create_candidate(**candidate_data)
                    print(f"✅ 创建测试候选人: {candidate_data['name']} (ID: {candidate_id})")
                    created_count += 1
                except Exception as e:
                    print(f"❌ 创建候选人 {candidate_data['name']} 失败: {e}")
            
            # 创建测试操作日志
            with get_db_session() as session:
                test_log = DBOperationLog(
                    timestamp=datetime.now(),
                    action="测试数据创建",
                    details=f"创建了 {created_count} 个测试候选人",
                    data_type="test",
                    data_id="test_001"
                )
                session.add(test_log)
                session.commit()
                print(f"✅ 创建测试操作日志")
            
            print(f"\n📊 测试数据创建完成，共创建 {created_count} 个候选人")
            return True
            
        except Exception as e:
            print(f"❌ 创建测试数据失败: {e}")
            return False
    
    def check_api_server(self):
        """检查API服务器状态"""
        self.print_header("API服务器检查")
        
        try:
            import requests
            
            # 检查服务器是否在运行
            try:
                response = requests.get("http://localhost:8000/api/status", timeout=5)
                if response.status_code == 200:
                    status = response.json()
                    print("✅ API服务器正在运行")
                    print(f"   自动化状态: {'运行中' if status.get('running') else '已停止'}")
                    print(f"   当前页面类型: {status.get('pageType', '未知')}")
                    print(f"   已处理数量: {status.get('processedCount', 0)}")
                    return True
                else:
                    print(f"❌ API服务器响应异常: {response.status_code}")
                    return False
            except requests.exceptions.ConnectionError:
                print("❌ API服务器未运行")
                print("   请先启动API服务器: python start.py")
                return False
                
        except ImportError:
            print("❌ 缺少requests库，无法检查API服务器")
            return False
        except Exception as e:
            print(f"❌ 检查API服务器失败: {e}")
            return False
    
    def run_full_diagnosis(self):
        """运行完整诊断"""
        print("🔍 Sourcing Copilot 系统诊断工具")
        print("   检查候选人管理和操作日志数据同步问题")
        
        # 1. 检查数据库
        db_ok = self.check_database_status()
        
        # 2. 检查配置
        config_ok = self.check_configuration()
        
        # 3. 检查API服务器
        api_ok = self.check_api_server()
        
        # 4. 提供解决方案
        self.print_header("诊断结果和解决方案")
        
        if not db_ok:
            print("❌ 数据库存在问题")
            print("   解决方案: 重新初始化数据库")
            
        if not config_ok:
            print("❌ 配置存在问题")
            print("   解决方案: 已创建默认配置，请重启服务")
            
        if not api_ok:
            print("❌ API服务器存在问题")
            print("   解决方案: 重新启动API服务器")
        
        if db_ok and config_ok and api_ok:
            print("✅ 系统状态正常")
            print("   如果仍无数据，请检查:")
            print("   1. 是否启动了自动化任务")
            print("   2. 是否在Boss直聘页面")
            print("   3. 是否有简历卡片可处理")
        
        # 5. 询问是否创建测试数据
        print("\n" + "="*50)
        response = input("是否创建测试数据以验证系统功能? (y/n): ").lower().strip()
        if response in ['y', 'yes', '是']:
            self.create_test_data()
        
        print("\n🎯 下一步操作建议:")
        print("1. 确保API服务器正在运行: python start.py")
        print("2. 打开前端界面: http://localhost:3000")
        print("3. 配置筛选规则或启用AI智能筛选")
        print("4. 启动浏览器并开始自动化任务")
        print("5. 在Boss直聘页面上观察处理过程")

def main():
    """主函数"""
    debugger = SystemDebugger()
    debugger.run_full_diagnosis()

if __name__ == "__main__":
    main() 