/**
 * Boss直聘 Sourcing 智能助手 - 内容脚本主入口
 * 整合所有模块化功能，处理页面加载和用户交互
 */

import { isRecommendListPage, isResumeDetailPage, getCurrentPageType } from './modules/page-detector';
import { processRecommendListPage, processResumeDetailPage, setProcessingState } from './modules/resume-processor';
import { addLogToSidebar, updatePageStatus, getSelectors, getMode } from './modules/message-service';
import { showSuccessNotification, showErrorNotification } from './modules/ui-actions';

// 全局存储当前页面类型
let currentPageType: 'recommend' | 'detail' | 'unknown' = 'unknown';

/**
 * 初始化内容脚本
 */
async function initialize(): Promise<void> {
  // 立即重置处理状态，确保不会自动启动处理
  setProcessingState(false);
  console.log('初始化时重置处理状态');
  
  try {
    console.log('Boss直聘 Sourcing 智能助手 - 内容脚本已启动');
    
    // 添加日志
    await addLogToSidebar('内容脚本已启动', 'info');
    
    // 获取选择器配置
    const selectors = await getSelectors();
    if (!selectors) {
      console.error('获取选择器配置失败');
      return;
    }
    
    // 添加功能按钮到页面
    addControlButtons();
    
    // 检测页面类型
    detectPageType();
    
    // 监听页面变化
    observePageChanges();
    
    // 监听来自扩展的消息
    setupMessageListeners();
    
    // 再次确认处理状态已重置
    setProcessingState(false);
    console.log('初始化完成，最终检查处理状态:', isProcessing());
    
  } catch (error) {
    console.error('初始化内容脚本失败:', error);
    await addLogToSidebar(`初始化失败: ${error.message}`, 'error');
    
    // 确保即使初始化失败，处理状态也被重置
    setProcessingState(false);
  }
}

/**
 * 检测当前页面类型并更新状态
 */
function detectPageType(): void {
  try {
    const newPageType = getCurrentPageType();
    
    if (newPageType !== currentPageType) {
      currentPageType = newPageType;
      console.log(`页面类型变更为: ${currentPageType}`);
      
      // 更新页面状态
      updatePageStatus();
      
      // 根据页面类型添加不同的日志，但不自动启动处理
      if (currentPageType === 'recommend') {
        addLogToSidebar('检测到推荐列表页面', 'info');
        console.log('检测到推荐列表页面，但不自动启动处理');
      } else if (currentPageType === 'detail') {
        addLogToSidebar('检测到简历详情页面', 'info');
        console.log('检测到简历详情页面，但不自动启动处理');
      }
    }
  } catch (error) {
    console.error('检测页面类型失败:', error);
  }
}

/**
 * 观察页面变化
 */
function observePageChanges(): void {
  // 创建变化观察器
  const observer = new MutationObserver((mutations) => {
    // 当DOM变化时，尝试检测页面类型
    detectPageType();
  });
  
  // 开始观察文档变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * 添加控制按钮到页面
 */
function addControlButtons(): void {
  try {
    // 如果页面上已经有控制按钮，则不重复添加
    if (document.querySelector('.sourcing-assistant-controls')) {
      return;
    }
    
    // 创建控制按钮容器
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'sourcing-assistant-controls';
    controlsContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    // 创建启动按钮
    const startButton = document.createElement('button');
    startButton.textContent = '开始处理';
    startButton.style.cssText = `
      padding: 8px 12px;
      background-color: #1890ff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    startButton.addEventListener('click', handleStartProcessing);
    
    // 创建停止按钮
    const stopButton = document.createElement('button');
    stopButton.textContent = '停止处理';
    stopButton.style.cssText = `
      padding: 8px 12px;
      background-color: #ff4d4f;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    stopButton.addEventListener('click', handleStopProcessing);
    
    // 添加按钮到容器
    controlsContainer.appendChild(startButton);
    controlsContainer.appendChild(stopButton);
    
    // 添加容器到页面
    document.body.appendChild(controlsContainer);
    
  } catch (error) {
    console.error('添加控制按钮失败:', error);
  }
}

/**
 * 处理开始处理按钮点击
 */
async function handleStartProcessing(): Promise<void> {
  try {
    console.log('开始处理 - 当前处理状态:', isProcessing());
    
    // 检查是否已经在处理中
    if (isProcessing()) {
      console.log('已有处理任务在进行中，忽略本次请求');
      await addLogToSidebar('已有任务在进行中，请先停止当前任务', 'warning');
      return;
    }
    
    // 获取选择器配置
    const selectors = await getSelectors();
    if (!selectors) {
      showErrorNotification('获取选择器配置失败');
      return;
    }
    
    // 获取当前模式
    const mode = await getMode();
    const needConfirmation = mode === 'calibration';
    
    // 设置是否需要用户确认和处理状态
    console.log('设置处理状态为处理中');
    setProcessingState(true, needConfirmation);
    console.log('是否需要用户确认:', needConfirmation);
    
    // 根据页面类型进行处理
    if (isRecommendListPage()) {
      console.log('当前是推荐列表页，开始处理');
      await processRecommendListPage(selectors);
    } else if (isResumeDetailPage()) {
      console.log('当前是简历详情页，开始处理');
      await processResumeDetailPage(selectors);
    } else {
      console.log('当前页面不是推荐列表页或简历详情页');
      showErrorNotification('当前页面不是推荐列表页或简历详情页');
      setProcessingState(false);
    }
    
    // 处理完成后重置状态
    console.log('处理流程执行结束，重置处理状态');
    setProcessingState(false);
    
  } catch (error) {
    console.error('开始处理失败:', error);
    await addLogToSidebar(`开始处理失败: ${error.message}`, 'error');
    showErrorNotification(`开始处理失败: ${error.message}`);
    
    // 重置处理状态
    setProcessingState(false);
  }
}

/**
 * 检查是否正在处理中
 */
function isProcessing(): boolean {
  return getProcessingState().isProcessing;
}

/**
 * 获取当前处理状态
 */
function getProcessingState(): { isProcessing: boolean, needConfirmation: boolean } {
  // 调用resume-processor模块的getProcessingState函数
  // 这里我们假设该模块已导出该函数
  // 如果没有导出，则需要添加该导出
  try {
    // @ts-ignore - 添加类型忽略，因为TypeScript可能无法识别该导入
    return require('./modules/resume-processor').getProcessingState();
  } catch (error) {
    console.error('获取处理状态失败:', error);
    return { isProcessing: false, needConfirmation: false };
  }
}

/**
 * 处理停止处理按钮点击
 */
function handleStopProcessing(): void {
  try {
    // 设置处理状态为未处理
    setProcessingState(false);
    console.log('处理已停止');
    
    // 显示成功通知
    showSuccessNotification('已停止处理');
    
    // 添加日志
    addLogToSidebar('用户手动停止了处理', 'warning');
  } catch (error) {
    console.error('停止处理失败:', error);
    showErrorNotification(`停止处理失败: ${error.message}`);
  }
}

/**
 * 设置消息监听器
 */
function setupMessageListeners(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('内容脚本收到消息:', message.type);
    
    // 处理消息
    switch (message.type) {
      // 开始处理
      case 'startProcessing':
        console.log('收到开始处理消息');
        handleStartProcessing();
        sendResponse({ success: true });
        break;
        
      // 停止处理
      case 'stopProcessing':
        console.log('收到停止处理消息');
        handleStopProcessing();
        sendResponse({ success: true });
        break;
        
      // 获取当前页面状态
      case 'getPageStatus':
        const status = {
          pageType: currentPageType,
          isRecommendPage: isRecommendListPage(),
          isDetailPage: isResumeDetailPage()
        };
        console.log('页面状态请求:', status);
        sendResponse(status);
        break;
        
      default:
        console.log('未知消息类型:', message.type);
        sendResponse({ success: false, error: '未知消息类型' });
    }
    
    return true; // 保持消息通道开放以便异步响应
  });
}

// 在页面加载完成后初始化内容脚本
window.addEventListener('load', () => {
  // 首先确保处理状态重置
  setProcessingState(false);
  console.log('页面加载完成，重置处理状态');
  
  // 延迟初始化，确保页面已完全加载
  setTimeout(initialize, 500);
});

// 在DOMContentLoaded时检测页面类型
document.addEventListener('DOMContentLoaded', () => {
  // 先重置处理状态
  setProcessingState(false);
  console.log('DOM内容加载完成，重置处理状态');
  
  // 检测页面类型
  detectPageType();
});