/**
 * Boss直聘 Sourcing 智能助手 - 后台服务
 */
import { RulesEvaluator } from '../../shared/core/rules-engine/evaluator';
import { LogicalOperator } from '../../shared/core/rules-engine/types';
import { simpleRulesConnector } from './simple-rules-connector';

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
      // 初始化系统设置
      systemSettings: {
        processingSpeed: 'normal',
        maxCandidates: '50' 
      },
      // 初始化AI服务配置
      aiServiceConfig: {
        service: 'deepseek',
        apiKey: '',
        model: 'deepseek-chat'
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
        // 检查是否使用简化规则引擎
        const useSimpleRules = message.useSimpleRules !== false; // 默认使用简化规则
        
        if (useSimpleRules) {
          // 使用简化规则引擎评估
          simpleRulesConnector.evaluateCandidate(message.resumeData)
            .then(result => {
              sendResponse({ result, engineType: 'simple' });
            })
            .catch(error => {
              console.error('简化规则引擎评估失败:', error);
              // 回退到传统规则引擎
              fallbackToTraditionalEngine();
            });
        } else {
          // 直接使用传统规则引擎
          fallbackToTraditionalEngine();
        }
        
        // 使用传统规则引擎的回退函数
        function fallbackToTraditionalEngine() {
          try {
            const result = rulesEvaluator.evaluateRules(
              { data: message.resumeData },
              message.rules
            );
            sendResponse({ result, engineType: 'traditional' });
          } catch (error) {
            console.error('传统规则引擎评估错误:', error);
            sendResponse({ error: error.message });
          }
        }
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
        // 获取AI服务配置
        chrome.storage.local.get(['aiServiceConfig'], async (result) => {
          const config = result.aiServiceConfig || {
            service: 'deepseek',
            apiKey: '',
            model: 'deepseek-chat'
          };
          
          if (!config.apiKey) {
            sendResponse({
              success: false,
              error: '请先在系统设置中配置AI服务API密钥'
            });
            return;
          }
          
          try {
            // 使用AI辅助生成规则
            const rules = await generateRulesFromPrompt(
              message.prompt,
              config.service,
              config.apiKey,
              config.model
            );
            sendResponse({ rules });
          } catch (error) {
            console.error('生成规则错误:', error);
            sendResponse({ 
              success: false,
              error: error.message || '生成规则失败'
            });
          }
        });
      } catch (error) {
        console.error('生成规则错误:', error);
        sendResponse({ error: error.message });
      }
      return true;
      
    // 获取简化规则配置
    case 'getSimpleRulesConfig':
      simpleRulesConnector.getConfig()
        .then(config => {
          console.log('index.ts: 返回规则配置', config);
          sendResponse({ success: true, config });
        })
        .catch(error => {
          console.error('获取简化规则配置失败:', error);
          sendResponse({ 
            success: false, 
            error: error.message || '获取规则配置失败' 
          });
        });
      return true;
      
    // 保存简化规则配置
    case 'saveSimpleRulesConfig':
      console.log('index.ts: 保存简化规则配置', message.config);
      simpleRulesConnector.saveConfig(message.config)
        .then(() => {
          console.log('规则保存成功');
          
          // 同时保存到规则历史中
          saveRuleHistory(message.config);
          
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('保存规则配置失败:', error);
          sendResponse({ 
            success: false, 
            error: error.message || '保存规则配置失败' 
          });
        });
      return true;
      
    // 获取规则历史记录
    case 'getRuleHistory':
      chrome.storage.local.get(['ruleHistory'], (result) => {
        sendResponse({ success: true, history: result.ruleHistory || [] });
      });
      return true;
      
    // 系统设置更新
    case 'systemSettingsUpdated':
      try {
        console.log('系统设置已更新:', message.settings);
        // 这里可以根据需要处理系统设置的更新逻辑
        // 例如更新内部状态或通知其他组件
        
        // 修改处理速度等全局参数
        // 如果存在消息处理队列或定时任务，可以在这里调整
        
        sendResponse({ success: true });
      } catch (error) {
        console.error('处理系统设置更新失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message || '处理系统设置更新失败'
        });
      }
      return true;
      
    // AI服务配置更新
    case 'aiServiceConfigUpdated':
      try {
        console.log('AI服务配置已更新');
        // 这里可以处理AI服务配置的更新逻辑
        // 例如初始化或重新配置AI客户端
        
        sendResponse({ success: true });
      } catch (error) {
        console.error('处理AI服务配置更新失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message || '处理AI服务配置更新失败'
        });
      }
      return true;
      
    // 测试API连接
    case 'testApiConnection':
      try {
        // 获取测试配置
        const { service, apiKey, model } = message.config;
        
        console.log(`测试 ${service} API 连接，模型: ${model}`);
        
        // 执行实际的API测试
        testApiConnection(service, apiKey, model)
          .then(result => {
            sendResponse({ 
              success: true,
              result: result
            });
          })
          .catch(error => {
            console.error('API连接测试失败:', error);
            sendResponse({ 
              success: false, 
              error: error.message || 'API连接测试失败'
            });
          });
      } catch (error) {
        console.error('API连接测试失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'API连接测试失败'
        });
      }
      return true;
      
    // 获取AI推荐
    case 'getAIRecommendations':
      try {
        // 获取配置参数
        const { promptType, keywords, ruleType } = message;
        
        console.log(`获取AI推荐, 类型: ${promptType}, 关键词: ${keywords}, 规则类型: ${ruleType}`);
        
        // 获取AI服务配置
        chrome.storage.local.get(['aiServiceConfig'], async (result) => {
          const config = result.aiServiceConfig || {
            service: 'deepseek',
            apiKey: '',
            model: 'deepseek-chat'
          };
          
          if (!config.apiKey) {
            sendResponse({
              success: false,
              error: '请先在系统设置中配置AI服务API密钥'
            });
            return;
          }
          
          try {
            // 根据不同的promptType调用不同的AI推荐函数
            const recommendations = await getAIRecommendations(
              config.service,
              config.apiKey,
              config.model,
              promptType,
              keywords,
              ruleType
            );
            
            sendResponse({
              success: true,
              recommendations
            });
          } catch (error) {
            console.error('获取AI推荐失败:', error);
            sendResponse({
              success: false,
              error: error.message || '获取AI推荐失败'
            });
          }
        });
      } catch (error) {
        console.error('处理AI推荐请求失败:', error);
        sendResponse({
          success: false,
          error: error.message || '处理AI推荐请求失败'
        });
      }
      return true;
      
    default:
      sendResponse({ error: '未知消息类型' });
  }
  
  return true; // 保持消息通道开放以便异步响应
});

// AI辅助生成规则的实现
async function generateRulesFromPrompt(prompt: string, service: string, apiKey: string, model: string): Promise<any> {
  console.log('使用AI生成规则，prompt:', prompt);
  
  // 构建更完整的提示，让AI生成规则
  const fullPrompt = `
作为Boss直聘智能助手的规则生成器，请根据以下关键词和技能要求，生成一个用于筛选简历的规则配置。

用户输入: ${prompt}

请生成一个JSON对象，包含以下结构：
{
  "id": "root",
  "operator": "AND",
  "conditions": [
    // 岗位条件（如果有）
    {
      "id": "生成一个随机ID",
      "type": "岗位",
      "keywords": ["根据输入生成相关岗位名称数组"],
      "enabled": true
    },
    // 公司条件（如果有）
    {
      "id": "生成一个随机ID", 
      "type": "公司",
      "keywords": ["根据输入生成相关公司名称数组"],
      "enabled": true
    },
    // 岗位核心关键词条件（必须有）
    {
      "id": "生成一个随机ID",
      "type": "岗位核心关键词",
      "keywords": ["根据输入生成技能关键词数组"],
      "enabled": true,
      "importance": 75,
      "minMatch": 2
    }
  ],
  "enabled": true
}

规则说明：
1. 如果用户提到特定岗位，则添加"岗位"条件；如果没有提到，则不需要此条件
2. 如果用户提到特定公司，则添加"公司"条件；如果没有提到，则不需要此条件
3. "岗位核心关键词"条件是必须的，应包含用户提到的关键技能和要求
4. 每个ID应生成一个随机字符串，例如: "abc123"
5. keywords数组中的条目应与用户输入的关键词和要求相关
6. "importance"值应在25(不重要)到100(非常重要)之间
7. "minMatch"表示最少需要匹配的关键词数量，应根据关键词总数合理设置

请确保生成的规则对搜索候选人有实际帮助。只返回JSON对象，不要包含其他说明或文字。
`;

  // 调用AI服务生成规则
  if (service === 'deepseek') {
    try {
      // 构建请求参数
      const requestBody = {
        model: model,
        messages: [
          {
            role: "user",
            content: fullPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      };
      
      // DeepSeek API端点
      const apiEndpoint = "https://api.deepseek.com/v1/chat/completions";
      
      // 发送请求
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API错误: ${errorData.error?.message || response.statusText}`);
      }
      
      // 解析响应
      const data = await response.json();
      
      if (data && 
          data.choices && 
          data.choices.length > 0 && 
          data.choices[0].message && 
          data.choices[0].message.content) {
        
        // 尝试解析返回的JSON
        try {
          const rulesConfig = JSON.parse(data.choices[0].message.content);
          console.log('AI生成的规则:', rulesConfig);
          return rulesConfig;
        } catch (jsonError) {
          console.error('解析AI生成的规则失败:', jsonError);
          throw new Error('无法解析AI生成的规则JSON');
        }
      } else {
        throw new Error('AI响应格式不正确');
      }
    } catch (error) {
      console.error('使用DeepSeek API生成规则失败:', error);
      throw error;
    }
  } else {
    throw new Error(`不支持的AI服务: ${service}`);
  }
}

// 保存规则历史记录
function saveRuleHistory(config: any): void {
  chrome.storage.local.get(['ruleHistory'], (result) => {
    let history = result.ruleHistory || [];
    
    // 确保配置中的自动模式为true
    const configCopy = JSON.parse(JSON.stringify(config));
    configCopy.autoMode = true;
    
    // 创建历史记录项
    const historyItem = {
      id: Date.now().toString(),
      name: `配置 ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      config: configCopy
    };
    
    // 最多保存10条历史记录
    history.unshift(historyItem);
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    // 保存到存储
    chrome.storage.local.set({ ruleHistory: history }, () => {
      console.log('规则历史记录已保存');
    });
  });
}

// AI推荐Prompt模板
const promptTemplates = {
  // 推荐类似岗位名称
  similarJobs: (keywords: string) => `
作为招聘专家，请根据给定的岗位名称，推荐5-8个相似的岗位名称。
当前岗位：${keywords || '前端开发工程师'}
要求：
1. 返回格式为JSON数组，如["岗位1", "岗位2", "岗位3"]
2. 不要包含其他文字说明
3. 岗位名称应该是具体的职位名称，而不是笼统的描述
4. 岗位名称要简洁准确，避免冗长
5. 不要重复当前已有的岗位名称
`,
  
  // 推荐竞对公司
  competitors: (keywords: string) => `
作为行业分析专家，请根据给定的公司名称，推荐5-8个主要竞争对手公司。
当前公司：${keywords || '阿里巴巴、腾讯'}
要求：
1. 返回格式为JSON数组，如["公司1", "公司2", "公司3"]
2. 不要包含其他文字说明
3. 公司名称应该是中国市场上真实存在的公司
4. 公司名称要简洁，通常使用大家熟知的名称
5. 不要重复当前已有的公司名称
`,
  
  // 推荐岗位关键词
  jobKeywords: (keywords: string, ruleType: string) => `
作为招聘和人才获取专家，请根据给定的岗位关键词，推荐5-8个相关的技能关键词。
当前岗位关键词：${keywords || 'React, JavaScript, 前端'}
岗位类型：${ruleType || '开发'}
要求：
1. 返回格式为JSON数组，如["技能1", "技能2", "技能3"]
2. 不要包含其他文字说明
3. 关键词应该是具体的技术、工具、框架或能力
4. 关键词要简洁，通常是1-3个词
5. 不要重复当前已有的关键词
`
};

// 获取AI推荐
async function getAIRecommendations(service: string, apiKey: string, model: string, promptType: string, keywords: string, ruleType: string): Promise<string[]> {
  // 根据promptType获取对应的prompt模板
  let promptTemplate: (keywords: string, ruleType?: string) => string;
  
  switch (promptType) {
    case 'similarJobs':
      promptTemplate = promptTemplates.similarJobs;
      break;
    case 'competitors':
      promptTemplate = promptTemplates.competitors;
      break;
    case 'jobKeywords':
      promptTemplate = promptTemplates.jobKeywords;
      break;
    default:
      throw new Error(`未知的推荐类型: ${promptType}`);
  }
  
  // 生成prompt
  const prompt = promptType === 'jobKeywords' 
    ? promptTemplate(keywords, ruleType)
    : promptTemplate(keywords);
  
  console.log('使用的Prompt:', prompt);
  
  // 调用AI服务
  if (service === 'deepseek') {
    // 调用DeepSeek API
    const response = await callDeepseekAPI(apiKey, model, prompt);
    return parseAIResponse(response);
  } else {
    throw new Error(`不支持的AI服务: ${service}`);
  }
}

// 调用DeepSeek API
async function callDeepseekAPI(apiKey: string, model: string, prompt: string): Promise<any> {
  // 构建请求参数
  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: "json_object" }
  };
  
  // DeepSeek API端点
  const apiEndpoint = "https://api.deepseek.com/v1/chat/completions";
  
  // 发送请求
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  // 检查响应状态
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`DeepSeek API错误: ${errorData.error?.message || response.statusText}`);
  }
  
  // 解析响应
  const data = await response.json();
  return data;
}

// 解析AI响应
function parseAIResponse(response: any): string[] {
  try {
    if (response && 
        response.choices && 
        response.choices.length > 0 && 
        response.choices[0].message && 
        response.choices[0].message.content) {
      
      const content = response.choices[0].message.content.trim();
      
      // 尝试解析JSON
      try {
        // 如果内容是JSON格式的字符串
        const jsonData = JSON.parse(content);
        
        // 如果是数组，直接返回
        if (Array.isArray(jsonData)) {
          return jsonData;
        }
        
        // 如果是对象，尝试查找数组字段
        for (const key in jsonData) {
          if (Array.isArray(jsonData[key])) {
            return jsonData[key];
          }
        }
        
        // 如果没有找到数组，将所有值转为数组
        return Object.values(jsonData).map(value => String(value));
      } catch (jsonError) {
        // 如果不是JSON格式，尝试将文本拆分为数组
        // 查找可能的列表格式，如"1. 项目1"或"- 项目1"
        const lines = content.split('\n').filter(line => line.trim());
        const listItems = lines.map(line => {
          // 移除列表标记，如数字、破折号等
          return line.replace(/^[\s\d\.\-\*]+/, '').trim();
        }).filter(item => item);
        
        if (listItems.length > 0) {
          return listItems;
        }
        
        // 最后尝试拆分为逗号分隔的列表
        return content.split(',').map(item => item.trim()).filter(item => item);
      }
    }
    
    throw new Error('无法解析AI响应');
  } catch (error) {
    console.error('解析AI响应失败:', error, response);
    throw new Error('解析AI响应失败: ' + error.message);
  }
}

// 测试API连接
async function testApiConnection(service: string, apiKey: string, model: string): Promise<any> {
  // 这里实现实际的API连接测试
  // 针对不同的AI服务提供商实现不同的测试逻辑
  
  if (service === 'deepseek') {
    return testDeepseekApiConnection(apiKey, model);
  }
  
  throw new Error(`不支持的服务提供商: ${service}`);
}

// 测试DeepSeek API连接
async function testDeepseekApiConnection(apiKey: string, model: string): Promise<any> {
  // 简单的测试消息
  const message = "你好，这是一条测试消息，请回复'DeepSeek API连接正常'。";
  
  // 构建请求参数
  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: message
      }
    ],
    temperature: 0.1,
    max_tokens: 20
  };
  
  // DeepSeek API端点
  const apiEndpoint = "https://api.deepseek.com/v1/chat/completions";
  
  // 发送请求
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  // 检查响应状态
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`DeepSeek API错误: ${errorData.error?.message || response.statusText}`);
  }
  
  // 解析响应
  const data = await response.json();
  return data;
} 