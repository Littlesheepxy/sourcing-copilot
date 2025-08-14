"""
简历详情页处理模块
负责处理简历详情页的功能
"""

import asyncio
import time
import os
import re
from automation.processors.enhanced_data_extractor import EnhancedDataExtractor

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
        self.greeting_in_progress = False  # 添加打招呼进行中状态标记
        
        # 初始化增强数据提取器
        self.enhanced_extractor = EnhancedDataExtractor()
        
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
                
            # 等待页面加载完成（优化：减少到1.5秒）
            await asyncio.sleep(1.5)  # 优化：从3.0秒减少到1.5秒，加快处理速度
            
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
            
            # 使用增强数据提取器从详情页提取数据
            print("🔍 使用增强提取器处理详情页...")
            start_time = time.time()
            
            try:
                # 使用增强数据提取器提取详情页数据
                detail_data = await self.enhanced_extractor.extract_resume_data(page, None, self.processor.selectors)
                
                if detail_data:
                    print(f"✅ 增强提取完成，耗时: {time.time() - start_time:.2f}秒")
                    
                    # 智能合并卡片数据和详情页数据
                    if card_resume_data:
                        resume_data = await self.enhanced_extractor.merge_resume_data(card_resume_data, detail_data)
                        print("📋 已合并卡片数据和详情页数据")
                    else:
                        resume_data = detail_data
                    
                    # 输出提取的文本内容
                    if detail_data.get('fullText'):
                        print("=" * 80)
                        print("📄 【增强提取】详情页文本内容:")
                        print("=" * 80)
                        # 显示前1500字符的内容
                        preview_text = detail_data.get('fullText')[:1500]
                        if len(detail_data.get('fullText')) > 1500:
                            preview_text += "\n...(还有更多内容)"
                        print(preview_text)
                        print("=" * 80)
                        print(f"📄 提取的文本总长度: {len(detail_data.get('fullText'))}")
                    
                    print(f"📊 增强提取结果: 姓名={resume_data.get('name')}, 学历={resume_data.get('education')}, 职位={resume_data.get('position')}, 工作经验={resume_data.get('experience')}年")
                else:
                    print(f"⚠️ 增强提取完成，耗时: {time.time() - start_time:.2f}秒，但未能提取到数据")
                    
            except Exception as e:
                print(f"❌ 增强提取失败: {e}")
                import traceback
                traceback.print_exc()
            
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
            
            # 获取详细的AI评估结果用于记录
            ai_evaluation_result = None
            try:
                ai_evaluation_result = await EvaluationHelper.evaluate_keywords_ai(resume_data, config)
                print(f"🤖 获取到AI评估详细结果: {ai_evaluation_result}")
            except Exception as eval_error:
                print(f"⚠️ 获取AI评估详细结果失败: {eval_error}")
                # 构建基本的评估结果
                ai_evaluation_result = {
                    "score": 0,
                    "passed": pass_filter,
                    "reason": reject_reason if not pass_filter else "通过评估"
                }
            
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
                    # 立即设置状态为False，防止在打招呼过程中触发滑动
                    self.processing_detail = False
                    # 设置打招呼进行中状态
                    self.greeting_in_progress = True
                    
                    success = await self.processor.interaction_handler.greet_candidate(greet_button, resume_data, page)
                    if success:
                        print(f"✅ 成功向候选人 {resume_data.get('name')} 打招呼")
                    else:
                        print(f"❌ 向候选人 {resume_data.get('name')} 打招呼失败")
                    
                    # 重置打招呼状态
                    self.greeting_in_progress = False
                    
                    self.processor.processed_ids.add(detail_id)
                    self.processor.processed_count += 1
                    # 记录打招呼的候选人，包含AI评估详细结果
                    self.processor.log_candidate(resume_data, "greet", "通过评估筛选", ai_evaluation_result)
                    # 等待操作完成
                    await asyncio.sleep(2)
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
                # 记录跳过的候选人，增加详细日志，包含AI评估详细结果
                if "关键词评分不足" in reject_reason:
                    print(f"📊 详细原因: {reject_reason}")
                self.processor.log_candidate(resume_data, "skip", reject_reason, ai_evaluation_result)
                
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
        finally:
            # 确保在任何情况下都重置状态
            if self.processing_detail:
                print("🔄 在finally块中重置详情页处理状态")
                self.processing_detail = False
            if hasattr(self, 'greeting_in_progress') and self.greeting_in_progress:
                print("🔄 在finally块中重置打招呼进行中状态")
                self.greeting_in_progress = False
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
            
            # 添加状态保护，确保在任何异常情况下都能重置状态
            try:
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
            except Exception as e:
                print(f"⚠️ 从iframe URL中提取ID时出错: {e}")
                return False
            
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
            
            # 检查页面是否已加载完成（优化：减少等待时间）
            try:
                await asyncio.sleep(1.5)  # 优化：从3.0秒减少到1.5秒，确保iframe充分加载
                
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
            
            # 使用增强数据提取器从iframe提取详情页数据
            try:
                print("🔍 使用增强提取器处理iframe详情页...")
                start_time = time.time()
                
                # 优化：设置超时时间为6秒
                extract_timeout = 6
                try:
                    print("⏳ 正在使用增强提取器提取简历数据，这可能需要几秒钟...")
                    # 使用asyncio.wait_for包装提取过程，如果超时则抛出异常
                    detail_data = await asyncio.wait_for(
                        self.enhanced_extractor.extract_resume_data(iframe, None, self.processor.selectors),
                        timeout=extract_timeout
                    )
                except asyncio.TimeoutError:
                    print(f"⚠️ 增强提取超时，已等待{extract_timeout}秒，跳过提取")
                    detail_data = None
                except Exception as e:
                    print(f"❌ 增强提取发生错误: {e}")
                    detail_data = None
                
                if detail_data:
                    print(f"✅ 增强提取完成，耗时: {time.time() - start_time:.2f}秒")
                    
                    # 智能合并卡片数据和详情页数据
                    if card_resume_data:
                        resume_data = await self.enhanced_extractor.merge_resume_data(card_resume_data, detail_data)
                        print("✅ 已合并卡片数据和iframe详情页数据")
                    else:
                        resume_data = detail_data
                    
                    # 记录提取的详细信息到日志
                    if detail_data.get('fullText'):
                        text_preview = detail_data.get('fullText')[:300] + "..." if len(detail_data.get('fullText')) > 300 else detail_data.get('fullText')
                        print(f"📝 提取的文本内容预览: {text_preview}")
                        print(f"📄 提取的文本总长度: {len(detail_data.get('fullText'))}")
                    
                    print(f"📊 增强提取结果: 姓名={resume_data.get('name')}, 学历={resume_data.get('education')}, 职位={resume_data.get('position')}, 工作经验={resume_data.get('experience')}年")
            except Exception as e:
                print(f"❌ 从iframe增强提取详情页数据出错: {e}")
                import traceback
                traceback.print_exc()
            
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
            
            # 获取详细的AI评估结果用于记录
            ai_evaluation_result = None
            try:
                ai_evaluation_result = await EvaluationHelper.evaluate_keywords_ai(resume_data, config)
                print(f"🤖 获取到AI评估详细结果: {ai_evaluation_result}")
            except Exception as eval_error:
                print(f"⚠️ 获取AI评估详细结果失败: {eval_error}")
                # 构建基本的评估结果
                ai_evaluation_result = {
                    "score": 0,
                    "passed": pass_filter,
                    "reason": reject_reason if not pass_filter else "通过评估"
                }
            
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
                    # 立即设置状态为False，防止在打招呼过程中触发滑动
                    self.processing_detail = False
                    # 设置打招呼进行中状态
                    self.greeting_in_progress = True
                    
                    success = await self.processor.interaction_handler.greet_candidate(greet_button, resume_data, parent_page)
                    if success:
                        print(f"✅ 成功向候选人 {resume_data.get('name')} 打招呼")
                    else:
                        print(f"❌ 向候选人 {resume_data.get('name')} 打招呼失败")
                    
                    # 重置打招呼状态
                    self.greeting_in_progress = False
                    
                    self.processor.processed_ids.add(detail_id)
                    self.processor.processed_count += 1
                    # 记录打招呼的候选人，包含AI评估详细结果
                    self.processor.log_candidate(resume_data, "greet", "通过评估筛选", ai_evaluation_result)
                    # 等待操作完成
                    await asyncio.sleep(2)
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
        finally:
            # 确保在任何情况下都重置状态
            if self.processing_detail:
                print("🔄 在finally块中重置详情页处理状态")
                self.processing_detail = False
            if hasattr(self, 'greeting_in_progress') and self.greeting_in_progress:
                print("🔄 在finally块中重置打招呼进行中状态")
                self.greeting_in_progress = False


