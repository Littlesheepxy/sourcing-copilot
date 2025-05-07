// Sourcing Copilot - Boss直聘智能助手 侧边栏脚本

document.addEventListener('DOMContentLoaded', async () => {
  const modeSelect = document.getElementById('mode-select');
  const editRulesBtn = document.getElementById('edit-rules-btn');
  const resetRulesBtn = document.getElementById('reset-rules-btn');
  const startProcessingBtn = document.getElementById('start-processing-btn');
  const themeToggle = document.getElementById('theme-toggle');
  
  // 加载和初始化主题设置
  initializeTheme();
  
  // 获取当前模式
  try {
    const { mode } = await chrome.storage.local.get('mode');
    if (mode) {
      modeSelect.value = mode;
    }
  } catch (error) {
    console.error('获取模式失败:', error);
  }
  
  // 模式切换
  modeSelect.addEventListener('change', async () => {
    const mode = modeSelect.value;
    try {
      await chrome.storage.local.set({ mode });
      console.log('模式已更改为:', mode);
      
      // 向后台脚本发送模式更改消息
      chrome.runtime.sendMessage({ 
        type: 'toggleMode',
        mode
      });
    } catch (error) {
      console.error('保存模式失败:', error);
    }
  });
  
  // 编辑规则按钮
  editRulesBtn.addEventListener('click', () => {
    // 添加点击动画效果
    animateButtonClick(editRulesBtn);
    // 打开规则编辑弹窗
    openRuleModal();
  });
  
  // 重置规则按钮
  resetRulesBtn.addEventListener('click', async () => {
    // 添加点击动画效果
    animateButtonClick(resetRulesBtn);
    
    if (confirm('确定要重置所有规则吗？这将删除所有已配置的规则。')) {
      try {
        await chrome.runtime.sendMessage({ 
          type: 'updateRules',
          rules: { 
            id: 'root', 
            operator: 'AND', 
            conditions: [], 
            enabled: true 
          }
        });
        showToast('规则已重置');
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
      // 更新设置
      await chrome.storage.local.set({ 
        autoStart: true, 
        needConfirmation: false 
      });
      
      // 向当前活动标签页发送开始处理消息
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'startProcessing' });
        window.close(); // 关闭侧边栏
      } else {
        showToast('无法获取当前标签页', 'error');
      }
    } catch (error) {
      console.error('开始处理失败:', error);
      showToast('开始处理失败: ' + error.message, 'error');
    }
  });
  
  // 主题切换按钮
  themeToggle.addEventListener('click', () => {
    toggleTheme();
  });
  
  // 处理来自规则弹窗的消息
  window.addEventListener('message', (event) => {
    if (event.data.type === 'RULES_SAVED') {
      console.log('规则已保存:', event.data.rules);
      // 更新本地规则
      chrome.storage.local.set({ rules: event.data.rules });
      showToast('规则已保存');
    }
  });
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

// 打开规则编辑弹窗
function openRuleModal() {
  // 获取当前标签页
  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    if (activeTab && activeTab.id) {
      // 向当前标签页注入弹窗
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: injectRuleModal
      }).catch(error => {
        console.error('注入规则弹窗失败:', error);
        // 如果注入失败，打开模态框页面
        chrome.tabs.create({ url: chrome.runtime.getURL('modal/rule-modal.html') });
      });
    } else {
      // 如果无法获取当前标签页，直接打开模态框页面
      chrome.tabs.create({ url: chrome.runtime.getURL('modal/rule-modal.html') });
    }
  });
}

// 在页面中注入规则弹窗
function injectRuleModal() {
  // 检查是否已存在弹窗
  if (document.getElementById('sourcing-rule-modal-container')) {
    return;
  }
  
  // 创建弹窗容器
  const container = document.createElement('div');
  container.id = 'sourcing-rule-modal-container';
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
  iframe.src = chrome.runtime.getURL('modal/rule-modal.html');
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
    if (event.data.type === 'CLOSE_RULE_MODAL') {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  });
  
  // 添加到页面
  document.body.appendChild(container);
} 