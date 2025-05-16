"""
简历页面处理模块
负责处理推荐列表页面的逻辑
"""

import asyncio

class ResumePageProcessor:
    """简历页面处理器，处理简历列表页面"""
    
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
        
        while retry_count < max_retries and self.processor.is_processing:
            try:
                # 滚动到页面顶部，确保从头开始处理
                try:
                    await page.evaluate("window.scrollTo(0, 0)")
                except Exception as scroll_err:
                    print(f"页面滚动出错，尝试刷新页面: {scroll_err}")
                    await page.reload()
                    await asyncio.sleep(2)
                    # 重试滚动
                    await page.evaluate("window.scrollTo(0, 0)")
                
                await asyncio.sleep(1)
                
                # 检查页面是否包含iframe
                iframe = None
                try:
                    # 尝试查找推荐牛人iframe
                    iframe_selectors = [
                        'iframe[src*="recommend"]', 
                        'iframe[src*="frame/recommend"]',
                        'iframe[src*="web/frame/recommend"]',
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
                    print(f"开始处理 {len(cards)} 个推荐卡片")
                    
                    # 逐个处理卡片
                    for i, card in enumerate(cards):
                        # 如果处理足够多的简历或用户取消，则退出
                        if (self.processor.max_process_count > 0 and 
                            self.processor.processed_count - start_count >= self.processor.max_process_count):
                            print(f"已达到处理数量上限: {self.processor.max_process_count}，停止处理")
                            break
                            
                        if not self.processor.is_processing:
                            print("处理被用户取消，停止处理")
                            break
                            
                        # 确保没有正在进行的OCR处理
                        if self.processor.is_detail_page_processing():
                            print("检测到详情页处理未完成，等待OCR分析完成...")
                            # 等待详情页处理完成
                            max_wait = 60  # 最长等待60秒
                            wait_count = 0
                            while self.processor.is_detail_page_processing() and wait_count < max_wait:
                                if wait_count % 5 == 0:  # 每5秒打印一次
                                    print(f"等待详情页OCR处理完成... ({wait_count}秒)")
                                await asyncio.sleep(1)
                                wait_count += 1
                            
                            if wait_count >= max_wait:
                                print("等待详情页处理超时，强制继续")
                            else:
                                print(f"详情页处理已完成，等待时间: {wait_count} 秒")
                            
                        print(f"\n===== 开始处理第 {i+1}/{len(cards)} 个卡片 =====")
                        
                        # 处理单个卡片
                        try:
                            processed = await self.processor.process_resume_card(target_page, card, config)
                            if processed:
                                self.processor.processed_count += 1
                                print(f"已处理 {self.processor.processed_count} 个卡片，总数: {len(self.processor.processed_ids)}")
                        except Exception as e:
                            print(f"处理卡片时出错: {e}")
                            import traceback
                            traceback.print_exc()
                        
                        # 临时停顿，避免频繁操作
                        await asyncio.sleep(0.5)
                        
                    # 处理完当前页的卡片后，尝试滚动加载更多
                    if self.processor.is_processing:
                        # 查找已处理的卡片，避免重复处理
                        processed_selectors = []
                        for card_id in self.processor.processed_ids:
                            processed_selectors.append(f'[data-id="{card_id}"]')
                            processed_selectors.append(f'[data-geek="{card_id}"]')
                            processed_selectors.append(f'[data-uid="{card_id}"]')
                            processed_selectors.append(f'[id="{card_id}"]')
                        
                        # 构建JavaScript来获取未处理的卡片数量
                        js_check_unprocessed = f'''
                            () => {{
                                const selectors = [
                                    '.card-list .card-item',
                                    '.recommend-list .recommend-item',
                                    '.geek-list .geek-item',
                                    '.user-list .user-item',
                                    '.list-wrap .list-item',
                                    '.card'
                                ];
                                
                                // 已处理的卡片选择器
                                const processedSelectors = {processed_selectors};
                                
                                // 查找页面上所有卡片
                                let allCards = [];
                                for (const selector of selectors) {{
                                    const cards = document.querySelectorAll(selector);
                                    if (cards && cards.length > 0) {{
                                        allCards = Array.from(cards);
                                        break;
                                    }}
                                }}
                                
                                // 计算未处理的卡片数量
                                let unprocessedCount = 0;
                                for (const card of allCards) {{
                                    let isProcessed = false;
                                    for (const processedSelector of processedSelectors) {{
                                        if (card.matches(processedSelector)) {{
                                            isProcessed = true;
                                            break;
                                        }}
                                    }}
                                    if (!isProcessed) {{
                                        unprocessedCount++;
                                    }}
                                }}
                                
                                return {{
                                    totalCards: allCards.length,
                                    unprocessedCards: unprocessedCount
                                }};
                            }}
                        '''
                        
                        try:
                            # 确保详情页处理已完成
                            if self.processor.is_detail_page_processing():
                                print("执行下一步前，等待详情页OCR分析完成...")
                                # 等待详情页处理完成
                                max_wait = 30  # 最长等待30秒
                                wait_count = 0
                                while self.processor.is_detail_page_processing() and wait_count < max_wait:
                                    if wait_count % 5 == 0:  # 每5秒打印一次
                                        print(f"等待详情页OCR处理完成... ({wait_count}秒)")
                                    await asyncio.sleep(1)
                                    wait_count += 1
                                
                                if wait_count >= max_wait:
                                    print("等待详情页处理超时，强制继续")
                                else:
                                    print(f"详情页处理已完成，等待时间: {wait_count} 秒")
                                    
                            card_stats = await target_page.evaluate(js_check_unprocessed)
                            print(f"页面卡片统计: 总数 {card_stats['totalCards']}, 未处理 {card_stats['unprocessedCards']}")
                            
                            # 如果还有未处理的卡片，不需要滚动加载更多
                            if card_stats['unprocessedCards'] > 0:
                                print(f"页面上还有 {card_stats['unprocessedCards']} 个未处理的卡片，继续处理当前页面")
                                return await self.process_recommend_list_page(page, config)
                            
                            # 尝试滚动加载更多卡片
                            has_more = await self.processor._go_to_next_page(target_page)
                            if has_more:
                                # 等待新卡片加载
                                await asyncio.sleep(2)
                                # 递归处理新加载的卡片
                                return await self.process_recommend_list_page(page, config)
                            else:
                                print("没有更多卡片可加载，处理完成")
                        except Exception as e:
                            print(f"检查未处理卡片数量时出错: {e}")
                            import traceback
                            traceback.print_exc()
                else:
                    print("未找到任何推荐卡片，请检查页面结构或选择器配置")
                    # 尝试刷新页面重试
                    if retry_count < max_retries - 1:
                        print(f"将尝试刷新页面并重试 (尝试 {retry_count + 1}/{max_retries})")
                        await page.reload()
                        await asyncio.sleep(3)  # 等待页面加载
                        retry_count += 1
                        continue
                    
                return self.processor.processed_count - start_count
                
            except Exception as e:
                retry_count += 1
                print(f"处理推荐列表页出错: {e}")
                import traceback
                traceback.print_exc()
                
                if retry_count < max_retries:
                    # 检查是否是连接关闭错误
                    error_str = str(e).lower()
                    if "connection closed" in error_str or "failed to fetch" in error_str:
                        print(f"检测到连接关闭错误，正在尝试重新连接和刷新页面 (尝试 {retry_count}/{max_retries})...")
                        try:
                            # 尝试刷新页面或重新加载
                            await page.reload()
                            await asyncio.sleep(3)  # 等待页面加载
                        except Exception as reload_err:
                            print(f"刷新页面时出错: {reload_err}")
                            # 如果刷新失败，跳出循环
                            break
                    else:
                        # 其他类型的错误
                        print(f"将尝试重试处理 (尝试 {retry_count}/{max_retries})")
                        await asyncio.sleep(2)
                else:
                    print(f"处理失败，达到最大重试次数 {max_retries}")
                    break
        
        self.processor.is_processing = False
        return self.processor.processed_count - start_count 