// 简易规则编辑器 JavaScript 逻辑

// 规则类型配置
const ruleTypes = {
  '岗位': { icon: '👨‍💻', color: '#4F46E5' },
  '公司': { icon: '🏢', color: '#0EA5E9' },
  '岗位核心关键词': { icon: '🔧', color: '#10B981' },
  '学校': { icon: '🎓', color: '#F59E0B' },
  '学历': { icon: '📜', color: '#EC4899' }
};

// 重要性级别 - 保留兼容性
const importanceLevels = [
  { value: 25, label: '不重要' },
  { value: 50, label: '一般' },
  { value: 75, label: '重要' },
  { value: 100, label: '非常重要' }
];

// 当前规则配置
let currentConfig = {
  rules: [],
  autoMode: false
};

// DOM元素引用
const elementsRef = {
  rulesContainer: null,
  noRulesMessage: null,
  addRuleButtons: null,
  importRulesBtn: null,
  exportRulesBtn: null,
  resetRulesBtn: null,
  cancelBtn: null,
  saveRulesBtn: null,
  importFile: null,
  themeToggle: null,
  moonIcon: null,
  sunIcon: null,
  loadSpinner: null,
  stageHint: null,
  historySelect: null
};

// 拖拽相关变量
let draggedItem = null;
let draggedItemIndex = null;

// 添加规则描述，用于UI提示
const ruleDescs = {
  '岗位': '匹配候选人的期望岗位，此条件不满足将终止评估',
  '公司': '检查候选人是否来自竞争对手公司，如果是则直接通过',
  '岗位核心关键词': '评估候选人的技能是否满足岗位核心要求，设置通过分数',
  '学校': '筛选候选人的毕业院校',
  '学历': '筛选候选人的学历水平'
};

// 存储规则历史记录
let ruleHistory = [];

// 初始化函数
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化DOM引用
  initDomReferences();
  
  // 初始化主题
  initTheme();
  
  // 绑定事件处理器
  bindEventHandlers();
  
  // 加载规则配置
  await loadConfig();
  
  // 渲染UI
  renderUI();
  
  // 初始化拖拽排序功能
  initDragAndDrop();
});

// 初始化DOM引用
function initDomReferences() {
  elementsRef.rulesContainer = document.getElementById('rules-container');
  elementsRef.noRulesMessage = document.getElementById('no-rules-message');
  elementsRef.addRuleButtons = document.querySelectorAll('.add-rule-btn');
  elementsRef.importRulesBtn = document.getElementById('import-rules-btn');
  elementsRef.exportRulesBtn = document.getElementById('export-rules-btn');
  elementsRef.resetRulesBtn = document.getElementById('reset-rules-btn');
  elementsRef.cancelBtn = document.getElementById('cancel-btn');
  elementsRef.saveRulesBtn = document.getElementById('save-rules-btn');
  elementsRef.importFile = document.getElementById('import-file');
  elementsRef.themeToggle = document.getElementById('theme-toggle');
  elementsRef.moonIcon = document.getElementById('moon-icon');
  elementsRef.sunIcon = document.getElementById('sun-icon');
  elementsRef.loadSpinner = document.getElementById('load-spinner');
  elementsRef.stageHint = document.getElementById('stage-hint');
  elementsRef.historySelect = document.getElementById('history-select');
}

// 初始化主题
function initTheme() {
  const body = document.body;
  
  // 尝试从存储中获取主题
  chrome.storage.local.get('theme', ({ theme }) => {
    const currentTheme = theme || 'light';
    body.setAttribute('data-theme', currentTheme);
    
    // 更新图标
    if (currentTheme === 'dark') {
      elementsRef.moonIcon.style.display = 'none';
      elementsRef.sunIcon.style.display = 'block';
    } else {
      elementsRef.moonIcon.style.display = 'block';
      elementsRef.sunIcon.style.display = 'none';
    }
  });
}

// 切换主题
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  // 更新DOM
  body.setAttribute('data-theme', newTheme);
  
  // 更新图标
  if (newTheme === 'dark') {
    elementsRef.moonIcon.style.display = 'none';
    elementsRef.sunIcon.style.display = 'block';
  } else {
    elementsRef.moonIcon.style.display = 'block';
    elementsRef.sunIcon.style.display = 'none';
  }
  
  // 保存到存储
  chrome.storage.local.set({ theme: newTheme });
}

// 绑定事件处理器
function bindEventHandlers() {
  // 添加规则按钮
  elementsRef.addRuleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const ruleType = btn.getAttribute('data-type');
      addNewRule(ruleType);
    });
  });
  
  // 导入规则按钮
  elementsRef.importRulesBtn.addEventListener('click', () => {
    elementsRef.importFile.click();
  });
  
  // 文件输入变化
  elementsRef.importFile.addEventListener('change', handleImportFile);
  
  // 导出规则按钮
  elementsRef.exportRulesBtn.addEventListener('click', exportRules);
  
  // 重置规则按钮
  elementsRef.resetRulesBtn.addEventListener('click', resetRules);
  
  // 取消按钮
  elementsRef.cancelBtn.addEventListener('click', handleCancel);
  
  // 保存按钮
  elementsRef.saveRulesBtn.addEventListener('click', saveRules);
  
  // 主题切换
  elementsRef.themeToggle.addEventListener('click', toggleTheme);
  
  // 历史记录选择
  elementsRef.historySelect.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      loadRuleFromHistory(selectedId);
    }
  });
}

// 从后台加载规则配置
async function loadConfig() {
  try {
    // 显示加载动画
    showLoading(true);
    
    // 通过消息API获取配置
    const response = await chrome.runtime.sendMessage({ 
      type: 'getSimpleRulesConfig'
    });
    
    console.log('获取到的规则配置:', response);
    
    if (response && response.success && response.config) {
      currentConfig = response.config;
      
      // 加载规则历史
      await loadRuleHistory();
    } else if (response && !response.success) {
      console.error('获取规则失败:', response.error);
      showToast('获取规则失败: ' + response.error, 'error');
    }
    
    // 隐藏加载动画
    showLoading(false);
  } catch (error) {
    console.error('加载规则配置失败:', error);
    showToast('加载规则配置失败', 'error');
    showLoading(false);
  }
}

// 加载规则历史
async function loadRuleHistory() {
  try {
    const response = await chrome.runtime.sendMessage({ 
      type: 'getRuleHistory'
    });
    
    if (response && response.success && response.history) {
      ruleHistory = response.history;
      
      // 更新历史选择下拉框
      updateHistorySelect();
    }
  } catch (error) {
    console.error('加载规则历史失败:', error);
  }
}

// 更新历史选择下拉框
function updateHistorySelect() {
  // 清空除了第一个选项外的所有选项
  while (elementsRef.historySelect.options.length > 1) {
    elementsRef.historySelect.remove(1);
  }
  
  // 添加历史记录选项
  ruleHistory.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    elementsRef.historySelect.appendChild(option);
  });
  
  // 重置选择到第一个选项
  elementsRef.historySelect.selectedIndex = 0;
}

// 渲染UI
function renderUI() {
  // 渲染规则列表
  renderRulesList();
}

// 渲染规则列表
function renderRulesList() {
  // 清空容器
  elementsRef.rulesContainer.innerHTML = '';
  
  // 显示或隐藏"无规则"消息
  if (currentConfig.rules.length === 0) {
    elementsRef.noRulesMessage.style.display = 'block';
    elementsRef.stageHint.style.display = 'none';
    return;
  } else {
    elementsRef.noRulesMessage.style.display = 'none';
    elementsRef.stageHint.style.display = 'block';
  }
  
  // 确保规则有顺序属性
  ensureRulesHaveOrder();
  
  // 按顺序排序规则
  const sortedRules = [...currentConfig.rules].sort((a, b) => {
    return (a.order || 0) - (b.order || 0);
  });
  
  // 渲染每条规则
  sortedRules.forEach((rule, index) => {
    const ruleElement = createRuleElement(rule, index);
    elementsRef.rulesContainer.appendChild(ruleElement);
  });
  
  // 更新阶段评估说明
  updateStageHint();
}

// 确保所有规则都有order属性
function ensureRulesHaveOrder() {
  currentConfig.rules.forEach((rule, index) => {
    if (rule.order === undefined) {
      rule.order = index;
    }
  });
}

// 创建规则元素
function createRuleElement(rule, index) {
  const typeInfo = ruleTypes[rule.type];
  const ruleElement = document.createElement('div');
  ruleElement.className = 'rule-card';
  ruleElement.dataset.id = rule.id;
  ruleElement.dataset.index = index;
  ruleElement.dataset.type = rule.type;
  ruleElement.style.borderLeft = `4px solid ${typeInfo.color}`;
  
  // 添加拖拽属性
  ruleElement.draggable = true;
  ruleElement.dataset.order = rule.order || index;
  
  // 规则头部
  const ruleHeader = document.createElement('div');
  ruleHeader.className = 'rule-header';
  
  // 左侧：拖拽图标、类型图标和类型名
  const leftSide = document.createElement('div');
  leftSide.style.display = 'flex';
  leftSide.style.alignItems = 'center';
  
  // 拖拽图标
  const dragHandle = document.createElement('span');
  dragHandle.className = 'rule-drag-handle';
  dragHandle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; cursor: grab; color: #94a3b8;">
      <circle cx="9" cy="12" r="1"></circle>
      <circle cx="9" cy="5" r="1"></circle>
      <circle cx="9" cy="19" r="1"></circle>
      <circle cx="15" cy="12" r="1"></circle>
      <circle cx="15" cy="5" r="1"></circle>
      <circle cx="15" cy="19" r="1"></circle>
    </svg>
  `;
  
  const ruleIcon = document.createElement('span');
  ruleIcon.className = 'rule-icon';
  ruleIcon.textContent = typeInfo.icon;
  
  const ruleType = document.createElement('span');
  ruleType.textContent = rule.type;
  ruleType.style.fontWeight = '500';
  
  leftSide.appendChild(dragHandle);
  leftSide.appendChild(ruleIcon);
  leftSide.appendChild(ruleType);

  // 显示序号
  const orderDisplay = document.createElement('span');
  orderDisplay.className = 'rule-order';
  orderDisplay.textContent = `#${parseInt(rule.order || index) + 1}`;
  orderDisplay.style.marginLeft = '8px';
  orderDisplay.style.fontSize = '12px';
  orderDisplay.style.color = '#64748b';
  orderDisplay.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
  orderDisplay.style.padding = '2px 6px';
  orderDisplay.style.borderRadius = '12px';
  
  leftSide.appendChild(orderDisplay);
  
  // 右侧：启用开关和删除按钮
  const rightSide = document.createElement('div');
  rightSide.style.display = 'flex';
  rightSide.style.alignItems = 'center';
  rightSide.style.gap = '8px';
  
  const enabledLabel = document.createElement('label');
  enabledLabel.className = 'checkbox-label';
  enabledLabel.style.marginRight = '8px';
  
  const enabledCheckbox = document.createElement('input');
  enabledCheckbox.type = 'checkbox';
  enabledCheckbox.checked = rule.enabled;
  enabledCheckbox.addEventListener('change', (e) => {
    updateRule(rule.id, { enabled: e.target.checked });
    updateStageHint(); // 更新阶段提示
  });
  
  const enabledText = document.createElement('span');
  enabledText.textContent = '启用';
  enabledText.style.fontSize = '12px';
  
  enabledLabel.appendChild(enabledCheckbox);
  enabledLabel.appendChild(enabledText);
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn-sm btn-danger';
  deleteButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  deleteButton.addEventListener('click', () => {
    deleteRule(rule.id);
  });
  
  rightSide.appendChild(enabledLabel);
  rightSide.appendChild(deleteButton);
  
  ruleHeader.appendChild(leftSide);
  ruleHeader.appendChild(rightSide);
  
  // 规则内容
  const ruleContent = document.createElement('div');
  ruleContent.className = 'rule-content';
  
  // 添加规则说明
  if (ruleDescs[rule.type]) {
    const ruleDescription = document.createElement('div');
    ruleDescription.className = 'rule-description';
    ruleDescription.style.marginBottom = '12px';
    ruleDescription.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; color: #94a3b8;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      ${ruleDescs[rule.type]}
    `;
    ruleContent.appendChild(ruleDescription);
  }
  
  // 关键词输入
  const keywordsContainer = document.createElement('div');
  keywordsContainer.className = 'form-group';
  
  const keywordsLabel = document.createElement('label');
  keywordsLabel.className = 'form-label';
  keywordsLabel.textContent = '关键词';
  
  const keywordsInputContainer = document.createElement('div');
  keywordsInputContainer.style.display = 'flex';
  keywordsInputContainer.style.gap = '8px';
  
  const keywordsInput = document.createElement('input');
  keywordsInput.type = 'text';
  keywordsInput.className = 'form-input';
  keywordsInput.placeholder = '输入关键词，回车添加';
  
  const addKeywordBtn = document.createElement('button');
  addKeywordBtn.className = 'btn btn-primary';
  addKeywordBtn.textContent = '添加';
  addKeywordBtn.style.flexShrink = '0';
  
  // AI 推荐按钮容器
  const aiRecommendContainer = document.createElement('div');
  aiRecommendContainer.style.display = 'flex';
  aiRecommendContainer.style.gap = '8px';
  aiRecommendContainer.style.marginTop = '8px';
  
  // AI推荐按钮函数
  const createAIRecommendButton = (text, tooltip, promptType) => {
    const button = document.createElement('button');
    button.className = 'btn btn-outline';
    button.style.fontSize = '12px';
    button.style.padding = '4px 8px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.gap = '4px';
    button.title = tooltip;
    
    const aiIcon = document.createElement('span');
    aiIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <path d="M 7 10 C 7 8 9 6 12 6 C 15 6 17 8 17 10 L 17 14 C 17 16 15 18 12 18 C 9 18 7 16 7 14 Z"></path>
        <path d="M 9 11 L 9 13"></path>
        <path d="M 15 11 L 15 13"></path>
        <path d="M 7 10 L 17 10"></path>
        <path d="M 7 14 L 17 14"></path>
      </svg>
    `;
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    
    button.appendChild(aiIcon);
    button.appendChild(textSpan);
    
    // 添加点击事件
    button.addEventListener('click', async () => {
      try {
        button.disabled = true;
        button.style.opacity = '0.7';
        
        // 显示加载提示
        const loadingText = document.createElement('span');
        loadingText.textContent = ' 加载中...';
        button.appendChild(loadingText);
        
        // 获取规则类型和当前关键词
        const currentKeywords = rule.keywords.join(', ');
        const ruleType = rule.type;
        
        // 调用后台API获取推荐
        const response = await chrome.runtime.sendMessage({
          type: 'getAIRecommendations',
          promptType: promptType,
          keywords: currentKeywords,
          ruleType: ruleType
        });
        
        // 处理返回结果
        if (response && response.success && response.recommendations) {
          // 添加推荐关键词
          response.recommendations.forEach(keyword => {
            if (keyword && keyword.trim() && !rule.keywords.includes(keyword.trim())) {
              addKeyword(keyword.trim());
            }
          });
          
          // 显示成功提示
          showToast('AI推荐已添加', 'success');
        } else {
          const errorMsg = response && response.error ? response.error : '获取AI推荐失败';
          showToast(errorMsg, 'error');
        }
      } catch (error) {
        console.error('AI推荐错误:', error);
        showToast('AI推荐错误: ' + error.message, 'error');
      } finally {
        // 恢复按钮状态
        button.disabled = false;
        button.style.opacity = '1';
        // 移除加载提示
        button.lastChild.textContent === ' 加载中...' && button.removeChild(button.lastChild);
      }
    });
    
    return button;
  };
  
  // 创建不同类型的AI推荐按钮
  if (rule.type === '岗位') {
    const similarJobsButton = createAIRecommendButton(
      'AI推荐类似岗位名称', 
      '通过AI智能分析，推荐与当前岗位相似的其他岗位名称', 
      'similarJobs'
    );
    aiRecommendContainer.appendChild(similarJobsButton);
  } else if (rule.type === '公司') {
    const competitorButton = createAIRecommendButton(
      'AI推荐竞对公司', 
      '通过AI智能分析，推荐与当前公司相关的竞争对手公司', 
      'competitors'
    );
    aiRecommendContainer.appendChild(competitorButton);
  } else if (rule.type === '岗位核心关键词') {
    const keywordsButton = createAIRecommendButton(
      'AI推荐岗位关键词', 
      '通过AI智能分析，推荐与当前岗位相关的技能关键词', 
      'jobKeywords'
    );
    aiRecommendContainer.appendChild(keywordsButton);
  }
  
  // 关键词标签容器
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'tag-container';
  
  // 渲染已有标签
  rule.keywords.forEach((keyword, index) => {
    const tag = createTagElement(keyword, index, rule.id);
    tagsContainer.appendChild(tag);
  });
  
  // 添加关键词逻辑
  const addKeyword = (keyword) => {
    if (!keyword.trim()) return;
    
    // 更新规则
    const newKeywords = [...rule.keywords, keyword.trim()];
    updateRule(rule.id, { keywords: newKeywords });
    
    // 添加标签到UI
    const newTag = createTagElement(keyword.trim(), rule.keywords.length, rule.id);
    tagsContainer.appendChild(newTag);
    
    // 清空输入框
    keywordsInput.value = '';
    
    // 如果是关键词规则，更新阶段提示
    if (rule.type === '岗位核心关键词') {
      updateStageHint();
    }
  };
  
  // 绑定事件
  keywordsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addKeyword(keywordsInput.value);
      e.preventDefault();
    }
  });
  
  addKeywordBtn.addEventListener('click', () => {
    addKeyword(keywordsInput.value);
  });
  
  keywordsInputContainer.appendChild(keywordsInput);
  keywordsInputContainer.appendChild(addKeywordBtn);
  
  keywordsContainer.appendChild(keywordsLabel);
  keywordsContainer.appendChild(keywordsInputContainer);
  // 添加AI推荐按钮容器
  keywordsContainer.appendChild(aiRecommendContainer);
  keywordsContainer.appendChild(tagsContainer);
  
  // 如果是岗位核心关键词规则，添加通过分数设置
  if (rule.type === '岗位核心关键词') {
    const passScoreContainer = document.createElement('div');
    passScoreContainer.className = 'form-group';
    
    const passScoreLabel = document.createElement('label');
    passScoreLabel.className = 'form-label';
    passScoreLabel.innerHTML = `通过分数 <span id="pass-score-value-${rule.id}">${rule.passScore || 60}</span>`;
    
    const passScoreInput = document.createElement('input');
    passScoreInput.type = 'range';
    passScoreInput.className = 'importance-slider';
    passScoreInput.min = '0';
    passScoreInput.max = '100';
    passScoreInput.value = rule.passScore || 60;
    
    const sliderLabels = document.createElement('div');
    sliderLabels.className = 'slider-labels';
    sliderLabels.innerHTML = `
      <span>0</span>
      <span>25</span>
      <span>50</span>
      <span>75</span>
      <span>100</span>
    `;
    
    const passScoreHint = document.createElement('p');
    passScoreHint.className = 'hint';
    passScoreHint.textContent = '得分高于此值的候选人将被视为通过筛选';
    
    passScoreInput.addEventListener('input', (e) => {
      const value = e.target.value;
      document.getElementById(`pass-score-value-${rule.id}`).textContent = value;
      updateRule(rule.id, { passScore: parseInt(value, 10) });
      updateStageHint(); // 更新阶段提示
    });
    
    passScoreContainer.appendChild(passScoreLabel);
    passScoreContainer.appendChild(passScoreInput);
    passScoreContainer.appendChild(sliderLabels);
    passScoreContainer.appendChild(passScoreHint);
    
    ruleContent.appendChild(passScoreContainer);
  }
  
  // 必须满足选项
  const mustMatchContainer = document.createElement('div');
  mustMatchContainer.className = 'form-group';
  
  const mustMatchLabel = document.createElement('label');
  mustMatchLabel.className = 'checkbox-label';
  
  const mustMatchCheckbox = document.createElement('input');
  mustMatchCheckbox.type = 'checkbox';
  mustMatchCheckbox.checked = rule.mustMatch;
  
  mustMatchCheckbox.addEventListener('change', (e) => {
    updateRule(rule.id, { mustMatch: e.target.checked });
  });
  
  const mustMatchText = document.createElement('span');
  mustMatchText.textContent = '必须满足此条件（不满足直接拒绝）';
  
  mustMatchLabel.appendChild(mustMatchCheckbox);
  mustMatchLabel.appendChild(mustMatchText);
  
  mustMatchContainer.appendChild(mustMatchLabel);
  
  // 添加元素到规则内容
  ruleContent.appendChild(keywordsContainer);
  ruleContent.appendChild(mustMatchContainer);
  
  // 组装规则卡片
  ruleElement.appendChild(ruleHeader);
  ruleElement.appendChild(ruleContent);
  
  // 添加拖拽事件监听器
  ruleElement.addEventListener('dragstart', handleDragStart);
  ruleElement.addEventListener('dragover', handleDragOver);
  ruleElement.addEventListener('dragleave', handleDragLeave);
  ruleElement.addEventListener('drop', handleDrop);
  ruleElement.addEventListener('dragend', handleDragEnd);
  
  return ruleElement;
}

// 初始化拖拽排序功能
function initDragAndDrop() {
  // 所有事件在createRuleElement中添加
}

// 处理拖拽开始
function handleDragStart(e) {
  draggedItem = this;
  draggedItemIndex = parseInt(this.dataset.index);
  
  // 添加拖拽效果
  setTimeout(() => {
    this.style.opacity = '0.4';
  }, 0);
  
  // 存储拖拽数据
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
}

// 处理拖拽经过
function handleDragOver(e) {
  e.preventDefault();
  this.classList.add('rule-card-dragover');
  return false;
}

// 处理拖拽离开
function handleDragLeave() {
  this.classList.remove('rule-card-dragover');
}

// 处理放置
function handleDrop(e) {
  e.stopPropagation();
  
  // 获取目标索引
  const targetIndex = parseInt(this.dataset.index);
  
  if (draggedItem !== this) {
    // 更新规则顺序
    reorderRules(draggedItemIndex, targetIndex);
    
    // 更新阶段提示
    updateStageHint();
  }
  
  this.classList.remove('rule-card-dragover');
  return false;
}

// 处理拖拽结束
function handleDragEnd() {
  this.style.opacity = '1';
  
  // 清除所有dragover效果
  document.querySelectorAll('.rule-card').forEach(item => {
    item.classList.remove('rule-card-dragover');
  });
}

// 重新排序规则
function reorderRules(fromIndex, toIndex) {
  // 获取排序后的规则
  const rules = [...currentConfig.rules];
  const rule = rules[fromIndex];
  
  // 移除拖拽的规则
  rules.splice(fromIndex, 1);
  
  // 在新位置插入规则
  rules.splice(toIndex, 0, rule);
  
  // 更新所有规则的order属性
  rules.forEach((rule, index) => {
    rule.order = index;
  });
  
  // 更新配置并重新渲染
  currentConfig.rules = rules;
  renderRulesList();
}

// 创建标签元素
function createTagElement(text, index, ruleId) {
  const tag = document.createElement('div');
  tag.className = 'tag';
  
  const tagText = document.createElement('span');
  tagText.textContent = text;
  
  const removeBtn = document.createElement('span');
  removeBtn.className = 'tag-remove';
  removeBtn.textContent = '×';
  removeBtn.addEventListener('click', () => {
    // 找到对应规则
    const rule = currentConfig.rules.find(r => r.id === ruleId);
    if (rule) {
      // 移除关键词
      const newKeywords = [...rule.keywords];
      newKeywords.splice(index, 1);
      updateRule(ruleId, { keywords: newKeywords });
      
      // 从DOM中移除标签
      tag.remove();
    }
  });
  
  tag.appendChild(tagText);
  tag.appendChild(removeBtn);
  
  return tag;
}

// 获取重要性标签
function getImportanceLabel(value) {
  const level = importanceLevels.find(level => level.value === value);
  return level ? level.label : '一般';
}

// 添加新规则
function addNewRule(type) {
  const newRule = {
    id: generateId(),
    type: type,
    keywords: [],
    mustMatch: false,
    enabled: true,
    order: currentConfig.rules.length // 新规则放到最后
  };
  
  // 添加到规则列表
  currentConfig.rules.push(newRule);
  
  // 重新渲染UI
  renderRulesList();
}

// 更新规则
function updateRule(id, changes) {
  // 找到要更新的规则
  const index = currentConfig.rules.findIndex(r => r.id === id);
  if (index !== -1) {
    // 应用更改
    currentConfig.rules[index] = {
      ...currentConfig.rules[index],
      ...changes
    };
  }
}

// 删除规则
function deleteRule(id) {
  if (confirm('确定要删除这条规则吗？')) {
    // 过滤掉要删除的规则
    currentConfig.rules = currentConfig.rules.filter(r => r.id !== id);
    
    // 更新剩余规则的顺序
    currentConfig.rules.forEach((rule, index) => {
      rule.order = index;
    });
    
    // 重新渲染UI
    renderRulesList();
  }
}

// 处理导入文件
function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target.result);
      
      // 验证配置格式
      if (validateConfig(config)) {
        currentConfig = config;
        renderUI();
        showToast('规则导入成功');
      } else {
        showToast('规则格式无效', 'error');
      }
    } catch (error) {
      console.error('导入规则失败:', error);
      showToast('导入规则失败: ' + error.message, 'error');
    }
    
    // 清空文件输入值，以便于再次导入同一文件
    event.target.value = '';
  };
  
  reader.readAsText(file);
}

// 验证配置格式
function validateConfig(config) {
  if (!config || typeof config !== 'object') return false;
  if (typeof config.autoMode !== 'boolean') return false;
  if (!Array.isArray(config.rules)) return false;
  
  return true;
}

// 导出规则
function exportRules() {
  const configStr = JSON.stringify(currentConfig, null, 2);
  const blob = new Blob([configStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sourcing_rules_config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('规则导出成功');
}

// 重置规则
function resetRules() {
  if (confirm('确定要重置所有规则吗？这将删除所有已配置的规则。')) {
    currentConfig = {
      rules: []
    };
    
    renderUI();
    showToast('规则已重置');
  }
}

// 取消操作
function handleCancel() {
  window.parent.postMessage({ type: 'CLOSE_SIMPLE_RULE_MODAL' }, '*');
}

// 保存规则
async function saveRules() {
  try {
    // 显示加载动画
    showLoading(true);
    
    // 通过消息API保存配置
    await chrome.runtime.sendMessage({ 
      type: 'saveSimpleRulesConfig',
      config: currentConfig
    });
    
    // 通知父窗口
    window.parent.postMessage({ 
      type: 'SIMPLE_RULES_SAVED', 
      config: currentConfig 
    }, '*');
    
    // 关闭模态框
    window.parent.postMessage({ type: 'CLOSE_SIMPLE_RULE_MODAL' }, '*');
    
    // 隐藏加载动画
    showLoading(false);
  } catch (error) {
    console.error('保存规则失败:', error);
    showToast('保存规则失败: ' + error.message, 'error');
    showLoading(false);
  }
}

// 显示/隐藏加载动画
function showLoading(show) {
  elementsRef.loadSpinner.style.display = show ? 'inline-block' : 'none';
  elementsRef.saveRulesBtn.disabled = show;
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
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
  `;
  
  // 根据类型设置颜色
  if (type === 'error') {
    toast.style.backgroundColor = 'var(--danger)';
    toast.style.color = 'white';
  } else {
    toast.style.backgroundColor = 'var(--primary)';
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

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
  .rule-card {
    cursor: move;
    transition: background-color 0.2s, transform 0.2s, opacity 0.2s;
  }
  
  .rule-card-dragover {
    background-color: rgba(59, 130, 246, 0.1);
    transform: scale(1.01);
  }
  
  .rule-drag-handle {
    cursor: grab;
  }
  
  .rule-drag-handle:active {
    cursor: grabbing;
  }
`;
document.head.appendChild(style);

// 添加更新阶段评估说明的函数
function updateStageHint() {
  // 获取排序后的规则
  const sortedRules = [...currentConfig.rules]
    .filter(r => r.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // 分析规则顺序并生成阶段性评估说明
  let stages = [];
  let stageIndex = 1;
  
  // 查找第一个岗位规则
  const positionRuleIndex = sortedRules.findIndex(r => r.type === '岗位');
  if (positionRuleIndex !== -1) {
    stages.push(`
      <div class="stage">
        <div class="stage-header">
          <span class="stage-number">${stageIndex++}</span>
          <span class="stage-title">岗位匹配</span>
        </div>
        <div class="stage-desc">
          先检查候选人岗位是否匹配，如不匹配则终止评估
        </div>
      </div>
    `);
  }
  
  // 查找第一个公司规则
  const companyRuleIndex = sortedRules.findIndex(r => r.type === '公司');
  if (companyRuleIndex !== -1) {
    stages.push(`
      <div class="stage">
        <div class="stage-header">
          <span class="stage-number">${stageIndex++}</span>
          <span class="stage-title">公司筛查</span>
        </div>
        <div class="stage-desc">
          检查候选人是否来自竞争对手公司，如是则直接通过
        </div>
      </div>
    `);
  }
  
  // 查找第一个关键词规则
  const keywordRuleIndex = sortedRules.findIndex(r => r.type === '岗位核心关键词');
  if (keywordRuleIndex !== -1) {
    const keywordRule = sortedRules[keywordRuleIndex];
    stages.push(`
      <div class="stage">
        <div class="stage-header">
          <span class="stage-number">${stageIndex++}</span>
          <span class="stage-title">关键词评估</span>
        </div>
        <div class="stage-desc">
          评估候选人技能关键词匹配度，得分高于 <b>${keywordRule.passScore || 60}</b> 分才能通过
        </div>
      </div>
    `);
  }
  
  // 将生成的阶段说明添加到DOM
  elementsRef.stageHint.innerHTML = `
    <div class="stage-title-main">评估流程:</div>
    <div class="stages-container">
      ${stages.join('')}
    </div>
    <div class="stage-note">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      通过拖拽调整规则顺序，规则将按照顺序依次评估
    </div>
  `;
}

// 从历史记录中加载规则
function loadRuleFromHistory(historyId) {
  const historyItem = ruleHistory.find(item => item.id === historyId);
  if (historyItem && historyItem.config) {
    // 应用历史配置
    currentConfig = JSON.parse(JSON.stringify(historyItem.config));
    
    // 更新UI
    renderUI();
    
    // 显示提示
    showToast(`已加载配置: ${historyItem.name}`);
  } else {
    showToast('找不到历史配置', 'error');
  }
} 