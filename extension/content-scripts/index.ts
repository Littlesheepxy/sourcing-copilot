/**
 * Boss直聘 Sourcing 智能助手 - 内容脚本
 */
import { RulesEvaluator } from '../../shared/core/rules-engine/evaluator';
import { LogicalOperator, RuleGroup } from '../../shared/core/rules-engine/types';

console.log('Boss直聘 Sourcing 智能助手 - 内容脚本已加载');

// 全局状态
let selectors: any = {}; // 选择器配置
let currentMode = 'calibration'; // 默认为校准模式
let filterRules: RuleGroup = { id: 'root', operator: LogicalOperator.AND, conditions: [], enabled: true }; // 默认筛选规则
let isProcessing = false; // 防止重复处理
let autoStart = false; // 是否自动开始处理
let needConfirmation = true; // 是否需要用户确认
const rulesEvaluator = new RulesEvaluator();

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('内容脚本收到消息:', message);
  
  if (message.type === 'startProcessing') {
    autoStart = true;
    needConfirmation = false;
    
    if (isRecommendListPage()) {
      processRecommendListPage();
    }
    
    sendResponse({ success: true });
    return true;
  }
  
  return true;
});

// 初始化函数
async function initialize() {
  try {
    // 获取选择器配置
    const selectorsResponse = await sendMessageToBackground('getSelectors');
    if (selectorsResponse && selectorsResponse.selectors) {
      selectors = selectorsResponse.selectors;
    }
    
    // 获取筛选规则
    const rulesResponse = await sendMessageToBackground('getRules');
    if (rulesResponse && rulesResponse.rules) {
      filterRules = rulesResponse.rules;
    }
    
    // 获取当前模式
    const modeResponse = await sendMessageToBackground('getMode');
    if (modeResponse && modeResponse.mode) {
      currentMode = modeResponse.mode;
    }
    
    // 设置DOM变化观察器
    setupMutationObserver();
    
    console.log('初始化完成:', { selectors, filterRules, currentMode });
    
    // 检查当前页面类型并处理
    if (isRecommendListPage()) {
      console.log('当前页面是推荐列表页');
      if (autoStart) {
        processRecommendListPage();
      }
    } else if (isResumeDetailPage()) {
      console.log('当前页面是简历详情页');
      processResumeDetailPage();
    }
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

// 给后台脚本发送消息的辅助函数
function sendMessageToBackground(type: string, data: any = {}): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...data }, (response) => {
      resolve(response);
    });
  });
}

// 检查是否是推荐列表页
function isRecommendListPage(): boolean {
  const url = window.location.href;
  return (
    url.includes('zhipin.com/web/chat/recommend') ||
    url.includes('zhipin.com/boss/recommend')
  );
}

// 检查是否是简历详情页
function isResumeDetailPage(): boolean {
  const url = window.location.href;
  return (
    url.includes('zhipin.com/geek/new/resumeDetail') ||
    url.includes('zhipin.com/web/geek/detail')
  );
}

// 设置DOM变化观察器
function setupMutationObserver(): void {
  const observer = new MutationObserver((mutations) => {
    // 当DOM发生变化时，检查相关元素
    if (isRecommendListPage()) {
      // 如果有新的推荐简历列表，且设置为自动处理
      if (autoStart && !isProcessing) {
        processRecommendListPage();
      }
    }
  });
  
  // 开始观察
  observer.observe(document.body, { childList: true, subtree: true });
}

// 处理推荐列表页
async function processRecommendListPage(): Promise<void> {
  if (isProcessing) return;
  
  try {
    isProcessing = true;
    console.log('开始处理推荐列表页');
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '开始处理',
      details: '处理推荐列表页'
    });
    
    // 获取推荐卡片列表
    const resumeCards = document.querySelectorAll(selectors.resumeCard);
    console.log('找到推荐卡片:', resumeCards.length);
    
    if (resumeCards.length === 0) {
      console.log('未找到推荐卡片');
      showErrorNotification('未找到推荐卡片，请确认当前是否在推荐列表页');
      isProcessing = false;
      return;
    }
    
    // 显示成功通知
    showSuccessNotification(`找到 ${resumeCards.length} 个简历卡片`);
    
    // 处理每个推荐卡片
    for (const card of resumeCards) {
      await processResumeCard(card as Element);
      
      // 随机延迟，模拟人工操作
      await new Promise(resolve => setTimeout(resolve, getRandomDelay(500, 1500)));
    }
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '处理完成',
      details: `处理了 ${resumeCards.length} 个推荐卡片`
    });
    
    // 显示成功通知
    showSuccessNotification('所有简历卡片处理完成');
  } catch (error) {
    console.error('处理推荐列表页失败:', error);
    
    // 记录错误日志
    await sendMessageToBackground('addLog', {
      action: '处理失败',
      details: `错误: ${error.message}`
    });
    
    // 显示错误通知
    showErrorNotification(`处理失败: ${error.message}`);
  } finally {
    isProcessing = false;
  }
}

// 显示成功通知
function showSuccessNotification(message: string) {
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
    document.body.removeChild(notification);
  }, 3000);
}

// 显示错误通知
function showErrorNotification(message: string) {
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
    document.body.removeChild(notification);
  }, 3000);
}

// 处理简历卡片
async function processResumeCard(card: Element): Promise<void> {
  try {
    // 提取简历数据
    const resumeData = extractResumeData(card);
    console.log('提取到简历数据:', resumeData);
    
    // 根据当前模式处理
    if (currentMode === 'calibration') {
      // 校准模式：添加标记按钮，让用户手动标记简历
      addMarkingButtons(card, resumeData);
    } else {
      // 自动模式：使用规则引擎评估简历
      const evaluationResult = await sendMessageToBackground('evaluateResume', {
        resumeData,
        rules: filterRules
      });
      
      console.log('评估结果:', evaluationResult);
      
      // 找到打招呼按钮
      const greetButton = card.querySelector(selectors.greetButton) as HTMLElement | null;
      
      if (!greetButton) {
        console.log('未找到打招呼按钮');
        return;
      }
      
      // 如果简历符合规则，则自动打招呼
      if (evaluationResult && evaluationResult.result) {
        console.log('简历符合规则，将自动打招呼');
        
        // 是否需要用户确认
        if (needConfirmation) {
          // 显示确认通知
          showConfirmationNotification();
          return;
        }
        
        // 打招呼
        await greetCandidate(greetButton, resumeData);
      } else {
        console.log('简历不符合规则，跳过');
      }
    }
  } catch (error) {
    console.error('处理简历卡片失败:', error);
    
    // 记录错误日志
    await sendMessageToBackground('addLog', {
      action: '卡片处理失败',
      details: `错误: ${error.message}`
    });
  }
}

// 提取简历数据
function extractResumeData(card: Element): any {
  const data: any = {};
  
  try {
    // 提取姓名
    const nameElement = card.querySelector(selectors.name);
    if (nameElement) {
      data.name = nameElement.textContent?.trim() || '';
    }
    
    // 提取基本信息（教育和经验）
    const baseInfoElements = card.querySelectorAll(selectors.education);
    if (baseInfoElements.length > 0) {
      const baseInfoText = Array.from(baseInfoElements)
        .map(el => el.textContent?.trim())
        .join(' ')
        .replace(/\s+/g, ' ');
      
      data.baseInfo = baseInfoText;
      
      // 尝试从基本信息中提取更细致的内容
      const educationMatch = baseInfoText.match(/([^·]+大学|学院)/);
      if (educationMatch) {
        data.education = educationMatch[0].trim();
      }
      
      const experienceMatch = baseInfoText.match(/(\d+)年经验/);
      if (experienceMatch) {
        data.experience = parseInt(experienceMatch[1]);
      }
    }
    
    // 提取学校
    const schoolElement = card.querySelector(selectors.school);
    if (schoolElement) {
      data.school = schoolElement.textContent?.trim() || '';
    }
    
    // 提取公司
    const companyElement = card.querySelector(selectors.company);
    if (companyElement) {
      data.company = companyElement.textContent?.trim() || '';
    }
    
    // 提取职位
    const positionElement = card.querySelector(selectors.position);
    if (positionElement) {
      data.position = positionElement.textContent?.trim() || '';
    }
    
    // 提取技能标签
    const skillElements = card.querySelectorAll(selectors.skills);
    if (skillElements.length > 0) {
      data.skills = Array.from(skillElements)
        .map(el => el.textContent?.trim())
        .filter(text => text);
    }
  } catch (error) {
    console.error('提取简历数据失败:', error);
  }
  
  return data;
}

// 添加标记按钮
function addMarkingButtons(card: Element, resumeData: any): void {
  // 检查是否已添加按钮
  if (card.querySelector('.marking-buttons')) {
    return;
  }
  
  // 创建标记按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'marking-buttons';
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background-color: #f5f5f5;
    border-top: 1px solid #e0e0e0;
  `;
  
  // 创建"符合"按钮
  const positiveButton = document.createElement('button');
  positiveButton.textContent = '符合要求';
  positiveButton.style.cssText = `
    padding: 6px 12px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `;
  
  // 创建"不符合"按钮
  const negativeButton = document.createElement('button');
  negativeButton.textContent = '不符合';
  negativeButton.style.cssText = `
    padding: 6px 12px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `;
  
  // 添加"符合"按钮点击事件
  positiveButton.addEventListener('click', async () => {
    // 添加到标记数据
    await sendMessageToBackground('addMarkedData', {
      isPositive: true,
      resumeData
    });
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '标记简历',
      details: `${resumeData.name} - 符合要求`
    });
    
    // 禁用按钮
    positiveButton.disabled = true;
    positiveButton.style.opacity = '0.5';
    negativeButton.disabled = true;
    negativeButton.style.opacity = '0.5';
    
    // 显示成功通知
    showSuccessNotification('已标记为符合要求');
  });
  
  // 添加"不符合"按钮点击事件
  negativeButton.addEventListener('click', async () => {
    // 添加到标记数据
    await sendMessageToBackground('addMarkedData', {
      isPositive: false,
      resumeData
    });
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '标记简历',
      details: `${resumeData.name} - 不符合要求`
    });
    
    // 禁用按钮
    positiveButton.disabled = true;
    positiveButton.style.opacity = '0.5';
    negativeButton.disabled = true;
    negativeButton.style.opacity = '0.5';
    
    // 显示成功通知
    showSuccessNotification('已标记为不符合要求');
  });
  
  // 添加按钮到容器
  buttonContainer.appendChild(positiveButton);
  buttonContainer.appendChild(negativeButton);
  
  // 添加容器到卡片
  card.appendChild(buttonContainer);
}

// 获取随机延迟时间
function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 模拟鼠标移动和点击操作
async function simulateMouseMovement(element: HTMLElement): Promise<void> {
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

// 打招呼操作
async function greetCandidate(greetButton: HTMLElement, resumeData: any): Promise<void> {
  try {
    // 模拟鼠标移动
    await simulateMouseMovement(greetButton);
    
    // 点击打招呼按钮
    greetButton.click();
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '打招呼',
      details: `向 ${resumeData.name} 发送了招呼`
    });
    
    // 显示成功通知
    showSuccessNotification(`已向 ${resumeData.name} 发送招呼`);
  } catch (error) {
    console.error('打招呼失败:', error);
    
    // 记录错误日志
    await sendMessageToBackground('addLog', {
      action: '打招呼失败',
      details: `向 ${resumeData.name} 打招呼时出错: ${error.message}`
    });
    
    // 显示错误通知
    showErrorNotification(`打招呼失败: ${error.message}`);
  }
}

// 处理简历详情页
async function processResumeDetailPage(): Promise<void> {
  try {
    console.log('开始处理简历详情页');
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '处理简历详情',
      details: '提取简历详情页信息'
    });
    
    // 提取简历详情数据
    const detailData = extractDetailPageData();
    console.log('提取到详情页数据:', detailData);
    
    // 根据当前模式处理
    if (currentMode === 'automatic') {
      // 自动模式：使用规则引擎评估简历
      const evaluationResult = await sendMessageToBackground('evaluateResume', {
        resumeData: detailData,
        rules: filterRules
      });
      
      console.log('评估结果:', evaluationResult);
      
      // 找到打招呼按钮
      const greetButton = document.querySelector(selectors.greetButton) as HTMLElement | null;
      
      if (!greetButton) {
        console.log('未找到打招呼按钮');
        showErrorNotification('未找到打招呼按钮');
        return;
      }
      
      // 如果简历符合规则，则自动打招呼
      if (evaluationResult && evaluationResult.result) {
        console.log('简历符合规则，将自动打招呼');
        
        // 是否需要用户确认
        if (needConfirmation) {
          // 显示确认通知
          showConfirmationNotification();
          return;
        }
        
        // 打招呼
        await greetCandidate(greetButton, detailData);
      } else {
        console.log('简历不符合规则，跳过');
        showErrorNotification('简历不符合筛选规则，已跳过');
      }
    }
  } catch (error) {
    console.error('处理简历详情页失败:', error);
    
    // 记录错误日志
    await sendMessageToBackground('addLog', {
      action: '处理详情页失败',
      details: `错误: ${error.message}`
    });
    
    // 显示错误通知
    showErrorNotification(`处理失败: ${error.message}`);
  }
}

// 提取详情页数据
function extractDetailPageData(): any {
  const data: any = {};
  
  try {
    // 检查容器是否存在
    const container = document.querySelector(selectors.detailPage.container);
    if (!container) {
      console.error('未找到详情页容器');
      return data;
    }
    
    // 提取姓名
    const nameElement = document.querySelector(selectors.name);
    if (nameElement) {
      data.name = nameElement.textContent?.trim() || '';
    }
    
    // 提取工作经历
    const workExperience = document.querySelector(selectors.detailPage.workExperience);
    if (workExperience) {
      data.workExperience = workExperience.textContent?.trim() || '';
    }
    
    // 提取教育经历
    const educationExperience = document.querySelector(selectors.detailPage.educationExperience);
    if (educationExperience) {
      data.educationExperience = educationExperience.textContent?.trim() || '';
    }
    
    // 提取项目经历
    const projectExperience = document.querySelector(selectors.detailPage.projectExperience);
    if (projectExperience) {
      data.projectExperience = projectExperience.textContent?.trim() || '';
    }
    
    // 提取期望
    const expectation = document.querySelector(selectors.detailPage.expectation);
    if (expectation) {
      data.expectation = expectation.textContent?.trim() || '';
    }
  } catch (error) {
    console.error('提取详情页数据失败:', error);
  }
  
  return data;
}

// 显示确认通知
function showConfirmationNotification() {
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
    // 设置不再需要确认
    needConfirmation = false;
    
    // 再次处理当前页面
    if (isRecommendListPage()) {
      processRecommendListPage();
    } else if (isResumeDetailPage()) {
      processResumeDetailPage();
    }
    
    // 移除通知
    document.body.removeChild(notification);
  });
  
  cancelBtn?.addEventListener('click', () => {
    // 移除通知
    document.body.removeChild(notification);
  });
}

// 初始化
initialize(); 