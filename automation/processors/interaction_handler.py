"""
交互处理模块
负责处理与候选人的交互，如打招呼等
"""

import random
import asyncio
import os
import datetime

class InteractionHandler:
    """交互处理类，处理与候选人的互动"""
    
    def __init__(self, log_dir=None):
        """
        初始化交互处理器
        
        Args:
            log_dir: 日志目录路径，默认为None，会使用系统默认路径
        """
        # 确保日志目录存在
        self.log_dir = log_dir or os.path.expanduser("~/Library/Application Support/SourcingCopilot/logs")
        os.makedirs(self.log_dir, exist_ok=True)
        
        # 日志文件路径
        self.candidates_log = os.path.join(self.log_dir, "greeted_candidates.csv")
        
        # 如果日志文件不存在，创建并写入表头
        if not os.path.exists(self.candidates_log):
            with open(self.candidates_log, "w", encoding="utf-8") as f:
                f.write("时间,姓名,期望职位,过往公司,技能,链接\n")
    
    async def greet_candidate(self, button, resume_data):
        """
        向候选人打招呼
        
        Args:
            button: 打招呼按钮元素
            resume_data: 简历数据
            
        Returns:
            bool: 是否成功打招呼
        """
        try:
            candidate_name = resume_data.get('name', '未知候选人')
            print(f"💬 开始向候选人 {candidate_name} 打招呼...")
            
            # 随机延迟，模拟人工操作
            delay = random.uniform(0.8, 1.5)
            print(f"⏳ 模拟人工操作延迟 {delay:.1f}秒...")
            await asyncio.sleep(delay)
            
            # 点击打招呼按钮
            print(f"🎯 点击打招呼按钮...")
            await button.click()
            print(f"✅ 已点击打招呼按钮")
            
            # 等待对话框出现
            dialog_delay = random.uniform(1.0, 2.0)
            print(f"⏳ 等待对话框出现 {dialog_delay:.1f}秒...")
            await asyncio.sleep(dialog_delay)
            
            # 构建招呼语
            greeting = self._generate_greeting(resume_data)
            print(f"📝 生成招呼语: {greeting}")
            
            # 查找输入框并输入招呼语
            print(f"🔍 查找输入框...")
            text_selectors = [
                '.chat-editor',
                'textarea',
                '.input-text',
                '.message-input',
                'input[type="text"]',
                '.text-input'
            ]
            
            text_area = None
            for selector in text_selectors:
                try:
                    text_area = await button.page.query_selector(selector)
                    if text_area:
                        is_visible = await text_area.is_visible()
                        if is_visible:
                            print(f"✅ 使用选择器 {selector} 找到输入框")
                            break
                        else:
                            print(f"⚠️ 选择器 {selector} 找到输入框但不可见")
                except Exception as e:
                    print(f"⚠️ 选择器 {selector} 查找失败: {e}")
                    
            if text_area:
                print(f"⌨️ 开始输入招呼语...")
                # 逐个字符输入，模拟人工输入
                for i, char in enumerate(greeting):
                    await text_area.type(char, delay=random.uniform(50, 150))
                    await asyncio.sleep(random.uniform(0.01, 0.03))
                    if i > 0 and i % 10 == 0:  # 每10个字符显示一次进度
                        print(f"⌨️ 输入进度: {i}/{len(greeting)} 字符")
                
                print(f"✅ 完成招呼语输入: {greeting}")
                
                # 随机延迟，模拟思考时间
                think_delay = random.uniform(0.8, 1.5)
                print(f"🤔 模拟思考时间 {think_delay:.1f}秒...")
                await asyncio.sleep(think_delay)
                
                # 查找发送按钮并点击
                print(f"🔍 查找发送按钮...")
                send_selectors = [
                    '.send-message-btn',
                    'button:has-text("发送")',
                    '.btn-send',
                    '.send-btn',
                    'button[type="submit"]',
                    '.submit-btn'
                ]
                
                send_button = None
                for selector in send_selectors:
                    try:
                        send_button = await button.page.query_selector(selector)
                        if send_button:
                            is_visible = await send_button.is_visible()
                            if is_visible:
                                print(f"✅ 使用选择器 {selector} 找到发送按钮")
                                break
                            else:
                                print(f"⚠️ 选择器 {selector} 找到发送按钮但不可见")
                    except Exception as e:
                        print(f"⚠️ 选择器 {selector} 查找失败: {e}")
                
                if send_button:
                    print(f"📤 点击发送按钮...")
                    await send_button.click()
                    print(f"✅ 已发送招呼")
                    
                    # 等待发送完成
                    send_delay = random.uniform(1.0, 2.0)
                    print(f"⏳ 等待发送完成 {send_delay:.1f}秒...")
                    await asyncio.sleep(send_delay)
                    
                    # 记录候选人信息
                    print(f"📊 记录候选人信息...")
                    self.record_candidate_info(resume_data)
                    
                    print(f"🎉 成功向候选人 {candidate_name} 打招呼！")
                    return True
                else:
                    print("❌ 未找到发送按钮")
            else:
                print("❌ 未找到输入框")
                
        except Exception as e:
            print(f"❌ 向候选人 {candidate_name} 打招呼失败: {e}")
            import traceback
            traceback.print_exc()
            
        return False
        
    def _generate_greeting(self, resume_data):
        """
        生成个性化招呼语
        
        Args:
            resume_data: 简历数据
            
        Returns:
            str: 招呼语
        """
        # 提取候选人姓名
        name = resume_data.get('name', '您好')
        
        # 招呼语模板列表
        greeting_templates = [
            f"{name}您好，看到您的简历很感兴趣，期待有机会和您交流！",
            f"您好{name}，对您的经历很感兴趣，希望有机会详细了解。",
            f"Hi {name}，我们正在寻找您这样的人才，方便聊一聊吗？",
            f"{name}您好，您的技能和经验很匹配我们的需求，希望进一步交流。"
        ]
        
        # 随机选择一个模板
        greeting = random.choice(greeting_templates)
        
        return greeting
        
    def record_candidate_info(self, resume_data):
        """
        记录候选人信息到日志文件
        
        Args:
            resume_data: 简历数据
        """
        try:
            # 获取当前时间
            current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # 提取候选人信息
            name = resume_data.get('name', '未命名候选人')
            position = resume_data.get('position', '未指定职位')
            
            # 处理公司信息（可能是列表或字符串）
            company_data = resume_data.get('company', [])
            if isinstance(company_data, list):
                company = "、".join(company_data) if company_data else "未提供公司信息"
            else:
                company = str(company_data) if company_data else "未提供公司信息"
            
            # 处理技能信息（可能是列表或字符串）
            skills_data = resume_data.get('skills', [])
            if isinstance(skills_data, list):
                skills = "、".join(skills_data) if skills_data else "未提供技能信息"
            else:
                skills = str(skills_data) if skills_data else "未提供技能信息"
            
            link = resume_data.get('link', '未提供链接')
            
            # CSV转义（替换逗号、引号等）
            name = self._escape_csv_field(name)
            position = self._escape_csv_field(position)
            company = self._escape_csv_field(company)
            skills = self._escape_csv_field(skills)
            link = self._escape_csv_field(link)
            
            # 构建日志记录
            log_entry = f"{current_time},{name},{position},{company},{skills},{link}\n"
            
            # 写入日志文件
            with open(self.candidates_log, "a", encoding="utf-8") as f:
                f.write(log_entry)
                
            print(f"已记录候选人 {name} 的信息到日志")
            
        except Exception as e:
            print(f"记录候选人信息失败: {e}")
            import traceback
            traceback.print_exc()
    
    def _escape_csv_field(self, value):
        """
        转义CSV字段
        
        Args:
            value: 字段值
            
        Returns:
            str: 转义后的字段值
        """
        if value is None:
            return ""
            
        # 转换为字符串
        value = str(value)
        
        # 如果包含逗号、引号或换行符，用引号包围并将引号替换为两个引号
        if ',' in value or '"' in value or '\n' in value:
            value = value.replace('"', '""')
            value = f'"{value}"'
            
        return value 