// 背景脚本 - 管理扩展生命周期和消息通信
console.log('Boss直聘 Sourcing 智能助手 - 后台服务已启动');

// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装，初始化扩展配置
    chrome.storage.local.set({
      // 初始化筛选规则
      filterRules: {
        operator: 'AND',
        conditions: []
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
        education: "div.base-info.join-text-wrap",
        experience: "div.base-info.join-text-wrap",
        school: "div.timeline-wrap.edu-exps div.join-text-wrap",
        company: "div.timeline-wrap.work-exps div.join-text-wrap",
        position: "div.row.row-flex.geek-desc",
        skills: "div.tags",
        greetButton: "button.btn.btn-greet",
        detailPage: {
          container: "div.resume-detail-wrap",
          workExperience: "div.geek-work-experience-wrap",
          educationExperience: "div.geek-education-experience-wrap",
          projectExperience: "div.geek-project-experience-wrap",
          expectation: "div.geek-expect-wrap"
        }
      }
    }, () => {
      console.log('扩展初始化配置完成');
    });
  }
});

// 监听来自content script或popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message);
  
  // 根据消息类型处理不同的请求
  switch (message.type) {
    // 切换操作模式（校准模式/自动模式）
    case 'toggleMode':
      chrome.storage.local.get(['mode'], (result) => {
        const newMode = result.mode === 'calibration' ? 'automatic' : 'calibration';
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
      
    default:
      sendResponse({ error: '未知消息类型' });
  }
  
  return true; // 保持消息通道开放以便异步响应
}); 