// Boss直聘 Sourcing 智能助手 - Content Script
console.log('Boss直聘 Sourcing 智能助手 - 内容脚本已加载');

// 全局状态
let selectors = {}; // 选择器配置
let currentMode = 'calibration'; // 默认为校准模式
let filterRules = { operator: 'AND', conditions: [] }; // 默认筛选规则
let isProcessing = false; // 防止重复处理

// 初始化
async function initialize() {
  // 获取选择器配置
  try {
    const response = await sendMessageToBackground('getSelectors');
    selectors = response.selectors;
    console.log('选择器配置已加载:', selectors);
  } catch (error) {
    console.error('获取选择器配置失败:', error);
  }
  
  // 获取当前模式
  try {
    const response = await sendMessageToBackground('getMode');
    currentMode = response.mode;
    console.log('当前模式:', currentMode);
  } catch (error) {
    console.error('获取当前模式失败:', error);
  }
  
  // 获取筛选规则
  try {
    const response = await sendMessageToBackground('getRules');
    filterRules = response.rules;
    console.log('筛选规则已加载:', filterRules);
  } catch (error) {
    console.error('获取筛选规则失败:', error);
  }
  
  // 设置MutationObserver监听DOM变化
  setupMutationObserver();
  
  // 如果当前已经在候选人列表页，立即处理
  if (isRecommendListPage()) {
    processRecommendListPage();
  }
}

// 封装发送消息给背景脚本的函数
function sendMessageToBackground(type, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...data }, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// 判断当前是否在推荐列表页
function isRecommendListPage() {
  return window.location.href.includes('zhipin.com/web/boss/recommend');
}

// 判断当前是否在简历详情页
function isResumeDetailPage() {
  return window.location.href.includes('zhipin.com/web/geek/detail');
}

// 设置MutationObserver监听DOM变化
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    // 当DOM变化时，检查当前页面类型并处理
    if (isRecommendListPage() && !isProcessing) {
      processRecommendListPage();
    } else if (isResumeDetailPage() && !isProcessing) {
      processResumeDetailPage();
    }
  });
  
  // 监听整个文档的变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 处理推荐列表页
async function processRecommendListPage() {
  isProcessing = true;
  
  try {
    console.log('处理推荐列表页...');
    
    // 获取所有简历卡片
    const resumeCards = document.querySelectorAll('.recommend-card-wrap');
    console.log(`找到${resumeCards.length}个简历卡片`);
    
    // 为每个简历卡片添加处理
    for (const card of resumeCards) {
      await processResumeCard(card);
    }
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '处理推荐列表页',
      details: `处理了${resumeCards.length}个简历卡片`
    });
  } catch (error) {
    console.error('处理推荐列表页出错:', error);
  } finally {
    isProcessing = false;
  }
}

// 处理单个简历卡片
async function processResumeCard(card) {
  try {
    // 提取简历数据
    const resumeData = extractResumeData(card);
    console.log('提取的简历数据:', resumeData);
    
    // 判断是否已经打过招呼（按钮文本不是"打招呼"）
    const greetButton = card.querySelector(selectors.greetButton);
    if (!greetButton || greetButton.textContent.trim() !== '打招呼') {
      console.log('已经打过招呼，跳过处理');
      return;
    }
    
    // 校准模式：添加人工标记按钮
    if (currentMode === 'calibration') {
      addMarkingButtons(card, resumeData);
    } 
    // 自动模式：应用筛选规则
    else if (currentMode === 'automatic') {
      const matchesRules = evaluateRules(resumeData, filterRules);
      
      if (matchesRules) {
        console.log('简历符合筛选规则，准备打招呼');
        
        // 检查是否需要查看详情页获取更多信息
        if (filterRules.checkDetail) {
          // 需要先查看详情页，模拟点击进入详情
          console.log('进入详情页获取更多信息');
          
          // 保存当前简历数据，用于详情页处理后返回
          sessionStorage.setItem('currentResumeData', JSON.stringify(resumeData));
          sessionStorage.setItem('pendingGreet', 'true');
          
          // 找到姓名链接并模拟点击，进入详情页
          const nameLink = card.querySelector(selectors.name);
          if (nameLink) {
            nameLink.click();
            return; // 点击后将导航到详情页，后续处理由详情页逻辑完成
          }
        } else {
          // 不需要详情页信息，直接执行打招呼
          await greetCandidate(greetButton, resumeData);
        }
      } else {
        console.log('简历不符合筛选规则，跳过');
      }
    }
  } catch (error) {
    console.error('处理简历卡片出错:', error);
  }
}

// 提取简历数据
function extractResumeData(card) {
  try {
    // 基本信息
    const name = card.querySelector(selectors.name)?.textContent.trim() || '';
    
    // 提取学历和经验
    const baseInfo = card.querySelector(selectors.education)?.textContent.trim() || '';
    const educationMatch = baseInfo.match(/(博士|硕士|本科|大专|高中)/);
    const education = educationMatch ? educationMatch[0] : '';
    
    const experienceMatch = baseInfo.match(/(\d+)年经验/);
    const experience = experienceMatch ? experienceMatch[1] : '';
    
    // 提取学校
    const schoolElem = card.querySelector(selectors.school);
    const school = schoolElem ? schoolElem.textContent.trim() : '';
    
    // 提取公司
    const companyElem = card.querySelector(selectors.company);
    const company = companyElem ? companyElem.textContent.trim() : '';
    
    // 提取岗位
    const positionElem = card.querySelector(selectors.position);
    const position = positionElem ? positionElem.textContent.trim() : '';
    
    // 提取技能标签
    const skillsElem = card.querySelector(selectors.skills);
    const skills = skillsElem ? 
      Array.from(skillsElem.querySelectorAll('span')).map(span => span.textContent.trim()) : 
      [];
    
    return {
      name,
      education,
      experience,
      school,
      company,
      position,
      skills,
      rawData: { // 保存原始文本，用于模糊匹配
        baseInfo,
        school: school,
        company: company,
        position: position
      }
    };
  } catch (error) {
    console.error('提取简历数据出错:', error);
    return {};
  }
}

// 评估筛选规则
function evaluateRules(resumeData, rules) {
  // 如果没有规则，默认通过
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }
  
  try {
    return evaluateCondition(resumeData, rules);
  } catch (error) {
    console.error('评估规则出错:', error);
    return false;
  }
}

// 评估条件
function evaluateCondition(resumeData, condition) {
  // 如果是条件组（AND/OR逻辑）
  if (condition.operator === 'AND' || condition.operator === 'OR') {
    // 如果没有子条件，返回true
    if (!condition.conditions || condition.conditions.length === 0) {
      return true;
    }
    
    if (condition.operator === 'AND') {
      // AND逻辑：所有子条件必须为true
      return condition.conditions.every(subCondition => 
        evaluateCondition(resumeData, subCondition)
      );
    } else {
      // OR逻辑：至少一个子条件为true
      return condition.conditions.some(subCondition => 
        evaluateCondition(resumeData, subCondition)
      );
    }
  }
  // 单一条件
  else {
    return evaluateSingleCondition(resumeData, condition);
  }
}

// 评估单一条件
function evaluateSingleCondition(resumeData, condition) {
  const { field, operator, value } = condition;
  
  // 获取简历中的字段值
  let fieldValue;
  
  // 特殊处理技能字段（数组）
  if (field === 'skills') {
    fieldValue = resumeData.skills || [];
  }
  // 处理原始文本字段（用于模糊匹配）
  else if (field.startsWith('rawData.')) {
    const rawField = field.replace('rawData.', '');
    fieldValue = resumeData.rawData && resumeData.rawData[rawField] 
      ? resumeData.rawData[rawField] 
      : '';
  }
  // 处理常规字段
  else {
    fieldValue = resumeData[field] || '';
  }
  
  // 根据操作符评估条件
  switch (operator) {
    case 'equals':
      // 完全相等
      return fieldValue === value;
      
    case 'contains':
      // 包含
      if (Array.isArray(fieldValue)) {
        // 如果是数组（如技能），检查是否有元素包含目标值
        return fieldValue.some(item => item.includes(value));
      } else {
        // 字符串包含
        return typeof fieldValue === 'string' && fieldValue.includes(value);
      }
      
    case 'startsWith':
      // 以...开始
      return typeof fieldValue === 'string' && fieldValue.startsWith(value);
      
    case 'endsWith':
      // 以...结束
      return typeof fieldValue === 'string' && fieldValue.endsWith(value);
      
    case 'greaterThan':
      // 大于（用于数值比较，如工作经验年限）
      return Number(fieldValue) > Number(value);
      
    case 'lessThan':
      // 小于
      return Number(fieldValue) < Number(value);
      
    case 'regex':
      // 正则表达式匹配
      try {
        const regex = new RegExp(value);
        return regex.test(String(fieldValue));
      } catch (error) {
        console.error('正则表达式错误:', error);
        return false;
      }
      
    default:
      console.warn(`未知操作符: ${operator}`);
      return false;
  }
}

// 添加人工标记按钮（校准模式）
function addMarkingButtons(card, resumeData) {
  // 检查是否已添加标记按钮
  if (card.querySelector('.marking-buttons')) {
    return;
  }
  
  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'marking-buttons';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  buttonContainer.style.marginTop = '10px';
  
  // 添加"符合"按钮
  const positiveButton = document.createElement('button');
  positiveButton.textContent = '✓ 符合';
  positiveButton.style.backgroundColor = '#00b38a';
  positiveButton.style.color = 'white';
  positiveButton.style.border = 'none';
  positiveButton.style.borderRadius = '4px';
  positiveButton.style.padding = '5px 10px';
  positiveButton.style.cursor = 'pointer';
  positiveButton.style.marginRight = '5px';
  
  // 添加"不符合"按钮
  const negativeButton = document.createElement('button');
  negativeButton.textContent = '✗ 不符合';
  negativeButton.style.backgroundColor = '#ff4d4f';
  negativeButton.style.color = 'white';
  negativeButton.style.border = 'none';
  negativeButton.style.borderRadius = '4px';
  negativeButton.style.padding = '5px 10px';
  negativeButton.style.cursor = 'pointer';
  
  // 按钮点击事件
  positiveButton.addEventListener('click', async () => {
    await sendMessageToBackground('addMarkedData', {
      isPositive: true,
      resumeData
    });
    
    // 添加视觉反馈
    card.style.border = '2px solid #00b38a';
    buttonContainer.remove();
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '人工标记',
      details: `标记 ${resumeData.name} 为"符合"`
    });
  });
  
  negativeButton.addEventListener('click', async () => {
    await sendMessageToBackground('addMarkedData', {
      isPositive: false,
      resumeData
    });
    
    // 添加视觉反馈
    card.style.border = '2px solid #ff4d4f';
    buttonContainer.remove();
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '人工标记',
      details: `标记 ${resumeData.name} 为"不符合"`
    });
  });
  
  // 添加按钮到容器
  buttonContainer.appendChild(positiveButton);
  buttonContainer.appendChild(negativeButton);
  
  // 添加容器到卡片
  card.appendChild(buttonContainer);
}

// 获取随机延迟时间
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 模拟鼠标移动轨迹
async function simulateMouseMovement(element) {
  // 获取元素的位置和尺寸
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // 创建并分发鼠标事件
  element.dispatchEvent(new MouseEvent('mouseover', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: centerX,
    clientY: centerY
  }));
  
  // 添加随机延迟
  await new Promise(resolve => setTimeout(resolve, getRandomDelay(100, 300)));
  
  element.dispatchEvent(new MouseEvent('mouseenter', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: centerX,
    clientY: centerY
  }));
}

// 向候选人打招呼
async function greetCandidate(greetButton, resumeData) {
  try {
    // 添加随机延迟（防封措施）
    const delay = getRandomDelay(1000, 3000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 模拟鼠标移动
    await simulateMouseMovement(greetButton);
    
    // 模拟点击
    greetButton.click();
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: '自动打招呼',
      details: `向 ${resumeData.name} 发送了招呼`
    });
    
    console.log(`成功向 ${resumeData.name} 打招呼`);
    return true;
  } catch (error) {
    console.error('打招呼失败:', error);
    return false;
  }
}

// 处理简历详情页
async function processResumeDetailPage() {
  isProcessing = true;
  
  try {
    console.log('处理简历详情页...');
    
    // 检查是否有等待处理的招呼请求
    const pendingGreet = sessionStorage.getItem('pendingGreet') === 'true';
    const storedResumeData = sessionStorage.getItem('currentResumeData');
    
    if (!pendingGreet || !storedResumeData) {
      console.log('没有待处理的招呼请求，跳过');
      return;
    }
    
    // 解析存储的简历数据
    const basicResumeData = JSON.parse(storedResumeData);
    
    // 提取详情页数据
    const detailData = extractDetailPageData();
    console.log('提取的详情页数据:', detailData);
    
    // 合并基本数据和详情数据
    const fullResumeData = {
      ...basicResumeData,
      detail: detailData
    };
    
    // 根据当前模式处理
    if (currentMode === 'automatic') {
      // 在自动模式下，调用AI进行深度分析
      const shouldGreet = await analyzeWithAI(fullResumeData);
      
      if (shouldGreet) {
        console.log('AI分析结果：简历符合要求，返回列表页打招呼');
        
        // 清理会话存储
        sessionStorage.removeItem('pendingGreet');
        sessionStorage.removeItem('currentResumeData');
        
        // 返回列表页
        window.history.back();
      } else {
        console.log('AI分析结果：简历不符合要求，跳过打招呼');
        
        // 清理会话存储
        sessionStorage.removeItem('pendingGreet');
        sessionStorage.removeItem('currentResumeData');
      }
    }
  } catch (error) {
    console.error('处理简历详情页出错:', error);
  } finally {
    isProcessing = false;
  }
}

// 提取详情页数据
function extractDetailPageData() {
  try {
    const container = document.querySelector(selectors.detailPage.container);
    if (!container) {
      console.error('未找到详情页容器');
      return {};
    }
    
    // 提取工作经历
    const workExperience = container.querySelector(selectors.detailPage.workExperience);
    const workExperienceText = workExperience ? workExperience.innerText : '';
    
    // 提取教育经历
    const educationExperience = container.querySelector(selectors.detailPage.educationExperience);
    const educationExperienceText = educationExperience ? educationExperience.innerText : '';
    
    // 提取项目经历
    const projectExperience = container.querySelector(selectors.detailPage.projectExperience);
    const projectExperienceText = projectExperience ? projectExperience.innerText : '';
    
    // 提取期望
    const expectation = container.querySelector(selectors.detailPage.expectation);
    const expectationText = expectation ? expectation.innerText : '';
    
    return {
      workExperience: workExperienceText,
      educationExperience: educationExperienceText,
      projectExperience: projectExperienceText,
      expectation: expectationText
    };
  } catch (error) {
    console.error('提取详情页数据出错:', error);
    return {};
  }
}

// 使用AI分析简历数据
async function analyzeWithAI(resumeData) {
  try {
    // 这里将会调用DeepSeek API进行分析
    // 暂时模拟AI分析结果
    console.log('准备使用AI分析简历详情数据');
    
    // 记录日志
    await sendMessageToBackground('addLog', {
      action: 'AI分析',
      details: `分析 ${resumeData.name} 的详情页数据`
    });
    
    // TODO: 集成DeepSeek API
    // 模拟延迟和分析过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟分析结果（随机返回）
    const result = Math.random() > 0.3;
    
    // 记录分析结果
    await sendMessageToBackground('addLog', {
      action: 'AI分析结果',
      details: `${resumeData.name}: ${result ? '符合' : '不符合'}`
    });
    
    return result;
  } catch (error) {
    console.error('AI分析出错:', error);
    return false;
  }
}

// 初始化
initialize(); 