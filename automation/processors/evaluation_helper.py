"""
评估帮助模块
负责评估候选人简历与规则的匹配情况
"""

from thefuzz import fuzz
import re
import json
import httpx
import asyncio
import os
import openai
from automation.utils.debug_logger import DebugLogger

class EvaluationHelper:
    """评估帮助类，提供简历评估方法"""
    
    @staticmethod
    def evaluate_card_stage(resume_data, config):
        """
        评估卡片阶段（阶段1和阶段2）
        
        Args:
            resume_data: 简历数据
            config: 规则配置
            
        Returns:
            dict: 评估结果
        """
        candidate_name = resume_data.get('name', '未知候选人')
        
        # 打印调试开始信息
        DebugLogger.print_extraction_start(candidate_name, resume_data.get('id', ''))
        DebugLogger.print_config_info(config)
        
        result = {
            "action": "continue",  # 默认继续到下一阶段
            "rejectReason": "",
            "stageResult": {
                "matchPosition": False,
                "competitorCompany": False
            }
        }
        
        # 阶段1：检查期望职位
        position_raw = resume_data.get('position', '').strip()
        position = position_raw
        extraction_method = "直接从position字段提取"
        
        # 如果职位为空，尝试从fullText提取"期望："字段
        if not position and resume_data.get('fullText'):
            DebugLogger.print_full_text_analysis(resume_data.get('fullText'))
            position_match = re.search(r'期望：\s*([^\n\r]+)', resume_data.get('fullText', ''))
            if position_match:
                position = position_match.group(1).strip()
                extraction_method = "从全文中通过正则表达式提取"
                # 重要：将提取到的期望岗位保存回resume_data
                resume_data['position'] = position
        
        # 打印期望岗位提取过程
        DebugLogger.print_position_extraction(position_raw, position, extraction_method)
        
        # 检查是否启用了AI智能筛选
        ai_enabled = config.get("aiEnabled", False)
        job_description = config.get("jobDescription", "")
        talent_profile = config.get("talentProfile", "")
        filter_criteria = config.get("filterCriteria", "")
        target_position = config.get("targetPosition", "")  # AI配置中的目标岗位
        competitor_company = config.get("competitorCompany", "")  # AI配置中的竞对公司
        
        # 获取传统岗位规则
        position_rules = [r for r in config.get('rules', []) if r.get('type') == '岗位' and r.get('enabled')]
        
        # 整合AI配置和传统规则的岗位关键词
        position_keywords = []
        
        # 1. 从传统规则获取关键词
        for rule in position_rules:
            position_keywords.extend(rule.get('keywords', []))
        
        # 2. 从AI配置的目标岗位提取关键词
        if target_position:
            # 将目标岗位作为关键词添加
            position_keywords.append(target_position)
            print(f"🤖 从AI配置添加目标岗位关键词: {target_position}")
        
        # 进行岗位匹配检查
        if position_keywords:
            print(f"🎯 整合后的岗位关键词: {position_keywords}")
            
            # 检查期望职位是否匹配规则 - 使用更精确的匹配逻辑
            position_match_result = {"matched": False, "matched_keywords": []}
            
            if position:
                position_match_result = EvaluationHelper._match_position_precisely(position, position_keywords)
                
                if position_match_result['matched']:
                    result["stageResult"]["matchPosition"] = True
                else:
                    # 如果直接匹配失败，尝试搜索整个文本
                    if resume_data.get('fullText'):
                        full_text = resume_data.get('fullText')
                        position_match_result = EvaluationHelper._match_position_precisely(full_text, position_keywords, is_full_text=True)
                        
                        if position_match_result['matched']:
                            result["stageResult"]["matchPosition"] = True
            else:
                # 如果期望职位为空，尝试搜索整个文本
                if resume_data.get('fullText'):
                    full_text = resume_data.get('fullText')
                    position_match_result = EvaluationHelper._match_position_precisely(full_text, position_keywords, is_full_text=True)
                    
                    if position_match_result['matched']:
                        result["stageResult"]["matchPosition"] = True
            
            # 构建规则信息用于调试日志（整合传统规则和AI配置）
            combined_rules = position_rules.copy()
            if target_position:
                # 添加AI配置作为虚拟规则
                ai_rule = {
                    "type": "岗位",
                    "enabled": True,
                    "keywords": [target_position],
                    "source": "AI配置"
                }
                combined_rules.append(ai_rule)
            
            # 打印期望岗位匹配过程
            DebugLogger.print_position_matching(position, combined_rules, position_match_result)
            
            # 如果职位不匹配，直接跳过
            if not result["stageResult"]["matchPosition"]:
                result["action"] = "skip"
                result["rejectReason"] = "期望职位不匹配"
                DebugLogger.print_evaluation_result(candidate_name, result["stageResult"], result["action"], result["rejectReason"])
                return result
        else:
            # 如果启用了AI但没有配置任何岗位关键词，跳过岗位匹配
            if ai_enabled or job_description or talent_profile or filter_criteria:
                print("🤖 AI智能筛选模式：未配置岗位关键词，跳过卡片阶段职位匹配")
                result["stageResult"]["matchPosition"] = True
            else:
                print("⚠️ 未配置任何岗位筛选条件，默认通过岗位匹配")
                result["stageResult"]["matchPosition"] = True
        
        # 阶段2: 检查是否竞对公司
        company_rules = [r for r in config.get("rules", []) if r.get("type") == "公司"]
        company_match = False
        company_match_result = {"matched": False, "matched_company": "", "matched_keyword": ""}
        
        # 确保company字段是列表
        company_list = resume_data.get('company', [])
        if company_list is None:
            company_list = []
        elif not isinstance(company_list, list):
            company_list = [company_list]
        
        # 打印公司信息提取过程
        DebugLogger.print_company_extraction(resume_data.get('company'), company_list)
        
        # 整合传统规则和AI配置的竞对公司关键词
        company_keywords = []
        
        # 1. 从传统规则获取关键词
        for rule in company_rules:
            company_keywords.extend(rule.get("keywords", []))
        
        # 2. 从AI配置的竞对公司提取关键词
        if competitor_company:
            company_keywords.append(competitor_company)
            print(f"🤖 从AI配置添加竞对公司关键词: {competitor_company}")
        
        # 进行竞对公司匹配
        if company_keywords:
            print(f"🏭 整合后的竞对公司关键词: {company_keywords}")
            
            for company in company_list:
                if company is None:
                    continue
                company_lower = str(company).lower()
                for keyword in company_keywords:
                    keyword_lower = str(keyword).lower()
                    if keyword_lower in company_lower:
                        # 竞对公司直接通过
                        company_match = True
                        company_match_result = {
                            "matched": True,
                            "matched_company": company,
                            "matched_keyword": keyword
                        }
                        # 设置为可以直接打招呼
                        result["stageResult"]["competitorCompany"] = True
                        result["passed"] = True
                        result["action"] = "greet"
                        
                        # 构建规则信息用于调试日志（整合传统规则和AI配置）
                        combined_company_rules = company_rules.copy()
                        if competitor_company:
                            # 添加AI配置作为虚拟规则
                            ai_company_rule = {
                                "type": "公司",
                                "enabled": True,
                                "keywords": [competitor_company],
                                "source": "AI配置"
                            }
                            combined_company_rules.append(ai_company_rule)
                        
                        # 打印竞对公司匹配过程
                        DebugLogger.print_company_matching(company_list, combined_company_rules, company_match_result)
                        DebugLogger.print_evaluation_result(candidate_name, result["stageResult"], result["action"])
                        return result
        
        # 构建规则信息用于调试日志（整合传统规则和AI配置）
        combined_company_rules = company_rules.copy()
        if competitor_company:
            # 添加AI配置作为虚拟规则
            ai_company_rule = {
                "type": "公司",
                "enabled": True,
                "keywords": [competitor_company],
                "source": "AI配置"
            }
            combined_company_rules.append(ai_company_rule)
        
        # 打印竞对公司匹配过程（未匹配的情况）
        DebugLogger.print_company_matching(company_list, combined_company_rules, company_match_result)
        
        result["stageResult"]["competitorCompany"] = company_match
        
        # 通过了岗位检查，并且是竞对公司或者需要继续检查关键词
        result["passed"] = True
        result["action"] = "continue"  # 继续进行详情页评估
        
        # 如果是竞对公司，可以直接打招呼
        if company_match:
            result["action"] = "greet"
        
        # 打印最终评估结果
        DebugLogger.print_evaluation_result(candidate_name, result["stageResult"], result["action"])
        
        # 打印提取总结
        DebugLogger.print_extraction_summary(candidate_name, resume_data)
            
        return result
    
    @staticmethod
    def _clean_position_data(position, name=None):
        """
        清理职位数据，移除与职位无关的信息
        
        Args:
            position: 原始职位字符串
            name: 候选人姓名(可选)，用于移除姓名
            
        Returns:
            str: 清理后的职位字符串
        """
        if not position:
            return ""
            
        # 转换为小写以便处理
        position = position.lower()
        
        # 移除候选人姓名
        if name and name.lower() in position:
            position = position.replace(name.lower(), "").strip()
            
        # 处理"期望"格式
        expectation_match = re.search(r'期望[：:]\s*(.+)', position)
        if expectation_match:
            position = expectation_match.group(1).strip()
            print(f"从期望格式中提取职位: {position}")
            
        # 处理城市+职位的组合格式（例如"北京游戏策划/制作"）
        city_pattern = r'^(北京|上海|广州|深圳|杭州|南京|成都|武汉|西安|苏州|天津|重庆|长沙|郑州|青岛|济南|厦门|福州|大连|宁波|合肥|无锡)'
        city_match = re.search(city_pattern, position)
        if city_match:
            city = city_match.group(1)
            # 移除城市并保留职位部分
            position_without_city = position[len(city):].strip()
            if position_without_city:  # 确保移除城市后仍有职位信息
                print(f"从\"{position}\"中提取到城市\"{city}\"和职位\"{position_without_city}\"")
                position = position_without_city
            
        # 定义职位相关的关键词
        position_keywords = ["工程师", "经理", "主管", "开发", "设计", "专员", "总监", "助理", 
                           "顾问", "策划", "运营", "产品", "销售", "人力资源", "hr", 
                           "ui", "ux", "架构师", "前端", "后端", "全栈", "测试", "运维",
                           "客服", "市场", "研发", "项目", "行政", "财务", "会计", "审计",
                           "法务", "采购", "物流", "media", "广告", "媒介", "游戏"]
        
        # 定义非职位信息的模式
        non_position_patterns = [
            r'\d+岁',                  # 年龄，如"28岁"
            r'\d+年(?:工作)?经验',      # 工作经验，如"5年经验"
            r'\d+年[应往]届生',         # 应届/往届，如"22年应届生"
            r'(?:本|硕|博)士',          # 学历，如"硕士"
            r'离职[-—]随时到岗',         # 离职状态
            r'在职[-—]考虑机会',         # 在职状态
            r'社招|校招',               # 招聘类型
        ]
        
        # 1. 检查是否包含明确的职位关键词
        has_position_keyword = any(keyword in position for keyword in position_keywords)
        
        # 2. 检查是否包含非职位信息
        contains_non_position = any(re.search(pattern, position) for pattern in non_position_patterns)
        
        # 如果包含非职位信息，但也包含职位关键词，提取相关职位部分
        if contains_non_position and has_position_keyword:
            # 先尝试查找职位关键词
            for keyword in sorted(position_keywords, key=len, reverse=True):
                if keyword in position:
                    # 提取包含关键词及其前后几个字的部分
                    keyword_index = position.find(keyword)
                    context_size = min(10, len(position))  # 上下文大小
                    start_index = max(0, keyword_index - context_size)
                    end_index = min(len(position), keyword_index + len(keyword) + context_size)
                    
                    extracted_position = position[start_index:end_index].strip()
                    
                    # 进一步清理，移除非职位部分
                    for pattern in non_position_patterns:
                        extracted_position = re.sub(pattern, "", extracted_position)
                    
                    # 清理多余标点符号
                    extracted_position = re.sub(r'[-_,，.。:：、/\s]+', " ", extracted_position).strip()
                    
                    return extracted_position
        
        # 如果只包含非职位信息，返回空字符串
        if contains_non_position and not has_position_keyword:
            return ""
            
        # 如果不包含非职位信息，直接返回清理后的原始职位
        # 清理多余标点符号和空格
        cleaned_position = re.sub(r'[-_,，.。:：、/\s]+', " ", position).strip()
        return cleaned_position
        
    @staticmethod
    async def evaluate_keywords_ai(resume_data, config):
        """
        使用大模型评估简历与岗位要求的匹配度
        
        Args:
            resume_data: 简历数据
            config: 规则配置
            
        Returns:
            dict: 大模型评估结果
        """
        # 初始化结果
        result = {
            "score": 0,
            "passed": False,
            "rejectReason": ""
        }
        
        # 检查是否启用了AI智能筛选
        ai_enabled = config.get("aiEnabled", False)
        job_description = config.get("jobDescription", "")
        talent_profile = config.get("talentProfile", "")
        filter_criteria = config.get("filterCriteria", "")
        
        # 如果没有启用AI智能筛选，则回退到传统关键词筛选
        if not ai_enabled and not job_description and not talent_profile and not filter_criteria:
            print("🔄 未启用AI智能筛选，使用传统关键词评估方法")
            # 获取所有启用的关键词规则
            active_rules = [r for r in config.get("rules", []) if r.get("enabled") and r.get("type") == "岗位核心关键词"]
            if not active_rules:
                # 没有关键词规则，默认通过
                print("📋 没有配置关键词规则，默认通过评估")
                result["passed"] = True
                result["score"] = 100
                return result
                
            # 获取通过分数（使用第一个关键词规则的通过分数）
            pass_score = active_rules[0].get("passScore", 60)
            keywords = active_rules[0].get("keywords", [])
            
            print(f"🎯 传统关键词评估配置: 通过分数={pass_score}, 关键词={keywords}")
                
            if not keywords:
                # 没有关键词，默认通过
                print("📋 没有配置具体关键词，默认通过评估")
                result["passed"] = True
                result["score"] = 100
                return result
        else:
            print("🤖 使用AI智能筛选进行评估")
            # 获取通过分数
            pass_score = config.get("passScore", 70)
            
            # 检查AI筛选配置的完整性
            has_config = False
            if filter_criteria:
                print(f"✅ 已配置AI智能筛选标准（长度: {len(filter_criteria)} 字符）")
                has_config = True
            if job_description:
                print(f"✅ 已配置职位描述（长度: {len(job_description)} 字符）")
                has_config = True
            if talent_profile:
                print(f"✅ 已配置人才画像（长度: {len(talent_profile)} 字符）")
                has_config = True
            
            # 如果没有配置任何AI筛选内容，使用关键词规则作为备用
            if not has_config:
                active_rules = [r for r in config.get("rules", []) if r.get("enabled") and r.get("type") == "岗位核心关键词"]
                if active_rules:
                    keywords = active_rules[0].get("keywords", [])
                    if keywords:
                        job_description = f"岗位要求包含以下关键技能：{', '.join(keywords)}"
                        talent_profile = "理想候选人应具备相关技能和工作经验"
                        print(f"🔄 从关键词规则生成JD和人才画像: {job_description}")
                        has_config = True
                
                if not has_config:
                    print("⚠️ 没有配置任何筛选标准，默认通过")
                    result["passed"] = True
                    result["score"] = 80
                    return result
            
        # 从简历数据中收集文本内容
        resume_content = ""
        
        # 添加职位信息
        if resume_data.get("position"):
            resume_content += f"期望职位: {resume_data.get('position')}\n\n"
            print(f"📝 期望职位: {resume_data.get('position')}")
            
        # 添加公司经历
        if resume_data.get("company"):
            companies = resume_data.get("company")
            if isinstance(companies, list):
                resume_content += "工作经历:\n"
                for company in companies:
                    resume_content += f"- {company}\n"
                resume_content += "\n"
                print(f"🏢 工作经历: {companies}")
            else:
                resume_content += f"工作经历: {companies}\n\n"
                print(f"🏢 工作经历: {companies}")
        
        # 添加教育经历
        if resume_data.get("schools"):
            schools = resume_data.get("schools")
            if isinstance(schools, list):
                resume_content += "教育经历:\n"
                for school in schools:
                    resume_content += f"- {school}\n"
                resume_content += "\n"
                print(f"🎓 教育经历: {schools}")
            else:
                resume_content += f"教育经历: {schools}\n\n"
                print(f"🎓 教育经历: {schools}")
        
        # 添加技能标签
        if resume_data.get("skills"):
            skills = resume_data.get("skills")
            if isinstance(skills, list):
                resume_content += "技能标签: " + ", ".join(skills) + "\n\n"
                print(f"🛠️ 技能标签: {skills}")
            else:
                resume_content += f"技能标签: {skills}\n\n"
                print(f"🛠️ 技能标签: {skills}")
                
        # 添加HTML内容（如果有）
        if resume_data.get("html_content"):
            resume_content += "简历HTML内容略（已提取到结构化数据）\n\n"
            print("📄 包含HTML格式简历内容")
            
        # 添加完整文本（优先使用）
        if resume_data.get("fullText"):
            resume_content += f"简历全文内容:\n{resume_data.get('fullText')}\n\n"
            text_length = len(resume_data.get('fullText'))
            print(f"📄 简历全文长度: {text_length} 字符")
            
        # 如果没有任何内容，使用原始数据
        if not resume_content.strip():
            resume_content = str(resume_data)
            print("⚠️ 使用原始简历数据进行评估")
            
        print(f"📊 准备发送给AI评估的内容长度: {len(resume_content)} 字符")
        
        # 构建智能提示词
        if ai_enabled and (filter_criteria or (job_description and talent_profile)):
            # 优先使用AI智能筛选标准，其次使用JD和人才画像
            if filter_criteria:
                prompt = f"""你是一位资深的人力资源专家，负责为企业筛选最合适的候选人。请根据以下AI智能筛选标准，评估候选人简历的匹配度。

【AI智能筛选标准】
{filter_criteria}

【候选人简历】
{resume_content}

【评估要求】
请严格按照上述筛选标准中的评估维度、必备条件、加分项和评分标准进行评估。

请以JSON格式输出评估结果：
{{
  "result": "通过" 或 "不通过",
  "score": 0-100之间的整数分数,
  "reason": "详细评估理由，包含匹配的优势和不足，不超过150字",
  "highlights": ["候选人的3-5个突出优势或关键匹配点"],
  "concerns": ["需要关注的2-3个不足或风险点"]
}}"""
            else:
                # 使用完整的JD和人才画像构建提示词
                prompt = f"""你是一位资深的人力资源专家，负责为企业筛选最合适的候选人。请根据以下职位要求和理想人才画像，评估候选人简历的匹配度。

【职位描述】
{job_description}

【理想人才画像】
{talent_profile}

【候选人简历】
{resume_content}

【评估要求】
1. 综合考虑技能匹配、经验相关性、学习潜力、文化匹配等多个维度
2. 评估标准：70分为通过门槛（满分100分）
3. 重点关注候选人与岗位核心要求的匹配程度
4. 考虑候选人的成长潜力和适应性

请以JSON格式输出评估结果：
{{
  "result": "通过" 或 "不通过",
  "score": 0-100之间的整数分数,
  "reason": "详细评估理由，包含匹配的优势和不足，不超过150字",
  "highlights": ["候选人的3-5个突出优势或关键匹配点"],
  "concerns": ["需要关注的2-3个不足或风险点"]
}}"""
        else:
            # 回退到基于关键词的评估
            active_rules = [r for r in config.get("rules", []) if r.get("enabled") and r.get("type") == "岗位核心关键词"]
            keywords = []
            if active_rules:
                keywords = active_rules[0].get("keywords", [])
            
            prompt = f"""你是一位专业的人力资源专家，需要评估一份简历是否符合岗位要求。

岗位关键要求:
{', '.join(keywords) if keywords else '请基于简历内容和常见岗位要求进行综合评估'}

简历内容:
{resume_content}

请分析这份简历是否符合岗位要求，评估通过标准为{pass_score}分（满分100分）。
请以JSON格式输出，格式为:
{{
  "result": "通过" 或 "不通过",
  "score": 0-100之间的分数,
  "reason": "通过或不通过的原因，不超过100字"
}}"""

        try:
            # 配置OpenAI客户端
            api_key = os.environ.get("OPENAI_API_KEY", "sk-hra-zp-2025052091")
            
            # 直接使用公网域名，避免内部域名解析问题
            base_url = "https://chat.inhyperloop.com/v1"
            
            print(f"🤖 正在调用AI评估API: {base_url}")
            print(f"📝 使用{'AI智能筛选' if ai_enabled else '关键词'}评估模式")
            
            # 初始化OpenAI客户端
            client = openai.OpenAI(api_key=api_key, base_url=base_url)
            
            # 发送请求
            try:
                print("⏳ 开始调用OpenAI API进行评估...")
                response = await asyncio.to_thread(
                    client.chat.completions.create,
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "你是一位专业的招聘评估助手，擅长分析简历与岗位匹配度。"},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    timeout=30  # 设置30秒超时
                )
                print("✅ OpenAI API调用成功")
                
                # 解析响应
                ai_response = response.choices[0].message.content
                print(f"🤖 AI原始响应: {ai_response}")
                
                try:
                    # 尝试解析JSON响应
                    # 处理可能包含```json代码块的响应
                    cleaned_response = ai_response.strip()
                    if cleaned_response.startswith('```json'):
                        # 移除代码块标记
                        cleaned_response = cleaned_response[7:]  # 移除```json
                        if cleaned_response.endswith('```'):
                            cleaned_response = cleaned_response[:-3]  # 移除```
                    elif cleaned_response.startswith('```'):
                        # 处理```开头的情况
                        lines = cleaned_response.split('\n')
                        if len(lines) > 1:
                            cleaned_response = '\n'.join(lines[1:])  # 移除第一行
                        if cleaned_response.endswith('```'):
                            cleaned_response = cleaned_response[:-3]  # 移除```
                    
                    # 清理可能的多余空白字符和换行符
                    cleaned_response = cleaned_response.strip()
                    
                    print(f"🧹 清理后的AI响应: {cleaned_response}")
                    
                    ai_result = json.loads(cleaned_response)
                    print(f"📊 AI评估结果解析成功: {ai_result}")
                    
                    # 将AI结果转换为我们的结果格式
                    if "result" in ai_result:
                        result["passed"] = ai_result["result"] == "通过"
                        print(f"🎯 评估结果: {'通过' if result['passed'] else '不通过'}")
                        
                    if "score" in ai_result:
                        result["score"] = int(ai_result["score"])
                        print(f"📊 评估分数: {result['score']}/{pass_score}")
                        
                    if "reason" in ai_result:
                        if not result["passed"]:
                            result["rejectReason"] = ai_result["reason"]
                        else:
                            result["reason"] = ai_result["reason"]  # 通过时也保存原因
                        print(f"📝 评估原因: {ai_result['reason']}")
                        
                    # 保存详细评估信息到结果中
                    if "highlights" in ai_result:
                        result["highlights"] = ai_result["highlights"]
                        print(f"✨ 候选人优势: {ai_result['highlights']}")
                    if "concerns" in ai_result:
                        result["concerns"] = ai_result["concerns"]
                        print(f"⚠️ 关注点: {ai_result['concerns']}")
                        
                    print(f"✅ AI评估完成: 结果={'通过' if result['passed'] else '不通过'}, 分数={result['score']}, 原因={ai_result.get('reason', '')}")
                    return result
                    
                except json.JSONDecodeError:
                    print(f"❌ 无法解析AI响应为JSON: {ai_response}")
                    # 自动通过，不回退到关键词匹配
                    result["passed"] = True
                    result["score"] = 70
                    result["rejectReason"] = "AI响应格式错误，自动通过"
                    print("🔄 由于解析错误，自动设置为通过")
                    return result
                
            except Exception as api_error:
                print(f"❌ OpenAI API调用失败: {api_error}")
                import traceback
                traceback.print_exc()
                
                # 尝试检查是否是网络连接问题
                if "connect" in str(api_error).lower() or "timeout" in str(api_error).lower() or "connection" in str(api_error).lower():
                    print("🌐 检测到网络连接问题，可能需要检查网络设置或代理")
                    
                # 自动通过，设置较低分数但仍然通过
                result["passed"] = True
                result["score"] = 65
                result["rejectReason"] = "API调用失败，自动通过"
                print("🔄 由于API调用失败，自动设置为通过")
                return result
                
        except Exception as e:
            print(f"❌ AI评估出错: {e}")
            import traceback
            traceback.print_exc()
            # 自动通过，不回退到关键词匹配
            result["passed"] = True
            result["score"] = 70
            result["rejectReason"] = "评估过程出错，自动通过"
            print("🔄 由于评估过程出错，自动设置为通过")
            return result

    @staticmethod
    def evaluate_keywords(resume_data, config):
        """
        仅评估关键词得分 (保留原方法作为备用)
        
        Args:
            resume_data: 简历数据
            config: 规则配置
            
        Returns:
            dict: 关键词评估结果
        """
        # 【注意: 以下是原始关键词匹配逻辑，已作为备用方法保留】
        
        # 初始化结果
        result = {
            "score": 0,
            "passed": False,
            "rejectReason": ""
        }
        
        # 获取所有启用的关键词规则
        active_rules = [r for r in config.get("rules", []) if r.get("enabled") and r.get("type") == "岗位核心关键词"]
        if not active_rules:
            # 没有关键词规则，默认通过
            result["passed"] = True
            result["score"] = 100
            return result
            
        # 获取通过分数（使用第一个关键词规则的通过分数）
        pass_score = active_rules[0].get("passScore", 60)
            
        # 合并所有关键词
        all_keywords = []
        for rule in active_rules:
            all_keywords.extend(rule.get("keywords", []))
            
        if not all_keywords:
            # 没有关键词，默认通过
            result["passed"] = True
            result["score"] = 100
            return result
            
        # 从简历数据中收集文本
        source_texts = []
        
        # 添加完整文本（详情页提取的文本）
        if resume_data.get("fullText"):
            source_texts.append(resume_data.get("fullText"))
            
        # 添加技能标签
        if resume_data.get("skills"):
            if isinstance(resume_data.get("skills"), list):
                source_texts.extend(resume_data.get("skills"))
            else:
                source_texts.append(resume_data.get("skills"))
            
        # 添加工作经历
        if resume_data.get("workExperience"):
            source_texts.append(resume_data.get("workExperience"))
            
        # 添加项目经历
        if resume_data.get("projectExperience"):
            source_texts.append(resume_data.get("projectExperience"))
            
        # 添加教育经历
        if resume_data.get("education"):
            source_texts.append(resume_data.get("education"))
            
        # 添加自我评价
        if resume_data.get("selfEvaluation"):
            source_texts.append(resume_data.get("selfEvaluation"))
            
        if not source_texts:
            # 没有源文本，无法评分
            result["rejectReason"] = "简历数据不足，无法评分"
            return result
            
        # 计算匹配关键词数量
        matched_count = 0
        matched_keywords = []
        
        for keyword in all_keywords:
            if not keyword:
                continue
                
            # 进行匹配
            for text in source_texts:
                if not text:
                    continue
                    
                text_lower = text.lower()
                keyword_lower = keyword.lower()
                
                # 直接包含
                if keyword_lower in text_lower:
                    matched_count += 1
                    matched_keywords.append(keyword)
                    break
                    
                # 检查关键词的各个部分
                if ' ' in keyword_lower:
                    parts = keyword_lower.split()
                    parts_matched = all(part in text_lower for part in parts if len(part) > 2)
                    if parts_matched:
                        matched_count += 1
                        matched_keywords.append(keyword)
                        break
                    
                # 使用模糊匹配
                ratio = fuzz.partial_ratio(keyword_lower, text_lower)
                if ratio >= 90:  # 90%以上相似度认为匹配
                    matched_count += 1
                    matched_keywords.append(keyword)
                    break
                    
        # 计算得分
        total_keywords = len(all_keywords)
        score = (matched_count / total_keywords) * 100
        result["score"] = min(100, int(score))
        
        # 评估是否通过
        result["passed"] = result["score"] >= pass_score
        
        if not result["passed"]:
            result["rejectReason"] = f"关键词得分不足 (得分:{result['score']}, 阈值:{pass_score})"
            
        print(f"关键词评分: {result['score']}/{pass_score}, 匹配关键词: {matched_keywords}")
        
        return result

    @staticmethod
    async def evaluate_resume(resume_data, config):
        """
        评估简历是否符合筛选规则
        
        Args:
            resume_data: 简历数据
            config: 规则配置
            
        Returns:
            tuple: (是否通过筛选, 拒绝原因)
        """
        try:
            # 如果简历数据不完整，无法评估
            if not resume_data or not resume_data.get('name'):
                return False, "简历数据不完整"
                
            # 提取规则配置
            rules = config.get('rules', [])
            position_rules = [r for r in rules if r.get('type') == '岗位' and r.get('enabled')]
            company_rules = [r for r in rules if r.get('type') == '公司' and r.get('enabled')]
            keyword_rules = [r for r in rules if r.get('type') == '岗位核心关键词' and r.get('enabled')]
            
            # 检查是否已经通过卡片阶段筛选
            # 如果代码执行到这里，说明卡片阶段（职位匹配）已经通过，详情页应该主要关注关键词评分
            
            # 1. 岗位规则评估 - 通常在卡片阶段已完成，此处仅作备用检查
            # 添加一个标记，如果该简历来自详情页，已经通过了卡片阶段筛选，则不再进行岗位匹配
            position_match = True
            
            # 检查是否是从卡片数据提取，或者是HTML格式的简历
            is_from_card = resume_data.get('is_using_card_data_only') or resume_data.get('is_boss_html_resume')
            
            # 只有在非卡片数据的情况下才再次检查职位匹配
            if not is_from_card and position_rules:
                # 尝试从职位字段检查
                position = resume_data.get('position', '')
                if position is None:
                    position = ''
                position = position.lower()
                
                # 检查职位是否符合规则的关键词
                position_match = False
                for rule in position_rules:
                    keywords = rule.get('keywords', [])
                    must_match = rule.get('mustMatch', False)
                    
                    if not keywords or not must_match:
                        position_match = True
                        break
                        
                    for keyword in keywords:
                        if keyword.lower() in position:
                            position_match = True
                            break
                            
                    if position_match:
                        break
                
                # 如果职位字段不匹配，尝试从全文中查找
                if not position_match and resume_data.get('fullText'):
                    full_text = resume_data.get('fullText', '').lower()
                    for rule in position_rules:
                        keywords = rule.get('keywords', [])
                        for keyword in keywords:
                            if keyword.lower() in full_text:
                                position_match = True
                                print(f"从全文中找到职位匹配: {keyword}")
                                break
                        if position_match:
                            break
            
            # 如果职位不匹配，且明确指定了必须匹配，才拒绝
            if not position_match:
                # 检查是否有规则明确要求必须匹配
                must_match_rule = False
                for rule in position_rules:
                    if rule.get('mustMatch', False):
                        must_match_rule = True
                        break
                
                if must_match_rule:
                    return False, "期望职位不匹配"
                else:
                    # 如果没有必须匹配的规则，依然允许通过职位检查
                    position_match = True
                    print("职位不完全匹配，但没有强制要求，继续评估关键词")
                
            # 2. 竞对公司评估 - 通过直接打招呼
            if company_rules and resume_data.get('company'):
                # 确保company字段是列表
                company_list = resume_data.get('company', [])
                if company_list is None:
                    company_list = []
                elif not isinstance(company_list, list):
                    company_list = [company_list]
                
                for rule in company_rules:
                    keywords = rule.get('keywords', [])
                    
                    if not keywords:
                        continue
                        
                    for company in company_list:
                        if company is None:
                            continue
                        company_lower = str(company).lower()
                        for keyword in keywords:
                            keyword_lower = str(keyword).lower()
                            if keyword_lower in company_lower:
                                # 竞对公司直接通过
                                print(f"从竞对公司 '{company}' 来的候选人，匹配关键词 '{keyword}'")
                                return True, ""
            
            # 3. HTML格式简历特殊处理
            if resume_data.get('is_boss_html_resume'):
                # HTML格式简历如果已通过前面筛选，考虑放宽要求
                if resume_data.get('position'):  # 有期望职位信息且已通过岗位筛选
                    print("HTML格式简历已通过岗位筛选，考虑放宽要求")
                    return True, ""
            
            # 4. 关键词评分 - 详情页主要评估逻辑
            # 检查是否启用了AI智能筛选
            ai_enabled = config.get("aiEnabled", False)
            job_description = config.get("jobDescription", "")
            talent_profile = config.get("talentProfile", "")
            filter_criteria = config.get("filterCriteria", "")
            
            # 如果启用了AI智能筛选或有关键词规则，进行评估
            if ai_enabled or job_description or talent_profile or filter_criteria or keyword_rules:
                print("使用大模型评估简历与岗位匹配度...")
                # 调用大模型评估方法
                ai_result = await EvaluationHelper.evaluate_keywords_ai(resume_data, config)
                
                if ai_result["passed"]:
                    print(f"大模型评估通过！得分: {ai_result['score']}")
                    return True, ""
                else:
                    print(f"大模型评估不通过: {ai_result['rejectReason']}")
                    return False, ai_result["rejectReason"]
            
            # 默认通过（只有在没有任何评估规则时）
            print("⚠️ 没有配置任何评估规则，默认通过")
            return True, ""
            
        except Exception as e:
            print(f"评估简历出错: {e}")
            import traceback
            traceback.print_exc()
            return False, f"评估出错: {str(e)}" 

    @staticmethod
    def _match_position_precisely(text, keywords, is_full_text=False):
        """
        更精确地匹配职位关键词
        
        Args:
            text: 待匹配的文本（职位名称或全文）
            keywords: 关键词列表
            is_full_text: 是否为全文匹配（影响匹配策略）
            
        Returns:
            dict: 匹配结果，包含是否匹配和匹配的关键词
        """
        result = {
            "matched": False,
            "matched_keywords": []
        }
        
        if not text or not keywords:
            return result
        
        text_lower = text.lower()
        matched_keywords = []
        
        # 对每个关键词进行精确匹配
        for keyword_item in keywords:
            if isinstance(keyword_item, list):
                # 如果是关键词组，所有关键词都必须匹配
                all_matched = True
                temp_matched = []
                
                for keyword in keyword_item:
                    keyword_lower = keyword.lower()
                    
                    if is_full_text:
                        # 全文匹配：使用词边界匹配，避免部分匹配
                        pattern = r'\b' + re.escape(keyword_lower) + r'\b'
                        if re.search(pattern, text_lower):
                            temp_matched.append(keyword)
                        else:
                            all_matched = False
                            break
                    else:
                        # 职位名称匹配：使用更严格的匹配
                        if EvaluationHelper._is_position_keyword_match(text_lower, keyword_lower):
                            temp_matched.append(keyword)
                        else:
                            all_matched = False
                            break
                
                if all_matched and temp_matched:
                    matched_keywords.extend(temp_matched)
                    result["matched"] = True
            else:
                # 单个关键词匹配
                keyword_lower = keyword_item.lower()
                
                if is_full_text:
                    # 全文匹配：使用词边界匹配
                    pattern = r'\b' + re.escape(keyword_lower) + r'\b'
                    if re.search(pattern, text_lower):
                        matched_keywords.append(keyword_item)
                        result["matched"] = True
                else:
                    # 职位名称匹配：使用更严格的匹配
                    if EvaluationHelper._is_position_keyword_match(text_lower, keyword_lower):
                        matched_keywords.append(keyword_item)
                        result["matched"] = True
        
        result["matched_keywords"] = matched_keywords
        return result
    
    @staticmethod
    def _is_position_keyword_match(position_text, keyword):
        """
        判断职位关键词是否匹配
        
        Args:
            position_text: 职位文本（已转小写）
            keyword: 关键词（已转小写）
            
        Returns:
            bool: 是否匹配
        """
        # 1. 精确匹配
        if position_text == keyword:
            return True
        
        # 2. 检查关键词是否在职位文本中
        if keyword in position_text:
            # 获取关键词在文本中的位置
            start_pos = position_text.find(keyword)
            
            # 检查关键词前面是否有不相关的职位词汇
            prefix_chars = position_text[:start_pos]
            
            # 定义不相关的职位前缀（这些前缀表示不同的职位类型）
            unrelated_prefixes = ['原画', '美术', '设计师', '开发', '程序', '测试', '运营', '市场', '销售']
            
            # 如果前面有不相关的职位词汇，则不匹配
            for prefix in unrelated_prefixes:
                if prefix in prefix_chars:
                    print(f"职位匹配被拒绝: '{position_text}' 包含不相关前缀 '{prefix}'")
                    return False
            
            # 特殊情况：如果关键词是"策划"，但前面有"美术"、"原画"等，也应该拒绝
            if keyword == "策划":
                # 检查是否是纯策划职位还是其他职位的策划部分
                unrelated_art_prefixes = ['美术', '原画', '角色', '场景', '特效', 'ui', 'ux']
                for art_prefix in unrelated_art_prefixes:
                    if art_prefix in prefix_chars:
                        print(f"策划职位匹配被拒绝: '{position_text}' 包含美术相关前缀 '{art_prefix}'")
                        return False
            
            return True
        
        # 3. 词边界匹配（主要针对英文）
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, position_text):
            return True
        
        return False 