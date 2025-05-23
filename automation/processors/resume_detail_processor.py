"""
简历详情页处理模块
负责处理简历详情页的功能
"""

import asyncio
import time
import os
import re

class ResumeDetailProcessor:
    """简历详情页处理器，处理简历详情页相关功能"""
    
    def __init__(self, resume_processor):
        """
        初始化详情页处理器
        
        Args:
            resume_processor: 父简历处理器对象
        """
        self.processor = resume_processor
        self.processing_detail = False  # 添加详情页处理状态标记
        
    async def process_detail_page(self, page, config, card_resume_data=None):
        """
        处理简历详情页
        
        Args:
            page: Playwright页面对象
            config: 规则配置
            card_resume_data: 从卡片中提取的简历数据
            
        Returns:
            bool: 是否成功处理
        """
        try:
            # 设置处理状态，防止过早退出
            self.processing_detail = True
            print("开始处理简历详情页...")
            
            # 检查页面URL确认是详情页
            current_url = page.url
            # BOSS直聘的详情页URL包含detail、resumeDetail或recommend
            if "detail" not in current_url and "resumeDetail" not in current_url and "recommend" not in current_url:
                print(f"当前页面不是简历详情页: {current_url}")
                self.processing_detail = False
                return False
                
            # 提取详情页ID
            url_match = re.search(r"resumeDetail\?id=([^&]+)", current_url)
            if not url_match:
                url_match = re.search(r"detail/\w+/([^/]+)", current_url)
                
            detail_id = url_match.group(1) if url_match else f"detail_{int(time.time())}"
            
            # 避免重复处理同一个详情页
            if detail_id in self.processor.processed_ids:
                print(f"该详情页已处理过，跳过: {detail_id}")
                # 尝试关闭详情页
                await self.processor._try_close_detail_page(page)
                self.processing_detail = False
                return True
                
            # 等待页面加载完成（不进行滚动操作）
            await asyncio.sleep(3.0)  # 从1.0秒增加到3.0秒，确保页面充分加载
            
            # 检查停止信号
            if not self.processor.is_processing or (hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running') and not self.processor.browser.is_running):
                print("🛑 收到停止信号，停止详情页处理")
                self.processing_detail = False
                return False
                
            # 尝试获取基本信息
            resume_data = {}
            
            # 如果提供了卡片数据，合并
            if card_resume_data:
                resume_data.update(card_resume_data)
                print(f"📋 卡片数据: 姓名={card_resume_data.get('name')}, 职位={card_resume_data.get('position')}")
            
            # 首先检查是否为HTML格式简历（BOSS直聘标准结构）
            boss_html_resume = await page.query_selector('.resume-detail-wrap, [data-v-bcc3a4cc]')
            
            # 如果主页面没有，检查弹窗中是否有简历内容
            if not boss_html_resume:
                print("🔍 主页面未找到简历内容，检查弹窗...")
                dialog_selectors = [
                    '.dialog-wrap',
                    '.modal',
                    '.popup',
                    '[data-type="boss-dialog"]',
                    '.ka-dialog',
                    '.ui-dialog',
                    '.layui-layer',
                    '.dialog'
                ]
                
                for dialog_selector in dialog_selectors:
                    try:
                        dialog = await page.query_selector(dialog_selector)
                        if dialog:
                            is_visible = await dialog.is_visible()
                            if is_visible:
                                print(f"✅ 找到可见弹窗: {dialog_selector}")
                                # 在弹窗内查找简历内容
                                boss_html_resume = await dialog.query_selector('.resume-detail-wrap, [data-v-bcc3a4cc]')
                                if boss_html_resume:
                                    print(f"✅ 在弹窗中找到BOSS直聘简历内容")
                                    break
                    except Exception as e:
                        print(f"检查弹窗 {dialog_selector} 时出错: {e}")
                        continue
            
            if boss_html_resume:
                print("🔍 检测到BOSS直聘HTML格式简历，开始提取内容...")
                
                # 使用data_extractor提取HTML内容
                print("⏳ 正在提取简历HTML内容，这可能需要几秒钟...")
                start_time = time.time()
                
                # 使用data_extractor提取HTML内容
                page_data = await self.processor.data_extractor.extract_from_detail_page(page, self.processor.selectors)
                
                if page_data and page_data.get('html_content'):
                    # 合并提取的数据
                    resume_data.update(page_data)
                    print(f"✅ HTML提取完成，耗时: {time.time() - start_time:.2f}秒")
                    print(f"📄 提取的HTML内容长度: {len(page_data.get('html_content', ''))}")
                    
                    # 记录提取的内容摘要到日志
                    html_preview = page_data.get('html_content', '')[:500] + "..." if len(page_data.get('html_content', '')) > 500 else page_data.get('html_content', '')
                    print(f"📝 HTML内容预览: {html_preview}")
                    
                    # 标记类型为HTML简历
                    resume_data['is_boss_html_resume'] = True
                else:
                    print(f"⚠️ HTML提取完成，耗时: {time.time() - start_time:.2f}秒，但未能提取到HTML内容，将继续尝试其他方法")
            else:
                # 标准详情页数据提取
                try:
                    print("🔍 标准详情页，开始提取数据...")
                    start_time = time.time()
                    
                    # 使用DataExtractor提取标准数据
                    page_data = await self.processor.data_extractor.extract_from_detail_page(page, self.processor.selectors)
                    
                    # 合并提取的数据
                    if page_data:
                        resume_data.update(page_data)
                        print(f"✅ 标准数据提取完成，耗时: {time.time() - start_time:.2f}秒")
                        
                        # 记录提取的详细信息到日志
                        if page_data.get('fullText'):
                            text_preview = page_data.get('fullText')[:300] + "..." if len(page_data.get('fullText')) > 300 else page_data.get('fullText')
                            print(f"📝 提取的文本内容预览: {text_preview}")
                            print(f"📄 提取的文本总长度: {len(page_data.get('fullText'))}")
                    
                    print(f"📊 从详情页提取的数据: 姓名={resume_data.get('name')}, 职位={resume_data.get('position')}, 公司={resume_data.get('company')}")
                except Exception as e:
                    print(f"❌ 提取简历详情数据出错: {e}")
            
            # 如果没有足够的数据进行评估，但有卡片数据，则使用卡片数据进行评估
            if not resume_data.get('name') and card_resume_data and card_resume_data.get('name'):
                print("⚠️ 从详情页提取的简历数据不完整，将使用卡片数据进行评估")
                resume_data = card_resume_data.copy()
                resume_data['is_using_card_data_only'] = True
            elif not resume_data.get('name'):
                print("❌ 未提取到足够的简历数据，且卡片数据也不完整，无法进行评估")
                await self.processor._try_close_detail_page(page)
                self.processing_detail = False
                return False
                
            # 记录评估前的数据状态
            print(f"🎯 准备评估候选人: {resume_data.get('name')}")
            print(f"📋 评估数据: 职位={resume_data.get('position')}, 公司={resume_data.get('company')}, 有全文={bool(resume_data.get('fullText'))}")
                
            # 检查停止信号
            if not self.processor.is_processing or (hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running') and not self.processor.browser.is_running):
                print("🛑 评估前收到停止信号，停止详情页处理")
                self.processing_detail = False
                return False
                
            # 使用规则引擎评估候选人
            from automation.processors.evaluation_helper import EvaluationHelper
            # 使用静态方法评估简历
            print("🤖 开始进行大模型评估...")
            pass_filter, reject_reason = await EvaluationHelper.evaluate_resume(resume_data, config)
            
            # 检查停止信号
            if not self.processor.is_processing or (hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running') and not self.processor.browser.is_running):
                print("🛑 评估后收到停止信号，停止详情页处理")
                self.processing_detail = False
                return False
            
            if pass_filter:
                print(f"✅ 候选人 {resume_data.get('name')} 通过筛选，准备打招呼")
                
                # 查找打招呼按钮，添加新的选择器
                greet_selectors = [
                    self.processor.selectors.get('detailGreetButton'),
                    '.btn-v2.btn-sure-v2.btn-greet.overdue-tip',  # 新增：您提供的具体按钮
                    '.btn-v2.btn-sure-v2.btn-greet',  # 通用按钮
                    '.button-chat-wrap.resumeGreet .btn-v2.btn-sure-v2.btn-greet',  # 详情页选择器
                    'button[class*="btn-greet"]',
                    '.btn-greet',
                    'button:has-text("打招呼")',
                    '.button-list .btn-greet',
                    '.btn.btn-greet'
                ]
                
                greet_button = None
                
                # 首先在弹窗中查找打招呼按钮
                print("🔍 优先在弹窗中查找打招呼按钮...")
                dialog_selectors = [
                    '.dialog-wrap',
                    '.modal',
                    '.popup',
                    '[data-type="boss-dialog"]',
                    '.ka-dialog',
                    '.ui-dialog',
                    '.layui-layer',
                    '.dialog'
                ]
                
                for dialog_selector in dialog_selectors:
                    try:
                        dialog = await page.query_selector(dialog_selector)
                        if dialog:
                            is_visible = await dialog.is_visible()
                            if is_visible:
                                print(f"🔍 在弹窗 {dialog_selector} 中查找打招呼按钮...")
                                for selector in greet_selectors:
                                    if not selector:
                                        continue
                                    button = await dialog.query_selector(selector)
                                    if button:
                                        button_visible = await button.is_visible()
                                        if button_visible:
                                            print(f"🎯 在弹窗中使用选择器 {selector} 找到了打招呼按钮")
                                            greet_button = button
                                            break
                                if greet_button:
                                    break
                    except Exception as e:
                        print(f"在弹窗 {dialog_selector} 中查找按钮时出错: {e}")
                        continue
                
                # 如果弹窗中没找到，在主页面查找
                if not greet_button:
                    print("🔍 弹窗中未找到按钮，在主页面查找...")
                    for selector in greet_selectors:
                        if not selector:
                            continue
                            
                        button = await page.query_selector(selector)
                        if button:
                            is_visible = await button.is_visible()
                            if is_visible:
                                print(f"🎯 在主页面使用选择器 {selector} 找到了打招呼按钮")
                                greet_button = button
                                break
                    
                if greet_button:
                    print(f"💬 开始打招呼...")
                    success = await self.processor.interaction_handler.greet_candidate(greet_button, resume_data)
                    if success:
                        print(f"✅ 成功向候选人 {resume_data.get('name')} 打招呼")
                    else:
                        print(f"❌ 向候选人 {resume_data.get('name')} 打招呼失败")
                    
                    self.processor.processed_ids.add(detail_id)
                    self.processor.processed_count += 1
                    # 记录打招呼的候选人
                    self.processor.log_candidate(resume_data, "greet", "通过评估筛选")
                    # 等待按钮操作完成
                    await asyncio.sleep(2)
                    self.processing_detail = False
                    return True
                else:
                    print("❌ 未找到打招呼按钮，尝试关闭详情页...")
                    # 尝试关闭详情页
                    success = await self.processor._try_close_detail_page(page)
                    if not success:
                        # 如果关闭失败，尝试按ESC键
                        print("🔄 尝试使用ESC键关闭详情页...")
                        await page.keyboard.press('Escape')
                        await asyncio.sleep(1)  # 等待ESC键生效
                    self.processing_detail = False
                    return True
            else:
                print(f"❌ 候选人 {resume_data.get('name')} 未通过筛选: {reject_reason}")
                self.processor.processed_ids.add(detail_id)
                self.processor.processed_count += 1
                # 记录跳过的候选人，增加详细日志
                if "关键词评分不足" in reject_reason:
                    print(f"📊 详细原因: {reject_reason}")
                self.processor.log_candidate(resume_data, "skip", reject_reason)
                
                print("🔄 准备关闭详情页...")
                # 尝试关闭详情页
                success = await self.processor._try_close_detail_page(page)
                if not success:
                    # 如果关闭失败，尝试按ESC键
                    print("🔄 尝试使用ESC键关闭详情页...")
                    await page.keyboard.press('Escape')
                    await asyncio.sleep(1)  # 等待ESC键生效
                
                self.processing_detail = False
                return True
                
        except Exception as e:
            print(f"❌ 处理简历详情页出错: {e}")
            import traceback
            traceback.print_exc()
            
            # 出错时也尝试关闭详情页
            try:
                await self.processor._try_close_detail_page(page)
                # 尝试ESC键退出
                await page.keyboard.press('Escape')
                await asyncio.sleep(1)
            except:
                pass
            
            self.processing_detail = False
        return False
        
    async def process_detail_page_iframe(self, iframe, parent_page, config, card_resume_data=None):
        """
        处理在iframe中的简历详情页
        
        Args:
            iframe: iframe页面对象
            parent_page: 父页面对象
            config: 规则配置
            card_resume_data: 从卡片提取的简历数据（可选）
            
        Returns:
            bool: 是否处理了该页面
        """
        try:
            # 设置处理状态，防止过早退出
            self.processing_detail = True
            print("🔍 开始处理iframe中的详情页")
            
            # 从iframe URL中提取ID，用于去重
            iframe_url = iframe.url
            print(f"📄 iframe URL: {iframe_url}")
            
            id_match = re.search(r'id=(\w+)', iframe_url)
            if not id_match:
                # 尝试从父页面URL提取
                parent_url = parent_page.url
                id_match = re.search(r'id=(\w+)', parent_url)
                
            if id_match:
                detail_id = id_match.group(1)
            else:
                # 使用卡片ID或时间戳作为备用ID
                if card_resume_data and card_resume_data.get('id'):
                    detail_id = f"card_{card_resume_data.get('id')}"
                else:
                    detail_id = f"iframe_{int(time.time())}"
            
            # 备份卡片数据中的关键字段，确保不会丢失
            original_position = None
            if card_resume_data and 'position' in card_resume_data:
                original_position = card_resume_data.get('position')
                print(f"📋 备份卡片中的期望职位: {original_position}")
                
            # 如果卡片数据中含有"北京广告创意策划"等信息，确保保留
            if card_resume_data and card_resume_data.get('fullText'):
                position_match = re.search(r'期望：\s*([^\n\r]+)', card_resume_data.get('fullText', ''))
                if position_match and not original_position:
                    original_position = position_match.group(1).strip()
                    card_resume_data['position'] = original_position
                    print(f"📋 从卡片全文提取到期望职位: {original_position}")

            # 记录当前处理的详情页ID
            current_detail_id = detail_id
            
            # 检查页面是否已加载完成（减少等待时间，不进行滚动）
            try:
                await asyncio.sleep(3.0)  # 从1.0秒增加到3.0秒，确保iframe充分加载
                
                # 检查停止信号
                if not self.processor.is_processing or (hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running') and not self.processor.browser.is_running):
                    print("🛑 收到停止信号，停止详情页处理")
                    self.processing_detail = False
                    return False
                
                # 尝试等待页面内容加载完成
                try:
                    await iframe.wait_for_selector('body', timeout=2000)  # 从15000ms改为2000ms
                except Exception as e:
                    print(f"⚠️ 等待iframe加载完成时出错: {e}")
            except Exception as e:
                print(f"⚠️ 等待iframe加载时出错: {e}")
            
            # 尝试获取基本信息
            resume_data = {}
            
            # 如果提供了卡片数据，合并
            if card_resume_data:
                resume_data.update(card_resume_data)
                print(f"📋 卡片数据: 姓名={card_resume_data.get('name')}, 职位={card_resume_data.get('position')}")
            
            # 增加调试信息
            try:
                body_content_length = await iframe.evaluate('document.body ? document.body.innerHTML.length : 0')
                print(f"📄 iframe内容长度: {body_content_length}")
            except Exception as e:
                print(f"⚠️ 获取iframe内容长度时出错: {e}")
            
            print(f"📄 iframe当前URL: {iframe.url}")
            
            # 尝试提取详情页数据
            try:
                # 使用DataExtractor提取标准数据
                print("🔍 开始提取iframe中标准数据...")
                start_time = time.time()
                
                # 设置超时时间为10秒
                extract_timeout = 10
                try:
                    print("⏳ 正在提取简历标准数据，这可能需要几秒钟...")
                    # 使用asyncio.wait_for包装提取过程，如果超时则抛出异常
                    page_data = await asyncio.wait_for(
                        self.processor.data_extractor.extract_from_detail_page(iframe, self.processor.selectors),
                        timeout=extract_timeout
                    )
                except asyncio.TimeoutError:
                    print(f"⚠️ 数据提取超时，已等待{extract_timeout}秒，跳过提取")
                    page_data = None
                except Exception as e:
                    print(f"❌ 数据提取发生错误: {e}")
                    page_data = None
                
                if page_data:
                    # 合并提取的数据
                    resume_data.update(page_data)
                    print(f"✅ 提取完成，耗时: {time.time() - start_time:.2f}秒")
                    
                    # 记录提取的详细信息到日志
                    if page_data.get('fullText'):
                        text_preview = page_data.get('fullText')[:300] + "..." if len(page_data.get('fullText')) > 300 else page_data.get('fullText')
                        print(f"📝 提取的文本内容预览: {text_preview}")
                        print(f"📄 提取的文本总长度: {len(page_data.get('fullText'))}")
                    
                    print(f"📊 从iframe详情页提取的标准数据: 姓名={resume_data.get('name')}, 职位={resume_data.get('position')}, 公司={resume_data.get('company')}")
            except Exception as e:
                print(f"❌ 从iframe提取详情页数据出错: {e}")
                
                # 尝试使用旧方法提取
                detail_resume_data = await self.processor.data_extractor.extract_detail_page_data(iframe, self.processor.selectors)
                if detail_resume_data:
                    # 合并卡片数据和详情页数据
                    if card_resume_data:
                        resume_data = self.processor.data_extractor.merge_resume_data(card_resume_data, detail_resume_data)
                        print("✅ 已合并卡片数据和iframe详情页数据")
                    else:
                        resume_data = detail_resume_data
            
            # 确保有链接信息
            if not resume_data.get('link'):
                resume_data['link'] = parent_page.url
                
            # 如果没有足够的数据进行评估，但有卡片数据，则使用卡片数据进行评估
            if not resume_data.get('name') and card_resume_data and card_resume_data.get('name'):
                print("⚠️ 从iframe提取的简历数据不完整，将使用卡片数据进行评估")
                resume_data = card_resume_data.copy()
                resume_data['is_using_card_data_only'] = True
            elif not resume_data.get('name'):
                print("❌ 从iframe提取的简历数据不完整，且卡片数据也不完整，无法进行评估")
                
                # 直接按ESC键关闭详情页，不再尝试其他方法
                print("🔄 尝试使用ESC键直接关闭详情页...")
                try:
                    # 修复：确保使用父页面的keyboard而非iframe
                    await parent_page.keyboard.press('Escape')
                except Exception as e:
                    print(f"❌ 使用ESC键关闭详情页失败: {e}")
                await asyncio.sleep(0.5)  # 只等待0.5秒
                
                self.processing_detail = False
                return False
            
            # 确保原始职位数据不丢失
            if original_position and (not resume_data.get('position') or resume_data.get('position') == ""):
                print(f"📋 使用卡片中备份的期望职位: {original_position}")
                resume_data['position'] = original_position
                
            # 记录评估前的数据状态
            print(f"🎯 准备评估候选人: {resume_data.get('name')}")
            print(f"📋 评估数据: 职位={resume_data.get('position')}, 公司={resume_data.get('company')}, 有全文={bool(resume_data.get('fullText'))}")
                
            # 检查停止信号
            if not self.processor.is_processing or (hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running') and not self.processor.browser.is_running):
                print("🛑 评估前收到停止信号，停止详情页处理")
                self.processing_detail = False
                return False
                
            # 使用规则引擎评估候选人
            from automation.processors.evaluation_helper import EvaluationHelper
            # 使用静态方法评估简历
            print("🤖 开始进行大模型评估...")
            pass_filter, reject_reason = await EvaluationHelper.evaluate_resume(resume_data, config)
            
            # 检查停止信号
            if not self.processor.is_processing or (hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running') and not self.processor.browser.is_running):
                print("🛑 评估后收到停止信号，停止详情页处理")
                self.processing_detail = False
                return False
            
            if pass_filter:
                print(f"✅ 候选人 {resume_data.get('name')} 通过筛选，准备打招呼")
                
                # 查找打招呼按钮，先在iframe内查找，添加新的选择器
                print("🔍 尝试在iframe中查找打招呼按钮...")
                iframe_selectors = [
                    self.processor.selectors.get('detailGreetButton'),
                    '.btn-v2.btn-sure-v2.btn-greet.overdue-tip',  # 新增：您提供的具体按钮
                    '.btn-v2.btn-sure-v2.btn-greet',  # 通用按钮
                    '.button-chat-wrap.resumeGreet .btn-v2.btn-sure-v2.btn-greet',  # 详情页选择器
                    '.button-chat-wrap .btn-v2.btn-sure-v2.btn-greet',
                    '.button-list .btn-v2.btn-sure-v2.btn-greet',
                    'button[class*="btn-greet"]',
                    '.btn-chat',
                    '.btn-greet',
                    '.btn.btn-greet',
                    'button:has-text("打招呼")'
                ]
                
                greet_button = None
                for selector in iframe_selectors:
                    if not selector:
                        continue
                    try:
                        button = await iframe.query_selector(selector)
                        if button:
                            is_visible = await button.is_visible()
                            if is_visible:
                                print(f"🎯 在iframe中使用选择器 {selector} 找到了打招呼按钮")
                                greet_button = button
                                break
                            else:
                                print(f"⚠️ iframe中按钮 {selector} 存在但不可见")
                    except Exception as e:
                        print(f"❌ 尝试iframe选择器 {selector} 时出错: {e}")
                
                # 如果iframe中没有找到打招呼按钮，尝试在父页面的弹窗中查找
                if not greet_button:
                    print("🔍 iframe中未找到打招呼按钮，尝试在父页面弹窗中查找...")
                    
                    # 弹窗选择器
                    dialog_selectors = [
                        '.dialog-wrap',
                        '.modal',
                        '.popup',
                        '[data-type="boss-dialog"]',
                        '.ka-dialog',
                        '.ui-dialog',
                        '.layui-layer',
                        '.dialog'
                    ]
                    
                    # 按钮选择器
                    button_selectors = [
                        '.btn-v2.btn-sure-v2.btn-greet.overdue-tip',
                        '.btn-v2.btn-sure-v2.btn-greet',
                        'button[class*="btn-greet"]',
                        '.btn-greet',
                        'button:has-text("打招呼")'
                    ]
                    
                    for dialog_selector in dialog_selectors:
                        try:
                            dialog = await parent_page.query_selector(dialog_selector)
                            if dialog:
                                is_visible = await dialog.is_visible()
                                if is_visible:
                                    print(f"🔍 在父页面弹窗 {dialog_selector} 中查找打招呼按钮...")
                                    for button_selector in button_selectors:
                                        button = await dialog.query_selector(button_selector)
                                        if button:
                                            button_visible = await button.is_visible()
                                            if button_visible:
                                                print(f"🎯 在父页面弹窗中使用选择器 {button_selector} 找到了打招呼按钮")
                                                greet_button = button
                                                break
                                    if greet_button:
                                        break
                        except Exception as e:
                            print(f"在父页面弹窗 {dialog_selector} 中查找按钮时出错: {e}")
                            continue
                
                # 如果弹窗中也没有找到，尝试在父页面主区域查找
                if not greet_button:
                    print("🔍 弹窗中也未找到打招呼按钮，尝试在父页面主区域查找...")
                    parent_selectors = [
                        self.processor.selectors.get('greetButton'),
                        '.btn-v2.btn-sure-v2.btn-greet.overdue-tip',
                        '.btn-v2.btn-sure-v2.btn-greet',
                        'button[class*="btn-greet"]',
                        '.btn-greet',
                        'button:has-text("打招呼")',
                        '.button-list .btn-greet',
                        '.btn.btn-greet'
                    ]
                    
                    for selector in parent_selectors:
                        if not selector:
                            continue
                        try:
                            button = await parent_page.query_selector(selector)
                            if button:
                                is_visible = await button.is_visible()
                                if is_visible:
                                    print(f"🎯 在父页面主区域中使用选择器 {selector} 找到了打招呼按钮")
                                    greet_button = button
                                    break
                                else:
                                    print(f"⚠️ 父页面中按钮 {selector} 存在但不可见")
                        except Exception as e:
                            print(f"❌ 尝试父页面选择器 {selector} 时出错: {e}")
                
                if greet_button:
                    print(f"💬 开始打招呼...")
                    success = await self.processor.interaction_handler.greet_candidate(greet_button, resume_data)
                    if success:
                        print(f"✅ 成功向候选人 {resume_data.get('name')} 打招呼")
                    else:
                        print(f"❌ 向候选人 {resume_data.get('name')} 打招呼失败")
                    
                    self.processor.processed_ids.add(detail_id)
                    self.processor.processed_count += 1
                    # 记录打招呼的候选人
                    self.processor.log_candidate(resume_data, "greet", "通过评估筛选")
                    # 等待操作完成
                    await asyncio.sleep(2)
                    self.processing_detail = False
                    return True
                else:
                    print("❌ 未找到打招呼按钮，尝试关闭详情页...")
                    # 尝试使用ESC键关闭详情页
                    try:
                        await parent_page.keyboard.press('Escape')
                        await asyncio.sleep(1)
                    except Exception as e:
                        print(f"❌ 使用ESC键关闭详情页失败: {e}")
                    
                    self.processing_detail = False
                    return True
            else:
                print(f"❌ 候选人 {resume_data.get('name')} 未通过筛选: {reject_reason}")
                self.processor.processed_ids.add(detail_id)
                self.processor.processed_count += 1
                # 记录跳过的候选人
                if "关键词评分不足" in reject_reason:
                    print(f"📊 详细原因: {reject_reason}")
                self.processor.log_candidate(resume_data, "skip", reject_reason)
                
                print("🔄 准备关闭详情页...")
                # 尝试使用ESC键关闭详情页
                try:
                    await parent_page.keyboard.press('Escape')
                    await asyncio.sleep(1)
                except Exception as e:
                    print(f"❌ 使用ESC键关闭详情页失败: {e}")
                
                self.processing_detail = False
                return True
                
        except Exception as e:
            print(f"❌ 处理iframe详情页出错: {e}")
            import traceback
            traceback.print_exc()
            
            # 出错时也尝试关闭详情页
            try:
                await parent_page.keyboard.press('Escape')
                await asyncio.sleep(0.5)
            except:
                pass
            
            self.processing_detail = False
            return False


