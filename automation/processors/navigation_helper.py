"""
导航助手模块
负责页面导航、滚动、关闭弹窗等操作
"""

import asyncio
import random

class NavigationHelper:
    """导航助手类，处理页面导航相关功能"""
    
    def __init__(self, resume_processor):
        """
        初始化导航助手
        
        Args:
            resume_processor: 父简历处理器对象
        """
        self.processor = resume_processor
        
    async def go_to_next_page(self, page):
        """
        通过滚动加载更多卡片
        
        Args:
            page: 页面对象
            
        Returns:
            bool: 是否成功加载更多
        """
        try:
            # 重要：检查详情页处理状态，如果正在处理详情页则不进行滚动
            if hasattr(self.processor, 'detail_processor') and self.processor.detail_processor.processing_detail:
                print("🛑 检测到详情页正在处理中，暂停滚动操作直到详情页处理完成")
                return False
            
            # 首先确保详情页已关闭，避免在详情页中滑动
            await self.ensure_detail_page_closed(page)
            
            # 再次检查详情页处理状态，确保关闭操作没有触发新的详情页处理
            if hasattr(self.processor, 'detail_processor') and self.processor.detail_processor.processing_detail:
                print("🛑 详情页关闭后仍在处理中，不进行滚动")
                return False
            
            print("✅ 详情页已确认关闭，开始滚动加载更多卡片...")
            
            # 记录滚动前的卡片数量
            before_card_count = await page.evaluate('''
                () => {
                    const selectors = [
                        '.card-list .card-item',
                        '.recommend-list .recommend-item',
                        '.geek-list .geek-item',
                        '.user-list .user-item',
                        '.list-wrap .list-item',
                        '.card'
                    ];
                    
                    for (const selector of selectors) {
                        const cards = document.querySelectorAll(selector);
                        if (cards && cards.length > 0) {
                            return cards.length;
                        }
                    }
                    return 0;
                }
            ''')
            
            print(f"当前页面卡片数量: {before_card_count}")
            
            if before_card_count == 0:
                print("未找到任何卡片，尝试多种选择器和方法查找")
                
                # 尝试执行更广泛的查找
                expanded_card_count = await page.evaluate('''
                    () => {
                        // 扩展选择器数组，包含更多可能的选择器
                        const expandedSelectors = [
                            '.card-list .card-item',
                            '.recommend-list .recommend-item',
                            '.geek-list .geek-item',
                            '.user-list .user-item',
                            '.list-wrap .list-item',
                            '.card',
                            'div[data-id]',
                            'div[data-geek]',
                            'div[data-uid]',
                            '.candidate-card',
                            '.resume-card',
                            '.candidate-list-content > div',
                            '.recommend-list-content > div',
                            '*:has(.candidate-name)',
                            '*:has(.name-text)',
                            '*:has(.candidate-position-text)',
                            '*:has(.company-text)'
                        ];
                        
                        let totalFound = 0;
                        
                        for (const selector of expandedSelectors) {
                            try {
                                const elements = document.querySelectorAll(selector);
                                if (elements && elements.length > 0) {
                                    console.log(`找到 ${elements.length} 个元素使用选择器: ${selector}`);
                                    totalFound = Math.max(totalFound, elements.length);
                                }
                            } catch (e) {
                                // 忽略选择器错误
                            }
                        }
                        
                        return totalFound;
                    }
                ''')
                
                if expanded_card_count > 0:
                    print(f"使用扩展选择器找到了 {expanded_card_count} 个可能的卡片")
                    before_card_count = expanded_card_count
                else:
                    print("即使使用扩展选择器也未找到任何卡片")
            
            # 获取当前视窗高度，用于小幅度滚动
            viewport_height = await page.evaluate('window.innerHeight')
            current_scroll_position = await page.evaluate('window.scrollY')
            
            # 获取页面总高度
            page_height = await page.evaluate('''
                Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                )
            ''')
            
            print(f"当前滚动位置: {current_scroll_position}, 视窗高度: {viewport_height}, 页面总高度: {page_height}")
            
            # 小幅度滚动模拟人类行为 - 每次滚动大约1/3屏幕高度，并添加随机延迟
            scroll_step = int(viewport_height / 3)  # 每次滚动约1/3屏幕高度
            scroll_count = 0
            max_scroll_count = 10  # 防止无限滚动
            loading_detected = False
            
            while scroll_count < max_scroll_count and current_scroll_position < page_height - viewport_height:
                # 在每次滚动前检查详情页处理状态
                if hasattr(self.processor, 'detail_processor') and self.processor.detail_processor.processing_detail:
                    print("🛑 滚动过程中检测到详情页处理开始，立即停止滚动")
                    return False
                
                # 检查停止信号
                if not self.processor.is_processing:
                    print("🛑 收到停止信号，停止滚动")
                    return False
                
                # 检查browser_manager的停止信号
                if hasattr(self.processor, 'browser') and hasattr(self.processor.browser, 'is_running'):
                    if not self.processor.browser.is_running:
                        print("🛑 检测到browser_manager停止信号，停止滚动")
                        return False
                
                # 生成稍微随机的滚动距离，模拟人类行为
                random_scroll = scroll_step + random.randint(-20, 20)
                if random_scroll < 50:  # 确保至少滚动一定距离
                    random_scroll = 50
                
                # 执行一次小幅度滚动
                await page.evaluate(f'window.scrollBy(0, {random_scroll})')
                
                # 添加随机延迟，模拟人类思考和查看内容的时间
                random_delay = random.uniform(0.5, 1.2)
                await asyncio.sleep(random_delay)
                
                # 更新当前滚动位置
                current_scroll_position = await page.evaluate('window.scrollY')
                scroll_count += 1
                
                print(f"小幅度滚动 #{scroll_count}: 距离 {random_scroll}px, 当前位置 {current_scroll_position}px")
                
                # 检查是否有"正在加载中"提示
                loading_indicators = [
                    '.loading-more',
                    '.loading-text',
                    '.loading-spinner',
                    '.loading-indicator',
                    '.loading',
                    '*:has-text("正在加载")',
                    '*:has-text("加载中")',
                    '*:has-text("loading")',
                    '*:has-text("Loading")'
                ]
                
                for indicator in loading_indicators:
                    try:
                        loading_element = await page.query_selector(indicator)
                        if loading_element and await loading_element.is_visible():
                            loading_text = await loading_element.text_content()
                            print(f"检测到加载指示器: \"{loading_text}\"")
                            loading_detected = True
                            
                            # 等待加载完成
                            await asyncio.sleep(2)
                            
                            # 尝试检查加载指示器是否消失
                            try:
                                still_loading = await loading_element.is_visible()
                                if not still_loading:
                                    print("加载指示器已消失，可能已完成加载")
                                else:
                                    print("加载指示器仍然存在，继续等待...")
                                    # 再等待一段时间
                                    await asyncio.sleep(2)
                            except Exception:
                                print("无法检查加载指示器状态，假设已完成加载")
                            
                            break
                    except Exception:
                        pass
                
                # 如果检测到加载指示器，再等待一段时间确保新内容加载完成
                if loading_detected:
                    await asyncio.sleep(1.5)
                    break
                
                # 检查当前卡片数量，如果增加了则表示加载成功
                current_card_count = await page.evaluate('''
                    () => {
                        const selectors = [
                            '.card-list .card-item',
                            '.recommend-list .recommend-item',
                            '.geek-list .geek-item',
                            '.user-list .user-item',
                            '.list-wrap .list-item',
                            '.card'
                        ];
                        
                        for (const selector of selectors) {
                            const cards = document.querySelectorAll(selector);
                            if (cards && cards.length > 0) {
                                return cards.length;
                            }
                        }
                        return 0;
                    }
                ''')
                
                if current_card_count > before_card_count:
                    print(f"滚动过程中发现新卡片: {current_card_count - before_card_count} 个")
                    break
            
            # 最后一次额外的小滚动，确保触发加载
            if not loading_detected and scroll_count < max_scroll_count:
                await page.evaluate(f'window.scrollBy(0, {scroll_step})')
                await asyncio.sleep(1)
            
            # 最终检查卡片数量
            after_card_count = await page.evaluate('''
                () => {
                    const selectors = [
                        '.card-list .card-item',
                        '.recommend-list .recommend-item',
                        '.geek-list .geek-item',
                        '.user-list .user-item',
                        '.list-wrap .list-item',
                        '.card'
                    ];
                    
                    for (const selector of selectors) {
                        const cards = document.querySelectorAll(selector);
                        if (cards && cards.length > 0) {
                            return cards.length;
                        }
                    }
                    return 0;
                }
            ''')
            
            print(f"滚动后卡片数量: {after_card_count} (之前: {before_card_count})")
            
            # 判断是否加载了更多卡片
            if after_card_count > before_card_count:
                print(f"成功加载了 {after_card_count - before_card_count} 个新卡片")
                
                # 批量加载检测 - Boss直聘通常一次加载15个
                new_cards = after_card_count - before_card_count
                if new_cards >= 10:
                    print(f"检测到批量加载，可能是一个新批次 (约 {new_cards} 个)")
                
                return True
            else:
                # 如果没有检测到新卡片但检测到了加载指示器，可能是正在加载或加载失败
                if loading_detected:
                    print("检测到加载指示器但未加载到新卡片，可能需要更长时间或刷新")
                    # 再次等待并检查
                    await asyncio.sleep(3)
                    final_check_count = await page.evaluate('''
                        () => {
                            const selectors = [
                                '.card-list .card-item',
                                '.recommend-list .recommend-item',
                                '.geek-list .geek-item',
                                '.user-list .user-item',
                                '.list-wrap .list-item',
                                '.card'
                            ];
                            
                            for (const selector of selectors) {
                                const cards = document.querySelectorAll(selector);
                                if (cards && cards.length > 0) {
                                    return cards.length;
                                }
                            }
                            return 0;
                        }
                    ''')
                    
                    if final_check_count > before_card_count:
                        print(f"最终检查: 成功加载了 {final_check_count - before_card_count} 个新卡片")
                        return True
                
                # 尝试查找"加载更多"按钮
                load_more_selectors = [
                    'button:has-text("加载更多")',
                    'a:has-text("加载更多")',
                    'button:has-text("查看更多")',
                    'a:has-text("查看更多")',
                    'button:has-text("Load More")',
                    'a:has-text("Load More")',
                    '.btn-more',
                    '.load-more',
                    '.show-more',
                    '*[class*="more"]',
                    '*[class*="load"]',
                    '*[id*="more"]',
                    '*[id*="load"]'
                ]
                
                for selector in load_more_selectors:
                    try:
                        load_more_btn = await page.query_selector(selector)
                        if load_more_btn and await load_more_btn.is_visible():
                            print(f"找到'加载更多'按钮: {selector}")
                            try:
                                # 模拟人类行为：先将鼠标悬停在按钮上，然后点击
                                await load_more_btn.hover()
                                await asyncio.sleep(random.uniform(0.3, 0.7))
                                await load_more_btn.click()
                                print("已点击'加载更多'按钮")
                                
                                # 添加随机等待时间
                                random_wait = random.uniform(1.5, 3.0)
                                await asyncio.sleep(random_wait)
                                
                                # 再次检查卡片数量
                                final_card_count = await page.evaluate('''
                                    () => {
                                        const selectors = [
                                            '.card-list .card-item',
                                            '.recommend-list .recommend-item',
                                            '.geek-list .geek-item',
                                            '.user-list .user-item',
                                            '.list-wrap .list-item',
                                            '.card'
                                        ];
                                        
                                        for (const selector of selectors) {
                                            const cards = document.querySelectorAll(selector);
                                            if (cards && cards.length > 0) {
                                                return cards.length;
                                            }
                                        }
                                        return 0;
                                    }
                                ''')
                                
                                if final_card_count > after_card_count:
                                    print(f"点击加载更多后，卡片数量增加到 {final_card_count}")
                                    return True
                                
                                print("点击按钮后卡片数量未变化")
                            except Exception as e:
                                print(f"点击'加载更多'按钮出错: {e}")
                    except Exception as e:
                        continue  # 忽略查找按钮错误，尝试下一个选择器
                
                # 检查是否已到达页面底部
                bottom_reached = await page.evaluate('''
                    () => {
                        const scrollPosition = window.scrollY;
                        const viewportHeight = window.innerHeight;
                        const pageHeight = Math.max(
                            document.body.scrollHeight,
                            document.body.offsetHeight,
                            document.documentElement.clientHeight,
                            document.documentElement.scrollHeight,
                            document.documentElement.offsetHeight
                        );
                        
                        // 如果滚动位置+视窗高度接近页面总高度，说明已到达底部
                        return (scrollPosition + viewportHeight) >= (pageHeight - 50);
                    }
                ''')
                
                if bottom_reached:
                    print("已到达页面底部，可能没有更多内容")
                    
                    # 检查是否有"没有更多"或"已加载全部"等提示
                    end_indicators = [
                        '*:has-text("没有更多")',
                        '*:has-text("全部加载完成")',
                        '*:has-text("已经到底了")',
                        '*:has-text("No more")',
                        '*:has-text("End of list")'
                    ]
                    
                    for indicator in end_indicators:
                        try:
                            end_element = await page.query_selector(indicator)
                            if end_element and await end_element.is_visible():
                                end_text = await end_element.text_content()
                                print(f"检测到列表结束提示: \"{end_text}\"")
                                return False
                        except Exception:
                            pass
                
                print("滚动后卡片数量未增加，尝试其他方法")
                
                # 尝试JavaScript触发滚动事件
                try:
                    print("尝试通过JavaScript触发滚动事件")
                    await page.evaluate('''
                        () => {
                            // 创建并分发滚动事件
                            const scrollEvent = new Event('scroll');
                            window.dispatchEvent(scrollEvent);
                            
                            // 触发可能的滚动监听器
                            if (typeof window.onscroll === 'function') {
                                window.onscroll();
                            }
                            
                            // 对可能有无限滚动的元素触发滚动
                            const scrollableElements = [
                                document.body,
                                document.documentElement,
                                document.querySelector('.main-content'),
                                document.querySelector('.container'),
                                document.querySelector('.list-wrap'),
                                document.querySelector('.card-list'),
                                document.querySelector('.scroll-container')
                            ];
                            
                            for (const el of scrollableElements) {
                                if (el) {
                                    const evt = new Event('scroll');
                                    el.dispatchEvent(evt);
                                }
                            }
                        }
                    ''')
                    await asyncio.sleep(2)
                except Exception as e:
                    print(f"JavaScript触发滚动事件出错: {e}")
                
                # 如果所有方法都失败，返回False表示无法加载更多
                return False
                
        except Exception as e:
            print(f"滚动加载更多卡片时出错: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def try_close_detail_page(self, page):
        """
        尝试关闭详情页
        
        Args:
            page: 页面对象
            
        Returns:
            bool: 是否成功关闭
        """
        try:
            # 尝试多种方式关闭详情页
            close_selectors = [
                self.processor.selectors.get('closeButton'),
                '.icon-close',
                '.dialog-close',
                '.modal-close',
                '.close-btn',
                'button:has-text("关闭")',
                '[aria-label="Close"]'
            ]
            
            for selector in close_selectors:
                if not selector:
                    continue
                    
                close_button = await page.query_selector(selector)
                if close_button:
                    await close_button.click()
                    print(f"使用选择器 {selector} 关闭了详情页")
                    await asyncio.sleep(0.5)
                    return True
                    
            # 如果上面都失败，尝试使用ESC键关闭
            await page.keyboard.press('Escape')
            print("尝试使用ESC键关闭详情页")
            await asyncio.sleep(0.5)
            
            return False
        except Exception as e:
            print(f"尝试关闭详情页时出错: {e}")
            return False
    
    async def ensure_detail_page_closed(self, page):
        """
        确保详情页已关闭，如果检测到详情页打开则关闭它
        
        Args:
            page: 页面对象
            
        Returns:
            bool: 是否成功确保详情页关闭
        """
        try:
            # 检测是否有详情页打开
            detail_page_indicators = [
                '.detail-dialog',
                '.modal',
                '.modal-dialog',
                '.popup',
                '.detail-popup',
                '.resume-detail',
                '.candidate-detail',
                '.dialog-mask',
                '.modal-mask',
                '[class*="detail"]',
                '[class*="modal"]',
                '[class*="popup"]'
            ]
            
            detail_page_found = False
            
            # 检查是否有详情页相关元素显示
            for indicator in detail_page_indicators:
                try:
                    detail_element = await page.query_selector(indicator)
                    if detail_element:
                        is_visible = await detail_element.is_visible()
                        if is_visible:
                            print(f"检测到详情页打开（选择器: {indicator}），准备关闭")
                            detail_page_found = True
                            break
                except Exception:
                    continue
            
            # 如果检测到详情页，尝试关闭
            if detail_page_found:
                print("确认检测到详情页打开，尝试关闭...")
                
                # 优先使用ESC键关闭，因为这是最可靠的方法
                print("使用ESC键关闭详情页...")
                await page.keyboard.press('Escape')
                await asyncio.sleep(1)  # 等待关闭动画完成
                
                # 再次检查是否成功关闭
                for indicator in detail_page_indicators:
                    try:
                        detail_element = await page.query_selector(indicator)
                        if detail_element and await detail_element.is_visible():
                            print("ESC键关闭失败，尝试点击关闭按钮...")
                            # 如果ESC没有关闭，尝试点击关闭按钮
                            success = await self.try_close_detail_page(page)
                            if success:
                                print("通过关闭按钮成功关闭详情页")
                            else:
                                print("⚠️ 无法关闭详情页，将强制继续滑动")
                            return success
                    except Exception:
                        continue
                
                print("✅ 详情页已成功关闭")
                return True
            else:
                print("✅ 未检测到详情页打开，可以安全滑动")
                return True
                
        except Exception as e:
            print(f"检查和关闭详情页时出错: {e}")
            # 即使出错，也尝试按一次ESC键确保安全
            try:
                await page.keyboard.press('Escape')
                await asyncio.sleep(0.5)
                print("出错后已尝试ESC键关闭可能的详情页")
            except:
                pass
            return False
            
    async def scroll_page(self, page, distance):
        """
        滚动页面指定距离
        
        Args:
            page: 页面对象
            distance: 滚动距离（正数向下，负数向上）
            
        Returns:
            bool: 是否成功滚动
        """
        try:
            # 首先确保详情页已关闭，避免在详情页中滑动
            await self.ensure_detail_page_closed(page)
            
            # 记录滚动前位置
            before_position = await page.evaluate("window.scrollY")
            target_position = before_position + distance
            
            # 分段滚动，使行为更像人类
            segments = random.randint(3, 5)  # 将总距离分为3-5段
            segment_distance = distance / segments
            total_scrolled = 0
            
            print(f"准备滚动页面: 从 {before_position}px 滚动 {distance}px，分 {segments} 段执行")
            
            for i in range(segments):
                # 为每段添加一些随机性
                if i == segments - 1:
                    # 最后一段，确保滚动到目标位置
                    current_scroll = distance - total_scrolled
                else:
                    # 添加±15%的随机变化
                    variation = segment_distance * random.uniform(-0.15, 0.15)
                    current_scroll = segment_distance + variation
                
                # 确保滚动距离至少有20px
                if abs(current_scroll) < 20:
                    current_scroll = 20 if current_scroll > 0 else -20
                
                # 执行单段滚动
                await page.evaluate(f"window.scrollBy(0, {current_scroll})")
                total_scrolled += current_scroll
                
                # 随机延迟，模拟人类思考和查看
                delay = random.uniform(0.2, 0.6)
                await asyncio.sleep(delay)
                
                # 获取当前滚动位置
                current_position = await page.evaluate("window.scrollY")
                print(f"滚动段 {i+1}/{segments}: 滚动了 {current_scroll:.1f}px, 当前位置 {current_position}px")
                
                # 检查是否有加载指示器
                try:
                    loading_indicators = [
                        '.loading-more', '.loading-text', '.loading-spinner',
                        '.loading-indicator', '.loading',
                        '*:has-text("正在加载")', '*:has-text("加载中")'
                    ]
                    
                    for indicator in loading_indicators:
                        loading_element = await page.query_selector(indicator)
                        if loading_element and await loading_element.is_visible():
                            loading_text = await loading_element.text_content() or "加载中"
                            print(f"检测到加载指示器: \"{loading_text}\"，等待加载完成...")
                            await asyncio.sleep(2)  # 等待加载完成
                            break
                except Exception:
                    pass  # 忽略检查加载指示器的错误
            
            # 最终检查滚动结果
            final_position = await page.evaluate("window.scrollY")
            total_scrolled = final_position - before_position
            
            print(f"滚动完成: 从 {before_position}px 到 {final_position}px, 实际滚动了 {total_scrolled}px")
            
            # 判断是否成功滚动（滚动距离至少是目标的50%）
            success = abs(total_scrolled) >= abs(distance) * 0.5
            
            if success:
                print("滚动成功")
            else:
                print(f"滚动效果不理想，目标 {distance}px，实际 {total_scrolled}px")
                
                # 尝试一次额外的滚动，确保达到目标
                remaining = distance - total_scrolled
                if abs(remaining) > 50:  # 如果差距较大，尝试额外滚动
                    print(f"尝试额外滚动 {remaining}px 以达到目标")
                    await page.evaluate(f"window.scrollBy(0, {remaining})")
                    await asyncio.sleep(0.5)
                    
                    # 再次检查
                    extra_position = await page.evaluate("window.scrollY")
                    extra_scrolled = extra_position - before_position
                    print(f"额外滚动后: 总共滚动了 {extra_scrolled}px")
                    
                    success = abs(extra_scrolled) >= abs(distance) * 0.7
            
            return success
            
        except Exception as e:
            print(f"滚动页面时出错: {e}")
            import traceback
            traceback.print_exc()
            return False 