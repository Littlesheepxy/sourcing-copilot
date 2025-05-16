/**
 * 消息处理器模块
 * 处理来自内容脚本和侧边栏的消息
 */

import { rulesEvaluator } from './rules-evaluator';

/**
 * 初始化消息监听器
 */
export function initializeMessageListeners(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('后台收到消息:', message.type);
    
    // 根据消息类型处理不同的请求
    switch (message.type) {
      // 获取当前模式
      case 'getMode':
        handleGetMode(sendResponse);
        break;
        
      // 获取选择器配置
      case 'getSelectors':
        handleGetSelectors(sendResponse);
        break;
        
      // 更新选择器配置
      case 'updateSelectors':
        handleUpdateSelectors(message, sendResponse);
        break;
        
      // 评估简历
      case 'evaluateResume':
        handleEvaluateResume(message, sendResponse);
        break;
        
      // 添加日志
      case 'addLog':
        handleAddLog(message, sendResponse);
        break;
        
      // 更新页面状态
      case 'updatePageStatus':
        handleUpdatePageStatus(message);
        break;
        
      // 获取简化规则配置
      case 'getSimpleRulesConfig':
        handleGetSimpleRulesConfig(sendResponse);
        break;
        
      // 保存简化规则配置
      case 'saveSimpleRulesConfig':
        handleSaveSimpleRulesConfig(message, sendResponse);
        break;
        
      // 切换操作模式
      case 'toggleMode':
        handleToggleMode(message, sendResponse);
        break;
        
      // 未知消息类型
      default:
        sendResponse({ error: '未知消息类型' });
    }
    
    return true; // 保持消息通道开放以便异步响应
  });
}

/**
 * 处理获取当前模式的请求
 * @param sendResponse 发送响应的函数
 */
function handleGetMode(sendResponse: (response: any) => void): void {
  chrome.storage.local.get(['mode'], (result) => {
    sendResponse({ mode: result.mode || 'automatic' });
  });
}

/**
 * 处理获取选择器配置的请求
 * @param sendResponse 发送响应的函数
 */
function handleGetSelectors(sendResponse: (response: any) => void): void {
  chrome.storage.local.get(['selectors'], (result) => {
    sendResponse({ selectors: result.selectors });
  });
}

/**
 * 处理更新选择器配置的请求
 * @param message 消息对象
 * @param sendResponse 发送响应的函数
 */
function handleUpdateSelectors(message: any, sendResponse: (response: any) => void): void {
  chrome.storage.local.set({ selectors: message.selectors }, () => {
    sendResponse({ success: true });
  });
}

/**
 * 处理评估简历的请求
 * @param message 消息对象
 * @param sendResponse 发送响应的函数
 */
function handleEvaluateResume(message: any, sendResponse: (response: any) => void): void {
  const evalId = message.evalId || `eval-${Date.now().toString(36)}`;
  console.log(`[${evalId}] 接收到评估简历请求`);
  
  if (message.useSimpleRules) {
    console.log(`[${evalId}] 使用简单规则引擎评估`);
    
    // 使用简单规则引擎评估
    rulesEvaluator.evaluateCandidate(message.resumeData)
      .then(evaluationResult => {
        console.log(`[${evalId}] 评估结果:`, evaluationResult);
        
        // 构建详细的响应
        const response = {
          result: evaluationResult.passed,
          engineType: 'simple',
          details: {
            score: evaluationResult.score,
            threshold: evaluationResult.passed ? 60 : 0,
            reason: evaluationResult.passed ? '符合筛选条件' : '不符合筛选条件',
            matchedRules: []
          }
        };
        
        // 发送响应
        sendResponse(response);
      })
      .catch(error => {
        console.error(`[${evalId}] 评估失败:`, error);
        sendResponse({
          result: false,
          error: `评估失败: ${error.message}`
        });
      });
  } else {
    // 使用传统规则引擎作为备选
    console.log(`[${evalId}] 不支持传统规则引擎，返回默认通过`);
    sendResponse({
      result: true,
      engineType: 'fallback',
      reason: '使用备选引擎，默认通过'
    });
  }
}

/**
 * 处理添加日志的请求
 * @param message 消息对象
 * @param sendResponse 发送响应的函数
 */
function handleAddLog(message: any, sendResponse: (response: any) => void): void {
  try {
    // 记录日志到存储
    chrome.storage.local.get(['logs'], (result) => {
      const logs = result.logs || [];
      const newLog = {
        timestamp: new Date().toISOString(),
        action: message.logType || 'info',
        details: message.content
      };
      logs.unshift(newLog); // 在数组开头添加，以便最新的日志显示在前面
      
      // 限制日志数量，防止过多
      const maxLogs = 1000;
      if (logs.length > maxLogs) {
        logs.length = maxLogs;
      }
      
      chrome.storage.local.set({ logs });
    });
    
    // 直接转发给侧边栏
    chrome.runtime.sendMessage({ 
      type: 'processingLog', 
      content: message.content,
      logType: message.logType
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('转发日志到侧边栏失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 处理更新页面状态的请求
 * @param message 消息对象
 */
function handleUpdatePageStatus(message: any): void {
  // 广播给所有侧边栏
  try {
    chrome.runtime.sendMessage({ 
      type: 'pageStatusUpdate', 
      status: message.status 
    });
    
    // 存储状态以便新打开的侧边栏可以获取
    chrome.storage.local.set({ currentPageStatus: message.status });
  } catch (error) {
    console.error('转发页面状态失败:', error);
  }
}

/**
 * 处理获取简化规则配置的请求
 * @param sendResponse 发送响应的函数
 */
function handleGetSimpleRulesConfig(sendResponse: (response: any) => void): void {
  rulesEvaluator.getConfig()
    .then(config => {
      console.log('返回规则配置');
      sendResponse({ success: true, config });
    })
    .catch(error => {
      console.error('获取简化规则配置失败:', error);
      sendResponse({ 
        success: false, 
        error: error.message || '获取规则配置失败' 
      });
    });
}

/**
 * 处理保存简化规则配置的请求
 * @param message 消息对象
 * @param sendResponse 发送响应的函数
 */
function handleSaveSimpleRulesConfig(message: any, sendResponse: (response: any) => void): void {
  console.log('保存简化规则配置');
  rulesEvaluator.saveConfig(message.config)
    .then(() => {
      console.log('规则保存成功');
      sendResponse({ success: true });
    })
    .catch(error => {
      console.error('保存规则配置失败:', error);
      sendResponse({ 
        success: false, 
        error: error.message || '保存规则配置失败' 
      });
    });
}

/**
 * 处理切换操作模式的请求
 * @param message 消息对象
 * @param sendResponse 发送响应的函数
 */
function handleToggleMode(message: any, sendResponse: (response: any) => void): void {
  chrome.storage.local.get(['mode'], (result) => {
    // 如果消息中包含mode，则使用消息中的mode
    const newMode = message.mode || (result.mode === 'calibration' ? 'automatic' : 'calibration');
    chrome.storage.local.set({ mode: newMode }, () => {
      sendResponse({ success: true, mode: newMode });
    });
  });
} 