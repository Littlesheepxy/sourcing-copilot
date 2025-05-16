"""
导航助手模块
负责页面导航、滚动、关闭弹窗等操作
"""

import asyncio

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
            print("尝试通过滚动加载更多卡片...")
            
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
                print("未找到任何卡片，无法判断是否需要滚动")
                return False
            
            # 滚动到页面底部
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            print("已滚动到页面底部")
            
            # 等待可能的新内容加载
            await asyncio.sleep(3)
            
            # 再次滚动确保触发加载
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            print("再次滚动确保触发加载")
            
            # 等待新内容加载完成
            await asyncio.sleep(2)
            
            # 检查滚动后的卡片数量
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
            
            print(f"滚动后卡片数量: {after_card_count}")
            
            # 判断是否加载了更多卡片
            if after_card_count > before_card_count:
                print(f"成功加载了 {after_card_count - before_card_count} 个新卡片")
                return True
            else:
                # 尝试检查是否有"加载更多"按钮
                load_more_selectors = [
                    'button:has-text("加载更多")',
                    'a:has-text("加载更多")',
                    '.btn-more',
                    '.load-more',
                    '.show-more'
                ]
                
                for selector in load_more_selectors:
                    load_more_btn = await page.query_selector(selector)
                    if load_more_btn and await load_more_btn.is_visible():
                        print(f"找到'加载更多'按钮: {selector}")
                        try:
                            await load_more_btn.click()
                            print("已点击'加载更多'按钮")
                            await asyncio.sleep(2)
                            
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
                        except Exception as e:
                            print(f"点击'加载更多'按钮出错: {e}")
                
                print("滚动后卡片数量未增加，可能已到达列表底部")
                return False
        except Exception as e:
            print(f"滚动加载更多卡片时出错: {e}")
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
            # 记录滚动前位置
            before_position = await page.evaluate("window.scrollY")
            
            # 尝试滚动
            await page.evaluate(f"window.scrollBy(0, {distance})")
            await asyncio.sleep(0.5)  # 等待滚动完成
            
            # 检查是否滚动成功
            after_position = await page.evaluate("window.scrollY")
            scroll_diff = after_position - before_position
            
            print(f"滚动页面: 从 {before_position} 到 {after_position}, 差值 {scroll_diff}px")
            
            return scroll_diff != 0
            
        except Exception as e:
            print(f"滚动页面时出错: {e}")
            return False 