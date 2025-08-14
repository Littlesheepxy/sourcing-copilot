"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Upload, 
  FileText, 
  Users, 
  MessageCircle, 
  Sparkles, 
  Target, 
  TrendingUp,
  Lightbulb,
  Eye,
  Save,
  RotateCcw,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Loader,
  Wand2,
  Bot,
  User,
  Copy,
  Trash2,
  Building2,
  Briefcase
} from 'lucide-react';
import { BasicFilters } from '../../../shared/types';

// AI筛选配置接口（增加基本筛选条件）
interface AIFilterConfig {
  jobDescription: string;
  talentProfile: string;
  filterCriteria: string;
  strictLevel: 'relaxed' | 'balanced' | 'strict';
  focusAreas: string[];
  customPrompts: string[];
  enabled: boolean;
  // 基本筛选条件
  basicFilters: BasicFilters;
}

// 聊天消息接口
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const AIFilterEditor: React.FC = () => {
  // 核心配置状态
  const [config, setConfig] = useState<AIFilterConfig>({
    jobDescription: '',
    talentProfile: '',
    filterCriteria: '',
    strictLevel: 'balanced',
    focusAreas: [],
    customPrompts: [],
    enabled: true,
    basicFilters: {
      position: '',
      companies: [],
      keywords: []
    }
  });

  // UI状态
  const [activeTab, setActiveTab] = useState<'basic' | 'jd' | 'profile' | 'chat'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');
  const [previewMode, setPreviewMode] = useState(false);
  
  // 基本筛选输入状态
  const [companyInput, setCompanyInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  
  // 聊天状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: '👋 你好！我是AI招聘助手。我可以帮你设置基本筛选条件、优化职位描述、完善人才画像，让筛选更精准。有什么问题尽管问我！',
      timestamp: new Date(),
      suggestions: [
        '帮我设置前端工程师的筛选条件',
        '如何定义高级前端工程师的人才画像？',
        '推荐一些优质的互联网公司'
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // 预设模板
  const jdTemplates = [
    {
      title: '高级前端工程师',
      content: '负责公司核心产品的前端开发工作，要求具备扎实的JavaScript基础，熟练掌握React/Vue等主流框架，有3年以上相关工作经验。'
    },
    {
      title: '产品经理',
      content: '负责产品规划和需求分析，协调技术团队实现产品功能，要求有互联网产品经验，具备良好的沟通协调能力。'
    },
    {
      title: 'Java后端工程师',
      content: '负责后端服务开发和架构设计，要求精通Java和Spring框架，熟悉微服务架构，有分布式系统开发经验。'
    }
  ];

  const profileTemplates = [
    {
      title: '技术专家型',
      content: '技术深度过硬，有丰富的项目实战经验，能够独立解决复杂技术问题，具备技术前瞻性和创新思维。'
    },
    {
      title: '团队协作型',
      content: '具备良好的团队合作精神，沟通能力强，能够在跨职能团队中有效协作，有mentor经验者优先。'
    },
    {
      title: '业务理解型',
      content: '深度理解业务逻辑，能够从业务角度思考技术方案，有过从0到1项目经验，具备产品思维。'
    }
  ];

  // 公司推荐选项
  const companyRecommendations = [
    '阿里', '腾讯', '百度', '字节跳动', '华为', '美团', '京东', '网易',
    '滴滴', '小米', '拼多多', '快手', 'bilibili', '蚂蚁', '360', '新浪',
    '微软', 'Google', 'Facebook', 'Apple', 'Amazon', 'Netflix', 'Uber', 'Airbnb'
  ];
  
  // 关键词推荐选项
  const keywordRecommendations = [
    'Java', 'Python', 'C++', 'JavaScript', 'React', 'Vue', 'Angular', 'Node.js',
    '微服务', '分布式', '云计算', '大数据', '人工智能', '机器学习', '深度学习',
    'Spring Boot', 'Docker', 'Kubernetes', 'DevOps', 'CI/CD', 'MySQL', 'Redis', 'MongoDB'
  ];

  // 组件加载时从后端获取配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('🔄 正在加载AI智能筛选配置...');
        const response = await fetch('http://localhost:8000/api/config');
        
        if (response.ok) {
          const data = await response.json();
          console.log('📥 从后端加载的配置:', data);
          
          // 如果后端有AI智能筛选配置，则加载
          if (data.aiEnabled || data.jobDescription || data.talentProfile) {
            setConfig(prev => ({
              ...prev,
              jobDescription: data.jobDescription || '',
              talentProfile: data.talentProfile || '',
              filterCriteria: data.filterCriteria || '',
              strictLevel: data.strictLevel || 'balanced',
              focusAreas: data.focusAreas || [],
              customPrompts: data.customPrompts || [],
              enabled: data.aiEnabled || false,
              basicFilters: {
                position: data.basicPosition || '',
                companies: data.basicCompanies || [],
                keywords: data.basicKeywords || []
              }
            }));
            
            console.log('✅ AI智能筛选配置加载成功');
            
            // 如果有基本筛选配置，自动展开基本筛选区域
            if (data.basicPosition || (data.basicCompanies && data.basicCompanies.length > 0)) {
              setExpandedSection('basic');
            } else if (data.jobDescription) {
              setExpandedSection('jd');
            } else if (data.talentProfile) {
              setExpandedSection('profile');
            }
            
            // 添加欢迎消息
            const welcomeMessage: ChatMessage = {
              id: Date.now().toString(),
              type: 'assistant',
              content: '✅ 已加载您之前保存的AI智能筛选配置。您可以继续编辑或直接使用现有配置。',
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, welcomeMessage]);
          } else {
            console.log('📝 未找到AI智能筛选配置，使用默认值');
          }
        } else {
          console.log('⚠️ 无法从后端加载配置，使用默认值');
        }
      } catch (error) {
        console.error('❌ 加载配置失败:', error);
        
        // 添加错误提示到聊天
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `⚠️ 无法加载历史配置：${error.message}。请检查后端服务是否正常运行。`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    };

    loadConfig();
  }, []);

  // 处理基本筛选条件更新
  const updateBasicFilters = (filters: BasicFilters) => {
    setConfig(prev => ({
      ...prev,
      basicFilters: filters
    }));
  };

  // 处理职位输入
  const handlePositionChange = (value: string) => {
    updateBasicFilters({
      ...config.basicFilters,
      position: value
    });
  };

  // 添加公司
  const handleAddCompany = () => {
    if (companyInput.trim() && !config.basicFilters.companies.includes(companyInput.trim())) {
      const newCompanies = [...config.basicFilters.companies, companyInput.trim()];
      updateBasicFilters({
        ...config.basicFilters,
        companies: newCompanies
      });
      setCompanyInput('');
    }
  };

  // 添加关键词
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !config.basicFilters.keywords.includes(keywordInput.trim())) {
      const newKeywords = [...config.basicFilters.keywords, keywordInput.trim()];
      updateBasicFilters({
        ...config.basicFilters,
        keywords: newKeywords
      });
      setKeywordInput('');
    }
  };

  // 移除公司
  const handleRemoveCompany = (company: string) => {
    const newCompanies = config.basicFilters.companies.filter(c => c !== company);
    updateBasicFilters({
      ...config.basicFilters,
      companies: newCompanies
    });
  };

  // 移除关键词
  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = config.basicFilters.keywords.filter(k => k !== keyword);
    updateBasicFilters({
      ...config.basicFilters,
      keywords: newKeywords
    });
  };

  // 添加推荐公司
  const handleAddRecommendedCompany = (company: string) => {
    if (!config.basicFilters.companies.includes(company)) {
      const newCompanies = [...config.basicFilters.companies, company];
      updateBasicFilters({
        ...config.basicFilters,
        companies: newCompanies
      });
    }
  };

  // 添加推荐关键词
  const handleAddRecommendedKeyword = (keyword: string) => {
    if (!config.basicFilters.keywords.includes(keyword)) {
      const newKeywords = [...config.basicFilters.keywords, keyword];
      updateBasicFilters({
        ...config.basicFilters,
        keywords: newKeywords
      });
    }
  };

  // 处理JD输入
  const handleJDChange = (value: string) => {
    setConfig(prev => ({ ...prev, jobDescription: value }));
  };

  // 处理人才画像输入
  const handleProfileChange = (value: string) => {
    setConfig(prev => ({ ...prev, talentProfile: value }));
  };

  // AI优化JD
  const optimizeJD = async () => {
    if (!config.jobDescription) {
      alert('请先输入职位描述');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `请优化以下职位描述(JD)，使其更具吸引力和准确性：

原始JD：
${config.jobDescription}

优化要求：
1. 保持原有内容的核心信息
2. 使语言更专业、清晰
3. 突出岗位亮点和发展机会
4. 明确技能要求的优先级
5. 增加具体的项目经验描述
6. 补充团队文化和发展机会

请直接输出优化后的JD内容。`;

      const optimizedJD = await callOpenAI(prompt);
      
      setConfig(prev => ({ ...prev, jobDescription: optimizedJD }));
      
      // 添加系统消息
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '✨ JD优化完成！我为你提升了职位描述的专业性和吸引力，使其更具针对性。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      
    } catch (error) {
      console.error('优化JD失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ JD优化失败，请检查网络连接或稍后重试。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // AI优化人才画像
  const optimizeProfile = async () => {
    if (!config.talentProfile) {
      alert('请先输入人才画像');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `请优化以下人才画像，使其更全面和精准：

原始人才画像：
${config.talentProfile}

优化要求：
1. 保持原有内容的核心特征
2. 增加关键评估维度
3. 补充软技能评估标准
4. 明确不同层次的要求
5. 增加行为特征描述
6. 突出成长潜力评估

请直接输出优化后的人才画像内容。`;

      const optimizedProfile = await callOpenAI(prompt);
      
      setConfig(prev => ({ ...prev, talentProfile: optimizedProfile }));
      
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '🎯 人才画像优化完成！增加了多个关键评估维度，让筛选标准更加全面精准。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      
    } catch (error) {
      console.error('优化人才画像失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ 人才画像优化失败，请检查网络连接或稍后重试。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      // 构建上下文信息
      let context = '当前配置信息：\n';
      if (config.basicFilters.position) {
        context += `目标职位：${config.basicFilters.position}\n`;
      }
      if (config.basicFilters.companies.length > 0) {
        context += `竞对公司：${config.basicFilters.companies.join(', ')}\n`;
      }
      if (config.basicFilters.keywords.length > 0) {
        context += `技能关键词：${config.basicFilters.keywords.join(', ')}\n`;
      }
      if (config.jobDescription) {
        context += `已填写职位描述\n`;
      }
      if (config.talentProfile) {
        context += `已填写人才画像\n`;
      }
      if (config.filterCriteria) {
        context += `已生成筛选标准\n`;
      }

      const prompt = `你是一位专业的HR助手，专门帮助用户设置AI智能筛选规则。

${context}

用户问题：${currentInput}

请针对用户的问题提供专业的建议。如果用户询问关于招聘筛选、职位设置、公司推荐等相关问题，请给出具体的操作建议。回答要简洁明了，不超过150字。`;

      const response = await callOpenAI(prompt);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI回复失败:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '❌ AI助手暂时无法回复，请检查网络连接或稍后重试。您也可以继续配置筛选规则。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // AI推荐职位
  const recommendPositions = async () => {
    if (!config.basicFilters.position) {
      alert('请先输入一个基础职位关键词');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `请根据用户输入的职位"${config.basicFilters.position}"，推荐5个相关的具体职位名称。
要求：
1. 推荐的职位应该与输入职位相关或相似
2. 包含不同级别（初级、中级、高级）的职位
3. 可以包含不同方向或分支的职位
4. 职位名称要具体明确，便于招聘使用

请以JSON数组格式返回，例如：["前端开发工程师", "高级前端工程师", "前端架构师", "React开发工程师", "前端技术专家"]

只返回JSON数组，不要包含其他说明文字。`;

      const response = await callOpenAI(prompt);
      console.log('AI推荐职位原始响应:', response);
      
      let positions: string[] = [];
      try {
        // 尝试解析JSON
        const cleanResponse = response.trim().replace(/```json\s*/, '').replace(/```\s*$/, '');
        positions = JSON.parse(cleanResponse);
      } catch (jsonError) {
        console.log('JSON解析失败，尝试从文本中提取职位...');
        // 如果不是JSON格式，尝试从文本中提取职位
        const lines = response.split('\n').filter(line => line.trim());
        positions = lines
          .filter(line => line.includes('工程师') || line.includes('经理') || line.includes('专员') || line.includes('总监') || line.includes('架构师'))
          .map(line => line.replace(/^\d+\.?\s*/, '').replace(/[""'']/g, '').trim())
          .slice(0, 5);
      }
      
      if (!Array.isArray(positions) || positions.length === 0) {
        throw new Error('AI推荐返回的职位格式不正确');
      }
      
      // 添加AI推荐消息到聊天
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🎯 基于"${config.basicFilters.position}"，我为您推荐了以下相关职位：\n${positions.map((p: string, i: number) => `${i+1}. ${p}`).join('\n')}`,
        timestamp: new Date(),
        suggestions: positions.map((p: string) => `选择职位：${p}`)
      };
      setChatMessages(prev => [...prev, newMessage]);
      
    } catch (error) {
      console.error('AI推荐职位失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ AI推荐职位失败，请检查网络连接或稍后重试。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // AI推荐公司
  const recommendCompanies = async () => {
    if (!config.basicFilters.position) {
      alert('请先输入目标职位以获得更精准的公司推荐');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `请根据职位"${config.basicFilters.position}"，推荐10个相关的优质公司名称。
要求：
1. 推荐的公司应该经常招聘该类型职位
2. 包含不同规模的公司（大厂、独角兽、创业公司等）
3. 以国内公司为主，也可包含知名外企
4. 公司名称要准确，使用常见简称

请以JSON数组格式返回，例如：["阿里", "腾讯", "字节跳动", "美团", "小米", "华为", "百度", "京东", "网易", "滴滴"]

只返回JSON数组，不要包含其他说明文字。`;

      const response = await callOpenAI(prompt);
      console.log('AI推荐公司原始响应:', response);
      
      let companies: string[] = [];
      try {
        // 尝试解析JSON
        const cleanResponse = response.trim().replace(/```json\s*/, '').replace(/```\s*$/, '');
        companies = JSON.parse(cleanResponse);
      } catch (jsonError) {
        console.log('JSON解析失败，尝试从文本中提取公司...');
        // 如果不是JSON格式，尝试从文本中提取公司名
        const lines = response.split('\n').filter(line => line.trim());
        companies = lines
          .map(line => line.replace(/^\d+\.?\s*/, '').replace(/[""'']/g, '').trim())
          .filter(line => line.length > 0 && line.length < 20) // 过滤掉过长的文本
          .slice(0, 10);
      }
      
      if (!Array.isArray(companies) || companies.length === 0) {
        throw new Error('AI推荐返回的公司格式不正确');
      }
      
      // 添加AI推荐消息到聊天
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🏢 基于"${config.basicFilters.position}"职位，我为您推荐了以下优质公司：\n${companies.map((c: string, i: number) => `${i+1}. ${c}`).join('\n')}`,
        timestamp: new Date(),
        suggestions: companies.slice(0, 5).map((c: string) => `添加公司：${c}`)
      };
      setChatMessages(prev => [...prev, newMessage]);
      
    } catch (error) {
      console.error('AI推荐公司失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ AI推荐公司失败，请检查网络连接或稍后重试。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 调用OpenAI API的通用函数
  const callOpenAI = async (prompt: string): Promise<string> => {
    const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'sk-hra-zp-2025052091';
    const BASE_URL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://chat.inhyperloop.com/v1';
    
    console.log('🤖 调用OpenAI API:', BASE_URL);
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的人力资源专家和招聘顾问，善于分析职位需求和推荐优质公司。请用中文回答。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API调用失败:', response.status, errorText);
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('API响应格式错误:', data);
      throw new Error('API响应格式错误');
    }

    const result = data.choices[0].message.content;
    console.log('✅ OpenAI API调用成功，响应长度:', result.length);
    return result;
  };

  // 处理聊天建议点击（增强功能）
  const applySuggestion = (suggestion: string) => {
    if (suggestion.startsWith('选择职位：')) {
      const position = suggestion.replace('选择职位：', '');
      handlePositionChange(position);
      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `✅ 已将职位设置为：${position}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, confirmMessage]);
    } else if (suggestion.startsWith('添加公司：')) {
      const company = suggestion.replace('添加公司：', '');
      handleAddRecommendedCompany(company);
      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `✅ 已添加公司：${company}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, confirmMessage]);
    } else {
      setChatInput(suggestion);
    }
  };

  // 生成筛选标准（修改为必需JD或人才画像其中之一）
  const generateFilterCriteria = async () => {
    if (!config.jobDescription && !config.talentProfile) {
      alert('请先完善职位描述(JD)或人才画像其中一项');
      return;
    }

    setIsLoading(true);
    try {
      // 构建AI提示词
      let context = '';
      if (config.jobDescription) {
        context += `职位描述(JD)：\n${config.jobDescription}\n\n`;
      }
      if (config.talentProfile) {
        context += `人才画像：\n${config.talentProfile}\n\n`;
      }
      if (config.basicFilters.position) {
        context += `目标职位：${config.basicFilters.position}\n\n`;
      }
      if (config.basicFilters.companies.length > 0) {
        context += `竞对公司：${config.basicFilters.companies.join(', ')}\n\n`;
      }

      const prompt = `作为资深HR专家，请基于以下信息生成一套完整的AI智能筛选标准和逻辑：

${context}

请生成包含以下内容的筛选标准：
1. **核心评估维度**：明确列出4-6个关键评估维度及其权重
2. **必备条件**：候选人必须满足的硬性要求
3. **加分项**：优先考虑的优势条件
4. **评分标准**：具体的评分逻辑和分数区间
5. **筛选逻辑**：AI筛选的具体执行逻辑

要求：
- 标准要具体可操作，便于AI理解和执行
- 评分标准要量化明确
- 考虑候选人的技能、经验、背景、潜力等多个方面
- 输出格式要清晰易读，包含必要的分类和说明

请直接输出完整的筛选标准内容。`;

      const response = await callOpenAI(prompt);
      
      setConfig(prev => ({ ...prev, filterCriteria: response }));
      
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '🚀 AI智能筛选标准生成完成！已根据您提供的职位信息和要求制定了详细的筛选逻辑。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      
    } catch (error) {
      console.error('生成筛选标准失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ 生成筛选标准失败，请检查网络连接或稍后重试。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    setIsLoading(true);
    try {
      // 检查必填项
      if (!config.basicFilters.position) {
        alert('请填写目标岗位');
        setIsLoading(false);
        return;
      }

      if (config.basicFilters.companies.length === 0) {
        alert('请至少添加一个竞对公司');
        setIsLoading(false);
        return;
      }

      if (!config.filterCriteria) {
        alert('请先生成AI智能筛选标准');
        setIsLoading(false);
        return;
      }

      // 构建配置对象，只包含必要的字段
      const configToSave = {
        // 传统规则字段（保持兼容性）
        rules: [],
        autoMode: false,
        passScore: 70,
        
        // AI智能筛选字段（只传AI筛选标准）
        aiEnabled: true,  // 启用AI智能筛选
        filterCriteria: config.filterCriteria,  // 只传AI智能筛选标准
        strictLevel: config.strictLevel,
        
        // 基本筛选条件
        basicPosition: config.basicFilters.position,
        basicCompanies: config.basicFilters.companies,
        basicKeywords: config.basicFilters.keywords
      };

      console.log('🚀 保存AI智能筛选配置:', configToSave);

      // 调用后端API保存配置
      const response = await fetch('http://localhost:8000/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configToSave)
      });
      
      if (!response.ok) {
        throw new Error('API响应错误');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '保存失败');
      }

      console.log('✅ AI智能筛选配置保存成功');
      
      // 添加成功消息到聊天
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '🎉 AI智能筛选配置已成功保存！系统将使用您定义的筛选标准进行智能筛选。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, successMessage]);
      
      // 显示成功提示
      alert('AI智能筛选配置保存成功！');
    } catch (error) {
      console.error('❌ 保存AI智能筛选配置失败:', error);
      
      // 添加错误消息到聊天
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ 保存失败：${error.message}。请检查网络连接或稍后重试。`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      
      alert('保存失败，请重试: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Brain className="w-6 h-6 mr-2 text-purple-500" />
            AI智能筛选
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            设置基本筛选条件，让AI理解你的需求，自动筛选最合适的候选人
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center"
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? '编辑模式' : '预览模式'}
          </button>
          
          <button
            onClick={saveConfig}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center disabled:opacity-50"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            保存配置
          </button>
        </div>
      </div>

      {/* 核心内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：基本筛选、JD和人才画像 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本筛选条件 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div 
              className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'basic' ? null : 'basic')}
            >
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-orange-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">基本筛选条件</h3>
                <span className="ml-2 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 px-2 py-1 rounded-full">
                  必填
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {expandedSection === 'basic' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
            
            {expandedSection === 'basic' && (
              <div className="p-4 space-y-6">
                {/* 岗位筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    目标岗位 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.basicFilters.position}
                      onChange={(e) => handlePositionChange(e.target.value)}
                      placeholder="请输入目标岗位名称"
                      className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={recommendPositions}
                      disabled={isLoading || !config.basicFilters.position}
                      className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center whitespace-nowrap"
                    >
                      <Brain className="w-4 h-4 mr-1" />
                      AI推荐
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">例如：前端工程师、Java开发工程师、产品经理等</p>
                </div>

                {/* 竞对公司筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    竞对公司 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {config.basicFilters.companies.map(company => (
                      <span 
                        key={company}
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {company}
                        <button 
                          onClick={() => handleRemoveCompany(company)}
                          className="ml-2 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 h-5 w-5 inline-flex items-center justify-center"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCompany()}
                      placeholder="输入公司名称并回车添加"
                      className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleAddCompany}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      添加
                    </button>
                    <button
                      onClick={recommendCompanies}
                      disabled={isLoading || !config.basicFilters.position}
                      className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center whitespace-nowrap"
                    >
                      <Brain className="w-4 h-4 mr-1" />
                      AI推荐
                    </button>
                  </div>
                  
                  {/* 推荐公司 */}
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      常见竞对公司（备选）
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {companyRecommendations.map(company => (
                        <button
                          key={company}
                          onClick={() => handleAddRecommendedCompany(company)}
                          disabled={config.basicFilters.companies.includes(company)}
                          className={`text-xs px-3 py-1 rounded-full 
                            ${config.basicFilters.companies.includes(company) 
                              ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                              : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 dark:bg-gray-700 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-gray-600'
                            }`}
                        >
                          {company} {!config.basicFilters.companies.includes(company) && '+'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 技能关键词筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    技能关键词 <span className="text-gray-500">(可选)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {config.basicFilters.keywords.map(keyword => (
                      <span 
                        key={keyword}
                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {keyword}
                        <button 
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-2 rounded-full hover:bg-green-200 dark:hover:bg-green-800 h-5 w-5 inline-flex items-center justify-center"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                      placeholder="输入技能关键词并回车添加"
                      className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleAddKeyword}
                      className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      添加
                    </button>
                  </div>
                  
                  {/* 推荐关键词 */}
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3 flex items-center">
                      <Sparkles className="w-4 h-4 mr-1" />
                      热门技能关键词
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {keywordRecommendations.map(keyword => (
                        <button
                          key={keyword}
                          onClick={() => handleAddRecommendedKeyword(keyword)}
                          disabled={config.basicFilters.keywords.includes(keyword)}
                          className={`text-xs px-3 py-1 rounded-full 
                            ${config.basicFilters.keywords.includes(keyword) 
                              ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                              : 'bg-white text-green-700 border border-green-300 hover:bg-green-50 dark:bg-gray-700 dark:text-green-300 dark:border-green-600 dark:hover:bg-gray-600'
                            }`}
                        >
                          {keyword} {!config.basicFilters.keywords.includes(keyword) && '+'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* JD输入区 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div 
              className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'jd' ? null : 'jd')}
            >
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">职位描述 (JD)</h3>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 px-2 py-1 rounded-full">
                  选填
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    optimizeJD();
                  }}
                  disabled={isLoading || !config.jobDescription}
                  className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md text-sm hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center"
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  AI优化
                </button>
                {expandedSection === 'jd' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
            
            {expandedSection === 'jd' && (
              <div className="p-4 space-y-4">
                {/* 说明文字 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 职位描述将用于生成AI智能筛选标准。您可以填写JD或人才画像其中一项，也可以都填写以获得更精准的筛选标准。
                  </p>
                </div>

                {/* 模板选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    快速开始 - 选择模板
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {jdTemplates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handleJDChange(template.content)}
                        className="text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{template.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{template.content.slice(0, 40)}...</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* JD输入框 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    详细职位描述
                  </label>
                  <textarea
                    value={config.jobDescription}
                    onChange={(e) => handleJDChange(e.target.value)}
                    placeholder="请输入详细的职位描述，包括岗位职责、任职要求、技能需求等..."
                    className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {config.jobDescription.length} 字符
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleJDChange('')}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 人才画像区 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div 
              className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">理想人才画像</h3>
                <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 px-2 py-1 rounded-full">
                  选填
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    optimizeProfile();
                  }}
                  disabled={isLoading || !config.talentProfile}
                  className="px-3 py-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-md text-sm hover:from-green-600 hover:to-teal-600 disabled:opacity-50 flex items-center"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI完善
                </button>
                {expandedSection === 'profile' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
            
            {expandedSection === 'profile' && (
              <div className="p-4 space-y-4">
                {/* 说明文字 */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    💡 人才画像将用于生成AI智能筛选标准。您可以填写JD或人才画像其中一项，也可以都填写以获得更精准的筛选标准。
                  </p>
                </div>

                {/* 画像模板 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    人才类型模板
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {profileTemplates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handleProfileChange(template.content)}
                        className="text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{template.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{template.content.slice(0, 40)}...</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 画像输入框 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    详细人才画像
                  </label>
                  <textarea
                    value={config.talentProfile}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    placeholder="描述理想候选人的特征，包括技能水平、工作经验、性格特点、成长潜力等..."
                    className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {config.talentProfile.length} 字符
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 生成筛选标准 */}
          {config.jobDescription && config.talentProfile && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI智能筛选标准</h3>
                </div>
                <button
                  onClick={generateFilterCriteria}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  生成筛选标准
                </button>
              </div>
              
              {config.filterCriteria && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {config.filterCriteria}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：AI助手聊天 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-fit lg:sticky lg:top-4">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-indigo-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">AI助手</h3>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">在线</span>
            </div>
          </div>
          
          {/* 聊天消息区 */}
          <div className="flex-1 p-4 space-y-4 max-h-96 overflow-y-auto">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : message.type === 'system'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                } rounded-lg p-3`}>
                  <div className="flex items-start space-x-2">
                    {message.type === 'assistant' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      {message.suggestions && (
                        <div className="mt-3 space-y-1">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => applySuggestion(suggestion)}
                              className="block w-full text-left text-xs bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 px-2 py-1 rounded border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 聊天输入区 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="问我任何关于招聘筛选的问题..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isChatLoading}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFilterEditor; 