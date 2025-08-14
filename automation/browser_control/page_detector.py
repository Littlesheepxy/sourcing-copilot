"""
页面检测器模块
负责检测当前页面类型
"""

from playwright.async_api import Page

class PageDetector:
    """页面检测器类，用于检测Boss直聘页面类型"""
    
    def is_recommend_list_page(self, url):
        """
        检查是否是推荐列表页
        
        Args:
            url: 当前页面URL
            
        Returns:
            bool: 是否是推荐列表页
        """
        return ('zhipin.com/web/chat/recommend' in url or 
                'zhipin.com/web/boss/recommend' in url or
                'zhipin.com/boss/recommend' in url)
        
    def is_resume_detail_page(self, url):
        """
        检查是否是简历详情页
        
        Args:
            url: 当前页面URL
            
        Returns:
            bool: 是否是简历详情页
        """
        return ('zhipin.com/geek/new/resumeDetail' in url or 
                'zhipin.com/web/geek/detail' in url or
                'zhipin.com/web/boss/geek/detail' in url)
        
    def get_current_page_type(self, url):
        """
        获取当前页面类型
        
        Args:
            url: 当前页面URL
            
        Returns:
            str: 页面类型 ('recommend'|'detail'|'unknown')
        """
        if self.is_recommend_list_page(url):
            return 'recommend'
        elif self.is_resume_detail_page(url):
            return 'detail'
        return 'unknown'
        
    async def detect_page_with_iframes(self, page: Page):
        """
        检测页面类型，包括检查iframe内容
        
        Args:
            page: Playwright页面对象
            
        Returns:
            tuple: (页面类型, iframe对象或None)
        """
        # 首先检查主页面URL
        url = page.url
        page_type = self.get_current_page_type(url)
        
        # 如果主页面已经是Boss直聘相关页面，直接返回
        if page_type != 'unknown':
            return page_type, None
            
        # 检查页面中的所有iframe
        try:
            iframe_selectors = [
                'iframe[name="recommendFrame"]',
                'iframe[src*="frame/recommend"]',
                'iframe[data-v-16429d95]',
                'iframe[src*="recommend"]',
                'iframe[src*="zhipin"]',
                'iframe[src*="boss"]',
                'iframe'
            ]
            
            for selector in iframe_selectors:
                iframe_elements = await page.query_selector_all(selector)
                for iframe_element in iframe_elements:
                    src = await iframe_element.get_attribute('src')
                    if src:
                        iframe_type = self.get_current_page_type(src)
                        if iframe_type != 'unknown':
                            # 获取iframe内容框架
                            iframe = await iframe_element.content_frame()
                            if iframe:
                                print(f"在iframe中找到{iframe_type}页面: {src}")
                                return iframe_type, iframe
                    
                    # 即使没有src属性，仍尝试获取iframe内容
                    iframe = await iframe_element.content_frame()
                    if iframe:
                        # 检查iframe的URL
                        iframe_url = iframe.url
                        iframe_type = self.get_current_page_type(iframe_url)
                        if iframe_type != 'unknown':
                            print(f"在iframe中找到{iframe_type}页面: {iframe_url}")
                            return iframe_type, iframe
                            
            # 没有找到相关iframe
            return 'unknown', None
            
        except Exception as e:
            print(f"检测iframe时出错: {e}")
            return 'unknown', None 