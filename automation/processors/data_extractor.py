"""
数据提取模块
负责从页面提取简历数据
"""

import re
import uuid
import os
import tempfile
import requests  # 添加requests模块，用于OCR-Space API
from playwright.async_api import Page
from PIL import Image
import math
import time
import base64  # 确保导入base64模块

class DataExtractor:
    """数据提取器类，用于从Boss直聘页面提取简历数据"""
    
    def __init__(self):
        """初始化数据提取器"""
        pass
        
    async def extract_resume_card_data(self, page: Page, card_selector: str, selectors: dict = None):
        """
        从卡片提取简历数据
        
        Args:
            page: Playwright页面对象
            card_selector: 卡片元素选择器
            selectors: 选择器配置
            
        Returns:
            dict: 提取的简历数据
        """
        if selectors is None:
            selectors = {}
            
        card = await page.query_selector(card_selector)
        if not card:
            return None
            
        data = {
            'id': await self._generate_card_id(page, card)
        }
        
        try:
            # 提取姓名
            data['name'] = await self._extract_element_text(card, [
                selectors.get('name'),
                '.name', 
                '.candidate-name',
                '.geek-name',
                'h3.name',
                '[class*="name"]'
            ])
            
            # 提取期望职位
            data['position'] = await self._extract_element_text(card, [
                selectors.get('expectPosition'),
                '.join-text-wrap',
                '.expect-position',
                '.position-expectation',
                '.job-expectation',
                '.position-name',
                '.position-info-item.expect .expect-content',
                '.job-name',
                '.job-info .job-name',
                '.expect-position .content',
                '.info-text',
                '.item-job',
                '.header-job',
                '.name-box .job-name',
                '.expect-job',
                '.item-position',
                '.column-position',
                '.candidate-position-text',
                '[class*="join-text-wrap"]'
            ])
            
            # 提取当前/上一家公司
            data['company'] = await self._extract_element_text(card, [
                selectors.get('company'),
                '.timeline-wrap.work-exps',
                '.company', 
                '.work-exp', 
                '.company-name',
                '[class*="timeline-wrap"]'
            ])
            
            # 如果公司是字符串,转成数组(保持和后端评估接口一致)
            if isinstance(data['company'], str) and data['company']:
                data['company'] = [data['company']]
            elif not data.get('company'):
                data['company'] = []
                
            # 提取教育信息
            data['education'] = await self._extract_element_text(card, [
                selectors.get('education'),
                '.education',
                '.edu-exp'
            ])
            
            # 提取学校
            data['schools'] = []
            school = await self._extract_element_text(card, [
                selectors.get('school'),
                '.school', 
                '.edu-exp-box .text', 
                '[class*="school"]'
            ])
            if school:
                data['schools'].append(school)
                
            # 提取工作经验
            exp_text = await self._extract_element_text(card, ['.experience', '[class*="experience"]'])
            if exp_text:
                exp_match = re.search(r'(\d+)[年|-]经验', exp_text)
                if exp_match:
                    data['experience'] = int(exp_match.group(1))
                    
            # 提取技能标签
            data['skills'] = await self._extract_elements_text(card, [
                selectors.get('skills'),
                '.tag-list', 
                '.skill-tag', 
                '.tags', 
                '.labels',
                '[class*="tag"]',
                '[class*="skill"]'
            ])
            
            # 提取完整文本用于备用匹配
            full_text = await card.text_content()
            if full_text:
                data['fullText'] = re.sub(r'\s+', ' ', full_text).strip()
            else:
                data['fullText'] = ''
                
        except Exception as e:
            print(f"提取简历卡片数据失败: {e}")
            
        return data
        
    async def extract_detail_page_data(self, page: Page, selectors: dict = None):
        """
        从详情页提取简历数据
        
        Args:
            page: Playwright页面对象
            selectors: 选择器配置
            
        Returns:
            dict: 提取的简历数据
        """
        if selectors is None:
            selectors = {}
            
        data = {}
        
        try:
            # 详情页是图片格式，直接提取页面完整文本
            # 首先检查页面是否加载了简历内容
            detail_container = await page.query_selector(
                selectors.get('detailPage', {}).get('container') or
                '.resume-detail-wrap'
            )
            
            if not detail_container:
                print("未找到简历详情页容器元素")
                return data
                
            # 提取页面完整文本进行处理
            full_text = await page.text_content()
            if not full_text:
                print("未能从详情页提取文本")
                return data
                
            print(f"从详情页获取到文本，长度: {len(full_text)}")
            
            # 通过正则表达式从文本中提取关键信息
            # 提取姓名
            name_match = re.search(r'姓名[：:]\s*([^\n\r]+)', full_text)
            if name_match:
                data['name'] = name_match.group(1).strip()
            
            # 提取期望职位
            position_patterns = [
                r'期望职位[：:]\s*([^\n\r]+)',
                r'期望岗位[：:]\s*([^\n\r]+)',
                r'应聘[：:]\s*([^\n\r]+)',
                r'岗位[：:]\s*([^\n\r]+)',
                r'期望[：:]\s*([^\n\r,，]+)',  # 新增：匹配简单的"期望："格式
                r'期望[：:].*?(\w+(?:开发|工程师|经理|主管|总监|专员|助理|顾问|分析师|设计师))'  # 匹配职位关键词
            ]
            
            for pattern in position_patterns:
                position_match = re.search(pattern, full_text)
                if position_match:
                    data['position'] = position_match.group(1).strip()
                    print(f"通过正则表达式 '{pattern}' 从详情页提取到职位: {data['position']}")
                    break
                
            # 提取工作经验
            experience_match = re.search(r'(\d+)[年|-]经验', full_text)
            if experience_match:
                data['experience'] = int(experience_match.group(1))
                
            # 提取公司信息 - 增强对时间段和公司名称的区分
            companies = []
            # 先尝试查找标准格式
            company_matches = re.finditer(r'(公司名称|任职公司)[：:]\s*([^\n\r]+)', full_text)
            for match in company_matches:
                company = match.group(2).strip()
                if company and company not in companies:
                    companies.append(company)
            
            # 如果没有找到标准格式，尝试查找时间段和公司的模式
            if not companies:
                # 匹配常见的工作经历模式：时间段+公司名+职位
                work_exp_matches = re.finditer(
                    r'(\d{4}\.\d{2}至今|\d{4}\.\d{2}[-—至]\d{4}\.\d{2})\s*([^，。\n\d]{2,30})',
                    full_text
                )
                for match in work_exp_matches:
                    time_period = match.group(1).strip()
                    company_name = match.group(2).strip()
                    if company_name and time_period:
                        companies.append(f"{time_period} {company_name}")
                        
            # 如果还是没有找到，尝试更宽松的模式
            if not companies:
                # 查找包含"公司"一词的段落
                company_sections = re.findall(r'[^\n]+公司[^\n]+', full_text)
                for section in company_sections:
                    if len(section) < 100:  # 避免过长的文本
                        companies.append(section.strip())
            
            data['company'] = companies
            
            # 提取教育经历
            schools = []
            school_matches = re.finditer(r'(学校名称|毕业院校)[：:]\s*([^\n\r]+)', full_text)
            for match in school_matches:
                school = match.group(2).strip()
                if school and school not in schools:
                    schools.append(school)
            data['schools'] = schools
            
            # 提取技能标签
            skills = []
            # 尝试从"技能标签"部分提取
            skills_section_match = re.search(r'技能标签[：:](.*?)(?=\n\s*\n|\Z)', full_text, re.DOTALL)
            if skills_section_match:
                skills_text = skills_section_match.group(1)
                # 按逗号、空格等分隔符分割技能
                skill_candidates = re.split(r'[,，、\s]+', skills_text)
                for skill in skill_candidates:
                    if skill.strip() and len(skill.strip()) < 20:  # 过滤无效或过长的技能名
                        skills.append(skill.strip())
            
            # 如果没找到技能，尝试从全文中匹配常见技术关键词
            if not skills:
                common_skills = ["Java", "Python", "C++", "JavaScript", "TypeScript", "React", "Vue", "Angular", 
                               "Node.js", "Spring", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", 
                               "微服务", "分布式", "前端", "后端", "全栈", "算法", "数据结构", "测试", "DevOps"]
                for skill in common_skills:
                    if re.search(r'\b' + re.escape(skill) + r'\b', full_text):
                        skills.append(skill)
            
            data['skills'] = skills
            
            # 保存完整文本以备后续处理
            data['fullText'] = full_text
            
        except Exception as e:
            print(f"提取详情页数据失败: {e}")
            import traceback
            traceback.print_exc()
            
        return data
        
    def merge_resume_data(self, card_data, detail_data):
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
            
        # 合并详情页数据，优先使用详情页中的更详细信息
        for key, value in detail_data.items():
            # 数组类型的数据需要合并去重
            if isinstance(value, list) and isinstance(merged_data.get(key), list):
                merged_data[key] = list(set(merged_data[key] + value))
            # 对于有值的字段，优先使用详情页数据
            elif value:
                merged_data[key] = value
                
        return merged_data
        
    async def _extract_element_text(self, element, selectors):
        """提取元素文本"""
        for selector in selectors:
            if not selector:
                continue
                
            try:
                if isinstance(element, Page):
                    el = await element.query_selector(selector)
                else:
                    el = await element.query_selector(selector)
                    
                if el:
                    text = await el.text_content()
                    if text:
                        # 处理特殊格式的期望职位（如"期望：北京游戏策划/制作"）
                        if "期望" in selector.lower() or "position" in selector.lower():
                            # 尝试提取"期望："后面的内容
                            expectation_match = re.search(r'期望[：:]\s*([^\n\r]+)', text)
                            if expectation_match:
                                return expectation_match.group(1).strip()
                                
                        return text.strip()
            except Exception:
                pass
                
        return ""
        
    async def _extract_elements_text(self, element, selectors):
        """提取多个元素文本"""
        for selector in selectors:
            if not selector:
                continue
                
            try:
                if isinstance(element, Page):
                    els = await element.query_selector_all(selector)
                else:
                    els = await element.query_selector_all(selector)
                    
                if els and len(els) > 0:
                    texts = []
                    for el in els:
                        content = await el.text_content()
                        if content:
                            texts.append(content.strip())
                    return texts
            except Exception:
                pass
                
        return []
        
    async def _generate_card_id(self, page, card):
        """生成卡片唯一ID"""
        try:
            # 尝试从DOM元素获取ID
            card_id = await card.get_attribute('data-id')
            if card_id:
                return card_id
                
            # 尝试从URL中获取ID
            url = page.url
            id_match = re.search(r'id=(\w+)', url)
            if id_match:
                return id_match.group(1)
        except Exception:
            pass
            
        # 生成随机ID
        return str(uuid.uuid4())
        
    async def extract_from_detail_page(self, page, selectors=None):
        """
        从详情页中提取简历数据，支持HTML格式的简历提取
        
        Args:
            page: Playwright页面对象
            selectors: 选择器配置
            
        Returns:
            dict: 提取的简历数据
        """
        try:
            # 使用传入的选择器或默认选择器
            selectors = selectors or {}
            
            # 初始化简历数据字典
            resume_data = {
                'link': page.url,
                'is_standard_resume': True
                # 不再预定义结构化字段，直接存储原始HTML
            }
            
            # 检查是否为BOSS直聘HTML格式简历（具有特定结构的div）
            boss_resume_container = await page.query_selector('.resume-detail-wrap, [data-v-bcc3a4cc], [class*="resume-detail"]')
            if boss_resume_container:
                print("检测到BOSS直聘HTML格式简历，提取HTML文本")
                resume_data['is_boss_html_resume'] = True
                
                # 直接获取整个HTML内容
                html_content = await page.content()
                resume_data['html_content'] = html_content
                
                print(f"已成功提取BOSS直聘HTML简历内容，长度: {len(html_content)}")
                return resume_data
            
            # 如果不是BOSS直聘HTML格式简历，尝试获取页面的完整文本
            try:
                full_text = await page.text_content()
                if full_text:
                    resume_data['fullText'] = full_text
                    print(f"提取到页面文本，长度: {len(full_text)}")
                else:
                    print("未能从页面提取文本")
            except Exception as e:
                print(f"提取页面文本时出错: {e}")
                
            return resume_data
            
        except Exception as e:
            print(f"从详情页提取数据时出错: {e}")
            import traceback
            traceback.print_exc()
            return {} 