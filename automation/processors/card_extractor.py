"""
卡片数据提取模块
负责从简历卡片中提取数据
"""

import re
import json

class CardExtractor:
    """卡片提取类，用于从卡片元素中提取简历数据"""
    
    @staticmethod
    async def extract_data_from_card_element(card):
        """
        直接从卡片元素提取数据，不依赖选择器
        
        Args:
            card: 卡片元素
            
        Returns:
            dict: 提取的简历数据
        """
        resume_data = {}
        
        try:
            # 调试：打印卡片的HTML结构，帮助分析
            try:
                card_html = await card.evaluate('el => el.outerHTML')
                print("\n===== 卡片HTML结构 =====")
                # 只打印前500字符，避免日志过长
                print(card_html[:500] + ('...' if len(card_html) > 500 else ''))
                print("=================\n")
            except Exception as e:
                print(f"获取卡片HTML结构失败: {e}")
                
            # 调试：获取所有class包含row的元素
            try:
                rows = await card.query_selector_all('[class*="row"]')
                print(f"找到 {len(rows)} 个row元素")
                
                for i, row in enumerate(rows):
                    row_html = await row.evaluate('el => el.outerHTML')
                    row_text = await row.text_content()
                    print(f"Row #{i+1} class: {await row.get_attribute('class')}")
                    print(f"Row #{i+1} text: {row_text.strip()[:100]}")
            except Exception as e:
                print(f"分析row元素失败: {e}")
            
            # 提取姓名
            name_el = await card.query_selector('.name')
            if name_el:
                resume_data['name'] = await name_el.text_content()
                resume_data['name'] = resume_data['name'].strip()
                print(f"提取到姓名: {resume_data['name']}")
            
            # 使用专门的函数提取期望职位 - Boss直聘定制版
            position = await CardExtractor._extract_position_zhipin(card)
            if position:
                resume_data['position'] = position
                print(f"从Boss直聘专用函数提取到职位: {position}")
            
            # 如果专门的函数失败，继续使用常规方法
            if not resume_data.get('position'):
                # 调试：更精确地查找期望职位元素
                print("\n===== 查找期望职位 =====")
                
                # 尝试查找包含"期望职位"文本的元素
                try:
                    labels = await card.query_selector_all('*')
                    position_label = None
                    
                    for label in labels:
                        try:
                            text = await label.text_content()
                            if "期望职位" in text and len(text) < 20:  # 确保是标签而不是内容
                                position_label = label
                                print(f"找到期望职位标签: '{text}', 标签类名: {await label.get_attribute('class')}")
                                
                                # 尝试找到其父元素
                                parent = await label.evaluate('node => node.parentNode')
                                if parent:
                                    parent_html = await card.evaluate('(parent) => parent.outerHTML', parent)
                                    print(f"标签父元素: {parent_html[:200]}...")
                                break
                        except Exception:
                            continue
                    
                    if position_label:
                        # 尝试找到标签旁边的内容元素
                        parent_el = await position_label.evaluate('node => node.parentNode')
                        if parent_el:
                            siblings = await card.evaluate('(parent) => Array.from(parent.children).map(el => ({tag: el.tagName, class: el.className, text: el.textContent.trim()}))', parent_el)
                            print(f"标签相邻元素: {json.dumps(siblings, ensure_ascii=False)}")
                            
                            # 查找可能的内容元素
                            for sibling in siblings:
                                if sibling['text'] and "期望职位" not in sibling['text'] and len(sibling['text']) < 50:
                                    print(f"可能的职位内容: '{sibling['text']}'")
                except Exception as e:
                    print(f"查找期望职位标签失败: {e}")
                
                # 尝试多种选择器提取期望职位
                # 更精确的选择器，按照页面结构匹配
                position_selectors = [
                    '.row.row-flex .content', # 期望职位常见选择器
                    '.expect-position-content', 
                    '.pos-name',
                    '.join-text-wrap',
                    '.expect-position',
                    '.expect', 
                    '.position-expectation',
                    '.job-expectation',
                    '.position-name',
                    '.job-name',
                    '.expect-job',
                    '[class*="position"]',
                    '[class*="job"]',
                    '.text-desc'
                ]
                
                # 提取期望职位
                position_found = False
                for selector in position_selectors:
                    if not selector:
                        continue
                    
                    # 尝试找到所有匹配的元素，可能有多个
                    position_elements = await card.query_selector_all(selector)
                    print(f"选择器 '{selector}' 找到 {len(position_elements)} 个元素")
                    
                    for position_el in position_elements:
                        position_text = await position_el.text_content()
                        if position_text:
                            position_text = position_text.strip()
                            print(f"选择器 '{selector}' 元素内容: '{position_text}'")
                            
                            # 检查文本内容，排除明显不是职位的内容
                            if len(position_text) > 50 or "年龄" in position_text or "离职" in position_text:
                                print(f"跳过不像职位的文本: \"{position_text}\"")
                                continue
                                
                            # 检查是否包含职位相关关键词
                            position_keywords = ["工程师", "经理", "主管", "开发", "设计", "专员", "总监", "助理", "顾问"]
                            position_indicator_words = ["期望", "应聘", "职位", "岗位"]
                            
                            # 检查是否包含职位关键词
                            contains_position_keyword = any(keyword in position_text for keyword in position_keywords)
                            
                            # 检查是否包含指示词
                            contains_indicator = any(word in position_text for word in position_indicator_words)
                            
                            # 如果包含职位关键词或指示词，优先使用
                            if contains_position_keyword or contains_indicator:
                                print(f"从选择器 '{selector}' 提取到职位信息: \"{position_text}\"")
                                resume_data['position'] = position_text
                                position_found = True
                                break
                            
                            # 如果没有明确的职位关键词，但文本长度合适，也可能是职位
                            if not position_found and 2 < len(position_text) < 30:
                                print(f"从选择器 '{selector}' 提取到可能的职位信息: \"{position_text}\"")
                                resume_data['position'] = position_text
                                
                    if position_found:
                        break
                
                # 如果仍未找到职位信息，尝试从标签中查找
                if not resume_data.get('position'):
                    label_selectors = ['.label', '.label-text', '[class*="label"]']
                    
                    for selector in label_selectors:
                        labels = await card.query_selector_all(selector)
                        print(f"标签选择器 '{selector}' 找到 {len(labels)} 个元素")
                        
                        for label in labels:
                            label_text = await label.text_content()
                            print(f"标签文本: '{label_text}'")
                            
                            if "期望职位" in label_text or "应聘职位" in label_text:
                                # 找到期望职位标签，尝试获取其后面的内容
                                parent = await label.evaluate('node => node.parentNode')
                                if parent:
                                    siblings = await parent.query_selector_all('*')
                                    for sibling in siblings:
                                        if await sibling.evaluate('node => node !== arguments[0]', label):
                                            sibling_text = await sibling.text_content()
                                            if sibling_text and sibling_text.strip():
                                                position_text = sibling_text.strip()
                                                print(f"从标签 '{label_text}' 后找到职位信息: \"{position_text}\"")
                                                resume_data['position'] = position_text
                                                position_found = True
                                                break
                        
                        if position_found:
                            break
                
                # 如果仍未找到职位信息，尝试提取整个卡片文本进行分析
                if not resume_data.get('position'):
                    print("\n===== 使用全文正则表达式提取 =====")
                    card_text = await card.text_content()
                    # 输出卡片文本前200个字符，帮助调试
                    print(f"卡片文本: {card_text[:200]}...")
                    
                    # 尝试通过正则表达式匹配常见的期望职位模式
                    position_patterns = [
                        r'期望职位[:：]\s*([^\n\r,，]+)',
                        r'期望岗位[:：]\s*([^\n\r,，]+)',
                        r'应聘[:：]\s*([^\n\r,，]+)',
                        r'岗位[:：]\s*([^\n\r,，]+)',
                        r'期望[:：]\s*([^\n\r,，]+)',  # 新增：匹配"期望："后面的内容
                        r'(?:^|\n)([^，。\n]{2,15}(?:工程师|经理|主管|总监|专员|助理|顾问|分析师|设计师))'
                    ]
                    
                    for pattern in position_patterns:
                        match = re.search(pattern, card_text)
                        if match:
                            position = match.group(1).strip()
                            print(f"通过正则表达式 '{pattern}' 提取到职位信息: \"{position}\"")
                            resume_data['position'] = position
                            break
            
            # 提取公司
            company_el = await card.query_selector('.timeline-wrap.work-exps')
            if company_el:
                company_text = await company_el.text_content()
                resume_data['company'] = company_text.strip()
                
                # 尝试更精确地分割公司和时间信息
                # 首先检查是否包含时间段模式
                time_patterns = [
                    r'\d{4}\.\d{2}至今',                    # 如 "2025.02至今"
                    r'\d{4}\.\d{2}[-—至]\d{4}\.\d{2}',      # 如 "2024.05-2024.09"
                    r'\d{4}年\d{1,2}月[-—至]\d{4}年\d{1,2}月',  # 如 "2024年5月-2024年9月"
                    r'\d{4}[-/]\d{1,2}[-—至]\d{4}[-/]\d{1,2}'   # 如 "2024/05-2024/09"
                ]
                
                # 使用正则表达式分割
                segments = []
                remaining_text = company_text
                
                for pattern in time_patterns:
                    matches = list(re.finditer(pattern, remaining_text))
                    if matches:
                        last_end = 0
                        for match in matches:
                            time_period = match.group(0)
                            start, end = match.span()
                            
                            # 提取时间段前的公司名（如果有）
                            if start > last_end:
                                company_segment = remaining_text[last_end:start].strip()
                                if company_segment:
                                    segments.append(company_segment)
                            
                            # 添加时间段
                            segments.append(time_period)
                            last_end = end
                        
                        # 添加最后一段（如果有）
                        if last_end < len(remaining_text):
                            final_segment = remaining_text[last_end:].strip()
                            if final_segment:
                                segments.append(final_segment)
                        
                        # 重组公司信息
                        processed_companies = []
                        for i in range(0, len(segments), 2):
                            if i+1 < len(segments):
                                # 时间段 + 公司名
                                processed_companies.append(f"{segments[i]} {segments[i+1]}")
                            else:
                                # 剩余的部分（如果有）
                                processed_companies.append(segments[i])
                        
                        if processed_companies:
                            resume_data['company'] = processed_companies
                            print(f"通过时间段模式分割得到公司信息: {processed_companies}")
                            break
                
                # 如果上述方法未生效，使用传统的分隔符分割
                if isinstance(resume_data['company'], str):
                    # 尝试常规分割
                    if '，' in company_text:
                        resume_data['company'] = [comp.strip() for comp in company_text.split('，') if comp.strip()]
                    elif ',' in company_text:
                        resume_data['company'] = [comp.strip() for comp in company_text.split(',') if comp.strip()]
                    elif '|' in company_text:
                        resume_data['company'] = [comp.strip() for comp in company_text.split('|') if comp.strip()]
                    else:
                        # 尝试根据常见的时间段模式进行智能分割
                        segments = re.split(r'(\d{4}\.\d{2}至今|\d{4}\.\d{2}[-—至]\d{4}\.\d{2})', company_text)
                        if len(segments) > 1:
                            # 重组时间段和公司
                            processed_companies = []
                            current_segment = ""
                            
                            for segment in segments:
                                if segment.strip():
                                    if re.match(r'\d{4}\.\d{2}至今|\d{4}\.\d{2}[-—至]\d{4}\.\d{2}', segment):
                                        # 这是时间段
                                        current_segment = segment.strip() + " "
                                    else:
                                        # 这是公司名
                                        if current_segment:
                                            processed_companies.append(current_segment + segment.strip())
                                            current_segment = ""
                                        else:
                                            processed_companies.append(segment.strip())
                            
                            # 处理最后一个片段
                            if current_segment:
                                processed_companies.append(current_segment.strip())
                            
                            if processed_companies:
                                resume_data['company'] = processed_companies
                            else:
                                resume_data['company'] = [company_text.strip()]
                        else:
                            resume_data['company'] = [company_text.strip()]
            
            # 提取技能
            skills_el = await card.query_selector('.tag-list,.skill-tag')
            if skills_el:
                skills_text = await skills_el.text_content()
                resume_data['skills'] = skills_text.strip()
                
                # 尝试分割技能
                if '，' in skills_text:
                    resume_data['skills'] = [skill.strip() for skill in skills_text.split('，') if skill.strip()]
                elif ',' in skills_text:
                    resume_data['skills'] = [skill.strip() for skill in skills_text.split(',') if skill.strip()]
                elif ' ' in skills_text:
                    resume_data['skills'] = [skill.strip() for skill in skills_text.split(' ') if skill.strip()]
                else:
                    resume_data['skills'] = [skills_text.strip()]
            
            # 如果没有找到关键数据，打印卡片文本帮助调试
            if not (resume_data.get('name') and resume_data.get('position')):
                card_text = await card.text_content()
                print(f"卡片文本内容: {card_text.strip()}")
                
                # 使用简单的文本分析尝试提取信息
                lines = [line.strip() for line in card_text.split('\n') if line.strip()]
                print("\n===== 逐行分析 =====")
                for i, line in enumerate(lines[:10]):  # 只打印前10行
                    print(f"行 {i+1}: '{line}'")
                
                if lines and not resume_data.get('name'):
                    resume_data['name'] = lines[0]  # 假设第一行是姓名
                    print(f"从第一行提取姓名: \"{resume_data['name']}\"")
                
                if len(lines) > 1 and not resume_data.get('position'):
                    # 查找看起来像职位的行
                    for i, line in enumerate(lines[1:5]):  # 只检查前几行
                        # 跳过只有数字和符号的行
                        if re.match(r'^[\d\s\W]+$', line):
                            continue
                            
                        # 跳过太长的行或包含特定关键词的行
                        if len(line) > 30 or "年龄" in line or "离职" in line:
                            continue
                            
                        # 找到看起来像职位的行
                        if '岗位' in line or '职位' in line or '工程师' in line or '经理' in line or '专员' in line:
                            resume_data['position'] = line
                            print(f"从文本第{i+2}行提取职位: \"{line}\"")
                            break
                        # 如果没有明显的职位关键词，使用第二行作为职位
                        elif i == 0 and len(line) < 20:
                            resume_data['position'] = line
                            print(f"默认使用第二行作为职位: \"{line}\"")
            
            # 确保职位信息不包含姓名或其他明显不相关的信息
            if resume_data.get('position') and resume_data.get('name'):
                position = resume_data.get('position')
                name = resume_data.get('name')
                
                # 移除姓名
                if name in position:
                    position = position.replace(name, '').strip()
                    resume_data['position'] = position
                    print(f"从职位中移除姓名后: \"{position}\"")
                
                # 移除年龄和离职等明显不是职位的信息
                if "岁" in position or "离职" in position:
                    # 尝试查找职位关键词
                    position_keywords = ["工程师", "经理", "主管", "开发", "设计", "专员", "总监", "助理", "顾问"]
                    for keyword in position_keywords:
                        if keyword in position:
                            # 提取包含关键词及其前后几个字的部分
                            keyword_index = position.find(keyword)
                            start_index = max(0, keyword_index - 5)
                            end_index = min(len(position), keyword_index + len(keyword) + 5)
                            
                            new_position = position[start_index:end_index].strip()
                            print(f"从不相关信息中提取职位: \"{new_position}\"")
                            resume_data['position'] = new_position
                            break
            
            # 最终提取结果
            print("\n===== 最终提取结果 =====")
            print(f"姓名: {resume_data.get('name', '未提取')}")
            print(f"职位: {resume_data.get('position', '未提取')}")
            print(f"公司: {resume_data.get('company', '未提取')}")
            print(f"技能: {resume_data.get('skills', '未提取')}")
            
            return resume_data
            
        except Exception as e:
            print(f"从卡片元素提取数据时出错: {e}")
            import traceback
            traceback.print_exc()
            return resume_data
            
    @staticmethod
    async def _extract_position_zhipin(card):
        """
        专门针对Boss直聘页面结构提取期望职位
        
        Args:
            card: 卡片元素
            
        Returns:
            str: 提取的期望职位，如果未提取到则返回None
        """
        try:
            print("\n===== Boss直聘专用职位提取 =====")
            
            # 首先分析卡片的类名，确定我们在处理什么类型的卡片
            card_class = await card.get_attribute('class') or ""
            print(f"当前卡片类名: {card_class}")
            
            # 检查是否是Boss直聘的卡片结构
            is_boss_card = "card-item" in card_class or "geek-item" in card_class
            print(f"是否为Boss直聘卡片结构: {is_boss_card}")
            
            # 增加对iframe内特定结构的判断
            if not is_boss_card:
                # 新版iframe结构可能有不同的类名
                is_boss_card = "recommend-item" in card_class or "card" in card_class
                print(f"检查推荐列表iframe结构: {is_boss_card}")
            
            # 如果不是Boss直聘的卡片结构，提前返回
            if not is_boss_card:
                print("非Boss直聘卡片结构，跳过专用提取")
                return None
                
            # 针对iframe结构中的卡片，分析导航路径
            try:
                # 尝试查找当前iframe的URL
                iframe_url = await card.evaluate('el => { try { return window.location.href; } catch(e) { return ""; } }')
                if iframe_url and "frame/recommend" in iframe_url:
                    print(f"检测到在推荐iframe中: {iframe_url}")

                    # 尝试更多特定于recommend iframe的选择器
                    recommend_selectors = [
                        '.item-job',                        # 推荐iframe中的职位名称
                        '.header-job',                      # 职位头部信息
                        '.name-box .job-name',              # 带有职位名称的盒子
                        '.expect-job',                      # 期望职位
                        '.item-position',                   # 职位项
                        '.column-position',                 # 职位列
                        '.candidate-position-text'          # 候选人职位文本
                    ]
                    
                    for selector in recommend_selectors:
                        try:
                            position_el = await card.query_selector(selector)
                            if position_el:
                                position_text = await position_el.text_content()
                                if position_text and 2 < len(position_text.strip()) < 30:
                                    print(f"从推荐iframe特定选择器 '{selector}' 找到职位: {position_text}")
                                    return position_text.strip()
                        except Exception as e:
                            print(f"使用推荐iframe选择器 '{selector}' 提取失败: {e}")
            except Exception as e:
                print(f"尝试分析iframe URL失败: {e}")
                
            # 方法1：针对iframe下的 list-body > card-list > card-item 结构
            try:
                # 先尝试Boss直聘特定的结构：.position-info-item + .expect + .expect-content
                position_item = await card.query_selector('.position-info-item.expect .expect-content')
                if position_item:
                    position_text = await position_item.text_content()
                    if position_text and len(position_text) < 30:
                        print(f"从Boss直聘标准结构找到职位: {position_text}")
                        return position_text.trim() if hasattr(position_text, 'trim') else position_text.strip()

                # 直接查找特定的职位名称元素
                position_name = await card.query_selector('.job-name')
                if position_name:
                    position_text = await position_name.text_content()
                    if position_text and len(position_text) < 30:
                        print(f"从job-name找到职位: {position_text}")
                        return position_text.trim() if hasattr(position_text, 'trim') else position_text.strip()
            
                # 查找卡片内所有具有"label"属性的元素，这通常包含字段标签
                labels = await card.query_selector_all('[class*="label"]')
                print(f"找到 {len(labels)} 个带label类的元素")
                
                # 遍历所有label元素，查找标记为"期望职位"的标签
                position_label = None
                for label in labels:
                    label_text = await label.text_content()
                    if "期望职位" in label_text:
                        position_label = label
                        print(f"找到期望职位标签: {label_text}")
                        
                        # 找到标签后，查找同级元素中的职位内容
                        parent = await label.evaluate('node => node.parentNode')
                        if parent:
                            # 尝试查找同一行内的value或text类元素，这通常包含字段值
                            value_el = await card.evaluate('''
                                (parent) => {
                                    // 查找同级的value元素
                                    const valueEl = parent.querySelector('[class*="value"], [class*="text"], [class*="content"]');
                                    return valueEl ? valueEl.textContent.trim() : null;
                                }
                            ''', parent)
                            
                            if value_el:
                                print(f"从标签行找到职位: {value_el}")
                                return value_el
                            
                            # 如果没有找到明确的值元素，尝试提取非标签部分
                            parent_text = await card.evaluate('(parent) => parent.textContent', parent)
                            if parent_text:
                                # 移除"期望职位"文本以获取剩余部分
                                clean_text = parent_text.replace("期望职位", "").replace("：", "").replace(":", "").strip()
                                if clean_text and len(clean_text) < 30:
                                    print(f"从行文本提取职位: {clean_text}")
                                    return clean_text
            except Exception as e:
                print(f"尝试从标签提取职位时出错: {e}")
            
            # 方法2：专门针对iframe内的列表结构
            try:
                # 尝试直接通过JavaScript分析DOM结构找出职位信息
                position = await card.evaluate('''
                    (card) => {
                        // 特定用于Boss直聘列表页的卡片DOM结构分析
                        
                        // 1. 先查找最精确的职位选择器
                        const exactPositionSelectors = [
                            '.position-info-item.expect .expect-content', // 标准的期望职位选择器
                            '.job-name',                                  // 直接的职位名称
                            '.expect-position .content'                   // 期望职位内容
                        ];
                        
                        for (const selector of exactPositionSelectors) {
                            const posEl = card.querySelector(selector);
                            if (posEl && posEl.textContent.trim()) {
                                return posEl.textContent.trim();
                            }
                        }
                        
                        // 2. 查找包含"期望职位"标签的父级元素
                        const labels = Array.from(card.querySelectorAll('*')).filter(
                            el => el.textContent.includes('期望职位')
                        );
                        
                        for (const label of labels) {
                            // 获取父级元素
                            const parent = label.parentElement;
                            if (parent) {
                                // 尝试找到值元素 - 通常在标签同级有一个值元素
                                const valueEl = parent.querySelector('[class*="value"], [class*="content"], [class*="text"]');
                                if (valueEl && valueEl !== label) {
                                    return valueEl.textContent.trim();
                                }
                                
                                // 如果没有找到特定的值元素，尝试获取标签后面的文本
                                const parentText = parent.textContent.trim();
                                const position = parentText.replace(/期望职位[：:]*/, '').trim();
                                if (position && position.length < 30) {
                                    return position;
                                }
                            }
                        }
                        
                        // 3. 查找.info-labels下的职位信息
                        const infoLabels = card.querySelector('.info-labels');
                        if (infoLabels) {
                            const items = Array.from(infoLabels.children);
                            for (const item of items) {
                                if (item.textContent.includes('期望职位')) {
                                    const posText = item.textContent.replace(/期望职位[：:]*/, '').trim();
                                    if (posText && posText.length < 30) {
                                        return posText;
                                    }
                                }
                            }
                        }
                        
                        // 4. 查找所有row元素，寻找包含期望职位的行
                        const rows = Array.from(card.querySelectorAll('[class*="row"], [class*="field"]'));
                        for (const row of rows) {
                            if (row.textContent.includes('期望职位') && 
                                !row.textContent.includes('离职') && 
                                !row.textContent.includes('岁')) {
                                
                                // 尝试获取行内部的内容元素
                                const contentEl = row.querySelector('[class*="content"], [class*="value"], [class*="text"]');
                                if (contentEl && !contentEl.textContent.includes('期望职位')) {
                                    return contentEl.textContent.trim();
                                }
                                
                                // 如果没有找到内容元素，尝试处理整行文本
                                const rowText = row.textContent.trim();
                                const position = rowText.replace(/期望职位[：:]*/, '').trim();
                                if (position && position.length < 30) {
                                    return position;
                                }
                            }
                        }
                        
                        return null;
                    }
                ''')
                
                if position:
                    print(f"通过DOM分析找到职位: {position}")
                    return position
            except Exception as e:
                print(f"DOM分析提取职位失败: {e}")
            
            # 方法3：使用特定的选择器模式来匹配Boss直聘的结构
            selectors = [
                '.job-info .job-name',                  # 常见的职位名称选择器
                '.expect-position .content',            # 期望职位内容
                '.position-name',                       # 职位名称
                '.position-info-item.expect .expect-content', # 详细期望职位
                '.field-text',                          # 通用字段文本
                '.info-text'                            # Boss直聘常见信息文本类
            ]
            
            for selector in selectors:
                try:
                    elements = await card.query_selector_all(selector)
                    print(f"选择器 '{selector}' 找到 {len(elements)} 个元素")
                    
                    for el in elements:
                        text = await el.text_content()
                        text = text.strip()
                        
                        # 排除不可能是职位的文本
                        if (text and len(text) < 30 and 
                            "岁" not in text and 
                            "离职" not in text and 
                            "期望职位" not in text):
                            print(f"从选择器 '{selector}' 找到可能的职位: {text}")
                            return text
                except Exception as e:
                    print(f"使用选择器 '{selector}' 提取失败: {e}")
            
            # 如果上述方法都失败，返回None让DataExtractor处理
            return None
            
        except Exception as e:
            print(f"Boss直聘专用职位提取失败: {e}")
            return None 