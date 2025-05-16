/**
 * 元素查找模块
 * 负责查找页面中的各种元素
 */

/**
 * 查找打招呼按钮
 * @param container 在该容器中查找
 * @param selectors 选择器配置
 */
export async function findGreetButton(container: Element | Document, selectors: any): Promise<HTMLElement | null> {
  try {
    // 可能的打招呼按钮选择器
    const greetButtonSelectors = [
      selectors.greetButton,
      '.btn-greet',
      '.btn-chat',
      '.btn-connect',
      '.btn-hi',
      '.chat-btn',
      '.greet-btn',
      'button:contains("打招呼")',
      'button:contains("沟通")',
      'button:contains("聊一聊")',
      '[class*="greet"]',
      '[class*="chat"]',
      '.geek-chat-btn'
    ];
    
    // 尝试查找打招呼按钮
    for (const selector of greetButtonSelectors) {
      try {
        const button = container.querySelector(selector) as HTMLElement;
        if (button) {
          console.log(`找到打招呼按钮使用选择器 ${selector}`);
          return button;
        }
      } catch (e) {
        // 忽略选择器语法错误，继续尝试下一个
        continue;
      }
    }
    
    // 如果没有找到按钮，尝试通过文本内容查找
    const allButtons = container.querySelectorAll('button, a, [role="button"]');
    for (const button of allButtons) {
      const text = button.textContent?.trim().toLowerCase() || '';
      if (text.includes('打招呼') || text.includes('聊一聊') || text.includes('沟通') || 
          text.includes('chat') || text.includes('hi') || text.includes('hello')) {
        console.log('通过文本内容找到打招呼按钮:', text);
        return button as HTMLElement;
      }
    }
    
    // 如果还没找到，尝试查找带有特定类名的任何可点击元素
    const clickableElements = container.querySelectorAll('[class*="btn"], [class*="button"]');
    if (clickableElements.length > 0) {
      // 使用第一个找到的按钮元素
      console.log('使用第一个找到的按钮元素作为打招呼按钮');
      return clickableElements[0] as HTMLElement;
    }
    
    return null;
  } catch (error) {
    console.error('查找打招呼按钮失败:', error);
    return null;
  }
}

/**
 * 查找简历卡片详情元素
 * @param card 简历卡片
 */
export async function findDetailElement(card: Element): Promise<HTMLElement | null> {
  try {
    // 可能的详情元素选择器
    const detailSelectors = [
      '.detail-link',
      '.view-detail',
      '.resume-detail',
      '.card-detail',
      '.recommend-card-wrap',
      '.name',
      '.candidate-name',
      '.geek-name',
      'a[href*="resumeDetail"]',
      'a[href*="geek/detail"]',
      '[class*="detail"]',
      '.card-inner',
      '.card-body'
    ];
    
    // 尝试查找详情元素
    for (const selector of detailSelectors) {
      try {
        const element = card.querySelector(selector) as HTMLElement;
        if (element) {
          console.log(`找到详情元素使用选择器 ${selector}`);
          return element;
        }
      } catch (e) {
        // 忽略选择器语法错误，继续尝试下一个
        continue;
      }
    }
    
    // 如果没有找到，尝试查找第一个可点击元素
    const clickableElements = card.querySelectorAll('a, [role="link"], [class*="link"]');
    if (clickableElements.length > 0) {
      console.log('使用第一个找到的链接元素作为详情元素');
      return clickableElements[0] as HTMLElement;
    }
    
    // 如果还没找到，尝试使用卡片自身作为点击目标
    console.log('未找到详情元素，使用卡片自身');
    return card as HTMLElement;
  } catch (error) {
    console.error('查找详情元素失败:', error);
    return null;
  }
}

/**
 * 查找关闭按钮
 * @param container 在该容器中查找
 */
export async function findCloseButton(container: Element | Document = document): Promise<HTMLElement | null> {
  try {
    // 可能的关闭按钮选择器
    const closeButtonSelectors = [
      '.close-btn',
      '.btn-close',
      '.close-icon',
      '.dialog-close',
      '[class*="close"]',
      'button:contains("关闭")',
      'button:contains("取消")',
      'svg[class*="close"]',
      '.modal-close'
    ];
    
    // 尝试查找关闭按钮
    for (const selector of closeButtonSelectors) {
      try {
        const button = container.querySelector(selector) as HTMLElement;
        if (button) {
          console.log(`找到关闭按钮使用选择器 ${selector}`);
          return button;
        }
      } catch (e) {
        // 忽略选择器语法错误，继续尝试下一个
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('查找关闭按钮失败:', error);
    return null;
  }
}

/**
 * 等待元素加载
 * @param selector 元素选择器
 * @param timeout 超时时间(毫秒)
 */
export function waitForElement(selector: string, timeout: number = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    // 先尝试直接查找元素
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      console.log(`等待元素 ${selector} 超时`);
      resolve(null);
    }, timeout);
    
    // 设置变化观察器
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        clearTimeout(timeoutId);
        obs.disconnect();
        resolve(element);
      }
    });
    
    // 开始观察
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
} 