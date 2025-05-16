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
            if "detail" not in current_url and "resumeDetail" not in current_url:
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
                
            # 尝试获取基本信息
            resume_data = {}
            
            # 如果提供了卡片数据，合并
            if card_resume_data:
                resume_data.update(card_resume_data)
            
            # 标记是否需要OCR处理
            needs_ocr = False
            ocr_processing = False
            
            # 检查是否为canvas格式简历
            canvas = await page.query_selector('canvas')
            if canvas:
                needs_ocr = True
                ocr_processing = True
                print("检测到canvas格式简历，尝试使用OCR提取文本")
                
                # 先保存canvas为图片，便于检查和OCR
                try:
                    # 创建保存目录
                    screenshots_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/screenshots")
                    os.makedirs(screenshots_dir, exist_ok=True)
                    
                    # 显示截图保存目录提示，让用户更容易找到
                    print(f"\n🖼️ 截图保存目录: {screenshots_dir}")
                    print(f"   可以通过Finder打开或终端命令: open \"{screenshots_dir}\"\n")
                    
                    # 截取canvas元素
                    timestamp = int(time.time())
                    screenshot_path = os.path.join(screenshots_dir, f"canvas_{detail_id}_{timestamp}.png")
                    
                    # 使用JavaScript获取canvas图像数据
                    canvas_data = await page.evaluate("""(canvas) => {
                        try {
                            return canvas.toDataURL('image/png');
                        } catch(e) {
                            return null;
                        }
                    }""", canvas)
                    
                    if not canvas_data:
                        # 直接截图
                        await canvas.screenshot(path=screenshot_path)
                    else:
                        # 从base64数据保存图片
                        import base64
                        canvas_data = canvas_data.split(",")[1]
                        with open(screenshot_path, 'wb') as f:
                            f.write(base64.b64decode(canvas_data))
                    
                    print(f"已保存canvas截图到: {screenshot_path}")
                    
                    # 同时截取整个页面作为参考
                    full_screenshot_path = os.path.join(screenshots_dir, f"page_{detail_id}_{timestamp}.png")
                    await page.screenshot(path=full_screenshot_path)
                    print(f"已保存页面完整截图到: {full_screenshot_path}")
                    
                    # 将截图路径添加到简历数据中
                    resume_data['canvas_screenshot'] = screenshot_path
                    resume_data['page_screenshot'] = full_screenshot_path
                    
                except Exception as e:
                    print(f"保存canvas截图时出错: {e}")
                
                print("开始OCR提取canvas内容，请等待...")
                # 使用data_extractor提取canvas内容，设置最大等待时间
                ocr_timeout = 10  # 最大等待10秒
                start_time = time.time()
                
                print("⏳ 正在提取和解析简历内容，这可能需要几秒钟...")
                # 使用data_extractor提取canvas内容
                page_data = await self.processor.data_extractor.extract_from_detail_page(page, self.processor.selectors)
                
                ocr_processing = False  # OCR处理完成
                
                if page_data:
                    # 合并提取的数据
                    resume_data.update(page_data)
                    print(f"✅ OCR提取完成，耗时: {time.time() - start_time:.2f}秒，从canvas简历提取的数据: {resume_data}")
                    
                    # 标记类型为canvas简历
                    resume_data['is_canvas_resume'] = True
                else:
                    print(f"⚠️ OCR提取完成，耗时: {time.time() - start_time:.2f}秒，从canvas提取数据失败，但将继续使用卡片数据进行评估")
            # 检查是否为图片格式简历
            elif await page.query_selector('.resume-img-box, img[src*="resume"], .resume-image, .resume-picture, .image-display'):
                needs_ocr = True
                ocr_processing = True
                print("检测到图片格式简历，准备OCR提取")
                
                # 保存图片简历
                try:
                    # 创建保存目录
                    screenshots_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/screenshots")
                    os.makedirs(screenshots_dir, exist_ok=True)
                    
                    # 显示截图保存目录提示，让用户更容易找到
                    print(f"\n🖼️ 截图保存目录: {screenshots_dir}")
                    print(f"   可以通过Finder打开或终端命令: open \"{screenshots_dir}\"\n")
                    
                    # 查找简历图片元素
                    img_selectors = ['.resume-img-box img', 'img[src*="resume"]', '.resume-image img', '.resume-picture img', '.image-display img']
                    resume_img = None
                    
                    for selector in img_selectors:
                        img = await page.query_selector(selector)
                        if img:
                            resume_img = img
                            break
                    
                    if resume_img:
                        # 截取图片元素
                        timestamp = int(time.time())
                        screenshot_path = os.path.join(screenshots_dir, f"img_{detail_id}_{timestamp}.png")
                        await resume_img.screenshot(path=screenshot_path)
                        print(f"已保存简历图片到: {screenshot_path}")
                    else:
                        # 截取整个页面
                        timestamp = int(time.time())
                        screenshot_path = os.path.join(screenshots_dir, f"page_{detail_id}_{timestamp}.png")
                        await page.screenshot(path=screenshot_path)
                        print(f"未找到特定图片元素，已保存整个页面截图: {screenshot_path}")
                    
                    # 将截图路径添加到简历数据中
                    resume_data['resume_screenshot'] = screenshot_path
                    
                except Exception as e:
                    print(f"保存简历图片时出错: {e}")
                
                print("开始OCR提取图片内容，请等待...")
                # 使用data_extractor提取图片内容，设置最大等待时间
                ocr_timeout = 10  # 最大等待10秒
                start_time = time.time()
                
                print("⏳ 正在提取和解析简历内容，这可能需要几秒钟...")
                # 使用data_extractor提取图片内容
                page_data = await self.processor.data_extractor.extract_from_detail_page(page, self.processor.selectors)
                
                ocr_processing = False  # OCR处理完成
                
                if page_data:
                    # 合并提取的数据
                    resume_data.update(page_data)
                    print(f"✅ OCR提取完成，耗时: {time.time() - start_time:.2f}秒，从图片简历提取的数据: {resume_data}")
                    
                    # 标记类型为图片简历
                    resume_data['is_image_resume'] = True
                else:
                    print(f"⚠️ OCR提取完成，耗时: {time.time() - start_time:.2f}秒，但从图片简历提取数据失败，将继续使用卡片数据进行评估")
            else:
                # 标准详情页数据提取
                try:
                    print("标准详情页，开始提取数据...")
                    start_time = time.time()
                    
                    # 使用DataExtractor提取标准数据
                    page_data = await self.processor.data_extractor.extract_from_detail_page(page, self.processor.selectors)
                    
                    # 合并提取的数据
                    if page_data:
                        resume_data.update(page_data)
                    
                    print(f"标准页面数据提取完成，耗时: {time.time() - start_time:.2f}秒，提取结果: {resume_data}")
                except Exception as e:
                    print(f"提取简历详情数据出错: {e}")
            
            # 确保OCR处理已完成
            if needs_ocr and ocr_processing:
                print("警告：OCR处理未正常完成标记，可能是发生了异常，等待5秒...")
                await asyncio.sleep(5)  # 额外等待，确保OCR处理完成
            
            # 如果没有足够的数据进行评估，但有卡片数据，则使用卡片数据进行评估
            if not resume_data.get('name') and card_resume_data and card_resume_data.get('name'):
                print("从详情页提取的简历数据不完整，将使用卡片数据进行评估")
                resume_data = card_resume_data.copy()
                resume_data['is_using_card_data_only'] = True
            elif not resume_data.get('name'):
                print("未提取到足够的简历数据，且卡片数据也不完整，无法进行评估")
                await self.processor._try_close_detail_page(page)
                self.processing_detail = False
                return False
                
            # 使用规则引擎评估候选人
            from automation.processors.evaluation_helper import EvaluationHelper
            # 使用静态方法评估简历
            pass_filter, reject_reason = EvaluationHelper.evaluate_resume(resume_data, config)
            
            if pass_filter:
                print(f"候选人 {resume_data.get('name')} 通过筛选，准备打招呼")
                
                # 查找打招呼按钮，添加新的选择器
                greet_selectors = [
                    self.processor.selectors.get('detailGreetButton'),
                    '.button-chat-wrap.resumeGreet .btn-v2.btn-sure-v2.btn-greet',  # 新增详情页选择器
                    '.btn-v2.btn-sure-v2.btn-greet',
                    'button[class*="btn-greet"]',
                    '.btn-greet',
                    'button:has-text("打招呼")',
                    '.button-list .btn-greet',
                    '.btn.btn-greet'  # 新增卡片内选择器
                ]
                
                greet_button = None
                for selector in greet_selectors:
                    if not selector:
                        continue
                        
                    button = await page.query_selector(selector)
                    if button:
                        is_visible = await button.is_visible()
                        if is_visible:
                            print(f"使用选择器 {selector} 找到了打招呼按钮")
                            greet_button = button
                            break
                    
                if greet_button:
                    success = await self.processor.interaction_handler.greet_candidate(greet_button, resume_data)
                    self.processor.processed_ids.add(detail_id)
                    self.processor.processed_count += 1
                    # 记录打招呼的候选人
                    self.processor.log_candidate(resume_data, "greet", "关键词评分通过")
                    # 等待按钮操作完成
                    await asyncio.sleep(2)
                    self.processing_detail = False
                    return True
                else:
                    print("未找到打招呼按钮，尝试关闭详情页...")
                    # 尝试关闭详情页
                    success = await self.processor._try_close_detail_page(page)
                    if not success:
                        # 如果是canvas或图片简历且关闭失败，尝试按ESC键
                        if resume_data.get('is_canvas_resume') or resume_data.get('is_image_resume'):
                            print("尝试使用ESC键关闭详情页...")
                            await page.keyboard.press('Escape')
                            await asyncio.sleep(1)  # 等待ESC键生效
                    self.processing_detail = False
                    return True
            else:
                print(f"候选人 {resume_data.get('name')} 未通过筛选: {reject_reason}")
                self.processor.processed_ids.add(detail_id)
                self.processor.processed_count += 1
                # 记录跳过的候选人，增加详细日志
                if "关键词评分不足" in reject_reason:
                    print(f"详细原因: {reject_reason}")
                self.processor.log_candidate(resume_data, "skip", reject_reason)
                
                # 尝试关闭详情页
                success = await self.processor._try_close_detail_page(page)
                if not success:
                    # 如果是canvas或图片简历且关闭失败，尝试按ESC键
                    if resume_data.get('is_canvas_resume') or resume_data.get('is_image_resume'):
                        print("尝试使用ESC键关闭详情页...")
                        await page.keyboard.press('Escape')
                        await asyncio.sleep(1)  # 等待ESC键生效
                
                self.processing_detail = False
                return True
                
        except Exception as e:
            print(f"处理简历详情页出错: {e}")
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
            print("开始处理iframe中的详情页")
            
            # 从iframe URL中提取ID，用于去重
            iframe_url = iframe.url
            print(f"iframe URL: {iframe_url}")
            
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
                print(f"备份卡片中的期望职位: {original_position}")
                
            # 如果卡片数据中含有"北京广告创意策划"等信息，确保保留
            if card_resume_data and card_resume_data.get('fullText'):
                position_match = re.search(r'期望：\s*([^\n\r]+)', card_resume_data.get('fullText', ''))
                if position_match and not original_position:
                    original_position = position_match.group(1).strip()
                    card_resume_data['position'] = original_position
                    print(f"从卡片全文提取到期望职位: {original_position}")

            # 记录当前处理的详情页ID
            current_detail_id = detail_id
            
            # 检查页面是否已加载完成
            try:
                # 等待页面加载，图片简历可能需要额外时间加载
                await asyncio.sleep(1.0)  # 减少等待时间，从3.5秒降低到1秒
                
                # 尝试等待页面内容加载完成
                try:
                    # 减少超时时间，提高处理速度
                    await iframe.wait_for_selector('body', timeout=2000)  # 从15000ms改为2000ms
                except Exception as e:
                    print(f"等待iframe加载完成时出错: {e}")
            except Exception as e:
                print(f"等待iframe加载时出错: {e}")
            
            # 尝试获取基本信息
            resume_data = {}
            
            # 如果提供了卡片数据，合并
            if card_resume_data:
                resume_data.update(card_resume_data)
            
            # 增加调试信息
            try:
                body_content_length = await iframe.evaluate('document.body ? document.body.innerHTML.length : 0')
                print(f"iframe内容长度: {body_content_length}")
            except Exception as e:
                print(f"获取iframe内容长度时出错: {e}")
            
            try:
                js_query = 'document.querySelectorAll("canvas").length'
                canvas_count = await iframe.evaluate(js_query)
                print(f"iframe中的canvas元素数量: {canvas_count}")
            except Exception as e:
                print(f"检查iframe中canvas元素时出错: {e}")
            
            print(f"尝试从iframe获取当前URL: {iframe.url}")
            
            # 标记是否需要OCR处理
            needs_ocr = False
            ocr_processing = False
            
            # 检查iframe中是否有canvas元素
            canvas = await iframe.query_selector('canvas')
            if canvas:
                needs_ocr = True
                ocr_processing = True
                print("在iframe中检测到canvas格式简历，开始OCR提取文本")
                
                # 先保存canvas为图片，便于检查和OCR
                try:
                    # 创建保存目录
                    screenshots_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/screenshots")
                    os.makedirs(screenshots_dir, exist_ok=True)
                    
                    # 显示截图保存目录提示，让用户更容易找到
                    print(f"\n🖼️ 截图保存目录: {screenshots_dir}")
                    print(f"   可以通过Finder打开或终端命令: open \"{screenshots_dir}\"\n")
                    
                    # 截取canvas元素
                    timestamp = int(time.time())
                    screenshot_path = os.path.join(screenshots_dir, f"canvas_{current_detail_id}_{timestamp}.png")
                    
                    # 修改：使用正确的截图方法
                    try:
                        # 先获取canvas的宽高
                        canvas_size = await iframe.evaluate("""(canvas) => {
                            return {
                                width: canvas.width,
                                height: canvas.height,
                                clientWidth: canvas.clientWidth,
                                clientHeight: canvas.clientHeight,
                                scrollWidth: canvas.scrollWidth,
                                scrollHeight: canvas.scrollHeight
                            };
                        }""", canvas)
                        
                        print(f"Canvas尺寸信息: {canvas_size}")
                        
                        # 优先使用JavaScript获取canvas图像数据，支持长图
                        canvas_data = await iframe.evaluate("""(canvas) => {
                            try {
                                // 创建一个新canvas，确保尺寸足够大
                                const tempCanvas = document.createElement('canvas');
                                tempCanvas.width = canvas.width || canvas.clientWidth || 800;
                                tempCanvas.height = canvas.height || canvas.clientHeight || 3000; // 确保高度足够
                                
                                // 获取上下文并绘制原canvas内容
                                const tempCtx = tempCanvas.getContext('2d');
                                
                                // 如果原canvas非常大，分段绘制
                                const maxHeight = 5000; // 最大处理高度
                                const sourceHeight = canvas.height || canvas.clientHeight;
                                
                                if (sourceHeight > maxHeight) {
                                    console.log("Canvas过高，分段处理");
                                    // 分多次绘制
                                    const segments = Math.ceil(sourceHeight / maxHeight);
                                    for (let i = 0; i < segments; i++) {
                                        const y = i * maxHeight;
                                        const h = Math.min(maxHeight, sourceHeight - y);
                                        tempCtx.drawImage(
                                            canvas, 
                                            0, y, canvas.width, h,  // 源区域
                                            0, y, canvas.width, h   // 目标区域
                                        );
                                    }
                                } else {
                                    // 直接绘制整个canvas
                                    tempCtx.drawImage(canvas, 0, 0);
                                }
                                
                                // 转换为base64
                                return tempCanvas.toDataURL('image/png');
                            } catch(e) {
                                console.error('Canvas截图出错:', e);
                                return null;
                            }
                        }""", canvas)
                        
                        if canvas_data and canvas_data.startswith('data:image'):
                            # 从base64数据保存图片
                            import base64
                            try:
                                canvas_data = canvas_data.split(",")[1]
                                with open(screenshot_path, 'wb') as f:
                                    f.write(base64.b64decode(canvas_data))
                                print(f"已从JavaScript数据保存canvas完整截图到: {screenshot_path}")
                            except Exception as e:
                                print(f"从base64保存canvas图片时出错: {e}")
                        else:
                            # 备选方法：尝试截取整个iframe
                            print("无法获取canvas数据，尝试截取整个iframe...")
                            
                            # 获取iframe滚动信息
                            scroll_height = await iframe.evaluate("document.body.scrollHeight")
                            viewport_height = await iframe.evaluate("window.innerHeight")
                            print(f"滚动高度: {scroll_height}, 视口高度: {viewport_height}")
                            
                            if scroll_height > viewport_height:
                                # 是长页面，需要使用全页面截图
                                await iframe.screenshot(path=screenshot_path, full_page=True)
                                print(f"已使用full_page=True截取整个iframe长页面: {screenshot_path}")
                            else:
                                # 常规截图
                                await iframe.screenshot(path=screenshot_path)
                                print(f"已截取整个iframe作为canvas截图: {screenshot_path}")
                    except Exception as e:
                        print(f"截取canvas时出错: {e}")
                        # 备选方法：截取整个页面并标记为长页面
                        try:
                            await iframe.screenshot(path=screenshot_path, full_page=True)
                            print(f"已使用备选方法截取整个iframe (full_page): {screenshot_path}")
                        except Exception as e2:
                            print(f"备选截图方法也失败: {e2}")
                            try:
                                # 最后尝试常规截图
                                await iframe.screenshot(path=screenshot_path)
                                print(f"已使用常规截图作为最后尝试: {screenshot_path}")
                            except Exception as e3:
                                print(f"所有截图方法均失败: {e3}")
                    
                    print(f"已保存canvas截图到: {screenshot_path}")
                    
                    # 同时截取整个iframe作为参考
                    try:
                        full_screenshot_path = os.path.join(screenshots_dir, f"iframe_{current_detail_id}_{timestamp}.png")
                        await iframe.screenshot(path=full_screenshot_path)
                        print(f"已保存iframe完整截图到: {full_screenshot_path}")
                        
                        # 将截图路径添加到简历数据中
                        resume_data['canvas_screenshot'] = screenshot_path
                        resume_data['iframe_screenshot'] = full_screenshot_path
                    except Exception as e:
                        print(f"保存iframe截图时出错: {e}")
                    
                except Exception as e:
                    print(f"保存canvas截图时出错: {e}")
                
                # 使用data_extractor提取canvas内容
                print("开始OCR提取iframe中canvas内容，请等待...")
                start_time = time.time()
                
                # 设置OCR超时时间为20秒
                ocr_timeout = 20
                try:
                    print("⏳ 正在提取和解析简历内容，这可能需要10-20秒...")
                    # 使用asyncio.wait_for包装OCR处理，如果超时则抛出异常
                    page_data = await asyncio.wait_for(
                        self.processor.data_extractor.extract_from_detail_page(iframe, self.processor.selectors),
                        timeout=ocr_timeout
                    )
                except asyncio.TimeoutError:
                    print(f"⚠️ OCR处理超时，已等待{ocr_timeout}秒，跳过OCR")
                    page_data = None
                except Exception as e:
                    print(f"OCR处理发生错误: {e}")
                    page_data = None
                
                ocr_processing = False  # OCR处理完成
                
                if page_data:
                    # 合并提取的数据
                    resume_data.update(page_data)
                    print(f"✅ OCR提取完成，耗时: {time.time() - start_time:.2f}秒，从iframe中的canvas简历提取的数据: {resume_data}")
                    
                    # 标记类型为canvas简历
                    resume_data['is_canvas_resume'] = True
                else:
                    print(f"⚠️ OCR提取完成或超时，耗时: {time.time() - start_time:.2f}秒，但从iframe中的canvas提取数据失败，将继续使用卡片数据进行评估")
            # 检查iframe中是否有图片简历
            elif await iframe.query_selector('.resume-img-box, img[src*="resume"], .resume-image, .resume-picture'):
                needs_ocr = True
                ocr_processing = True
                print("在iframe中检测到图片格式简历，开始OCR提取")
                
                # 保存图片简历
                try:
                    # 创建保存目录
                    screenshots_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/screenshots")
                    os.makedirs(screenshots_dir, exist_ok=True)
                    
                    # 显示截图保存目录提示，让用户更容易找到
                    print(f"\n🖼️ 截图保存目录: {screenshots_dir}")
                    print(f"   可以通过Finder打开或终端命令: open \"{screenshots_dir}\"\n")
                    
                    # 查找简历图片元素
                    img_selectors = ['.resume-img-box img', 'img[src*="resume"]', '.resume-image img', '.resume-picture img']
                    resume_img = None
                    
                    for selector in img_selectors:
                        img = await iframe.query_selector(selector)
                        if img:
                            resume_img = img
                            break
                    
                    if resume_img:
                        # 截取图片元素
                        timestamp = int(time.time())
                        screenshot_path = os.path.join(screenshots_dir, f"img_{current_detail_id}_{timestamp}.png")
                        await resume_img.screenshot(path=screenshot_path)
                        print(f"已保存简历图片到: {screenshot_path}")
                    else:
                        # 截取整个iframe
                        timestamp = int(time.time())
                        screenshot_path = os.path.join(screenshots_dir, f"iframe_{current_detail_id}_{timestamp}.png")
                        await iframe.screenshot(path=screenshot_path)
                        print(f"未找到特定图片元素，已保存整个iframe截图: {screenshot_path}")
                    
                    # 将截图路径添加到简历数据中
                    resume_data['resume_screenshot'] = screenshot_path
                    
                except Exception as e:
                    print(f"保存简历图片时出错: {e}")
                
                # 使用data_extractor提取图片内容
                print("开始OCR提取iframe中图片内容，请等待...")
                start_time = time.time()
                
                # 设置OCR超时时间为20秒
                ocr_timeout = 20
                try:
                    print("⏳ 正在提取和解析简历内容，这可能需要10-20秒...")
                    # 使用asyncio.wait_for包装OCR处理，如果超时则抛出异常
                    page_data = await asyncio.wait_for(
                        self.processor.data_extractor.extract_from_detail_page(iframe, self.processor.selectors),
                        timeout=ocr_timeout
                    )
                except asyncio.TimeoutError:
                    print(f"⚠️ OCR处理超时，已等待{ocr_timeout}秒，跳过OCR")
                    page_data = None
                except Exception as e:
                    print(f"OCR处理发生错误: {e}")
                    page_data = None
                
                ocr_processing = False  # OCR处理完成
                
                if page_data:
                    # 合并提取的数据
                    resume_data.update(page_data)
                    print(f"✅ OCR提取完成，耗时: {time.time() - start_time:.2f}秒，从iframe中的图片简历提取的数据: {resume_data}")
                    
                    # 标记类型为图片简历
                    resume_data['is_image_resume'] = True
                else:
                    print(f"⚠️ OCR提取完成，耗时: {time.time() - start_time:.2f}秒，但从iframe中的图片简历提取数据失败，将继续使用卡片数据进行评估")
            else:
                # 提取详情页数据
                try:
                    # 使用DataExtractor提取标准数据
                    print("开始提取iframe中标准数据...")
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
                        print(f"数据提取超时，已等待{extract_timeout}秒，跳过提取")
                        page_data = None
                    except Exception as e:
                        print(f"数据提取发生错误: {e}")
                        page_data = None
                    
                    if page_data:
                        # 合并提取的数据
                        resume_data.update(page_data)
                        print(f"✅ 提取完成，耗时: {time.time() - start_time:.2f}秒，从iframe详情页提取的标准数据: {resume_data}")
                except Exception as e:
                    print(f"从iframe提取详情页数据出错: {e}")
                    
                    # 尝试使用旧方法提取
                    detail_resume_data = await self.processor.data_extractor.extract_detail_page_data(iframe, self.processor.selectors)
                    if detail_resume_data:
                        # 合并卡片数据和详情页数据
                        if card_resume_data:
                            resume_data = self.processor.data_extractor.merge_resume_data(card_resume_data, detail_resume_data)
                            print("已合并卡片数据和iframe详情页数据")
                        else:
                            resume_data = detail_resume_data
            
            # 确保OCR处理已完成
            if needs_ocr and ocr_processing:
                print("警告：OCR处理未正常完成标记，可能是发生了异常，等待2秒...")
                await asyncio.sleep(2)  # 额外等待时间，从5秒改为2秒
                
            # 确保有链接信息
            if not resume_data.get('link'):
                resume_data['link'] = parent_page.url
                
            # 如果没有足够的数据进行评估，但有卡片数据，则使用卡片数据进行评估
            if not resume_data.get('name') and card_resume_data and card_resume_data.get('name'):
                print("从iframe提取的简历数据不完整，将使用卡片数据进行评估")
                resume_data = card_resume_data.copy()
                resume_data['is_using_card_data_only'] = True
            elif not resume_data.get('name'):
                print("从iframe提取的简历数据不完整，且卡片数据也不完整，无法进行评估")
                
                # 直接按ESC键关闭详情页，不再尝试其他方法
                print("尝试使用ESC键直接关闭详情页...")
                try:
                    # 修复：确保使用父页面的keyboard而非iframe
                    await parent_page.keyboard.press('Escape')
                except Exception as e:
                    print(f"使用ESC键关闭详情页失败: {e}")
                await asyncio.sleep(0.5)  # 只等待0.5秒
                
                self.processing_detail = False
                return False
            
            # 确保原始职位数据不丢失
            if original_position and (not resume_data.get('position') or resume_data.get('position') == ""):
                print(f"使用卡片中备份的期望职位: {original_position}")
                resume_data['position'] = original_position
                
            # 使用规则引擎评估候选人
            from automation.processors.evaluation_helper import EvaluationHelper
            # 使用静态方法评估简历
            pass_filter, reject_reason = EvaluationHelper.evaluate_resume(resume_data, config)
            
            if pass_filter:
                print(f"候选人 {resume_data.get('name')} 通过筛选，准备打招呼")
                
                # 查找打招呼按钮，先在iframe内查找，添加新的选择器
                print("尝试在iframe中查找打招呼按钮...")
                iframe_selectors = [
                    self.processor.selectors.get('detailGreetButton'),
                    '.button-chat-wrap.resumeGreet .btn-v2.btn-sure-v2.btn-greet',  # 新增详情页选择器
                    '.button-chat-wrap .btn-v2.btn-sure-v2.btn-greet',
                    '.button-list .btn-v2.btn-sure-v2.btn-greet',
                    'button[class*="btn-greet"]',
                    '.btn-chat',
                    '.btn-greet',
                    '.btn.btn-greet',  # 新增卡片内选择器
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
                                print(f"在iframe中使用选择器 {selector} 找到了打招呼按钮")
                                greet_button = button
                                break
                            else:
                                print(f"iframe中按钮 {selector} 存在但不可见")
                    except Exception as e:
                        print(f"尝试iframe选择器 {selector} 时出错: {e}")
                
                # 如果iframe中没找到，尝试在父页面查找
                if not greet_button:
                    print("在iframe中未找到打招呼按钮，尝试在父页面查找...")
                    for selector in iframe_selectors:
                        if not selector:
                            continue
                        try:
                            button = await parent_page.query_selector(selector)
                            if button:
                                is_visible = await button.is_visible()
                                if is_visible:
                                    print(f"在父页面中使用选择器 {selector} 找到了打招呼按钮")
                                    greet_button = button
                                    break
                                else:
                                    print(f"父页面中按钮 {selector} 存在但不可见")
                        except Exception as e:
                            print(f"尝试父页面选择器 {selector} 时出错: {e}")
                
                if greet_button:
                    success = await self.processor.interaction_handler.greet_candidate(greet_button, resume_data)
                    self.processor.processed_ids.add(detail_id)
                    self.processor.processed_count += 1
                    # 记录打招呼的候选人
                    self.processor.log_candidate(resume_data, "greet", "关键词评分通过")
                    # 等待按钮操作完成
                    await asyncio.sleep(0.5)  # 从2秒减少到0.5秒
                    self.processing_detail = False
                    return True
                else:
                    print("在iframe和父页面中都未找到打招呼按钮")
                    
                    # 直接按ESC键关闭详情页，不再尝试其他方法
                    print("尝试使用ESC键直接关闭详情页...")
                    try:
                        # 修复：确保使用父页面的keyboard而非iframe
                        await parent_page.keyboard.press('Escape')
                    except Exception as e:
                        print(f"使用ESC键关闭详情页失败: {e}")
                    await asyncio.sleep(0.5)  # 只等待0.5秒
                    
                    self.processing_detail = False
                    return False
            else:
                print(f"候选人 {resume_data.get('name')} 未通过筛选: {reject_reason}")
                self.processor.processed_ids.add(detail_id)
                self.processor.processed_count += 1
                # 记录跳过的候选人，增加详细日志
                if "关键词评分不足" in reject_reason:
                    print(f"详细原因: {reject_reason}")
                self.processor.log_candidate(resume_data, "skip", reject_reason)
                
                # 直接按ESC键关闭详情页，不再尝试其他方法
                print("尝试使用ESC键直接关闭详情页...")
                try:
                    # 修复：确保使用父页面的keyboard而非iframe
                    await parent_page.keyboard.press('Escape')
                except Exception as e:
                    print(f"使用ESC键关闭详情页失败: {e}")
                await asyncio.sleep(0.5)  # 只等待0.5秒
                
                self.processing_detail = False
                return True
                
        except Exception as e:
            print(f"处理iframe简历详情页出错: {e}")
            import traceback
            traceback.print_exc()
            
            # 出错时尝试用ESC键关闭详情页
            try:
                print("出错后尝试使用ESC键关闭详情页...")
                # 修复：确保使用父页面的keyboard而非iframe
                try:
                    await parent_page.keyboard.press('Escape')
                except Exception as key_e:
                    print(f"使用ESC键关闭详情页失败: {key_e}")
                await asyncio.sleep(0.5)  # 只等待0.5秒
            except Exception as close_e:
                print(f"尝试关闭详情页时出错: {close_e}")
            
            self.processing_detail = False
        return False 