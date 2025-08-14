"""
调试日志工具
专门用于测试期望岗位和竞对公司的提取和匹配过程
"""

import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional

class DebugLogger:
    """调试日志类，提供清晰的日志打印功能"""
    
    @staticmethod
    def print_separator(title: str = "", char: str = "=", width: int = 80):
        """打印分隔线"""
        if title:
            title_with_spaces = f" {title} "
            padding = (width - len(title_with_spaces)) // 2
            line = char * padding + title_with_spaces + char * padding
            if len(line) < width:
                line += char
        else:
            line = char * width
        print(line)
    
    @staticmethod
    def print_extraction_start(candidate_name: str, card_id: str = ""):
        """打印提取开始信息"""
        DebugLogger.print_separator("数据提取开始", "🔍", 60)
        print(f"📋 候选人: {candidate_name}")
        if card_id:
            print(f"🆔 卡片ID: {card_id}")
        print(f"⏰ 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
    
    @staticmethod
    def print_position_extraction(position_raw: str, position_cleaned: str = "", extraction_method: str = ""):
        """打印期望岗位提取过程"""
        DebugLogger.print_separator("期望岗位提取", "💼")
        
        print(f"📝 原始提取内容: \"{position_raw}\"")
        
        if position_cleaned and position_cleaned != position_raw:
            print(f"🧹 清理后内容: \"{position_cleaned}\"")
        
        if extraction_method:
            print(f"🔧 提取方法: {extraction_method}")
        
        # 分析职位内容
        if position_cleaned or position_raw:
            final_position = position_cleaned or position_raw
            DebugLogger._analyze_position_content(final_position)
        else:
            print("❌ 未提取到期望岗位信息")
        
        print()
    
    @staticmethod
    def _analyze_position_content(position: str):
        """分析职位内容"""
        print(f"🔍 职位内容分析:")
        print(f"   📏 长度: {len(position)} 字符")
        
        # 检查是否包含职位关键词
        position_keywords = ["工程师", "经理", "主管", "开发", "设计", "专员", "总监", "助理", 
                           "顾问", "策划", "运营", "产品", "销售", "人力资源", "hr", 
                           "ui", "ux", "架构师", "前端", "后端", "全栈", "测试", "运维"]
        
        found_keywords = [kw for kw in position_keywords if kw.lower() in position.lower()]
        if found_keywords:
            print(f"   ✅ 包含职位关键词: {', '.join(found_keywords)}")
        else:
            print(f"   ⚠️  未包含明显的职位关键词")
        
        # 检查是否包含非职位信息
        non_position_patterns = [
            (r'\d+岁', '年龄信息'),
            (r'\d+年(?:工作)?经验', '工作经验'),
            (r'\d+年[应往]届生', '应届/往届'),
            (r'(?:本|硕|博)士', '学历信息'),
            (r'离职[-—]随时到岗', '离职状态'),
            (r'在职[-—]考虑机会', '在职状态'),
        ]
        
        non_position_found = []
        for pattern, desc in non_position_patterns:
            if re.search(pattern, position):
                non_position_found.append(desc)
        
        if non_position_found:
            print(f"   ⚠️  包含非职位信息: {', '.join(non_position_found)}")
        else:
            print(f"   ✅ 内容看起来是有效的职位信息")
    
    @staticmethod
    def print_company_extraction(companies_raw: Any, companies_cleaned: List[str] = None):
        """打印公司信息提取过程"""
        DebugLogger.print_separator("公司信息提取", "🏢")
        
        print(f"📝 原始提取内容: {companies_raw}")
        print(f"📝 原始内容类型: {type(companies_raw)}")
        
        if companies_cleaned:
            print(f"🧹 清理后内容: {companies_cleaned}")
            print(f"🔢 公司数量: {len(companies_cleaned)}")
            
            for i, company in enumerate(companies_cleaned, 1):
                print(f"   {i}. {company}")
        else:
            print("❌ 未提取到公司信息")
        
        print()
    
    @staticmethod
    def print_position_matching(position: str, position_rules: List[Dict], match_result: Dict):
        """打印期望岗位匹配过程"""
        DebugLogger.print_separator("期望岗位匹配", "🎯")
        
        print(f"📝 待匹配职位: \"{position}\"")
        
        if not position_rules:
            print("⚠️  未配置岗位规则")
            return
        
        print(f"📋 岗位规则数量: {len(position_rules)}")
        
        for i, rule in enumerate(position_rules, 1):
            enabled = rule.get('enabled', False)
            keywords = rule.get('keywords', [])
            must_match = rule.get('mustMatch', False)
            source = rule.get('source', '传统规则')
            
            print(f"   规则 {i} ({source}):")
            print(f"     ✅ 启用状态: {'是' if enabled else '否'}")
            print(f"     🔑 关键词: {keywords}")
            if 'mustMatch' in rule:
                print(f"     ⚡ 必须匹配: {'是' if must_match else '否'}")
        
        # 显示匹配结果
        matched = match_result.get('matched', False)
        matched_keywords = match_result.get('matched_keywords', [])
        
        if matched:
            print(f"✅ 匹配结果: 成功")
            print(f"🎯 匹配的关键词: {matched_keywords}")
        else:
            print(f"❌ 匹配结果: 失败")
            
            # 分析为什么失败
            all_keywords = []
            for rule in position_rules:
                if rule.get('enabled'):
                    all_keywords.extend(rule.get('keywords', []))
            
            if all_keywords:
                print(f"🔍 期望的关键词: {all_keywords}")
                print(f"💡 建议: 检查职位 \"{position}\" 是否包含以上任一关键词")
            else:
                print(f"⚠️  没有启用的岗位规则")
        
        print()
    
    @staticmethod
    def print_company_matching(companies: List[str], company_rules: List[Dict], match_result: Dict):
        """打印竞对公司匹配过程"""
        DebugLogger.print_separator("竞对公司匹配", "🏭")
        
        print(f"📝 候选人公司: {companies}")
        
        if not company_rules:
            print("⚠️  未配置竞对公司规则")
            return
        
        print(f"📋 竞对公司规则数量: {len(company_rules)}")
        
        for i, rule in enumerate(company_rules, 1):
            enabled = rule.get('enabled', False)
            keywords = rule.get('keywords', [])
            source = rule.get('source', '传统规则')
            
            print(f"   规则 {i} ({source}):")
            print(f"     ✅ 启用状态: {'是' if enabled else '否'}")
            print(f"     🔑 关键词: {keywords}")
        
        # 显示匹配结果
        matched = match_result.get('matched', False)
        matched_company = match_result.get('matched_company', '')
        matched_keyword = match_result.get('matched_keyword', '')
        
        if matched:
            print(f"✅ 匹配结果: 是竞对公司")
            print(f"🏢 匹配的公司: {matched_company}")
            print(f"🎯 匹配的关键词: {matched_keyword}")
        else:
            print(f"❌ 匹配结果: 不是竞对公司")
            
            # 分析为什么不匹配
            all_keywords = []
            for rule in company_rules:
                if rule.get('enabled'):
                    all_keywords.extend(rule.get('keywords', []))
            
            if all_keywords and companies:
                print(f"🔍 期望的关键词: {all_keywords}")
                print(f"💡 建议: 检查公司名称是否包含以上任一关键词")
            elif not all_keywords:
                print(f"⚠️  没有启用的竞对公司规则")
            else:
                print(f"⚠️  候选人没有公司信息")
        
        print()
    
    @staticmethod
    def print_evaluation_result(candidate_name: str, stage_result: Dict, final_action: str, reject_reason: str = ""):
        """打印评估结果"""
        DebugLogger.print_separator("评估结果", "📊")
        
        print(f"👤 候选人: {candidate_name}")
        print(f"📋 阶段结果:")
        print(f"   💼 期望岗位匹配: {'✅ 是' if stage_result.get('matchPosition') else '❌ 否'}")
        print(f"   🏢 竞对公司: {'✅ 是' if stage_result.get('competitorCompany') else '❌ 否'}")
        
        print(f"🎯 最终决策: {final_action}")
        if reject_reason:
            print(f"❌ 拒绝原因: {reject_reason}")
        
        # 根据结果给出建议
        if final_action == "skip":
            print(f"💡 建议: 检查期望岗位提取和匹配规则是否正确")
        elif final_action == "greet":
            print(f"💡 建议: 候选人来自竞对公司，可以直接打招呼")
        elif final_action == "continue":
            print(f"💡 建议: 继续查看详情页进行关键词评估")
        
        print()
    
    @staticmethod
    def print_full_text_analysis(full_text: str, max_length: int = 200):
        """打印全文分析"""
        DebugLogger.print_separator("全文内容分析", "📄")
        
        if not full_text:
            print("❌ 没有全文内容")
            return
        
        print(f"📏 全文长度: {len(full_text)} 字符")
        print(f"📝 前{max_length}字符预览:")
        print(f"   {full_text[:max_length]}{'...' if len(full_text) > max_length else ''}")
        
        # 查找期望相关的内容
        expectation_patterns = [
            r'期望职位[：:]\s*([^\n\r]+)',
            r'期望岗位[：:]\s*([^\n\r]+)',
            r'期望[：:]\s*([^\n\r,，]+)',
        ]
        
        print(f"🔍 期望相关内容搜索:")
        found_any = False
        for pattern in expectation_patterns:
            matches = re.findall(pattern, full_text)
            if matches:
                found_any = True
                print(f"   📝 模式 '{pattern}' 找到: {matches}")
        
        if not found_any:
            print(f"   ❌ 未找到期望相关内容")
        
        print()
    
    @staticmethod
    def print_extraction_summary(candidate_name: str, extracted_data: Dict):
        """打印提取总结"""
        DebugLogger.print_separator("提取总结", "📋")
        
        print(f"👤 候选人: {candidate_name}")
        print(f"📊 提取结果:")
        print(f"   💼 期望岗位: \"{extracted_data.get('position', '未提取')}\"")
        print(f"   🏢 公司信息: {extracted_data.get('company', '未提取')}")
        print(f"   🎓 学校信息: {extracted_data.get('schools', '未提取')}")
        print(f"   🛠️  技能信息: {extracted_data.get('skills', '未提取')}")
        
        # 数据质量评估
        print(f"📈 数据质量评估:")
        
        position = extracted_data.get('position', '')
        if position:
            if len(position) > 2 and len(position) < 30:
                print(f"   💼 期望岗位: ✅ 良好 (长度适中)")
            elif len(position) >= 30:
                print(f"   💼 期望岗位: ⚠️  可能包含多余信息 (过长)")
            else:
                print(f"   💼 期望岗位: ⚠️  信息不足 (过短)")
        else:
            print(f"   💼 期望岗位: ❌ 未提取到")
        
        companies = extracted_data.get('company', [])
        if companies:
            print(f"   🏢 公司信息: ✅ 良好 (共{len(companies)}家公司)")
        else:
            print(f"   🏢 公司信息: ❌ 未提取到")
        
        print()
    
    @staticmethod
    def print_config_info(config: Dict):
        """打印配置信息"""
        DebugLogger.print_separator("当前配置信息", "⚙️")
        
        # AI模式信息
        ai_enabled = config.get("aiEnabled", False)
        print(f"🤖 AI智能筛选: {'✅ 启用' if ai_enabled else '❌ 禁用'}")
        
        # AI配置的目标岗位和竞对公司
        target_position = config.get("targetPosition", "")
        competitor_company = config.get("competitorCompany", "")
        
        if ai_enabled:
            print(f"🎯 目标岗位: {target_position if target_position else '未配置'}")
            print(f"🏭 竞对公司: {competitor_company if competitor_company else '未配置'}")
            print(f"📝 职位描述: {config.get('jobDescription', '未配置')[:50]}...")
            print(f"👥 人才画像: {config.get('talentProfile', '未配置')[:50]}...")
        
        # 规则信息
        rules = config.get('rules', [])
        position_rules = [r for r in rules if r.get('type') == '岗位' and r.get('enabled')]
        company_rules = [r for r in rules if r.get('type') == '公司' and r.get('enabled')]
        keyword_rules = [r for r in rules if r.get('type') == '岗位核心关键词' and r.get('enabled')]
        
        print(f"📋 传统规则配置:")
        print(f"   💼 岗位规则: {len(position_rules)} 条启用")
        print(f"   🏢 公司规则: {len(company_rules)} 条启用")
        print(f"   🔑 关键词规则: {len(keyword_rules)} 条启用")
        
        # 详细规则信息
        if position_rules:
            print(f"   💼 岗位关键词: {[kw for rule in position_rules for kw in rule.get('keywords', [])]}")
        
        if company_rules:
            print(f"   🏢 竞对公司关键词: {[kw for rule in company_rules for kw in rule.get('keywords', [])]}")
        
        print() 