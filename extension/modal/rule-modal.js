// Sourcing Copilot - Boss直聘智能助手 规则编辑弹窗脚本

// 导入shared库中的规则引擎相关模块
// 注意：需要在webpack配置中适当配置别名以使这些导入正常工作
// import { RulesEvaluator } from '../../shared/core/rules-engine/evaluator';
// import { ConditionOperator, LogicalOperator, RuleGroup, Condition } from '../../shared/core/rules-engine/types';
// import { RulesBuilder } from '../../shared/core/rules-engine/builder';

// 由于当前我们是在浏览器环境，我们需要通过Chrome消息API来使用共享模块，而不是直接导入
// 以下是规则引擎的基本类型定义，与shared模块保持一致

// 条件操作符枚举
const ConditionOperator = {
  EQUALS: 'equals',
  NOT_EQUALS: 'notEquals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'notContains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  GREATER_THAN: 'greaterThan',
  LESS_THAN: 'lessThan',
  GREATER_THAN_OR_EQUAL: 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL: 'lessThanOrEqual',
  REGEX: 'regex',
  EXISTS: 'exists',
  NOT_EXISTS: 'notExists'
};

// 逻辑操作符枚举
const LogicalOperator = {
  AND: 'AND',
  OR: 'OR'
};

// 字段选项
const fieldOptions = [
  { value: 'education', label: '学历' },
  { value: 'school', label: '学校' },
  { value: 'company', label: '公司' },
  { value: 'position', label: '岗位' },
  { value: 'experience', label: '经验年限' },
  { value: 'skills', label: '技能标签' },
];

// 操作符选项
const operatorOptions = [
  { value: ConditionOperator.CONTAINS, label: '包含' },
  { value: ConditionOperator.EQUALS, label: '等于' },
  { value: ConditionOperator.NOT_EQUALS, label: '不等于' },
  { value: ConditionOperator.STARTS_WITH, label: '开头是' },
  { value: ConditionOperator.ENDS_WITH, label: '结尾是' },
  { value: ConditionOperator.GREATER_THAN, label: '大于' },
  { value: ConditionOperator.LESS_THAN, label: '小于' },
  { value: ConditionOperator.REGEX, label: '正则匹配' },
];

// 生成唯一ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// 创建默认规则组
function createDefaultRuleGroup() {
  return {
    id: 'root',
    operator: LogicalOperator.AND,
    conditions: [],
    enabled: true
  };
}

// 当前规则状态
let currentRules = createDefaultRuleGroup();
let currentTheme = 'light'; // 当前主题状态

// DOM元素
let rulesContainer;
let tabButtons;
let tabContents;
let closeModalBtn;
let cancelBtn;
let saveRulesBtn;
let importRulesBtn;
let exportRulesBtn;
let resetRulesBtn;
let generateRulesBtn;
let testRulesBtn;
let aiPromptInput;
let testDataInput;
let aiResultDiv;
let testResultDiv;
let importFileInput;
let themeToggleBtn;
let moonIcon;
let sunIcon;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化DOM元素引用
  initDOMReferences();
  
  // 初始化主题设置
  await initializeTheme();
  
  // 加载规则和设置UI
  await loadRules();
  renderRules();
  setupTabNavigation();
  
  // 事件处理程序绑定
  bindEventHandlers();
});

// 初始化DOM元素引用
function initDOMReferences() {
  rulesContainer = document.getElementById('rules-container');
  tabButtons = document.querySelectorAll('.tab');
  tabContents = document.querySelectorAll('.tab-content');
  closeModalBtn = document.getElementById('close-modal');
  cancelBtn = document.getElementById('cancel-btn');
  saveRulesBtn = document.getElementById('save-rules-btn');
  importRulesBtn = document.getElementById('import-rules-btn');
  exportRulesBtn = document.getElementById('export-rules-btn');
  resetRulesBtn = document.getElementById('reset-rules-btn');
  generateRulesBtn = document.getElementById('generate-rules-btn');
  testRulesBtn = document.getElementById('test-rules-btn');
  aiPromptInput = document.getElementById('ai-prompt');
  testDataInput = document.getElementById('test-data');
  aiResultDiv = document.getElementById('ai-result');
  testResultDiv = document.getElementById('test-result');
  importFileInput = document.getElementById('import-file');
  themeToggleBtn = document.getElementById('theme-toggle');
  moonIcon = document.getElementById('moon-icon');
  sunIcon = document.getElementById('sun-icon');
}

// 绑定事件处理程序
function bindEventHandlers() {
  closeModalBtn.addEventListener('click', handleCloseModal);
  cancelBtn.addEventListener('click', handleCloseModal);
  saveRulesBtn.addEventListener('click', handleSaveRules);
  importRulesBtn.addEventListener('click', handleImportClick);
  exportRulesBtn.addEventListener('click', handleExport);
  resetRulesBtn.addEventListener('click', handleReset);
  generateRulesBtn.addEventListener('click', handleGenerateRules);
  testRulesBtn.addEventListener('click', handleTestRules);
  importFileInput.addEventListener('change', handleImportFile);
  
  // 主题切换监听器已在HTML中设置，这里不需要重复添加
}

// 初始化主题
async function initializeTheme() {
  try {
    // 尝试从Chrome存储获取主题设置
    const result = await chrome.storage.local.get('theme');
    currentTheme = result.theme || 'light';
    
    // 应用主题
    const body = document.body;
    body.setAttribute('data-theme', currentTheme);
    
    // 更新图标显示
    updateThemeIcons();
  } catch (error) {
    console.error('加载主题设置失败:', error);
    // 使用默认主题
    const body = document.body;
    body.setAttribute('data-theme', 'light');
  }
}

// 更新主题图标显示
function updateThemeIcons() {
  if (currentTheme === 'dark') {
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'block';
  } else {
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
  }
}

// 设置标签页导航
function setupTabNavigation() {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 移除所有活动标签
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // 激活当前标签
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// 加载规则
async function loadRules() {
  try {
    const result = await chrome.storage.local.get('rules');
    if (result.rules) {
      currentRules = result.rules;
    }
  } catch (error) {
    console.error('加载规则失败:', error);
  }
}

// 渲染规则
function renderRules() {
  rulesContainer.innerHTML = '';
  const ruleGroupElement = renderRuleGroup(currentRules, true);
  rulesContainer.appendChild(ruleGroupElement);
}

// 渲染规则组
function renderRuleGroup(group, isRoot = false) {
  const groupElement = document.createElement('div');
  groupElement.className = 'rule-group';
  groupElement.dataset.id = group.id;
  
  // 规则组头部
  const groupHeader = document.createElement('div');
  groupHeader.className = 'rule-group-header';
  
  // 添加图标
  const operatorIcon = document.createElement('div');
  operatorIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; color: var(--primary);">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="8" y1="12" x2="16" y2="12"></line>
      ${group.operator === LogicalOperator.AND ? '<line x1="12" y1="8" x2="12" y2="16"></line>' : ''}
    </svg>
  `;
  groupHeader.appendChild(operatorIcon);
  
  // 操作符选择
  const operatorSelect = document.createElement('select');
  operatorSelect.className = 'form-select';
  operatorSelect.innerHTML = `
    <option value="${LogicalOperator.AND}" ${group.operator === LogicalOperator.AND ? 'selected' : ''}>AND (并且)</option>
    <option value="${LogicalOperator.OR}" ${group.operator === LogicalOperator.OR ? 'selected' : ''}>OR (或者)</option>
  `;
  operatorSelect.addEventListener('change', (e) => {
    group.operator = e.target.value;
    
    // 更新图标
    const iconContainer = operatorIcon.querySelector('svg');
    if (e.target.value === LogicalOperator.AND) {
      iconContainer.innerHTML = `
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="8" y1="12" x2="16" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="16"></line>
      `;
    } else {
      iconContainer.innerHTML = `
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      `;
    }
  });
  
  groupHeader.appendChild(operatorSelect);
  
  // 添加条件按钮
  const addButtonContainer = document.createElement('div');
  addButtonContainer.style.marginLeft = '12px';
  addButtonContainer.style.display = 'flex';
  addButtonContainer.style.gap = '8px';
  
  const addConditionBtn = document.createElement('button');
  addConditionBtn.className = 'btn btn-secondary btn-sm';
  addConditionBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    添加条件
  `;
  addConditionBtn.addEventListener('click', () => {
    const newCondition = {
      id: generateId(),
      field: 'education',
      operator: ConditionOperator.CONTAINS,
      value: ''
    };
    addCondition(group.id, newCondition);
    renderRules();
  });
  
  const addGroupBtn = document.createElement('button');
  addGroupBtn.className = 'btn btn-secondary btn-sm';
  addGroupBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="8" y1="12" x2="16" y2="12"></line>
      <line x1="12" y1="8" x2="12" y2="16"></line>
    </svg>
    添加组
  `;
  addGroupBtn.addEventListener('click', () => {
    const newGroup = {
      id: generateId(),
      operator: LogicalOperator.AND,
      conditions: []
    };
    addGroup(group.id, newGroup);
    renderRules();
  });
  
  addButtonContainer.appendChild(addConditionBtn);
  addButtonContainer.appendChild(addGroupBtn);
  
  groupHeader.appendChild(addButtonContainer);
  
  // 如果不是根规则组，添加删除按钮
  if (!isRoot) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      删除
    `;
    deleteBtn.style.marginLeft = 'auto';
    deleteBtn.addEventListener('click', () => {
      const parentElement = groupElement.parentElement;
      if (parentElement && parentElement.classList.contains('rule-group-content')) {
        const parentGroup = parentElement.parentElement;
        if (parentGroup && parentGroup.classList.contains('rule-group')) {
          const parentGroupId = parentGroup.dataset.id;
          deleteRule(parentGroupId, group.id);
          renderRules();
        }
      }
    });
    groupHeader.appendChild(deleteBtn);
  }
  
  groupElement.appendChild(groupHeader);
  
  // 规则组内容
  const groupContent = document.createElement('div');
  groupContent.className = 'rule-group-content';
  
  // 渲染条件
  group.conditions.forEach(condition => {
    if (condition.conditions) {
      // 渲染子规则组
      groupContent.appendChild(renderRuleGroup(condition));
    } else {
      // 渲染条件
      groupContent.appendChild(renderCondition(condition, group.id));
    }
  });
  
  groupElement.appendChild(groupContent);
  
  return groupElement;
}

// 渲染条件
function renderCondition(condition, parentId) {
  const conditionElement = document.createElement('div');
  conditionElement.className = 'rule-condition';
  conditionElement.dataset.id = condition.id;
  
  // 拖拽手柄
  const dragHandle = document.createElement('div');
  dragHandle.className = 'rule-condition-draghandle';
  dragHandle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="12" r="1"></circle>
      <circle cx="9" cy="5" r="1"></circle>
      <circle cx="9" cy="19" r="1"></circle>
      <circle cx="15" cy="12" r="1"></circle>
      <circle cx="15" cy="5" r="1"></circle>
      <circle cx="15" cy="19" r="1"></circle>
    </svg>
  `;
  conditionElement.appendChild(dragHandle);
  
  // 字段选择
  const fieldSelect = document.createElement('select');
  fieldSelect.className = 'form-select';
  
  fieldOptions.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    optionElement.selected = condition.field === option.value;
    fieldSelect.appendChild(optionElement);
  });
  
  fieldSelect.addEventListener('change', (e) => {
    condition.field = e.target.value;
  });
  
  conditionElement.appendChild(fieldSelect);
  
  // 操作符选择
  const operatorSelect = document.createElement('select');
  operatorSelect.className = 'form-select';
  
  operatorOptions.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    optionElement.selected = condition.operator === option.value;
    operatorSelect.appendChild(optionElement);
  });
  
  operatorSelect.addEventListener('change', (e) => {
    condition.operator = e.target.value;
  });
  
  conditionElement.appendChild(operatorSelect);
  
  // 值输入
  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'form-input';
  valueInput.placeholder = '输入条件值...';
  valueInput.value = condition.value || '';
  
  valueInput.addEventListener('input', (e) => {
    condition.value = e.target.value;
  });
  
  conditionElement.appendChild(valueInput);
  
  // 删除按钮
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-danger btn-sm btn-icon';
  deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  
  deleteBtn.addEventListener('click', () => {
    deleteRule(parentId, condition.id);
    renderRules();
  });
  
  conditionElement.appendChild(deleteBtn);
  
  return conditionElement;
}

// 添加条件
function addCondition(parentId, condition) {
  function findAndAddCondition(group, id, newCondition) {
    if (group.id === id) {
      group.conditions.push(newCondition);
      return true;
    }
    
    for (let i = 0; i < group.conditions.length; i++) {
      const item = group.conditions[i];
      if (item.conditions && findAndAddCondition(item, id, newCondition)) {
        return true;
      }
    }
    
    return false;
  }
  
  findAndAddCondition(currentRules, parentId, condition);
}

// 添加规则组
function addGroup(parentId, group) {
  function findAndAddGroup(parentGroup, id, newGroup) {
    if (parentGroup.id === id) {
      parentGroup.conditions.push(newGroup);
      return true;
    }
    
    for (let i = 0; i < parentGroup.conditions.length; i++) {
      const item = parentGroup.conditions[i];
      if (item.conditions && findAndAddGroup(item, id, newGroup)) {
        return true;
      }
    }
    
    return false;
  }
  
  findAndAddGroup(currentRules, parentId, group);
}

// 删除规则
function deleteRule(parentId, ruleId) {
  function findAndDeleteRule(group, id, targetId) {
    if (group.id === id) {
      group.conditions = group.conditions.filter(item => item.id !== targetId);
      return true;
    }
    
    for (let i = 0; i < group.conditions.length; i++) {
      const item = group.conditions[i];
      if (item.conditions && findAndDeleteRule(item, id, targetId)) {
        return true;
      }
    }
    
    return false;
  }
  
  findAndDeleteRule(currentRules, parentId, ruleId);
}

// 关闭弹窗
function handleCloseModal() {
  window.parent.postMessage({ type: 'CLOSE_RULE_MODAL' }, '*');
}

// 保存规则
async function handleSaveRules() {
  try {
    await chrome.storage.local.set({ rules: currentRules });
    
    // 向后台脚本发送更新规则消息
    chrome.runtime.sendMessage({ 
      type: 'updateRules',
      rules: currentRules
    });
    
    // 通知父窗口规则已保存
    window.parent.postMessage({ 
      type: 'RULES_SAVED', 
      rules: currentRules 
    }, '*');
    
    // 关闭弹窗
    handleCloseModal();
  } catch (error) {
    console.error('保存规则失败:', error);
    alert('保存规则失败: ' + error.message);
  }
}

// 导入规则点击处理
function handleImportClick() {
  importFileInput.click();
}

// 导入文件处理
function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const rules = JSON.parse(e.target.result);
      currentRules = rules;
      renderRules();
    } catch (error) {
      alert('导入规则失败: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// 导出规则处理
function handleExport() {
  const rulesJson = JSON.stringify(currentRules, null, 2);
  const blob = new Blob([rulesJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sourcing_rules.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 重置规则处理
function handleReset() {
  if (confirm('确定要重置所有规则吗？这将删除所有已配置的规则。')) {
    currentRules = createDefaultRuleGroup();
    renderRules();
  }
}

// AI生成规则
async function handleGenerateRules() {
  const prompt = aiPromptInput.value.trim();
  
  if (!prompt) {
    showToast('请输入筛选条件描述', 'error');
    return;
  }
  
  // 清空之前的结果
  aiResultDiv.innerHTML = '';
  
  // 显示加载状态
  const loadingElement = document.createElement('div');
  loadingElement.className = 'loading';
  loadingElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; padding: 1rem;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      <span style="margin-left: 0.5rem;">AI正在生成规则...</span>
    </div>
  `;
  
  aiResultDiv.appendChild(loadingElement);
  aiResultDiv.classList.remove('hidden');
  
  try {
    // 向后台发送消息，请求AI生成规则
    const response = await chrome.runtime.sendMessage({
      type: 'generateRules',
      prompt: prompt
    });
    
    // 移除加载状态
    aiResultDiv.removeChild(loadingElement);
    
    if (response && response.success) {
      // 解析规则
      try {
        const rules = JSON.parse(response.rules);
        currentRules = rules;
        renderRules();
        
        // 显示成功消息
        const successElement = document.createElement('div');
        successElement.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 1rem; color: #10b981;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span style="margin-left: 0.5rem; font-weight: 500;">规则生成成功！</span>
          </div>
          <p>已自动应用生成的规则，您可以在"手动编辑"选项卡中查看和修改。</p>
          <pre style="background-color: rgba(0,0,0,0.03); padding: 0.75rem; border-radius: var(--radius); margin-top: 0.75rem; overflow: auto; max-height: 200px;">${JSON.stringify(rules, null, 2)}</pre>
        `;
        aiResultDiv.appendChild(successElement);
        
        // 自动切换到手动编辑选项卡
        setTimeout(() => {
          document.querySelector('.tab[data-tab="manual"]').click();
        }, 1500);
      } catch (error) {
        console.error('解析AI生成的规则失败:', error);
        showError('规则格式无效: ' + error.message);
      }
    } else {
      showError('生成规则失败: ' + (response?.error || '未知错误'));
    }
  } catch (error) {
    console.error('发送AI生成规则请求失败:', error);
    showError('发送请求失败: ' + error.message);
  }
  
  // 显示错误消息的函数
  function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 1rem; color: var(--danger);">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span style="margin-left: 0.5rem; font-weight: 500;">生成失败</span>
      </div>
      <p>${message}</p>
      <p style="margin-top: 0.5rem;">请检查您的输入，并确保网络连接正常。</p>
    `;
    aiResultDiv.appendChild(errorElement);
  }
}

// 测试规则
async function handleTestRules() {
  const testDataStr = testDataInput.value.trim();
  
  if (!testDataStr) {
    showToast('请输入测试数据', 'error');
    return;
  }
  
  // 清空之前的结果
  testResultDiv.innerHTML = '';
  
  try {
    // 解析测试数据
    const testData = JSON.parse(testDataStr);
    
    // 显示加载状态
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <span style="margin-left: 0.5rem;">正在评估规则...</span>
      </div>
    `;
    
    testResultDiv.appendChild(loadingElement);
    testResultDiv.classList.remove('hidden');
    
    // 向后台发送消息，测试规则
    const response = await chrome.runtime.sendMessage({
      type: 'evaluateRules',
      rules: currentRules,
      data: testData
    });
    
    // 移除加载状态
    testResultDiv.removeChild(loadingElement);
    
    if (response && response.result !== undefined) {
      // 显示结果
      const resultElement = document.createElement('div');
      
      if (response.result) {
        resultElement.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 1rem; color: #10b981;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span style="margin-left: 0.5rem; font-size: 1.125rem; font-weight: 600;">匹配成功！</span>
          </div>
          <p>测试数据符合当前规则的筛选条件。候选人将会被保留。</p>
        `;
      } else {
        resultElement.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 1rem; color: #ef4444;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span style="margin-left: 0.5rem; font-size: 1.125rem; font-weight: 600;">匹配失败</span>
          </div>
          <p>测试数据不符合当前规则的筛选条件。候选人将被过滤掉。</p>
        `;
      }
      
      if (response.details && response.details.length > 0) {
        const detailsElement = document.createElement('div');
        detailsElement.style.marginTop = '1rem';
        detailsElement.innerHTML = `
          <h4 style="font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">评估详情：</h4>
          <ul style="list-style-type: disc; padding-left: 1.5rem;">
            ${response.details.map(detail => `<li>${detail}</li>`).join('')}
          </ul>
        `;
        resultElement.appendChild(detailsElement);
      }
      
      testResultDiv.appendChild(resultElement);
    } else {
      const errorElement = document.createElement('div');
      errorElement.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 1rem; color: var(--danger);">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span style="margin-left: 0.5rem; font-weight: 500;">测试失败</span>
        </div>
        <p>${response?.error || '未知错误'}</p>
      `;
      testResultDiv.appendChild(errorElement);
    }
  } catch (error) {
    console.error('测试规则失败:', error);
    testResultDiv.classList.remove('hidden');
    testResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 1rem; color: var(--danger);">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span style="margin-left: 0.5rem; font-weight: 500;">测试失败</span>
      </div>
      <p>JSON 格式错误: ${error.message}</p>
      <p style="margin-top: 0.5rem;">请确保输入的是有效的 JSON 格式。</p>
    `;
  }
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
    border-radius: var(--radius);
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    transition: opacity 0.3s, transform 0.3s;
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  // 根据类型设置颜色和图标
  if (type === 'error') {
    toast.style.backgroundColor = 'var(--danger)';
    toast.style.color = 'white';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
  } else {
    toast.style.backgroundColor = '#10b981'; // 绿色
    toast.style.color = 'white';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;
  }
  
  // 添加消息文本
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  toast.appendChild(messageSpan);
  
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

// 定义一个CSS动画的样式
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style); 