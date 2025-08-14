"""
简历页面处理模块
负责处理推荐列表页面的逻辑
"""

import asyncio
import random

class ResumePageProcessor:
    """简历页面处理器，处理简历列表页面"""
    
    # 常量定义
    BATCH_SIZE = 15  # Boss直聘一批次加载15个候选人
    
    def __init__(self, resume_processor):
        """
        初始化页面处理器
        
        Args:
            resume_processor: 父简历处理器对象
        """
        self.processor = resume_processor
        
    async def process_recommend_list_page(self, page, config):
        """
        处理推荐列表页
        
        Args:
            page: Playwright页面对象
            config: 规则配置
            
        Returns:
            int: 处理的简历数量
        """
        # 设置处理状态
        self.processor.is_processing = True
        start_count = self.processor.processed_count
        max_retries = 3  # 最大重试次数
        retry_count = 0
        empty_page_count = 0  # 连续空页面计数
        max_empty_pages = 3   # 最大允许的连续空页面数
        no_new_card_count = 0  # 连续无新卡片计数
        max_no_new_cards = 3  # 最大允许的连续无新卡片次数
        processed_batches = 0  # 已处理批次数
        total_greeted = 0     # 总共打招呼人数
        total_processed_pages = 0  # 总共处理的页面数
        
        # 获取已打招呼的总数
        greeted_count = 0
        for log in self.processor.get_candidates_log():
            if log.get('action') == 'greet':
                greeted_count += 1
                
        print(f"当前已打招呼数量: {greeted_count}")
        
        while retry_count < max_retries and self.processor.is_processing:
            try:
                # 检查停止信号 - 增加browser_manager的检查
                if hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running'):
                    if not self.processor.browser.is_running:
                        print("检测到browser_manager停止信号，停止处理")
                        self.processor.is_processing = False
                        break
                
                total_processed_pages += 1
                print(f"\n===== 开始处理第 {total_processed_pages} 页推荐列表 (批次 {processed_batches + 1}) =====")
                
                # 滚动到页面顶部，确保从头开始处理
                try:
                    await page.evaluate("window.scrollTo(0, 0)")
                except Exception as scroll_err:
                    print(f"页面滚动出错，尝试刷新页面: {scroll_err}")
                    await page.reload()
                    await asyncio.sleep(2)
                    # 重试滚动
                    await page.evaluate("window.scrollTo(0, 0)")
                
                # 随机短暂延迟，模拟人类行为
                await asyncio.sleep(random.uniform(0.5, 1.5))
                
                # 检查页面是否包含iframe
                iframe = None
                try:
                    # 尝试查找推荐牛人iframe
                    iframe_selectors = [
                        'iframe[name="recommendFrame"]',
                        'iframe[src*="frame/recommend"]',
                        'iframe[src*="web/frame/recommend"]',
                        'iframe[data-v-16429d95]', 
                        'iframe[src*="recommend"]', 
                        'iframe[id*="recommend"]',
                        'iframe[class*="recommend"]',
                        'iframe'
                    ]
                    
                    for selector in iframe_selectors:
                        iframe_element = await page.query_selector(selector)
                        if iframe_element:
                            iframe_src = await iframe_element.get_attribute('src')
                            print(f"找到iframe: {selector}, src: {iframe_src}")
                            iframe = await iframe_element.content_frame()
                            if iframe:
                                print("成功获取iframe内容框架")
                                break
                    
                    if not iframe:
                        print("页面中没有找到iframe，将在主页面中查找卡片")
                except Exception as e:
                    print(f"检查iframe时出错: {e}")
                
                # 使用正确的页面对象（可能是iframe或主页面）
                target_page = iframe if iframe else page
                
                # 获取推荐卡片元素
                card_selectors = [
                    self.processor.selectors.get('resumeCard', '.card-list .card-item'), # 默认选择器
                    '.recommend-list .recommend-item',                       # 推荐列表项
                    '.card-list .card-item',                                 # 卡片列表项
                    '.geek-list .geek-item',                                 # 牛人列表项
                    '.user-list .user-item',                                 # 用户列表项
                    '.list-wrap .list-item',                                 # 通用列表项
                    '.card'                                                  # 通用卡片
                ]
                
                cards = []
                for selector in card_selectors:
                    try:
                        card_elements = await target_page.query_selector_all(selector)
                        if card_elements and len(card_elements) > 0:
                            print(f"找到 {len(card_elements)} 个推荐卡片，使用选择器: {selector}")
                            cards = card_elements
                            break
                    except Exception as e:
                        print(f"使用选择器 {selector} 查找卡片时出错: {e}")
                
                # 如果找到了卡片，处理每一个卡片
                if cards and len(cards) > 0:
                    total_cards = len(cards)
                    print(f"开始处理 {total_cards} 个推荐卡片")
                    
                    # 检测是否是一个新批次
                    if total_cards >= self.BATCH_SIZE - 3:  # 允许有小误差
                        current_batch = processed_batches + 1
                        print(f"检测到第 {current_batch} 批次，预计有约 {self.BATCH_SIZE} 个候选人")
                    else:
                        print(f"当前批次中还有 {total_cards} 个候选人待处理")
                    
                    # 重置连续空页面计数
                    empty_page_count = 0
                    
                    # 记录当前已处理数量
                    before_processed_count = self.processor.processed_count
                    before_greeted_count = greeted_count
                    
                    # 逐个处理卡片
                    for i, card in enumerate(cards):
                        # 检查停止信号 - 增强停止检查
                        if not self.processor.is_processing:
                            print("处理被用户取消，停止处理")
                            return self.processor.processed_count - start_count
                            
                        # 检查browser_manager的停止信号
                        if hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running'):
                            if not self.processor.browser.is_running:
                                print("检测到browser_manager停止信号，停止处理")
                                self.processor.is_processing = False
                                return self.processor.processed_count - start_count
                        
                        # 更新总共打招呼数量
                        current_greeted = 0
                        for log in self.processor.get_candidates_log():
                            if log.get('action') == 'greet':
                                current_greeted += 1
                        
                        greeted_count = current_greeted
                        
                        # 如果处理足够多的简历或用户取消，则退出
                        if (self.processor.max_process_count > 0 and 
                            greeted_count >= self.processor.max_process_count):
                            print(f"已达到目标打招呼数量: {greeted_count}/{self.processor.max_process_count}，停止处理")
                            return self.processor.processed_count - start_count
                        
                        # 计算当前卡片在当前批次中的索引
                        batch_index = (before_processed_count + i) % self.BATCH_SIZE
                        print(f"\n===== 开始处理第 {i+1}/{total_cards} 个卡片 (批次 {processed_batches + 1} 中的第 {batch_index + 1} 个) =====")
                            
                        # 确保没有正在进行的详情页处理（加强检查）
                        if self.processor.is_detail_page_processing():
                            print("⚠️ 检测到详情页处理未完成，等待处理完成...")
                            # 停止所有滚动操作，等待详情页处理完成
                            max_wait = 60  # 最长等待60秒
                            wait_count = 0
                            while self.processor.is_detail_page_processing() and wait_count < max_wait:
                                # 在等待期间也要检查停止信号
                                if not self.processor.is_processing:
                                    print("等待详情页处理时收到停止信号，停止处理")
                                    return self.processor.processed_count - start_count
                                    
                                if hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running'):
                                    if not self.processor.browser.is_running:
                                        print("等待详情页处理时检测到browser_manager停止信号，停止处理")
                                        self.processor.is_processing = False
                                        return self.processor.processed_count - start_count
                                
                                if wait_count % 5 == 0:  # 每5秒打印一次
                                    print(f"等待详情页处理完成... ({wait_count}秒)")
                                await asyncio.sleep(1)
                                wait_count += 1
                            
                            if wait_count >= max_wait:
                                print("等待详情页处理超时，强制继续")
                            else:
                                print(f"✅ 详情页处理已完成，等待时间: {wait_count} 秒")
                        
                        # 打印进度信息
                        print(f"当前进度: 已处理 {self.processor.processed_count} 个简历，已打招呼 {greeted_count} 人")
                        if self.processor.max_process_count > 0:
                            print(f"目标打招呼数量: {self.processor.max_process_count}，还需 {max(0, self.processor.max_process_count - greeted_count)} 人")
                        
                        # 处理单个卡片 - 这里可能会进入详情页
                        try:
                            print(f"🎯 开始处理卡片...")
                            processed = await self.processor.process_resume_card(target_page, card, config)
                            if processed:
                                self.processor.processed_count += 1
                                print(f"✅ 已处理 {self.processor.processed_count} 个卡片，总数: {len(self.processor.processed_ids)}")
                                
                                # 卡片处理完成后，检查是否进入了详情页，如果是则等待详情页完成
                                if self.processor.is_detail_page_processing():
                                    print("🔄 卡片处理触发了详情页访问，等待详情页处理完成...")
                                    max_detail_wait = 60  # 最长等待60秒
                                    detail_wait_count = 0
                                    while self.processor.is_detail_page_processing() and detail_wait_count < max_detail_wait:
                                        # 在等待期间检查停止信号
                                        if not self.processor.is_processing:
                                            print("等待详情页处理时收到停止信号，停止处理")
                                            return self.processor.processed_count - start_count
                                            
                                        if hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running'):
                                            if not self.processor.browser.is_running:
                                                print("等待详情页处理时检测到browser_manager停止信号，停止处理")
                                                self.processor.is_processing = False
                                                return self.processor.processed_count - start_count
                                        
                                        if detail_wait_count % 3 == 0:  # 每3秒打印一次
                                            print(f"⏳ 等待详情页处理完成... ({detail_wait_count}秒)")
                                        await asyncio.sleep(1)
                                        detail_wait_count += 1
                                    
                                    if detail_wait_count >= max_detail_wait:
                                        print("⚠️ 等待详情页处理超时，强制继续")
                                    else:
                                        print(f"✅ 详情页处理已完成，用时: {detail_wait_count} 秒")
                        except Exception as e:
                            print(f"处理卡片时出错: {e}")
                            import traceback
                            traceback.print_exc()
                        
                        # 临时停顿，避免频繁操作，为每个卡片添加随机延迟
                        await asyncio.sleep(random.uniform(0.3, 0.8))
                        
                        # 如果是批次中的最后几个卡片，准备触发滚动加载下一批
                        remaining_in_batch = total_cards - (i + 1)
                        if remaining_in_batch <= 3 and i >= 10:  # 至少处理10个且剩余少于3个时
                            print(f"接近当前批次末尾，还剩 {remaining_in_batch} 个卡片")
                    
                    # 检查本页是否有新卡片被处理或打了招呼
                    after_processed_count = self.processor.processed_count
                    
                    # 更新最新的打招呼数量
                    after_greeted_count = 0
                    for log in self.processor.get_candidates_log():
                        if log.get('action') == 'greet':
                            after_greeted_count += 1
                    
                    new_processed = after_processed_count - before_processed_count
                    new_greeted = after_greeted_count - before_greeted_count
                    
                    print(f"本批处理统计: 新处理 {new_processed} 个候选人，新打招呼 {new_greeted} 人")
                    
                    # 更新已处理批次计数
                    if new_processed > 0 and new_processed >= total_cards * 0.7:  # 如果处理了当前页面70%以上的卡片
                        processed_batches += 1
                        print(f"批次 {processed_batches} 处理完成")
                    
                    if new_processed == 0:
                        no_new_card_count += 1
                        print(f"连续 {no_new_card_count}/{max_no_new_cards} 页没有新的候选人被处理")
                    else:
                        no_new_card_count = 0
                    
                    # 如果连续多页没有新的候选人，考虑结束处理
                    if no_new_card_count >= max_no_new_cards:
                        print(f"已连续 {no_new_card_count} 页没有新的候选人被处理，可能已浏览完所有有效候选人")
                        print(f"总计: 处理了 {self.processor.processed_count} 个候选人，打招呼 {after_greeted_count} 人，共 {processed_batches} 批次")
                        return self.processor.processed_count - start_count
                    
                    # 处理完当前页的卡片后，尝试滚动加载更多
                    if self.processor.is_processing:
                        # 再次检查browser_manager的停止信号
                        if hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running'):
                            if not self.processor.browser.is_running:
                                print("检测到browser_manager停止信号，停止滚动操作")
                                self.processor.is_processing = False
                                return self.processor.processed_count - start_count
                        
                        # 确保详情页处理已完成
                        if self.processor.is_detail_page_processing():
                            print("执行滚动前，等待详情页处理完成...")
                            # 等待详情页处理完成
                            max_wait = 30  # 最长等待30秒
                            wait_count = 0
                            while self.processor.is_detail_page_processing() and wait_count < max_wait:
                                # 在等待期间检查停止信号
                                if not self.processor.is_processing:
                                    print("等待详情页处理时收到停止信号，停止处理")
                                    return self.processor.processed_count - start_count
                                    
                                if hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running'):
                                    if not self.processor.browser.is_running:
                                        print("等待详情页处理时检测到browser_manager停止信号，停止处理")
                                        self.processor.is_processing = False
                                        return self.processor.processed_count - start_count
                                
                                if wait_count % 5 == 0:  # 每5秒打印一次
                                    print(f"等待详情页处理完成... ({wait_count}秒)")
                                await asyncio.sleep(1)
                                wait_count += 1
                            
                            if wait_count >= max_wait:
                                print("等待详情页处理超时，强制继续")
                            else:
                                print(f"详情页处理已完成，等待时间: {wait_count} 秒")
                        
                        # 尝试滚动加载更多卡片
                        print(f"尝试滚动加载更多卡片，准备加载第 {processed_batches + 1} 批次")
                        has_more = await self.processor._go_to_next_page(target_page)
                        if has_more:
                            # 等待新卡片加载，为批量加载添加更长的等待时间
                            load_wait = random.uniform(2.5, 4.0)
                            print(f"正在等待新批次加载... ({load_wait:.1f}秒)")
                            await asyncio.sleep(load_wait)
                            
                            # 递归处理新加载的卡片
                            print(f"已加载更多卡片，继续处理第 {processed_batches + 1} 批次")
                            return await self.process_recommend_list_page(page, config)
                        else:
                            print("没有更多卡片可加载，尝试刷新页面后再试")
                            try:
                                # 添加随机延迟模拟人类行为
                                await asyncio.sleep(random.uniform(1.0, 2.0))
                                await page.reload()
                                await asyncio.sleep(random.uniform(2.0, 3.5))  # 等待页面加载
                                return await self.process_recommend_list_page(page, config)
                            except Exception as e:
                                print(f"刷新页面出错: {e}")
                                return self.processor.processed_count - start_count
                else:
                    # 未找到卡片，尝试通过滚动加载或者重试
                    print("本页未找到有效的候选人卡片")
                    empty_page_count += 1
                    
                    if empty_page_count >= max_empty_pages:
                        print(f"已连续 {empty_page_count} 页未找到卡片，可能已浏览完所有候选人")
                        
                        # 更新最终打招呼数量
                        final_greeted_count = 0
                        for log in self.processor.get_candidates_log():
                            if log.get('action') == 'greet':
                                final_greeted_count += 1
                        
                        print(f"总计: 处理了 {self.processor.processed_count} 个候选人，打招呼 {final_greeted_count} 人，共 {processed_batches} 批次")
                        return self.processor.processed_count - start_count
                    
                    # 尝试滚动页面加载更多
                    print(f"尝试滚动加载更多卡片 (空页面计数: {empty_page_count}/{max_empty_pages})")
                    has_more = await self.processor._go_to_next_page(target_page)
                    if has_more:
                        # 等待新卡片加载，添加随机延迟
                        await asyncio.sleep(random.uniform(2.0, 3.5))
                        # 重置连续空页面计数
                        empty_page_count = 0
                        # 递归处理新加载的卡片
                        return await self.process_recommend_list_page(page, config)
                    else:
                        # 刷新页面再试
                        print("未找到卡片且无法滚动加载更多，尝试刷新页面")
                        retry_count += 1
                        if retry_count < max_retries:
                            try:
                                await asyncio.sleep(random.uniform(1.0, 2.0))
                                await page.reload()
                                await asyncio.sleep(random.uniform(2.0, 3.0))  # 等待页面加载
                                print(f"已刷新页面，重试第 {retry_count}/{max_retries} 次")
                            except Exception as e:
                                print(f"刷新页面出错: {e}")
                        else:
                            print(f"已达到最大重试次数: {max_retries}，停止处理")
                            
                            # 更新最终打招呼数量
                            final_greeted_count = 0
                            for log in self.processor.get_candidates_log():
                                if log.get('action') == 'greet':
                                    final_greeted_count += 1
                            
                            print(f"总计: 处理了 {self.processor.processed_count} 个候选人，打招呼 {final_greeted_count} 人，共 {processed_batches} 批次")
                            return self.processor.processed_count - start_count
            except Exception as e:
                print(f"处理推荐列表页出错: {e}")
                import traceback
                traceback.print_exc()
                
                retry_count += 1
                if retry_count < max_retries:
                    print(f"发生错误，重试第 {retry_count}/{max_retries} 次")
                    await asyncio.sleep(random.uniform(1.5, 2.5))
                else:
                    print(f"已达到最大重试次数: {max_retries}，停止处理")
                    
                    # 更新最终打招呼数量
                    final_greeted_count = 0
                    for log in self.processor.get_candidates_log():
                        if log.get('action') == 'greet':
                            final_greeted_count += 1
                    
                    print(f"总计: 处理了 {self.processor.processed_count} 个候选人，打招呼 {final_greeted_count} 人，共 {processed_batches} 批次")
                    return self.processor.processed_count - start_count
        
        # 更新最终打招呼数量
        final_greeted_count = 0
        for log in self.processor.get_candidates_log():
            if log.get('action') == 'greet':
                final_greeted_count += 1
        
        print(f"处理完毕: 总共处理了 {self.processor.processed_count} 个候选人，打招呼 {final_greeted_count} 人，共 {processed_batches} 批次")
        return self.processor.processed_count - start_count 