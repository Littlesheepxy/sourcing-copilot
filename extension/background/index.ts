/**
 * Boss直聘 Sourcing 智能助手 - 后台服务
 */
import { RulesEvaluator } from '../../shared/core/rules-engine/evaluator';
import { LogicalOperator } from '../../shared/core/rules-engine/types';

console.log('Boss直聘 Sourcing 智能助手 - 后台服务已启动');

// 初始化规则引擎
const rulesEvaluator = new RulesEvaluator();

// 设置侧边栏行为 - 点击扩展图标时打开侧边栏
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(error => console.error('设置侧边栏行为失败:', error));

// 监听标签页更新事件，在Boss直聘网站上启用侧边栏
// @ts-ignore - 忽略可能的类型错误
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab?.url) return;
  
  const url = new URL(tab.url);
  // 在Boss直聘网站上启用侧边栏
  if (url.hostname.includes('zhipin.com')) {
    try {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'sidebar.html',
        enabled: true
      });
      console.log('Boss直聘网站侧边栏已启用');
    } catch (error) {
      console.error('设置侧边栏选项失败:', error);
    }
  } else {
    // 在其他网站上禁用侧边栏
    try {
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false
      });
    } catch (error) {
      console.error('禁用侧边栏失败:', error);
    }
  }
});

// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装，初始化扩展配置
    chrome.storage.local.set({
      // 初始化筛选规则
      filterRules: {
        operator: LogicalOperator.AND,
        conditions: [],
        enabled: true
      },
      // 初始化模式（校准模式/自动模式）
      mode: 'calibration', // 'calibration' 或 'automatic'
      // 初始化日志
      logs: [],
      // 初始化标记数据
      markedData: {
        positive: [], // 人工标记为符合的简历
        negative: []  // 人工标记为不符合的简历
      },
      // 字段映射配置
      selectors: {
        name: ".name",
        education: ".base-info.job-detail",
        experience: ".base-info.job-detail",
        school: ".edu-exp-box .text",
        company: ".work-exp-box .text",
        position: ".job-header",
        skills: ".tag-list",
        greetButton: ".btn-greet",
        resumeCard: ".recommend-card-wrap",
        detailPage: {
          container: ".detail-content",
          workExperience: ".work-exp-box",
          educationExperience: ".edu-exp-box",
          projectExperience: ".project-exp-box",
          expectation: ".expect-box"
        }
      },
      // 初始化为需要用户确认
      autoStart: false, // 设置为false，表示不会自动开始处理
      needConfirmation: true // 需要用户确认
    }, () => {
      console.log('扩展初始化配置完成');
    });
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message);
  
  // 根据消息类型处理不同的请求
  switch (message.type) {
    // 切换操作模式（校准模式/自动模式）
    case 'toggleMode':
      chrome.storage.local.get(['mode'], (result) => {
        // 如果消息中包含mode，则使用消息中的mode
        const newMode = message.mode || (result.mode === 'calibration' ? 'automatic' : 'calibration');
        chrome.storage.local.set({ mode: newMode }, () => {
          sendResponse({ success: true, mode: newMode });
        });
      });
      return true; // 保持消息通道开放以便异步响应
      
    // 更新筛选规则
    case 'updateRules':
      chrome.storage.local.set({ filterRules: message.rules }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    // 添加日志
    case 'addLog':
      chrome.storage.local.get(['logs'], (result) => {
        const logs = result.logs || [];
        const newLog = {
          timestamp: new Date().toISOString(),
          action: message.action,
          details: message.details
        };
        logs.unshift(newLog); // 在数组开头添加，以便最新的日志显示在前面
        
        // 限制日志数量，防止过多
        const maxLogs = 1000;
        if (logs.length > maxLogs) {
          logs.length = maxLogs;
        }
        
        chrome.storage.local.set({ logs }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
      
    // 打开侧边栏
    case 'openSidebar':
      try {
        // 获取当前标签页
        chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
          if (activeTab && activeTab.id) {
            // 使用Chrome侧边栏API打开侧边栏
            chrome.sidePanel.open({ tabId: activeTab.id });
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: '无法获取当前标签页' });
          }
        });
      } catch (error) {
        console.error('打开侧边栏失败:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
      
    // 添加人工标记数据
    case 'addMarkedData':
      chrome.storage.local.get(['markedData'], (result) => {
        const markedData = result.markedData || { positive: [], negative: [] };
        
        if (message.isPositive) {
          markedData.positive.push(message.resumeData);
        } else {
          markedData.negative.push(message.resumeData);
        }
        
        chrome.storage.local.set({ markedData }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
      
    // 获取当前模式
    case 'getMode':
      chrome.storage.local.get(['mode'], (result) => {
        sendResponse({ mode: result.mode || 'calibration' });
      });
      return true;
      
    // 获取筛选规则
    case 'getRules':
      chrome.storage.local.get(['filterRules'], (result) => {
        sendResponse({ rules: result.filterRules });
      });
      return true;
      
    // 获取字段选择器配置
    case 'getSelectors':
      chrome.storage.local.get(['selectors'], (result) => {
        sendResponse({ selectors: result.selectors });
      });
      return true;
      
    // 更新字段选择器配置
    case 'updateSelectors':
      chrome.storage.local.set({ selectors: message.selectors }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    // 获取日志
    case 'getLogs':
      chrome.storage.local.get(['logs'], (result) => {
        sendResponse({ logs: result.logs || [] });
      });
      return true;
      
    // 使用规则引擎评估简历
    case 'evaluateResume':
      try {
        const result = rulesEvaluator.evaluateRules(
          { data: message.resumeData },
          message.rules
        );
        sendResponse({ result });
      } catch (error) {
        console.error('规则评估错误:', error);
        sendResponse({ error: error.message });
      }
      return true;
    
    // 弹窗中使用规则引擎评估规则
    case 'evaluateRules':
      try {
        // 使用shared中的评估器，确保与web-app保持一致
        const result = rulesEvaluator.evaluateRules(
          { data: message.data },
          message.rules
        );
        sendResponse({ result });
      } catch (error) {
        console.error('规则评估错误:', error);
        sendResponse({ error: error.message });
      }
      return true;
    
    // AI 辅助生成规则
    case 'generateRules':
      try {
        // 这里调用AI服务生成规则
        // 由于实际的AI服务可能需要异步调用，这里简化处理
        // 您可以根据实际情况替换为适当的AI服务调用
        generateRulesFromPrompt(message.prompt)
          .then(rules => {
            sendResponse({ rules });
          })
          .catch(error => {
            console.error('生成规则错误:', error);
            sendResponse({ error: error.message });
          });
      } catch (error) {
        console.error('生成规则错误:', error);
        sendResponse({ error: error.message });
      }
      return true;
      
    default:
      sendResponse({ error: '未知消息类型' });
  }
  
  return true; // 保持消息通道开放以便异步响应
});

// AI辅助生成规则的示例实现
// 在实际项目中，您应该替换为真实的AI服务调用
async function generateRulesFromPrompt(prompt: string) {
  // 这里模拟AI服务的调用，生成简单的规则
  // 在实际项目中，您可以调用OpenAI API或其他AI服务来生成规则
  
  // 等待一段时间，模拟API调用
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 生成示例规则
  return {
    id: 'root',
    operator: LogicalOperator.AND,
    conditions: [
      {
        id: Math.random().toString(36).substr(2, 9),
        field: 'experience',
        operator: 'greaterThan',
        value: '3',
        enabled: true
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        field: 'skills',
        operator: 'contains',
        value: prompt.includes('Java') ? 'Java' : '前端',
        enabled: true
      }
    ],
    enabled: true
  };
} 