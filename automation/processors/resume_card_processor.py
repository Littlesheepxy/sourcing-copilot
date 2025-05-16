"""
简历卡片处理模块
负责处理单个简历卡片的功能
"""

import random
import asyncio
import re

from automation.processors.data_extractor import DataExtractor
from automation.processors.card_extractor import CardExtractor
from automation.processors.evaluation_helper import EvaluationHelper

class ResumeCardProcessor:
    """简历卡片处理器，处理单个简历卡片相关功能"""
    
    def __init__(self, resume_processor):
        """
        初始化卡片处理器
        
        Args:
            resume_processor: 父简历处理器对象
        """
        self.processor = resume_processor
        
    async def process_resume_card(self, page, card, config):
        """
        处理单个简历卡片
        
        Args:
            page: Playwright页面对象
            card: 卡片元素
            config: 规则配置
            
        Returns:
            bool: 是否处理了该卡片
        """
        try:
            # 提取卡片ID，用于去重
            card_id = await card.get_attribute('data-id')
            if not card_id:
                # 尝试使用更多属性作为备用ID
                for attr in ['id', 'data-geek', 'data-uid', 'data-index']:
                    card_id = await card.get_attribute(attr)
                    if card_id:
                        print(f"使用 {attr} 作为卡片ID: {card_id}")
                        break
                        
                # 如果仍然没有ID，使用卡片内文本作为备用ID
                if not card_id:
                    card_text = await card.text_content()
                    if card_text:
                        card_id = str(hash(card_text))
                        print(f"使用文本哈希作为卡片ID: {card_id}")
                    else:
                        card_id = str(random.randint(1000000, 9999999))
                        print(f"使用随机数作为卡片ID: {card_id}")
            
            # 检查是否已处理过该卡片
            if card_id in self.processor.processed_ids:
                print(f"卡片 {card_id} 已处理过，跳过")
                return False
                
            # 从卡片提取简历数据
            data_extractor = DataExtractor()
            resume_data = {}
            
            # 确定卡片元素的选择器
            card_selector = None
            if card_id:
                # 尝试构建精确的选择器
                for attr in ['data-id', 'id', 'data-geek', 'data-uid', 'data-index']:
                    attr_value = await card.get_attribute(attr)
                    if attr_value:
                        card_selector = f'[{attr}="{attr_value}"]'
                        break
            
            if not card_selector:
                # 打印警告并尝试构建相对选择器
                print("无法构建精确的卡片选择器，将使用卡片元素直接提取数据")
            
            # 提取卡片数据 - 只用于阶段1和阶段2的筛选
            if card_selector:
                resume_data = await data_extractor.extract_resume_card_data(page, card_selector, self.processor.selectors)
                print("\n===== 通过选择器提取到的卡片数据 =====")
            else:
                # 直接从卡片元素提取数据，不依赖选择器
                resume_data = await CardExtractor.extract_data_from_card_element(card)
                print("\n===== 直接从元素提取到的卡片数据 =====")
                
            if not resume_data:
                print(f"未能从卡片提取数据，跳过")
                return False
                
            # 检查职位字段是否有效，如果不是有效的职位信息，尝试从完整文本中提取
            if not resume_data.get('position') or re.search(r'^\d+岁|\d+年|离职|在职|本科|大专|硕士', resume_data.get('position', '')):
                print(f"职位信息已清理: \"{resume_data.get('position', '')}\" -> \"\"")
                resume_data['position'] = ""  # 清除无效的职位信息
                
                # 尝试从完整文本中提取职位信息
                if resume_data.get('fullText'):
                    # 尝试查找"期望："后面的文本作为职位
                    position_match = re.search(r'期望：\s*([^\n\r]+)', resume_data.get('fullText'))
                    if position_match:
                        position_text = position_match.group(1).strip()
                        # 再次清理提取的文本，确保是有效的职位信息
                        if not re.search(r'^\d+岁|\d+年|离职|在职|本科|大专|硕士', position_text):
                            resume_data['position'] = position_text
                            print(f"从全文中提取到职位信息: {position_text}")
                
            # 打印完整的提取结果，方便调试
            print(f"提取结果 - 卡片ID: {card_id}")
            print(f"姓名: {resume_data.get('name', '未提取')}")
            print(f"职位: {resume_data.get('position', '未提取')}")
            print(f"公司: {resume_data.get('company', '未提取')}")
            print(f"教育: {resume_data.get('education', '未提取')}")
            print(f"学校: {resume_data.get('schools', '未提取')}")
            print(f"技能: {resume_data.get('skills', '未提取')}")
            if resume_data.get('fullText'):
                print(f"完整文本预览: {resume_data.get('fullText', '')[:100]}...")
            print("=====================================\n")
            
            # 保存当前页面URL（作为链接）
            resume_data['link'] = page.url
                
            # 使用规则引擎进行阶段1和阶段2的评估
            # 只检查期望职位和过往公司，不进行关键词打分
            print(f"候选人 {resume_data.get('name')}: 开始评估期望职位和过往公司")
            evaluation = EvaluationHelper.evaluate_card_stage(resume_data, config)
            
            # 如果阶段1或阶段2未通过，则直接跳过
            if evaluation.get("action") == "skip":
                print(f"候选人 {resume_data.get('name')} 未通过卡片阶段筛选: {evaluation.get('rejectReason')}")
                self.processor.processed_ids.add(card_id)
                # 记录跳过的候选人
                self.processor.log_candidate(resume_data, "skip", evaluation.get('rejectReason', ''))
                return True
                
            # 如果是竞对公司（阶段2通过），直接打招呼
            if evaluation.get("stageResult", {}).get("competitorCompany"):
                print(f"候选人 {resume_data.get('name')} 来自竞对公司，直接打招呼")
                greet_button = await card.query_selector(
                    self.processor.selectors.get('greetButton') or 
                    '.btn.btn-greet' or
                    'button[class*="btn-greet"]' or
                    '.start-chat-btn' or 
                    '.btn-greet' or
                    'button:has-text("打招呼")'
                )
                
                if greet_button:
                    success = await self.processor.interaction_handler.greet_candidate(greet_button, resume_data)
                    self.processor.processed_ids.add(card_id)
                    # 记录打招呼的候选人
                    self.processor.log_candidate(resume_data, "greet", "来自竞对公司")
                    return True
                else:
                    print("未找到打招呼按钮")
                    return False
            
            # 阶段1和阶段2通过，但不是竞对公司，需要查看详情页进行关键词评分
            print(f"候选人 {resume_data.get('name')} 通过卡片阶段筛选，需查看详情页进行关键词评分")

            # 点击前预处理页面
            try:
                # 尝试清除可能的遮罩层和弹窗
                await page.evaluate("""
                    // 清除遮罩层
                    document.querySelectorAll('.overlay, .mask, .modal-backdrop, [class*="mask"], [class*="overlay"]').forEach(el => {
                        el.style.display = 'none';
                        el.remove();
                    });
                    
                    // 关闭所有对话框
                    document.querySelectorAll('.dialog-wrap, .dialog, .modal, .popup, [data-type="boss-dialog"]').forEach(dialog => {
                        if(dialog.classList.contains('active')) {
                            dialog.classList.remove('active');
                            dialog.style.display = 'none';
                        }
                    });
                    
                    // 确保指针事件正常工作
                    document.querySelectorAll('body *').forEach(el => {
                        el.style.pointerEvents = 'auto';
                    });
                """)
                print("已尝试清除页面遮罩和对话框")
            except Exception as e:
                print(f"清除页面遮罩和对话框时出错: {e}")

            # 尝试点击卡片进入详情页
            try:
                # 尝试找到卡片中的链接或可点击区域
                card_link = await card.query_selector("a") or card
                
                # 点击进入详情页 - 增加重试和错误处理
                try:
                    # 使用JavaScript强制点击
                    await page.evaluate("""
                        (element) => {
                            element.click();
                        }
                    """, card_link)
                    print(f"已使用JavaScript点击卡片")
                except Exception as js_error:
                    print(f"JavaScript点击失败: {js_error}，尝试常规点击方法")
                    try:
                        await card_link.click(timeout=5000)  # 设置更短的超时时间
                        print(f"已点击卡片进入详情页")
                    except Exception as click_error:
                        print(f"常规点击方法失败: {click_error}，尝试其他方法")
                        # 尝试使用hover后点击
                        await card_link.hover()
                        await asyncio.sleep(0.5)
                        await page.keyboard.press('Enter')
                        print(f"已使用hover+Enter方式尝试进入详情页")
                
                # 等待详情页加载
                await asyncio.sleep(2)
                
                # 检查详情页iframe
                detail_iframe = None
                try:
                    # 尝试查找简历详情iframe
                    iframe_selectors = [
                        'iframe[src*="c-resume"]',
                        'iframe[src*="resumeDetail"]',
                        'iframe[src*="detail"]',
                        'iframe[src*="frame/c-resume"]',
                        'iframe[src^="https://www.zhipin.com/web/frame/c-resume"]',
                        'iframe'
                    ]
                    
                    # 尝试修复iframe拦截问题
                    try:
                        await page.evaluate("""
                            // 将所有iframe的pointer-events设置为none，解决点击拦截
                            document.querySelectorAll('iframe').forEach(iframe => {
                                iframe.style.pointerEvents = 'none';
                            });
                            
                            // 将对话框的z-index降低，避免拦截
                            document.querySelectorAll('[data-type="boss-dialog"]').forEach(dialog => {
                                dialog.style.zIndex = '0';
                            });
                        """)
                        print("已尝试修复iframe指针事件拦截问题")
                    except Exception as e:
                        print(f"修复iframe指针事件拦截时出错: {e}")
                    
                    for selector in iframe_selectors:
                        iframe_element = await page.query_selector(selector)
                        if iframe_element:
                            iframe_src = await iframe_element.get_attribute('src')
                            print(f"找到详情页iframe: {selector}, src: {iframe_src}")
                            
                            # 处理潜在的iframe拦截问题
                            try:
                                # 设置此iframe元素的pointer-events为none
                                await page.evaluate("""
                                    (element) => {
                                        element.style.pointerEvents = 'none';
                                    }
                                """, iframe_element)
                            except Exception as e:
                                print(f"设置iframe pointer-events时出错: {e}")
                                
                            detail_iframe = await iframe_element.content_frame()
                            if detail_iframe:
                                print("成功加载详情页iframe内容")
                                # 直接调用处理详情页iframe的方法
                                detail_processed = await self.processor.process_detail_page_iframe(detail_iframe, page, config, resume_data)
                                
                                # 等待详情页处理完成（检查OCR是否完成）
                                max_wait = 5  # 最长等待5秒，从60秒降低为5秒
                                wait_count = 0
                                while self.processor.detail_processor.processing_detail and wait_count < max_wait:
                                    print(f"⏳ 等待详情页处理完成... ({wait_count}/{max_wait}秒)")
                                    await asyncio.sleep(1)
                                    wait_count += 1
                                
                                if wait_count >= max_wait:
                                    print("⚠️ 等待详情页处理超时（5秒），强制继续")
                                else:
                                    print(f"✅ 详情页处理已完成，用时 {wait_count} 秒")
                                
                                # 标记为已处理
                                self.processor.processed_ids.add(card_id)
                                return True
                except Exception as e:
                    print(f"查找详情页iframe时出错: {e}")
                
                # 提取详情页URL，检查是否成功跳转
                current_url = page.url
                if "detail" not in current_url and "resumeDetail" not in current_url:
                    # 再次尝试检查iframe
                    try:
                        all_frames = page.frames
                        for frame in all_frames:
                            frame_url = frame.url
                            if "c-resume" in frame_url or "detail" in frame_url:
                                print(f"在frame中找到详情页URL: {frame_url}")
                                # 使用找到的frame处理详情页
                                detail_processed = await self.processor.process_detail_page_iframe(frame, page, config, resume_data)
                                
                                # 等待详情页处理完成（检查OCR是否完成）
                                max_wait = 5  # 最长等待5秒，从60秒降低为5秒
                                wait_count = 0
                                while self.processor.detail_processor.processing_detail and wait_count < max_wait:
                                    print(f"⏳ 等待详情页处理完成... ({wait_count}/{max_wait}秒)")
                                    await asyncio.sleep(1)
                                    wait_count += 1
                                
                                if wait_count >= max_wait:
                                    print("⚠️ 等待详情页处理超时（5秒），强制继续")
                                else:
                                    print(f"✅ 详情页处理已完成，用时 {wait_count} 秒")
                                
                                # 标记为已处理
                                self.processor.processed_ids.add(card_id)
                                return True
                    except Exception as e:
                        print(f"检查所有frames时出错: {e}")
                        
                    print("点击卡片后未能正确跳转到详情页")
                    self.processor.processed_ids.add(card_id)
                    return False
                
                # 调用详情页处理方法
                print("调用详情页处理方法")
                detail_processed = await self.processor.process_detail_page(page, config, resume_data)
                
                # 等待详情页处理完成（检查OCR是否完成）
                max_wait = 5  # 最长等待5秒，从60秒降低为5秒
                wait_count = 0
                while self.processor.detail_processor.processing_detail and wait_count < max_wait:
                    print(f"⏳ 等待详情页处理完成... ({wait_count}/{max_wait}秒)")
                    await asyncio.sleep(1)
                    wait_count += 1
                
                if wait_count >= max_wait:
                    print("⚠️ 等待详情页处理超时（5秒），强制继续")
                else:
                    print(f"✅ 详情页处理已完成，用时 {wait_count} 秒")
                
                # 标记为已处理
                self.processor.processed_ids.add(card_id)
                
                return True
                
            except Exception as e:
                print(f"点击卡片进入详情页时出错: {e}")
                import traceback
                traceback.print_exc()
                self.processor.processed_ids.add(card_id)
                return False
                
        except Exception as e:
            print(f"处理简历卡片出错: {e}")
            import traceback
            traceback.print_exc()
            
        return False 