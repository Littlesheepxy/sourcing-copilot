/**
 * UI交互模块
 * 负责UI操作和交互，模拟人类操作
 */

/**
 * 模拟鼠标移动和点击操作
 * @param element 目标元素
 */
export async function simulateMouseMovement(element: HTMLElement): Promise<void> {
  // 获取元素位置
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // 创建模拟的鼠标指针元素
  const pointer = document.createElement('div');
  pointer.style.cssText = `
    position: fixed;
    width: 10px;
    height: 10px;
    background-color: rgba(255, 0, 0, 0.5);
    border-radius: 50%;
    z-index: 10000;
    pointer-events: none;
    transition: all 0.3s ease;
    top: ${window.scrollY + centerY}px;
    left: ${centerX}px;
  `;
  
  document.body.appendChild(pointer);
  
  // 短暂延迟后移除指针
  await new Promise(resolve => setTimeout(resolve, 300));
  document.body.removeChild(pointer);
}

/**
 * 显示成功通知
 * @param message 通知消息
 */
export function showSuccessNotification(message: string): void {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = 'sourcing-assistant-notification success';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background-color: #4caf50;
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
  `;
  notification.textContent = message;
  
  // 添加到文档
  document.body.appendChild(notification);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 3000);
}

/**
 * 显示错误通知
 * @param message 通知消息
 */
export function showErrorNotification(message: string): void {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = 'sourcing-assistant-notification error';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background-color: #f44336;
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
  `;
  notification.textContent = message;
  
  // 添加到文档
  document.body.appendChild(notification);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 3000);
}

/**
 * 显示确认通知
 * @param onConfirm 确认回调函数
 * @param onCancel 取消回调函数
 */
export function showConfirmationNotification(onConfirm: () => void, onCancel: () => void): void {
  // 创建确认通知元素
  const notification = document.createElement('div');
  notification.className = 'sourcing-assistant-confirmation';
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px;
    background-color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    width: 300px;
  `;
  
  // 添加内容
  notification.innerHTML = `
    <h3 style="margin-top: 0; font-size: 16px;">确认操作</h3>
    <p style="margin-bottom: 20px; font-size: 14px;">简历符合筛选规则，是否自动打招呼？</p>
    <div style="display: flex; justify-content: space-between;">
      <button id="confirm-btn" style="
        padding: 8px 16px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">确认</button>
      <button id="cancel-btn" style="
        padding: 8px 16px;
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">取消</button>
    </div>
  `;
  
  // 添加到文档
  document.body.appendChild(notification);
  
  // 添加按钮事件
  const confirmBtn = document.getElementById('confirm-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  
  confirmBtn?.addEventListener('click', () => {
    // 移除通知
    document.body.removeChild(notification);
    // 执行确认回调
    onConfirm();
  });
  
  cancelBtn?.addEventListener('click', () => {
    // 移除通知
    document.body.removeChild(notification);
    // 执行取消回调
    onCancel();
  });
}

/**
 * 关闭详情弹窗
 */
export async function closeDetailDialog(): Promise<void> {
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
    let closeButton: HTMLElement | null = null;
    
    for (const selector of closeButtonSelectors) {
      try {
        const button = document.querySelector(selector) as HTMLElement;
        if (button) {
          console.log(`找到关闭按钮使用选择器 ${selector}`);
          closeButton = button;
          break;
        }
      } catch (e) {
        // 忽略选择器语法错误，继续尝试下一个
        continue;
      }
    }
    
    // 如果找到关闭按钮，点击它
    if (closeButton) {
      await simulateMouseMovement(closeButton);
      closeButton.click();
      console.log('点击关闭按钮关闭详情弹窗');
      return;
    }
    
    // 如果没有找到关闭按钮，尝试按ESC键关闭
    console.log('未找到关闭按钮，尝试按ESC键关闭');
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true
    }));
  } catch (error) {
    console.error('关闭详情弹窗失败:', error);
  }
}

/**
 * 滚动页面
 * @param distance 滚动距离
 */
export async function scrollPage(distance: number): Promise<boolean> {
  try {
    // 记住当前位置，以便检测滚动是否生效
    const initialY = window.scrollY;
    
    // 平滑滚动
    window.scrollBy({
      top: distance,
      behavior: 'smooth'
    });
    
    // 等待滚动完成 (平滑滚动通常需要一些时间)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 检查滚动是否生效
    if (Math.abs(window.scrollY - initialY) < 10) {
      // 滚动失败，尝试使用另一种方法
      console.log('平滑滚动似乎没有生效，尝试替代方法');
      window.scrollTo(0, window.scrollY + distance);
      
      // 再次等待并检查
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (Math.abs(window.scrollY - initialY) < 10) {
        // 两种方法都失败，使用元素滚动
        console.log('标准滚动方法都失败，尝试查找可滚动元素');
        
        // 尝试查找页面中的可滚动容器
        const scrollContainers = Array.from(document.querySelectorAll('div[style*="overflow"], div[style*="scroll"], .scroll-container, .scrollable'));
        for (const container of scrollContainers) {
          if (container instanceof HTMLElement) {
            const initialScrollTop = container.scrollTop;
            container.scrollTop += distance;
            
            // 检查是否滚动成功
            if (container.scrollTop > initialScrollTop) {
              console.log('使用容器元素成功滚动页面');
              return true;
            }
          }
        }
        
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('滚动页面失败:', error);
    return false;
  }
}

/**
 * 生成随机延迟时间，模拟人类操作间隔
 * @param min 最小延迟(毫秒)
 * @param max 最大延迟(毫秒)
 */
export function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
} 