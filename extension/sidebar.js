// Sourcing Copilot - Boss直聘智能助手 侧边栏脚本

document.addEventListener('DOMContentLoaded', async () => {
  // 获取DOM元素
  const editRulesBtn = document.getElementById('edit-rules-btn');
  const resetRulesBtn = document.getElementById('reset-rules-btn');
  const startProcessingBtn = document.getElementById('start-processing-btn');
  const processingControlsDiv = document.getElementById('processing-controls');
  const pauseProcessingBtn = document.getElementById('pause-processing-btn');
  const stopProcessingBtn = document.getElementById('stop-processing-btn');
  const logContainer = document.getElementById('log-container');
  const clearLogBtn = document.getElementById('clear-log-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const autoModeIndicator = document.getElementById('auto-mode-indicator');
  const autoModeDot = autoModeIndicator.querySelector('.auto-mode-dot');
  const autoModeText = document.getElementById('auto-mode-text');
  
  // 系统设置和AI服务配置相关元素
  const processingSpeedSelect = document.getElementById('processing-speed');
  const maxCandidatesSelect = document.getElementById('max-candidates');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  
  const aiServiceSelect = document.getElementById('ai-service');
  const apiKeyInput = document.getElementById('api-key');
  const apiModelSelect = document.getElementById('api-model');
  const testApiBtn = document.getElementById('test-api-btn');
  const saveApiBtn = document.getElementById('save-api-btn');
  const toggleApiKeyVisibilityBtn = document.getElementById('toggle-api-key-visibility');
  const eyeIcon = document.getElementById('eye-icon');
  const eyeOffIcon = document.getElementById('eye-off-icon');
  
  // 设置模态窗口相关元素
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  
  // 页面状态相关元素
  const pageStatusDot = document.getElementById('page-status-dot');
  const pageStatusText = document.getElementById('page-status-text');
  const jobPositionText = document.getElementById('job-position-text');
  
  // 处理状态
  let isProcessing = false;
  let isPaused = false;
  
  // 设置按钮点击事件
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      animateButtonClick(settingsBtn);
      // 显示设置模态窗口
      if (settingsModal) {
        settingsModal.style.display = 'flex';
      }
    });
  }
  
  // 关闭设置模态窗口
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      if (settingsModal) {
        settingsModal.style.display = 'none';
      }
    });
  }
  
  // 点击模态窗口外部关闭模态窗口
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
      }
    });
  }
  
  // 设置选项卡切换功能
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabButtons.length > 0) {
    tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        // 移除所有tab-btn的active类
        tabButtons.forEach((btn) => btn.classList.remove('active'));
        // 移除所有tab-content的active类
        tabContents.forEach((content) => content.classList.remove('active'));
        
        // 添加当前tab-btn的active类
        button.classList.add('active');
        // 获取对应的tab内容并显示
        const tabName = button.getAttribute('data-tab');
        const tabContent = document.getElementById(`tab-${tabName}`);
        if (tabContent) {
          tabContent.classList.add('active');
        }
      });
    });
  }
  
  // 加载和初始化主题设置
  initializeTheme();
  
  // 获取自动模式状态并更新UI
  updateAutoModeStatus();
  
  // 加载系统设置
  loadSystemSettings();
  
  // 加载AI服务配置
  loadAIServiceConfig();
  
  // 初始加载页面状态
  loadPageStatus();
  
  // 监听页面状态更新
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'pageStatusUpdate') {
      updatePageStatusUI(message.status);
    }
  });
  
  // 编辑规则按钮
  editRulesBtn.addEventListener('click', () => {
    // 添加点击动画效果
    animateButtonClick(editRulesBtn);
    // 打开规则编辑弹窗
    openSimpleRuleModal();
  });
  
  // 重置规则按钮
  resetRulesBtn.addEventListener('click', async () => {
    // 添加点击动画效果
    animateButtonClick(resetRulesBtn);
    
    if (confirm('确定要重置所有规则吗？这将删除所有已配置的规则。')) {
      try {
        await chrome.runtime.sendMessage({ 
          type: 'saveSimpleRulesConfig',
          config: { 
            rules: [],
            autoMode: false
          }
        });
        showToast('规则已重置');
        updateAutoModeStatus();
      } catch (error) {
        console.error('重置规则失败:', error);
        showToast('重置规则失败: ' + error.message, 'error');
      }
    }
  });
  
  // 开始处理按钮
  startProcessingBtn.addEventListener('click', async () => {
    // 添加点击动画效果
    animateButtonClick(startProcessingBtn);
    
    try {
      // 获取当前标签页
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        // 获取简易规则配置
        const response = await chrome.runtime.sendMessage({ 
          type: 'getSimpleRulesConfig'
        });
        
        console.log('获取规则配置响应:', response);
        
        if (response && response.success && response.config) {
          // 切换到处理状态UI
          toggleProcessingUI(true);
          
          // 发送开始处理消息给内容脚本
          chrome.tabs.sendMessage(activeTab.id, { 
            type: 'startProcessing',
            // 无论如何都启用自动模式，因为点击"开始处理"就意味着要自动处理
            autoMode: true
          });
          
          // 添加启动日志
          addLog('开始处理简历', 'success');
        } else {
          let errorMsg = '获取规则配置失败';
          if (response && !response.success && response.error) {
            errorMsg += ': ' + response.error;
          } else if (!response) {
            errorMsg += ': 无响应';
          }
          
          console.error(errorMsg);
          showToast(errorMsg, 'error');
          
          // 提示用户设置规则
          if (confirm('规则配置不可用。是否立即设置规则？')) {
            openSimpleRuleModal();
          }
        }
      }
    } catch (error) {
      console.error('启动处理失败:', error);
      showToast('启动处理失败: ' + error.message, 'error');
    }
  });
  
  // 暂停处理按钮
  pauseProcessingBtn.addEventListener('click', async () => {
    animateButtonClick(pauseProcessingBtn);
    
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        if (isPaused) {
          // 恢复处理
          chrome.tabs.sendMessage(activeTab.id, { type: 'resumeProcessing' });
          pauseProcessingBtn.querySelector('.btn-text').textContent = '暂停';
          pauseProcessingBtn.querySelector('.pause-icon').style.display = 'inline-block';
          pauseProcessingBtn.querySelector('.play-icon').style.display = 'none';
          addLog('恢复处理简历...', 'info');
        } else {
          // 暂停处理
          chrome.tabs.sendMessage(activeTab.id, { type: 'pauseProcessing' });
          pauseProcessingBtn.querySelector('.btn-text').textContent = '继续';
          pauseProcessingBtn.querySelector('.pause-icon').style.display = 'none';
          pauseProcessingBtn.querySelector('.play-icon').style.display = 'inline-block';
          addLog('暂停处理简历...', 'warning');
        }
        
        isPaused = !isPaused;
      }
    } catch (error) {
      console.error('暂停/恢复处理失败:', error);
      showToast('操作失败: ' + error.message, 'error');
    }
  });
  
  // 终止处理按钮
  stopProcessingBtn.addEventListener('click', async () => {
    animateButtonClick(stopProcessingBtn);
    
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'stopProcessing' });
        // 切换回初始UI
        toggleProcessingUI(false);
        addLog('终止处理简历', 'error');
      }
    } catch (error) {
      console.error('终止处理失败:', error);
      showToast('终止处理失败: ' + error.message, 'error');
    }
  });
  
  // 清除日志按钮
  clearLogBtn.addEventListener('click', () => {
    animateButtonClick(clearLogBtn);
    clearLogs();
  });
  
  // 主题切换按钮
  themeToggle.addEventListener('click', () => {
    toggleTheme();
  });
  
  // 处理来自规则弹窗的消息
  window.addEventListener('message', (event) => {
    if (event.data.type === 'SIMPLE_RULES_SAVED') {
      console.log('简易规则已保存:', event.data.config);
      showToast('规则已保存');
      // 更新自动模式状态
      updateAutoModeStatus();
    }
  });
  
  // 监听来自内容脚本的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'processingLog') {
      addLog(message.content, message.logType);
    }
    
    if (message.type === 'processingComplete') {
      toggleProcessingUI(false);
      addLog('简历处理完成', 'success');
    }
    
    if (message.type === 'processingStatus') {
      // 更新进度信息
      if (message.processed && message.total) {
        addLog(`已处理 ${message.processed}/${message.total} 份简历`, 'info');
      }
    }
    
    if (message.type === 'autoModeChanged') {
      updateAutoModeStatus();
    }
  });
  
  // 更新自动模式状态
  function updateAutoModeStatus(isProcessingActive = false) {
    // 更新指示器状态
    if (isProcessingActive) {
      autoModeDot.classList.add('active');
      autoModeText.textContent = '自动模式: 已启用';
    } else {
      autoModeDot.classList.remove('active');
      autoModeText.textContent = '自动模式: 未启用';
    }
  }
  
  // 切换处理UI状态
  function toggleProcessingUI(isProcessingActive) {
    isProcessing = isProcessingActive;
    
    // 更新自动模式状态
    updateAutoModeStatus(isProcessingActive);
    
    if (isProcessingActive) {
      // 显示处理控制按钮，隐藏开始按钮
      startProcessingBtn.style.display = 'none';
      processingControlsDiv.style.display = 'flex';
      // 显示日志容器
      logContainer.parentElement.style.display = 'block';
      
      // 重置暂停按钮状态
      isPaused = false;
      pauseProcessingBtn.querySelector('.btn-text').textContent = '暂停';
      pauseProcessingBtn.querySelector('.pause-icon').style.display = 'inline-block';
      pauseProcessingBtn.querySelector('.play-icon').style.display = 'none';
    } else {
      // 显示开始按钮，隐藏处理控制按钮
      startProcessingBtn.style.display = 'block';
      processingControlsDiv.style.display = 'none';
    }
  }
  
  // 添加日志
  function addLog(content, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    // 时间戳
    const timestamp = new Date().toLocaleTimeString();
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = timestamp;
    
    // 日志内容
    const contentSpan = document.createElement('span');
    contentSpan.className = 'log-content';
    contentSpan.textContent = content;
    
    // 组装日志条目
    logEntry.appendChild(timeSpan);
    logEntry.appendChild(contentSpan);
    
    // 添加到日志容器
    logContainer.appendChild(logEntry);
    
    // 自动滚动到底部
    logContainer.scrollTop = logContainer.scrollHeight;
  }
  
  // 清除日志
  function clearLogs() {
    logContainer.innerHTML = '';
  }
  
  // API密钥显示/隐藏切换
  if (toggleApiKeyVisibilityBtn) {
    toggleApiKeyVisibilityBtn.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
      } else {
        apiKeyInput.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
      }
    });
  }
  
  // 保存系统设置
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      animateButtonClick(saveSettingsBtn);
      saveSystemSettings();
    });
  }
  
  // 测试API连接
  if (testApiBtn) {
    testApiBtn.addEventListener('click', () => {
      animateButtonClick(testApiBtn);
      testApiConnection();
    });
  }
  
  // 保存API配置
  if (saveApiBtn) {
    saveApiBtn.addEventListener('click', () => {
      animateButtonClick(saveApiBtn);
      saveAIServiceConfig();
    });
  }
  
  // 加载系统设置
  async function loadSystemSettings() {
    try {
      const result = await chrome.storage.local.get('systemSettings');
      const settings = result.systemSettings || { 
        processingSpeed: 'normal', 
        maxCandidates: '50' 
      };
      
      // 设置表单值
      processingSpeedSelect.value = settings.processingSpeed;
      maxCandidatesSelect.value = settings.maxCandidates;
      
      console.log('系统设置已加载:', settings);
    } catch (error) {
      console.error('加载系统设置失败:', error);
      showToast('加载系统设置失败', 'error');
    }
  }
  
  // 保存系统设置
  async function saveSystemSettings() {
    try {
      const settings = {
        processingSpeed: processingSpeedSelect.value,
        maxCandidates: maxCandidatesSelect.value
      };
      
      await chrome.storage.local.set({ systemSettings: settings });
      
      console.log('系统设置已保存:', settings);
      showToast('系统设置已保存');
      
      // 通知后台脚本设置已更新
      chrome.runtime.sendMessage({ 
        type: 'systemSettingsUpdated',
        settings: settings
      });
    } catch (error) {
      console.error('保存系统设置失败:', error);
      showToast('保存系统设置失败: ' + error.message, 'error');
    }
  }
  
  // 加载AI服务配置
  async function loadAIServiceConfig() {
    try {
      const result = await chrome.storage.local.get('aiServiceConfig');
      const config = result.aiServiceConfig || { 
        service: 'deepseek', 
        apiKey: '', 
        model: 'deepseek-chat' 
      };
      
      // 设置表单值
      aiServiceSelect.value = config.service;
      apiKeyInput.value = config.apiKey;
      apiModelSelect.value = config.model;
      
      console.log('AI服务配置已加载');
    } catch (error) {
      console.error('加载AI服务配置失败:', error);
      showToast('加载AI服务配置失败', 'error');
    }
  }
  
  // 保存AI服务配置
  async function saveAIServiceConfig() {
    try {
      // 检查API密钥是否为空
      if (!apiKeyInput.value.trim()) {
        showToast('请输入API密钥', 'error');
        return;
      }
      
      const config = {
        service: aiServiceSelect.value,
        apiKey: apiKeyInput.value,
        model: apiModelSelect.value
      };
      
      await chrome.storage.local.set({ aiServiceConfig: config });
      
      console.log('AI服务配置已保存');
      showToast('AI服务配置已保存');
      
      // 通知后台脚本配置已更新
      chrome.runtime.sendMessage({ 
        type: 'aiServiceConfigUpdated',
        config: config
      });
    } catch (error) {
      console.error('保存AI服务配置失败:', error);
      showToast('保存AI服务配置失败: ' + error.message, 'error');
    }
  }
  
  // 测试API连接
  async function testApiConnection() {
    // 检查API密钥是否为空
    if (!apiKeyInput.value.trim()) {
      showToast('请输入API密钥', 'error');
      return;
    }
    
    showToast('正在测试连接...', 'info');
    
    // 构建测试配置
    const testConfig = {
      service: aiServiceSelect.value,
      apiKey: apiKeyInput.value,
      model: apiModelSelect.value
    };
    
    try {
      // 发送测试请求到后台脚本
      const response = await chrome.runtime.sendMessage({ 
        type: 'testApiConnection',
        config: testConfig
      });
      
      if (response && response.success) {
        showToast('API连接测试成功', 'success');
      } else {
        const errorMsg = response && response.error ? response.error : '未知错误';
        showToast('API连接测试失败: ' + errorMsg, 'error');
      }
    } catch (error) {
      console.error('API连接测试失败:', error);
      showToast('API连接测试失败: ' + error.message, 'error');
    }
  }
  
  // 初始化加载页面状态
  async function loadPageStatus() {
    try {
      // 尝试从存储中获取最新状态
      const result = await chrome.storage.local.get(['currentPageStatus']);
      if (result.currentPageStatus) {
        updatePageStatusUI(result.currentPageStatus);
      }
      
      // 从当前活动标签页获取最新状态
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        try {
          const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'getPageStatus' });
          if (response) {
            updatePageStatusUI(response);
          }
        } catch (error) {
          console.log('无法从内容脚本获取页面状态', error);
        }
      }
    } catch (error) {
      console.error('加载页面状态失败:', error);
    }
  }
  
  // 更新页面状态UI
  function updatePageStatusUI(status) {
    if (!status) return;
    
    if (status.isRecommendPage) {
      pageStatusDot.classList.add('connected');
      pageStatusDot.classList.remove('error');
      pageStatusText.textContent = '已连接到推荐页面';
    } else {
      pageStatusDot.classList.remove('connected');
      pageStatusDot.classList.add('error');
      pageStatusText.textContent = '未连接到推荐页面';
    }
    
    if (status.jobPosition && status.jobPosition !== '未检测到岗位信息') {
      jobPositionText.textContent = status.jobPosition;
    } else {
      jobPositionText.textContent = '未检测到岗位信息';
    }
  }
});

// 初始化主题
function initializeTheme() {
  // 尝试从存储中获取主题设置
  chrome.storage.local.get('theme', ({ theme }) => {
    const preferredTheme = theme || 'light';
    applyTheme(preferredTheme);
  });
}

// 切换主题
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  applyTheme(newTheme);
  
  // 保存主题设置到存储中
  chrome.storage.local.set({ theme: newTheme });
}

// 应用主题
function applyTheme(theme) {
  const body = document.body;
  const moonIcon = document.getElementById('moon-icon');
  const sunIcon = document.getElementById('sun-icon');
  
  body.setAttribute('data-theme', theme);
  
  // 更新图标显示
  if (theme === 'dark') {
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'block';
  } else {
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
  }
}

// 按钮点击动画
function animateButtonClick(button) {
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = 'scale(1)';
  }, 100);
}

// 显示提示消息
function showToast(message, type = 'success') {
  // 检查是否已存在toast元素
  let toast = document.getElementById('toast-notification');
  if (toast) {
    document.body.removeChild(toast);
  }
  
  // 创建新的toast元素
  toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 16px;
    border-radius: 4px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    transition: opacity 0.3s, transform 0.3s;
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  `;
  
  // 根据类型设置颜色
  if (type === 'error') {
    toast.style.backgroundColor = '#f44336';
    toast.style.color = 'white';
  } else {
    toast.style.backgroundColor = '#4caf50';
    toast.style.color = 'white';
  }
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 动画显示
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);
  
  // 3秒后隐藏
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// 打开简易规则编辑弹窗
function openSimpleRuleModal() {
  // 获取当前标签页
  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    if (activeTab && activeTab.id) {
      // 向当前标签页注入弹窗
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: injectSimpleRuleModal
      }).catch(error => {
        console.error('注入简易规则弹窗失败:', error);
        // 如果注入失败，打开模态框页面
        chrome.tabs.create({ url: chrome.runtime.getURL('modal/simple-rule-modal.html') });
      });
    } else {
      // 如果无法获取当前标签页，直接打开模态框页面
      chrome.tabs.create({ url: chrome.runtime.getURL('modal/simple-rule-modal.html') });
    }
  });
}

// 在页面中注入简易规则弹窗
function injectSimpleRuleModal() {
  // 检查是否已存在弹窗
  if (document.getElementById('sourcing-simple-rule-modal-container')) {
    return;
  }
  
  // 创建弹窗容器
  const container = document.createElement('div');
  container.id = 'sourcing-simple-rule-modal-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
  `;
  
  // 创建iframe来加载弹窗
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('modal/simple-rule-modal.html');
  iframe.style.cssText = `
    width: 90%;
    max-width: 800px;
    height: 90vh;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  container.appendChild(iframe);
  
  // 点击容器背景关闭弹窗
  container.addEventListener('click', (e) => {
    if (e.target === container) {
      document.body.removeChild(container);
    }
  });
  
  // 监听来自iframe的消息
  window.addEventListener('message', (event) => {
    if (event.data.type === 'CLOSE_SIMPLE_RULE_MODAL') {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  });
  
  // 添加到页面
  document.body.appendChild(container);
} 