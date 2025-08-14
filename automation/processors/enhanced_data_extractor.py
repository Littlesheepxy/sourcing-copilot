#!/usr/bin/env python3
"""
增强版数据提取器
使用更智能的信息提取逻辑来解析简历数据
"""

import re
import uuid
from typing import Dict, List, Optional, Any
from playwright.async_api import Page, ElementHandle


class EnhancedDataExtractor:
    """增强版数据提取器，使用更智能的信息提取逻辑"""
    
    def __init__(self):
        # 教育关键词
        self.education_keywords = {
            '博士': ['博士', 'PhD', 'Ph.D', '博士研究生', '博士学位'],
            '硕士': ['硕士', '研究生', 'Master', 'M.A', 'M.S', 'MBA', '硕士研究生', '硕士学位'],
            '本科': ['本科', '学士', 'Bachelor', 'B.A', 'B.S', '大学本科', '学士学位'],
            '大专': ['大专', '专科', '高职', '大学专科'],
            '高中': ['高中', '中专', '技校', '职高']
        }
        
        # 职位关键词
        self.position_keywords = [
            '工程师', '开发', '程序员', '架构师', '技术', '经理', '主管', '总监', 
            '专员', '助理', '顾问', '分析师', '设计师', '产品', '运营', '市场',
            '销售', '客服', '人事', '财务', '法务', '策划', '编辑', '测试'
        ]
        
        # 公司后缀
        self.company_suffixes = [
            '有限公司', '股份有限公司', '集团', '科技', '技术', '信息', '网络',
            '软件', '电子', '通信', '互联网', '金融', '投资', '咨询', '服务'
        ]
        
        # 技能关键词库
        self.skill_keywords = {
            '编程语言': ['Java', 'Python', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Swift', 'Kotlin'],
            '前端技术': ['React', 'Vue', 'Angular', 'HTML', 'CSS', 'jQuery', 'Bootstrap', 'Webpack'],
            '后端技术': ['Spring', 'Django', 'Flask', 'Express', 'Node.js', 'Laravel', 'Rails'],
            '数据库': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 'SQLite'],
            '云服务': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', '微服务', '分布式'],
            '工具': ['Git', 'Jenkins', 'Maven', 'Gradle', 'npm', 'yarn', 'Linux', 'Windows']
        }

    async def extract_resume_data(self, page: Page, card_selector: str = None, selectors: dict = None) -> Dict[str, Any]:
        """
        增强的简历数据提取器
        使用多种策略提取简历信息
        """
        data = {}
        
        try:
            # 获取页面完整文本 - 修复：添加选择器参数
            # 先尝试获取弹窗内容，如果没有则获取整个页面
            full_text = None
            
            # 优先尝试获取BOSS直聘弹窗内容 - 按优先级排序
            selectors_to_try = [
                '.resume-detail-wrap',           # 简历详情主容器
                '.dialog-wrap.active',           # 活动的弹窗
                '.boss-dialog__body',            # 弹窗主体
                '.lib-resume-recommend',         # 简历推荐容器
                '#boss-dynamic-dialog-1it1ej9u8', # 特定的弹窗ID（如果存在）
                '.dialog-wrap',                  # 通用弹窗
                'body'                           # 最后尝试整个页面
            ]
            
            for selector in selectors_to_try:
                try:
                    full_text = await page.text_content(selector)
                    if full_text and len(full_text.strip()) > 100:  # 确保获取到了足够的内容
                        print(f"✅ 成功使用选择器获取内容: {selector}")
                        break
                except Exception as e:
                    print(f"❌ 选择器 {selector} 失败: {str(e)}")
                    continue
            
            if not full_text:
                print("❌ 无法获取页面文本内容")
                return data
                
            # 清理文本
            cleaned_text = self._clean_text(full_text)
            data['fullText'] = cleaned_text
            
            # 先尝试使用DOM选择器精确提取信息（如果在卡片页面）
            try:
                if card_selector or await page.query_selector('.candidate-card-wrap, .card-inner'):
                    print("🎯 检测到卡片页面，使用精确DOM选择器提取...")
                    dom_data = await self._extract_from_dom(page, card_selector)
                    if dom_data:
                        data.update(dom_data)
                        print(f"✅ DOM提取成功: 姓名={data.get('name')}, 职位={data.get('position')}")
            except Exception as e:
                print(f"⚠️ DOM提取失败，回退到文本提取: {e}")
            
            # 如果DOM提取失败或不完整，使用文本提取作为补充
            if not data.get('name') or not data.get('position'):
                print("🔄 使用文本提取补充信息...")
                text_data = self._extract_from_text(cleaned_text)
                # 只补充缺失的字段
                for key, value in text_data.items():
                    if not data.get(key) and value:
                        data[key] = value
            
            # Boss直聘特有信息提取
            if not data.get('salary_expectation'):
                data['salary_expectation'] = self._extract_salary_expectation(cleaned_text)
            if not data.get('work_location'):
                data['work_location'] = self._extract_work_location(cleaned_text)
            if not data.get('position_experience'):
                data['position_experience'] = self._extract_position_experience(cleaned_text)
            
            print(f"✅ 增强提取完成: 姓名={data.get('name')}, 学历={data.get('education')}, 职位={data.get('position')}, 期望薪资={data.get('salary_expectation')}")
            
        except Exception as e:
            print(f"❌ 增强数据提取失败: {e}")
            import traceback
            traceback.print_exc()
            
        return data

    async def _extract_from_dom(self, page: Page, card_selector: str = None) -> Dict[str, Any]:
        """
        使用DOM选择器精确提取信息
        
        Args:
            page: Playwright页面对象
            card_selector: 卡片选择器
            
        Returns:
            Dict[str, Any]: 提取的数据
        """
        data = {}
        
        try:
            # 确定容器选择器
            container_selector = card_selector if card_selector else '.candidate-card-wrap, .card-inner, .resume-detail-wrap'
            
            # 提取姓名 - 使用更精确的选择器
            name_selectors = [
                '.name',                           # 通用姓名选择器
                '.row.name-wrap .name',           # 卡片中的姓名
                '.geek-base-info-wrap .name',     # 详情页中的姓名
                '[class*="name"]'                 # 包含name的类名
            ]
            
            for name_sel in name_selectors:
                try:
                    full_selector = f"{container_selector} {name_sel}" if container_selector != 'body' else name_sel
                    name_element = await page.query_selector(full_selector)
                    if name_element:
                        name = await name_element.text_content()
                        if name and name.strip() and name.strip() not in ['面议', '保密', '暂无', '']:
                            data['name'] = name.strip()
                            print(f"✅ DOM提取姓名: {data['name']} (选择器: {full_selector})")
                            break
                except Exception as e:
                    print(f"⚠️ 姓名选择器 {name_sel} 失败: {e}")
                    continue
            
            # 提取期望职位
            position_selectors = [
                '.content .join-text-wrap',       # 期望职位内容
                '.geek-expect-wrap .join-text-wrap', # 详情页期望职位
                '[class*="expect"] .content',     # 期望相关内容
                '.row-flex .content'              # 行内容
            ]
            
            for pos_sel in position_selectors:
                try:
                    full_selector = f"{container_selector} {pos_sel}" if container_selector != 'body' else pos_sel
                    position_elements = await page.query_selector_all(full_selector)
                    for element in position_elements:
                        position_text = await element.text_content()
                        if position_text and '期望' in await page.text_content(f"{full_selector}//ancestor::*[contains(@class, 'row')]"):
                            # 从期望职位文本中提取职位
                            position = self._extract_position_from_text(position_text.strip())
                            if position:
                                data['position'] = position
                                print(f"✅ DOM提取职位: {data['position']}")
                                break
                except Exception as e:
                    continue
                
                if data.get('position'):
                    break
            
            # 提取学历
            education_selectors = [
                '.base-info',                     # 基本信息
                '.join-text-wrap',               # 连接文本
                '.geek-base-info-wrap'           # 详情页基本信息
            ]
            
            for edu_sel in education_selectors:
                try:
                    full_selector = f"{container_selector} {edu_sel}" if container_selector != 'body' else edu_sel
                    edu_elements = await page.query_selector_all(full_selector)
                    for element in edu_elements:
                        edu_text = await element.text_content()
                        if edu_text:
                            education = self._extract_education_from_text(edu_text)
                            if education:
                                data['education'] = education
                                print(f"✅ DOM提取学历: {data['education']}")
                                break
                except Exception as e:
                    continue
                    
                if data.get('education'):
                    break
            
            # 提取公司信息
            company_selectors = [
                '.timeline-wrap.work-exps .content',  # 工作经历内容
                '.work-exp-box .company',             # 工作经历公司
                '.timeline-item .content'             # 时间轴内容
            ]
            
            companies = []
            for comp_sel in company_selectors:
                try:
                    full_selector = f"{container_selector} {comp_sel}" if container_selector != 'body' else comp_sel
                    comp_elements = await page.query_selector_all(full_selector)
                    for element in comp_elements:
                        comp_text = await element.text_content()
                        if comp_text:
                            company = self._extract_company_from_text(comp_text)
                            if company and company not in companies and company != '保密':
                                companies.append(company)
                except Exception as e:
                    continue
            
            if companies:
                data['company'] = companies
                print(f"✅ DOM提取公司: {companies}")
            
            # 提取学校信息
            school_selectors = [
                '.timeline-wrap.edu-exps .content',   # 教育经历内容
                '.edu-exp-box .school',               # 教育经历学校
                '.education .content'                 # 教育内容
            ]
            
            schools = []
            for school_sel in school_selectors:
                try:
                    full_selector = f"{container_selector} {school_sel}" if container_selector != 'body' else school_sel
                    school_elements = await page.query_selector_all(full_selector)
                    for element in school_elements:
                        school_text = await element.text_content()
                        if school_text:
                            school = self._extract_school_from_text(school_text)
                            if school and school not in schools:
                                schools.append(school)
                except Exception as e:
                    continue
            
            if schools:
                data['schools'] = schools
                print(f"✅ DOM提取学校: {schools}")
            
            # 提取技能标签
            skill_selectors = [
                '.tags-wrap .tag-item',              # 技能标签
                '.tag-list .tag',                    # 标签列表
                '.skill-tag'                         # 技能标签
            ]
            
            skills = []
            for skill_sel in skill_selectors:
                try:
                    full_selector = f"{container_selector} {skill_sel}" if container_selector != 'body' else skill_sel
                    skill_elements = await page.query_selector_all(full_selector)
                    for element in skill_elements:
                        skill_text = await element.text_content()
                        if skill_text and skill_text.strip():
                            skill = skill_text.strip()
                            if skill not in skills and len(skill) < 20:
                                skills.append(skill)
                except Exception as e:
                    continue
            
            if skills:
                data['skills'] = skills
                print(f"✅ DOM提取技能: {skills}")
            
            return data
            
        except Exception as e:
            print(f"❌ DOM提取失败: {e}")
            return {}

    def _extract_from_text(self, text: str) -> Dict[str, Any]:
        """
        从文本中提取信息（作为DOM提取的备用方案）
        
        Args:
            text: 清理后的文本
            
        Returns:
            Dict[str, Any]: 提取的数据
        """
        data = {}
        
        # 提取各种信息
        data['name'] = self._extract_name(text)
        data['education'] = self._extract_education(text)
        data['position'] = self._extract_position(text)
        data['company'] = self._extract_companies(text)
        data['schools'] = self._extract_schools(text)
        data['skills'] = self._extract_skills(text)
        data['experience'] = self._extract_experience(text)
        data['phone'] = self._extract_phone(text)
        data['email'] = self._extract_email(text)
        
        return data

    def _extract_position_from_text(self, text: str) -> str:
        """从文本中提取职位信息"""
        if not text:
            return ""
            
        # 移除地点信息，只保留职位
        parts = text.split('•')
        if len(parts) >= 2:
            position = parts[1].strip()
        else:
            # 按照其他分隔符尝试
            for sep in ['|', '·', '-', ' ']:
                parts = text.split(sep)
                if len(parts) >= 2:
                    position = parts[1].strip()
                    break
            else:
                position = text.strip()
        
        return self._clean_position(position)

    def _extract_education_from_text(self, text: str) -> str:
        """从文本中提取学历信息"""
        # 按优先级排序
        education_order = ['博士', '硕士', '本科', '大专', '高中']
        
        for edu_level in education_order:
            if edu_level in text:
                return edu_level
                    
        return ""

    def _extract_school_from_text(self, text: str) -> str:
        """从文本中提取学校信息"""
        # 查找包含"大学"、"学院"等关键词的文本
        school_keywords = ['大学', '学院', '学校', '职业技术学院', '师范']
        for keyword in school_keywords:
            if keyword in text:
                # 提取包含关键词的部分
                parts = text.split('•')
                for part in parts:
                    if keyword in part:
                        return self._clean_school_name(part.strip())
        
        return ""

    def _clean_text(self, text: str) -> str:
        """清理文本"""
        if not text:
            return ""
            
        # 移除多余的空白字符
        text = re.sub(r'\s+', ' ', text)
        # 移除特殊字符，但保留+号
        text = re.sub(r'[^\u4e00-\u9fff\w\s\.\-\(\)（）：:，,。\+]', ' ', text)
        return text.strip()

    def _extract_name(self, text: str) -> str:
        """提取姓名"""
        # BOSS直聘特定的姓名模式
        patterns = [
            r'姓名[：:]\s*([^\s\n]{2,4})',
            r'候选人[：:]\s*([^\s\n]{2,4})',
            r'简历[：:]\s*([^\s\n]{2,4})',
            r'联系人[：:]\s*([^\s\n]{2,4})',
            # 新增：从页面标题或其他位置提取姓名
            r'牛人[：:]\s*([^\s\n]{2,4})',
            r'求职者[：:]\s*([^\s\n]{2,4})',
        ]
        
        # 需要排除的词汇
        excluded_words = {'面议', '保密', '暂无', '本周', '活跃', '在职', '考虑', '机会', '年以上', '硕士', '本科', '大专', '博士'}
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                name = match.group(1).strip()
                # 验证是否为有效姓名（中文2-4字符且不在排除列表中）
                if re.match(r'^[\u4e00-\u9fff]{2,4}$', name) and name not in excluded_words:
                    return name
        
        # 如果没有找到，尝试提取文本中的中文姓名
        # 将文本按空格和常见分隔符分割
        words = re.split(r'[\s，,。；;！!？?\n\r]+', text)
        
        for word in words:
            word = word.strip()
            # 检查是否为有效的中文姓名
            if (re.match(r'^[\u4e00-\u9fff]{2,4}$', word) and 
                word not in excluded_words and
                not re.match(r'^\d+', word) and  # 不以数字开头
                word not in ['期望', '优势', '技能', '工作', '教育', '项目']):  # 不是常见标签
                return word
        
        # BOSS直聘中经常没有显示姓名，返回空字符串
        return ""

    def _extract_education(self, text: str) -> str:
        """提取学历"""
        # 按优先级排序
        education_order = ['博士', '硕士', '本科', '大专', '高中']
        
        for edu_level in education_order:
            for keyword in self.education_keywords[edu_level]:
                if keyword in text:
                    return edu_level
                    
        return ""

    def _extract_position(self, text: str) -> str:
        """提取期望职位"""
        # BOSS直聘特定的期望职位模式
        patterns = [
            r'期望职位[：:]\s*([^\n\r]{2,30})',
            r'期望岗位[：:]\s*([^\n\r]{2,30})',
            r'应聘职位[：:]\s*([^\n\r]{2,30})',
            r'期望[：:]\s*([^\n\r，,]{2,20})',
            # 新增：匹配BOSS直聘的期望职位格式（城市 | 职位 | 行业 | 薪资）
            r'北京[\s\|]*([^|\n\r]{2,15})[\s\|]*行业不限',
            r'上海[\s\|]*([^|\n\r]{2,15})[\s\|]*行业不限',
            r'广州[\s\|]*([^|\n\r]{2,15})[\s\|]*行业不限',
            r'深圳[\s\|]*([^|\n\r]{2,15})[\s\|]*行业不限',
            # 匹配职位 + 薪资的格式
            r'([^|\n\r]{2,15})[\s\|]*\d+-\d+K',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                position = match.group(1).strip()
                # 清理职位信息
                position = self._clean_position(position)
                if position:
                    return position
        
        # 如果没有找到明确的期望职位，尝试从文本中找职位关键词
        for keyword in self.position_keywords:
            if keyword in text:
                # 查找包含该关键词的短语
                pattern = rf'([^\s\n]{{0,10}}{re.escape(keyword)}[^\s\n]{{0,10}})'
                match = re.search(pattern, text)
                if match:
                    position = match.group(1).strip()
                    position = self._clean_position(position)
                    if position and len(position) < 20:
                        return position
                        
        return ""

    def _clean_position(self, position: str) -> str:
        """清理职位信息"""
        if not position:
            return ""
            
        # 移除明显不是职位的信息
        invalid_patterns = [
            r'\d+岁', r'\d+年', r'离职', r'在职', r'本科', r'大专', r'硕士', r'博士',
            r'\d{4}\.\d{2}', r'经验', r'工作', r'毕业'
        ]
        
        for pattern in invalid_patterns:
            position = re.sub(pattern, '', position)
            
        # 清理多余的符号和空格
        position = re.sub(r'[^\u4e00-\u9fff\w\s]', ' ', position)
        position = re.sub(r'\s+', ' ', position).strip()
        
        return position if len(position) > 1 else ""

    def _extract_companies(self, text: str) -> List[str]:
        """提取公司信息"""
        companies = []
        
        # BOSS直聘特定的公司格式
        patterns = [
            r'公司名称[：:]\s*([^\n\r]+)',
            r'任职公司[：:]\s*([^\n\r]+)',
            r'工作单位[：:]\s*([^\n\r]+)',
            # 新增：匹配BOSS直聘的工作经历格式
            r'([^\n\r]{3,30}(?:有限公司|股份有限公司|集团|科技|技术|信息|网络))[^\n\r]*\d{4}\.\d{2}[-—至今\d\.]*',
            # 匹配时间前的公司名
            r'([^\n\r]{3,30}(?:有限公司|股份有限公司|集团|科技|技术|信息|网络))[^\n\r]*(?=\s*\d{4}\.\d{2})',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                company = match.group(1).strip()
                company = self._clean_company_name(company)
                if company and company not in companies and company != '保密':
                    companies.append(company)
        
        # 如果没有找到标准格式，查找时间段+公司的模式
        if not companies:
            # 匹配：时间段 + 公司名
            work_pattern = r'(\d{4}\.\d{2}至今|\d{4}\.\d{2}[-—至]\d{4}\.\d{2})\s*([^\n\r\d]{3,30})'
            matches = re.finditer(work_pattern, text)
            for match in matches:
                company_text = match.group(2).strip()
                company = self._extract_company_from_text(company_text)
                if company and company not in companies and company != '保密':
                    companies.append(company)
        
        # 如果还是没有，查找包含公司后缀的文本
        if not companies:
            for suffix in self.company_suffixes:
                pattern = rf'([^\n\r]{{2,20}}{re.escape(suffix)})'
                matches = re.finditer(pattern, text)
                for match in matches:
                    company = match.group(1).strip()
                    company = self._clean_company_name(company)
                    if company and len(company) < 30 and company not in companies and company != '保密':
                        companies.append(company)
        
        return companies[:3]  # 最多返回3个公司

    def _extract_company_from_text(self, text: str) -> str:
        """从文本中提取公司名"""
        # 移除职位信息
        for keyword in self.position_keywords:
            text = text.replace(keyword, '')
            
        # 查找公司后缀
        for suffix in self.company_suffixes:
            if suffix in text:
                # 提取包含后缀的公司名
                pattern = rf'([^\s\n]{{2,15}}{re.escape(suffix)})'
                match = re.search(pattern, text)
                if match:
                    return self._clean_company_name(match.group(1))
                    
        # 如果没有后缀，返回清理后的文本
        return self._clean_company_name(text)

    def _clean_company_name(self, company: str) -> str:
        """清理公司名称"""
        if not company:
            return ""
            
        # 移除时间信息
        company = re.sub(r'\d{4}\.\d{2}[-—至今\d\.]*', '', company)
        # 移除职位信息
        for keyword in self.position_keywords:
            company = company.replace(keyword, '')
        # 清理符号
        company = re.sub(r'[^\u4e00-\u9fff\w\s]', ' ', company)
        company = re.sub(r'\s+', ' ', company).strip()
        
        return company if len(company) > 1 else ""

    def _extract_schools(self, text: str) -> List[str]:
        """提取学校信息"""
        schools = []
        
        # BOSS直聘特定的学校格式
        patterns = [
            r'学校名称[：:]\s*([^\n\r]+)',
            r'毕业院校[：:]\s*([^\n\r]+)',
            r'就读学校[：:]\s*([^\n\r]+)',
            # 新增：匹配BOSS直聘的教育经历格式
            r'([^\n\r]{3,15}(?:大学|学院|学校|职业技术学院|师范))[^\n\r]*工商管理',
            r'([^\n\r]{3,15}(?:大学|学院|学校|职业技术学院|师范))[^\n\r]*本科',
            r'([^\n\r]{3,15}(?:大学|学院|学校|职业技术学院|师范))[^\n\r]*硕士',
            r'([^\n\r]{3,15}(?:大学|学院|学校|职业技术学院|师范))[^\n\r]*\d{4}[-—\d]*',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                school = match.group(1).strip()
                school = self._clean_school_name(school)
                if school and school not in schools:
                    schools.append(school)
        
        # 查找包含"大学"、"学院"等关键词的文本
        if not schools:
            school_keywords = ['大学', '学院', '学校', '职业技术学院', '师范']
            for keyword in school_keywords:
                pattern = rf'([^\n\r]{{2,15}}{re.escape(keyword)})'
                matches = re.finditer(pattern, text)
                for match in matches:
                    school = match.group(1).strip()
                    school = self._clean_school_name(school)
                    if school and len(school) < 20 and school not in schools:
                        schools.append(school)
        
        return schools[:2]  # 最多返回2个学校

    def _clean_school_name(self, school: str) -> str:
        """清理学校名称"""
        if not school:
            return ""
            
        # 移除时间和专业信息
        school = re.sub(r'\d{4}[-—至今\d]*', '', school)
        school = re.sub(r'专业[：:].*', '', school)
        school = re.sub(r'英语.*', '', school)  # 移除专业信息
        school = re.sub(r'本科.*', '', school)  # 移除学历信息
        school = re.sub(r'硕士.*', '', school)  # 移除学历信息
        # 清理符号
        school = re.sub(r'[^\u4e00-\u9fff\w\s]', ' ', school)
        school = re.sub(r'\s+', ' ', school).strip()
        
        return school if len(school) > 1 else ""

    def _extract_skills(self, text: str) -> List[str]:
        """提取技能"""
        skills = []
        
        # 从技能标签部分提取
        skills_section_match = re.search(r'技能标签[：:](.*?)(?=\n\s*\n|\Z)', text, re.DOTALL)
        if skills_section_match:
            skills_text = skills_section_match.group(1)
            skill_candidates = re.split(r'[,，、\s]+', skills_text)
            for skill in skill_candidates:
                skill = skill.strip()
                if skill and len(skill) < 20 and skill not in skills:
                    skills.append(skill)
        
        # 从技能关键词库中匹配
        if len(skills) < 5:  # 如果技能太少，从关键词库补充
            for category, keywords in self.skill_keywords.items():
                for keyword in keywords:
                    if re.search(r'\b' + re.escape(keyword) + r'\b', text, re.IGNORECASE):
                        if keyword not in skills:
                            skills.append(keyword)
        
        return skills[:10]  # 最多返回10个技能

    def _extract_experience(self, text: str) -> int:
        """提取工作经验年限"""
        patterns = [
            r'(\d+)[年]经验',
            r'工作经验[：:]\s*(\d+)[年]',
            r'(\d+)[年]工作经验',
            r'(\d+)年\+行业经验',  
            r'(\d+)\+年经验',      
            r'(\d+)年 行业经验',   
            # 新增：匹配BOSS直聘的岗位经验格式
            r'媒介投放\s*(\d+)年\d*个月',
            r'SEM\s*(\d+)年\d*个月',
            r'海外市场\s*(\d+)年\d*个月',
            r'(\d+)年\d*个月',  # 通用格式
        ]
        
        max_years = 0
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                years = int(match.group(1))
                if 0 <= years <= 50:  # 合理的年限范围
                    max_years = max(max_years, years)
                    
        return max_years

    def _extract_phone(self, text: str) -> str:
        """提取电话号码"""
        pattern = r'1[3-9]\d{9}'
        match = re.search(pattern, text)
        return match.group(0) if match else ""

    def _extract_email(self, text: str) -> str:
        """提取邮箱"""
        pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        match = re.search(pattern, text)
        return match.group(0) if match else ""

    def _extract_salary_expectation(self, text: str) -> str:
        """提取期望薪资"""
        patterns = [
            r'(\d+-\d+K)',                    # 20-25K格式
            r'(\d+K-\d+K)',                   # 20K-25K格式
            r'(\d+k-\d+k)',                   # 小写k格式
            r'期望薪资[：:]\s*([^\n\r]+)',     # 期望薪资标签
            r'薪资要求[：:]\s*([^\n\r]+)',     # 薪资要求标签
            r'面议',                          # 面议
            r'(\d+)-(\d+)万',                 # 万元格式
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                salary = match.group(1) if match.groups() else match.group(0)
                return salary.strip()
                
        return ""

    def _extract_work_location(self, text: str) -> str:
        """提取工作地点"""
        # 常见城市列表
        cities = [
            '北京', '上海', '广州', '深圳', '杭州', '南京', '苏州', '成都',
            '武汉', '西安', '天津', '重庆', '青岛', '大连', '厦门', '宁波',
            '无锡', '福州', '济南', '郑州', '长沙', '石家庄', '合肥', '东莞'
        ]
        
        patterns = [
            r'期望.*?[：:]\s*([^，,\n\r]*(?:' + '|'.join(cities) + ')[^，,\n\r]*)',
            r'工作地点[：:]\s*([^\n\r]+)',
            r'([北上广深杭].*?)[，,·\s]',  # 简称匹配
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                location = match.group(1).strip()
                # 清理位置信息
                for city in cities:
                    if city in location:
                        return city
                        
        return ""

    def _extract_position_experience(self, text: str) -> Dict[str, str]:
        """提取岗位经验"""
        position_exp = {}
        
        # 匹配岗位经验格式：岗位名 X年Y个月
        patterns = [
            r'([^\n\r]{2,20})\s*(\d+年\d*个月)',
            r'([^\n\r]{2,20})\s*(\d+年)',
            r'([^\n\r]{2,20})\s*(\d+个月)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                position = match.group(1).strip()
                experience = match.group(2).strip()
                # 清理职位名称
                position = re.sub(r'[^\u4e00-\u9fff\w\s]', ' ', position).strip()
                if len(position) > 1 and len(position) < 20:
                    position_exp[position] = experience
        
        return position_exp

    async def merge_resume_data(self, card_data: Dict, detail_data: Dict) -> Dict:
        """
        合并卡片数据和详情页数据
        
        Args:
            card_data: 卡片数据
            detail_data: 详情页数据
            
        Returns:
            dict: 合并后的数据
        """
        merged_data = card_data.copy() if card_data else {}
        
        if not detail_data:
            return merged_data
            
        # 智能合并策略
        for key, value in detail_data.items():
            if not value:  # 跳过空值
                continue
                
            if key in ['company', 'schools', 'skills'] and isinstance(value, list):
                # 列表类型数据合并去重
                existing = merged_data.get(key, [])
                if isinstance(existing, list):
                    merged_data[key] = list(set(existing + value))
                else:
                    merged_data[key] = value
            elif key in ['name', 'education', 'position'] and value:
                # 重要字段优先使用详情页数据
                merged_data[key] = value
            elif not merged_data.get(key):
                # 如果原数据没有该字段，使用详情页数据
                merged_data[key] = value
                
        return merged_data 