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
        self.ocr = None
        self.ocr_enabled = True  # 默认启用OCR
        self.ocr_api_key = None  # OCR-Space API密钥
        
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
        从详情页中提取简历数据，支持图片简历和canvas格式的基本信息提取
        
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
                'name': None,
                'position': None,
                'company': [],
                'school': [],
                'skills': [],
                'link': page.url
            }
            
            # 检查是否为canvas格式简历
            canvas = await page.query_selector('canvas')
            if canvas:
                print("检测到canvas格式简历，尝试使用OCR提取文本")
                # 标记为canvas格式简历
                resume_data['is_canvas_resume'] = True
                
                # 使用OCR识别canvas内容
                ocr_text = await self._extract_text_from_canvas(page, canvas)
                if ocr_text:
                    print(f"从canvas提取到文本，长度: {len(ocr_text)}")
                    resume_data['fullText'] = ocr_text
                    
                    # 解析OCR文本提取关键信息
                    parsed_data = self._parse_ocr_text(ocr_text)
                    resume_data.update(parsed_data)
                    
                    # 标记为已使用OCR
                    resume_data['ocr_extracted'] = True
                    
                    print(f"OCR提取结果: {resume_data}")
                    return resume_data
                else:
                    print("OCR提取文本失败")
            
            # 检查是否为图片格式简历
            image_resume = await page.query_selector('.resume-img-box, img[src*="resume"], .resume-image, .resume-picture')
            if image_resume:
                print("检测到图片格式简历，尝试提取基本信息")
                resume_data['is_image_resume'] = True
                
                # 尝试使用OCR识别图片内容
                img_src = await image_resume.get_attribute('src')
                if img_src and self.ocr_enabled:
                    print("尝试使用OCR识别图片内容")
                    ocr_text = await self._extract_text_from_image(page, image_resume)
                    if ocr_text:
                        print(f"从图片提取到文本，长度: {len(ocr_text)}")
                        resume_data['fullText'] = ocr_text
                        
                        # 解析OCR文本提取关键信息
                        parsed_data = self._parse_ocr_text(ocr_text)
                        resume_data.update(parsed_data)
                        
                        # 标记为已使用OCR
                        resume_data['ocr_extracted'] = True
                        
                        print(f"OCR提取结果: {resume_data}")
                        return resume_data
                
                # 如果OCR失败或未启用，尝试从页面中提取
                # 从页面中提取可能的基本信息
                # 1. 尝试提取姓名
                name_selectors = ['.resume-name', '.name', '.candidate-name', 'h1[class*="name"]', '.user-name']
                for selector in name_selectors:
                    try:
                        name_el = await page.query_selector(selector)
                        if name_el:
                            name_text = await name_el.text_content()
                            if name_text and len(name_text.strip()) > 0:
                                resume_data['name'] = name_text.strip()
                                print(f"从图片简历中提取到姓名: {resume_data['name']}")
                                break
                    except Exception as e:
                        continue
                
                # 2. 尝试提取期望职位
                position_selectors = ['.expect-position', '.job-expect', '.job-intention', '.position-name']
                for selector in position_selectors:
                    try:
                        position_el = await page.query_selector(selector)
                        if position_el:
                            position_text = await position_el.text_content()
                            if position_text and len(position_text.strip()) > 0:
                                resume_data['position'] = position_text.strip()
                                print(f"从图片简历中提取到期望职位: {resume_data['position']}")
                                break
                    except Exception as e:
                        continue
                
                # 3. 尝试提取最近公司
                company_selectors = ['.company-name', '.work-exp .company', '.cur-company']
                for selector in company_selectors:
                    try:
                        company_el = await page.query_selector(selector)
                        if company_el:
                            company_text = await company_el.text_content()
                            if company_text and len(company_text.strip()) > 0:
                                resume_data['company'].append(company_text.strip())
                                print(f"从图片简历中提取到公司: {company_text.strip()}")
                                break
                    except Exception as e:
                        continue
                
                # 记录图片简历提取结果
                print(f"图片简历提取结果: {resume_data}")
                
                return resume_data
            
            # 标准详情页数据提取（非图片格式）
            # 1. 提取姓名
            name_el = await page.query_selector(selectors.get('name', '.name'))
            if name_el:
                resume_data['name'] = await name_el.text_content()
            
            # 2. 提取期望职位
            position_el = await page.query_selector(selectors.get('expectPosition', '.join-text-wrap'))
            if position_el:
                resume_data['position'] = await position_el.text_content()
            
            # 3. 提取公司经历
            company_els = await page.query_selector_all(
                selectors.get('company', '.timeline-wrap.work-exps .name, .work-exp-box .name')
            )
            for el in company_els:
                text = await el.text_content()
                if text and len(text.strip()) > 0:
                    resume_data['company'].append(text.strip())
            
            # 4. 提取教育经历
            school_els = await page.query_selector_all(
                selectors.get('school', '.timeline-wrap.edu-exps .name, .edu-exp-box .name')
            )
            for el in school_els:
                text = await el.text_content()
                if text and len(text.strip()) > 0:
                    resume_data['school'].append(text.strip())
            
            # 5. 提取技能标签
            skills_els = await page.query_selector_all(
                selectors.get('skills', '.tag-list .text, .skill-tag')
            )
            for el in skills_els:
                text = await el.text_content()
                if text and len(text.strip()) > 0:
                    resume_data['skills'].append(text.strip())
            
            # 标记是否是标准详情页
            resume_data['is_standard_resume'] = True
            
            print(f"标准详情页提取结果: {resume_data}")
            
            return resume_data
            
        except Exception as e:
            print(f"从详情页提取数据时出错: {e}")
            import traceback
            traceback.print_exc()
            return {}
            
    def enable_ocr(self):
        """启用OCR功能"""
        try:
            self.ocr_enabled = True
            # 从环境变量获取API密钥，如果没有则使用指定密钥
            import os
            self.ocr_api_key = os.environ.get('OCR_SPACE_API_KEY', '9a3441646188957')  # 使用特定密钥
            print("OCR功能已启用，使用OCR-Space API")
            return True
        except Exception as e:
            print(f"启用OCR失败: {e}")
            return False
            
    def disable_ocr(self):
        """禁用OCR功能"""
        self.ocr_enabled = False
        
    async def _extract_text_from_canvas(self, page, canvas_element):
        """
        从canvas元素中提取文本，使用OCR-Space API
        
        Args:
            page: Playwright页面对象
            canvas_element: canvas元素
            
        Returns:
            str: 提取的文本
        """
        try:
            # 确保OCR已启用
            if not self.ocr_enabled:
                success = self.enable_ocr()
                if not success:
                    print("OCR功能未启用，无法提取canvas文本")
                    return ""
            
            # 截取canvas图像
            print("检测到canvas格式简历，使用滚动截图方法提取OCR文本")
            temp_dir = tempfile.mkdtemp()
            screenshot_path = os.path.join(temp_dir, "canvas_screenshot.png")
            
            # 获取canvas尺寸信息
            try:
                canvas_size = await page.evaluate("""(canvas) => {
                    return {
                        width: canvas.width,
                        height: canvas.height,
                        clientWidth: canvas.clientWidth,
                        clientHeight: canvas.clientHeight,
                        scrollWidth: canvas.scrollWidth || document.body.scrollWidth,
                        scrollHeight: canvas.scrollHeight || document.body.scrollHeight
                    };
                }""", canvas_element)
                print(f"Canvas尺寸信息: {canvas_size}")
                
                # 检查canvas是否特别大，可能是超长简历
                is_long_resume = False
                if canvas_size.get('height', 0) > 3000 or canvas_size.get('scrollHeight', 0) > 3000:
                    is_long_resume = True
                    print(f"检测到超长简历，高度: {canvas_size.get('height')}px，滚动高度: {canvas_size.get('scrollHeight')}px")
                
            except Exception as e:
                print(f"获取canvas尺寸信息失败: {e}")
                canvas_size = {}
            
            # 使用滚动截图方法
            print("执行滚动截图方法提取canvas内容...")
            
            # 使用JavaScript获取canvas图像数据
            canvas_data = await page.evaluate("""(canvas) => {
                try {
                    // 获取canvas的真实尺寸
                    const width = canvas.width || canvas.clientWidth || 800;
                    const height = canvas.height || canvas.clientHeight || 3000;
                    
                    console.log(`Canvas原始尺寸: ${width}x${height}`);
                    
                    // 创建一个新canvas，确保尺寸足够大
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = width;
                    
                    // 对于高度很大的canvas，使用分段绘制
                    const maxSegmentHeight = 5000; // 最大单次处理高度
                    const segments = Math.ceil(height / maxSegmentHeight);
                    
                    // 设置临时canvas的高度
                    tempCanvas.height = height;
                    
                    // 获取临时canvas上下文
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // 分段绘制canvas内容
                    for (let i = 0; i < segments; i++) {
                        const srcY = i * maxSegmentHeight;
                        const srcHeight = Math.min(maxSegmentHeight, height - srcY);
                        
                        // 绘制当前段到临时canvas
                        console.log(`绘制段 ${i+1}/${segments}: 从y=${srcY}, 高度=${srcHeight}`);
                        tempCtx.drawImage(
                            canvas, 
                            0, srcY, width, srcHeight,  // 源区域
                            0, srcY, width, srcHeight   // 目标区域
                        );
                    }
                    
                    // 转换为base64
                    try {
                        return tempCanvas.toDataURL('image/png');
                    } catch (exportError) {
                        console.error("导出canvas为图片时出错:", exportError);
                        // 如果导出失败，尝试降低质量的JPEG
                        return tempCanvas.toDataURL('image/jpeg', 0.8);
                    }
                } catch(e) {
                    console.error('Canvas截图出错:', e);
                    return null;
                }
            }""", canvas_element)
            
            if canvas_data and (canvas_data.startswith('data:image/png') or canvas_data.startswith('data:image/jpeg')):
                # 从base64数据保存图片
                try:
                    canvas_data = canvas_data.split(",")[1]
                    with open(screenshot_path, 'wb') as f:
                        f.write(base64.b64decode(canvas_data))
                    print(f"成功从JavaScript数据保存canvas截图到: {screenshot_path}")
                except Exception as e:
                    print(f"从base64保存canvas图片时出错: {e}")
                    return ""
            else:
                print("无法获取canvas数据，OCR提取失败")
                return ""
            
            # 使用OCR-Space API识别图像文本
            print("使用OCR-Space API识别图像文本...")
            
            # OCR-Space API配置
            url = 'https://api.ocr.space/parse/image'
            headers = {
                'apikey': self.ocr_api_key
            }
            
            # 检查图片尺寸，如果太大则分段OCR处理
            with Image.open(screenshot_path) as img:
                width, height = img.size
                print(f"图片尺寸: {width}x{height}")
                
                # 如果高度过大，进行分段处理
                max_height = 6000
                if height > max_height:
                    print(f"图片高度 {height} 超过 {max_height}，将进行分段OCR处理")
                    
                    # 分段数
                    segments = math.ceil(height / max_height)
                    print(f"将图片分为 {segments} 段进行OCR处理")
                    
                    all_text_results = []
                    
                    for i in range(segments):
                        y_start = i * max_height
                        y_end = min((i + 1) * max_height, height)
                        segment_height = y_end - y_start
                        
                        print(f"处理第 {i+1}/{segments} 段: y={y_start} 到 y={y_end}")
                        
                        # 裁剪当前段
                        segment = img.crop((0, y_start, width, y_end))
                        segment_path = os.path.join(temp_dir, f"segment_{i+1}.png")
                        segment.save(segment_path)
                        
                        # 对当前段进行OCR
                        with open(segment_path, 'rb') as segment_file:
                            response = requests.post(
                                url, 
                                headers=headers,
                                files={'image': segment_file},
                                data={
                                    'language': 'chs',  # 中文识别
                                    'isOverlayRequired': 'false',
                                    'detectOrientation': 'true',
                                    'scale': 'true',
                                    'OCREngine': '2',  # 使用更先进的OCR引擎
                                    'filetype': 'png'
                                }
                            )
                            
                            if response.status_code == 200:
                                result = response.json()
                                if result.get('IsErroredOnProcessing') == False:
                                    parsed_results = result.get('ParsedResults', [])
                                    for parsed in parsed_results:
                                        text = parsed.get('ParsedText', '')
                                        if text:
                                            # 处理文本，保留换行符
                                            text_lines = text.split('\r\n')
                                            for line in text_lines:
                                                if line.strip():
                                                    all_text_results.append(line.strip())
                                else:
                                    print(f"第 {i+1} 段OCR处理出错: {result.get('ErrorMessage', '未知错误')}")
                            else:
                                print(f"第 {i+1} 段OCR API请求失败，状态码: {response.status_code}")
                        
                        # 删除临时分段文件
                        try:
                            os.remove(segment_path)
                        except:
                            pass
                    
                    # 合并所有分段结果
                    text_results = all_text_results
                    print(f"分段OCR完成，共提取 {len(text_results)} 行文本")
                else:
                    # 图像尺寸合适，直接OCR
                    text_results = []
                    with open(screenshot_path, 'rb') as image_file:
                        response = requests.post(
                            url, 
                            headers=headers,
                            files={'image': image_file},
                            data={
                                'language': 'chs',  # 中文识别
                                'isOverlayRequired': 'false',
                                'detectOrientation': 'true',
                                'scale': 'true',
                                'OCREngine': '2',  # 使用更先进的OCR引擎
                                'filetype': 'png'
                            }
                        )
                    
                        # 解析API响应
                        if response.status_code == 200:
                            result = response.json()
                            if result.get('IsErroredOnProcessing') == False:
                                parsed_results = result.get('ParsedResults', [])
                                for parsed in parsed_results:
                                    text = parsed.get('ParsedText', '')
                                    if text:
                                        # 处理文本，保留换行符
                                        text_lines = text.split('\r\n')
                                        for line in text_lines:
                                            if line.strip():
                                                text_results.append(line.strip())
                            else:
                                print(f"OCR处理出错: {result.get('ErrorMessage', '未知错误')}")
                        else:
                            print(f"OCR API请求失败，状态码: {response.status_code}")
            
            # 删除临时文件
            try:
                os.remove(screenshot_path)
                os.rmdir(temp_dir)
            except:
                pass
                
            # 合并文本结果
            result_text = "\n".join(text_results)
            print(f"OCR识别完成，提取到 {len(text_results)} 行文本")
            
            # 保存一份OCR结果到文件，方便调试
            try:
                ocr_log_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/ocr_logs")
                os.makedirs(ocr_log_dir, exist_ok=True)
                timestamp = int(time.time())
                ocr_log_path = os.path.join(ocr_log_dir, f"ocr_result_{timestamp}.txt")
                with open(ocr_log_path, 'w', encoding='utf-8') as f:
                    f.write(result_text)
                print(f"OCR结果已保存到: {ocr_log_path}")
            except Exception as e:
                print(f"保存OCR结果到文件失败: {e}")
            
            return result_text
            
        except Exception as e:
            print(f"从canvas提取文本时出错: {e}")
            import traceback
            traceback.print_exc()
            return ""
            
    async def _extract_text_from_image(self, page, image_element):
        """
        从图片元素中提取文本，使用OCR-Space API
        
        Args:
            page: Playwright页面对象
            image_element: 图片元素
            
        Returns:
            str: 提取的文本
        """
        try:
            import requests
            import json
            
            # 确保OCR已启用
            if not self.ocr_enabled:
                success = self.enable_ocr()
                if not success:
                    print("OCR功能未启用，无法提取图片文本")
                    return ""
            
            # OCR-Space API配置
            url = 'https://api.ocr.space/parse/image'
            headers = {
                'apikey': self.ocr_api_key
            }
            
            # 获取图片URL
            img_src = await image_element.get_attribute('src')
            if not img_src:
                print("获取图片URL失败，尝试截图")
                
                # 尝试截图
                temp_dir = tempfile.mkdtemp()
                screenshot_path = os.path.join(temp_dir, "image_screenshot.png")
                
                await image_element.screenshot(path=screenshot_path)
                print(f"已保存图片截图到: {screenshot_path}")
                
                # 使用OCR-Space API识别图像文本
                with open(screenshot_path, 'rb') as image_file:
                    response = requests.post(
                        url, 
                        headers=headers,
                        files={'image': image_file},
                        data={
                            'language': 'chs',  # 中文识别
                            'isOverlayRequired': 'false',
                            'detectOrientation': 'true',
                            'scale': 'true'
                        }
                    )
                
                # 删除临时文件
                try:
                    os.remove(screenshot_path)
                    os.rmdir(temp_dir)
                except:
                    pass
            else:
                # 从src中提取图片
                if img_src.startswith('data:image'):
                    # 如果是base64编码的图片
                    import base64
                    try:
                        # 提取base64数据
                        base64_data = img_src.split(',')[1]
                        
                        # 使用OCR-Space API识别base64图像文本
                        response = requests.post(
                            url, 
                            headers=headers,
                            data={
                                'base64Image': f"data:image/png;base64,{base64_data}",
                                'language': 'chs',  # 中文识别
                                'isOverlayRequired': 'false',
                                'detectOrientation': 'true',
                                'scale': 'true'
                            }
                        )
                    except Exception as e:
                        print(f"处理base64图片时出错: {e}")
                        return ""
                else:
                    # 对于网络图片，先截图再处理
                    temp_dir = tempfile.mkdtemp()
                    screenshot_path = os.path.join(temp_dir, "image_screenshot.png")
                    
                    await image_element.screenshot(path=screenshot_path)
                    
                    # 使用OCR-Space API识别图像文本
                    with open(screenshot_path, 'rb') as image_file:
                        response = requests.post(
                            url, 
                            headers=headers,
                            files={'image': image_file},
                            data={
                                'language': 'chs',  # 中文识别
                                'isOverlayRequired': 'false',
                                'detectOrientation': 'true',
                                'scale': 'true'
                            }
                        )
                    
                    # 删除临时文件
                    try:
                        os.remove(screenshot_path)
                        os.rmdir(temp_dir)
                    except:
                        pass
            
            # 解析API响应
            text_results = []
            if response.status_code == 200:
                result = response.json()
                if result.get('IsErroredOnProcessing') == False:
                    parsed_results = result.get('ParsedResults', [])
                    for parsed in parsed_results:
                        text = parsed.get('ParsedText', '')
                        if text:
                            # 处理文本，保留换行符
                            text_lines = text.split('\r\n')
                            for line in text_lines:
                                if line.strip():
                                    text_results.append(line.strip())
                else:
                    print(f"OCR处理出错: {result.get('ErrorMessage', '未知错误')}")
            else:
                print(f"OCR API请求失败，状态码: {response.status_code}")
            
            # 合并文本结果
            result_text = "\n".join(text_results)
            print(f"OCR识别完成，提取到 {len(text_results)} 行文本")
            
            return result_text
            
        except Exception as e:
            print(f"从图片提取文本时出错: {e}")
            import traceback
            traceback.print_exc()
            return ""
            
    def _parse_ocr_text(self, ocr_text):
        """
        解析OCR识别的文本，提取关键简历信息
        
        Args:
            ocr_text: OCR识别的文本
            
        Returns:
            dict: 提取的简历数据
        """
        result = {
            'name': None,
            'position': None,
            'company': [],
            'school': [],
            'skills': []
        }
        
        if not ocr_text:
            return result
            
        # 1. 提取姓名
        name_patterns = [
            r'姓名[：:]\s*([^\n\r]+)',
            r'(\w{2,4})\s*(?:\d+岁|\d+年|男|女)',  # 匹配如"张三 25岁"的格式
            r'^(\w{2,4})\s+',  # 匹配简历开头的名字
        ]
        
        for pattern in name_patterns:
            name_match = re.search(pattern, ocr_text)
            if name_match:
                result['name'] = name_match.group(1).strip()
                print(f"从OCR文本中提取到姓名: {result['name']}")
                break
                
        # 2. 提取期望职位
        position_patterns = [
            r'期望职位[：:]\s*([^\n\r]+)',
            r'期望岗位[：:]\s*([^\n\r]+)',
            r'应聘职位[：:]\s*([^\n\r]+)',
            r'应聘岗位[：:]\s*([^\n\r]+)',
            r'求职意向[：:]\s*([^\n\r]+)',
            r'期望从事[：:]\s*([^\n\r]+)',
            r'职位[：:]\s*([^\n\r]+)',
            r'(?:期望|意向)[:：].*?(\w+(?:开发|工程师|经理|主管|总监|专员|助理|顾问|分析师|设计师))'
        ]
        
        for pattern in position_patterns:
            position_match = re.search(pattern, ocr_text)
            if position_match:
                result['position'] = position_match.group(1).strip()
                print(f"从OCR文本中提取到期望职位: {result['position']}")
                break
                
        # 3. 提取公司经历
        company_patterns = [
            r'(?:公司名称|任职公司)[：:]\s*([^\n\r]+)',
            r'(\d{4}[-年][至\d]{1,7})\s*([^，。\n]*?公司)',
            r'([\u4e00-\u9fa5]{2,}(?:公司|集团|企业|技术|科技))',
        ]
        
        for pattern in company_patterns:
            for company_match in re.finditer(pattern, ocr_text):
                if len(company_match.groups()) >= 2:
                    company = f"{company_match.group(1)} {company_match.group(2)}"
                else:
                    company = company_match.group(1)
                    
                if company and company not in result['company']:
                    result['company'].append(company.strip())
                    print(f"从OCR文本中提取到公司: {company.strip()}")
                    if len(result['company']) >= 3:  # 最多提取3家公司
                        break
                        
        # 4. 提取学校
        school_patterns = [
            r'(?:学校名称|毕业院校|学校)[：:]\s*([^\n\r]+)',
            r'(\d{4}[-年][至\d]{1,7})\s*([^，。\n]*?(?:大学|学院|学校))',
            r'([\u4e00-\u9fa5]{2,}(?:大学|学院|学校))',
        ]
        
        for pattern in school_patterns:
            for school_match in re.finditer(pattern, ocr_text):
                if len(school_match.groups()) >= 2:
                    school = f"{school_match.group(1)} {school_match.group(2)}"
                else:
                    school = school_match.group(1)
                    
                if school and school not in result['school']:
                    result['school'].append(school.strip())
                    print(f"从OCR文本中提取到学校: {school.strip()}")
                    if len(result['school']) >= 2:  # 最多提取2所学校
                        break
                        
        # 5. 提取技能标签
        skills_section_match = re.search(r'(?:技能标签|专业技能|技能|熟练掌握)[：:](.*?)(?=\n\s*\n|\Z)', ocr_text, re.DOTALL)
        if skills_section_match:
            skills_text = skills_section_match.group(1)
            # 按逗号、空格等分隔符分割技能
            skill_candidates = re.split(r'[,，、\s]+', skills_text)
            for skill in skill_candidates:
                if skill.strip() and len(skill.strip()) < 20:  # 过滤无效或过长的技能名
                    result['skills'].append(skill.strip())
                    if len(result['skills']) >= 10:  # 最多提取10个技能
                        break
        
        # 如果没找到技能，尝试从全文中匹配常见技术关键词
        if not result['skills']:
            common_skills = ["Java", "Python", "C++", "JavaScript", "TypeScript", "React", "Vue", "Angular", 
                           "Node.js", "Spring", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", 
                           "微服务", "分布式", "前端", "后端", "全栈", "算法", "数据结构", "测试", "DevOps"]
            for skill in common_skills:
                if re.search(r'\b' + re.escape(skill) + r'\b', ocr_text, re.IGNORECASE):
                    result['skills'].append(skill)
                    if len(result['skills']) >= 10:  # 最多提取10个技能
                        break
        
        return result 