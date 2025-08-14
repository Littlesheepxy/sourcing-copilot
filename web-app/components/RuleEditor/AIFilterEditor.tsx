"use client";

import React, { useState, useEffect } from 'react';
import { Brain, Eye, Save, Loader } from 'lucide-react';
import { BasicFilters } from '../../../shared/types';
import BasicFiltersPanel from './panels/BasicFiltersPanel';
import JobDescriptionPanel from './panels/JobDescriptionPanel';
import TalentProfilePanel from './panels/TalentProfilePanel';
import AIAssistantChat, { ChatMessage } from './panels/AIAssistantChat';
import FilterCriteriaPanel from './panels/FilterCriteriaPanel';
import { useAIRecommendations } from './hooks/useAIRecommendations';
import { useSearchParams } from 'next/navigation';

// AI筛选配置接口
interface AIFilterConfig {
  jobDescription: string;
  talentProfile: string;
  filterCriteria: string;
  strictLevel: 'relaxed' | 'balanced' | 'strict';
  focusAreas: string[];
  customPrompts: string[];
  enabled: boolean;
  basicFilters: BasicFilters;
}

const AIFilterEditor: React.FC = () => {
  // 添加客户端渲染检查
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  
  // AI助手高亮状态
  const [shouldHighlightAI, setShouldHighlightAI] = useState(false);
  
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
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');
  const [previewMode, setPreviewMode] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
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

  // AI推荐功能 - 移到组件顶层，不再使用条件调用
  const aiRecommendations = useAIRecommendations({
    position: config.basicFilters.position,
    onAddChatMessage: (message) => setChatMessages(prev => [...prev, message])
  });

  const { isLoading: isAILoading, recommendPositions, recommendCompanies, callOpenAI } = aiRecommendations;

  // 确保只在客户端环境中初始化
  useEffect(() => {
    setIsClient(true);
    
    // 检查URL参数，如果有highlight=ai，则触发AI助手高亮
    if (searchParams.get('highlight') === 'ai') {
      setTimeout(() => {
        setShouldHighlightAI(true);
        // 清除URL参数（可选）
        const url = new URL(window.location.href);
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url.toString());
        
        // 2秒后重置状态，以便下次可以再次触发
        setTimeout(() => {
          setShouldHighlightAI(false);
        }, 2000);
      }, 500); // 延迟500ms让页面先加载完成
    }
  }, [searchParams]);

  // 自动保存功能 - 当配置变化时自动保存
  useEffect(() => {
    if (!isClient) return;
    
    // 防抖保存，避免频繁保存
    const autoSaveTimer = setTimeout(async () => {
      // 检查是否有有效配置需要保存
      if (config.basicFilters.position || 
          config.basicFilters.companies.length > 0 || 
          config.filterCriteria) {
        
        try {
          setAutoSaveStatus('saving');
          console.log('🔄 自动保存AI智能筛选配置...');
          
          const configToSave = {
            rules: [],
            autoMode: false,
            passScore: 70,
            aiEnabled: true,
            filterCriteria: config.filterCriteria,
            strictLevel: config.strictLevel,
            basicPosition: config.basicFilters.position,
            basicCompanies: config.basicFilters.companies,
            basicKeywords: config.basicFilters.keywords,
            jobDescription: config.jobDescription,
            talentProfile: config.talentProfile
          };

          const response = await fetch('http://localhost:8000/api/config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(configToSave)
          });
          
          if (response.ok) {
            console.log('✅ AI智能筛选配置自动保存成功');
            setAutoSaveStatus('saved');
            setTimeout(() => setAutoSaveStatus('idle'), 2000);
          } else {
            throw new Error('保存失败');
          }
        } catch (error) {
          console.log('⚠️ 自动保存失败，将在手动保存时重试:', error);
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
      }
    }, 2000); // 2秒防抖

    return () => clearTimeout(autoSaveTimer);
  }, [isClient, config.basicFilters, config.filterCriteria, config.strictLevel, config.jobDescription, config.talentProfile]);

  // 组件加载时从后端获取配置 - 只在客户端执行
  useEffect(() => {
    if (!isClient) return;

    const loadConfig = async () => {
      try {
        console.log('🔄 正在加载AI智能筛选配置...');
        const response = await fetch('http://localhost:8000/api/config');
        
        if (response.ok) {
          const data = await response.json();
          console.log('📥 从后端加载的配置:', data);
          
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
            
            if (data.basicPosition || (data.basicCompanies && data.basicCompanies.length > 0)) {
              setExpandedSection('basic');
            } else if (data.jobDescription) {
              setExpandedSection('jd');
            } else if (data.talentProfile) {
              setExpandedSection('profile');
            }
            
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
  }, [isClient]);

  // 如果还在服务器端或未初始化完成，显示加载状态
  if (!isClient) {
    return (
      <div className="space-y-6">
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
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center">
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              加载中...
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </div>
      </div>
    );
  }

  // 处理基本筛选条件更新
  const updateBasicFilters = (filters: BasicFilters) => {
    setConfig(prev => ({
      ...prev,
      basicFilters: filters
    }));
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

  // 处理聊天建议点击
  const applySuggestion = (suggestion: string) => {
    if (suggestion.startsWith('选择职位：')) {
      const position = suggestion.replace('选择职位：', '');
      updateBasicFilters({
        ...config.basicFilters,
        position: position
      });
      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `✅ 已将职位设置为：${position}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, confirmMessage]);
    } else if (suggestion.startsWith('添加公司：')) {
      const company = suggestion.replace('添加公司：', '');
      if (!config.basicFilters.companies.includes(company)) {
        const newCompanies = [...config.basicFilters.companies, company];
        updateBasicFilters({
          ...config.basicFilters,
          companies: newCompanies
        });
        const confirmMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `✅ 已添加公司：${company}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, confirmMessage]);
      }
    } else {
      setChatInput(suggestion);
    }
  };

  // 生成筛选标准
  const generateFilterCriteria = async () => {
    if (!config.jobDescription && !config.talentProfile) {
      alert('请先完善职位描述(JD)或人才画像其中一项');
      return;
    }

    setIsLoading(true);
    try {
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

      const configToSave = {
        rules: [],
        autoMode: false,
        passScore: 70,
        aiEnabled: true,
        filterCriteria: config.filterCriteria,
        strictLevel: config.strictLevel,
        basicPosition: config.basicFilters.position,
        basicCompanies: config.basicFilters.companies,
        basicKeywords: config.basicFilters.keywords
      };

      console.log('🚀 保存AI智能筛选配置:', configToSave);

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
      
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '🎉 AI智能筛选配置已成功保存！系统将使用您定义的筛选标准进行智能筛选。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, successMessage]);
      
      alert('AI智能筛选配置保存成功！');
    } catch (error) {
      console.error('❌ 保存AI智能筛选配置失败:', error);
      
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
          
          {/* 自动保存状态指示器 */}
          {autoSaveStatus !== 'idle' && (
            <div className={`px-3 py-2 rounded-lg flex items-center text-sm ${
              autoSaveStatus === 'saving' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
              autoSaveStatus === 'saved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {autoSaveStatus === 'saving' && <Loader className="w-4 h-4 mr-2 animate-spin" />}
              {autoSaveStatus === 'saved' && <span className="w-4 h-4 mr-2">✓</span>}
              {autoSaveStatus === 'error' && <span className="w-4 h-4 mr-2">⚠</span>}
              {autoSaveStatus === 'saving' && '自动保存中...'}
              {autoSaveStatus === 'saved' && '已自动保存'}
              {autoSaveStatus === 'error' && '保存失败'}
            </div>
          )}
          
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
            手动保存
          </button>
        </div>
      </div>

      {/* 核心内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：基本筛选、JD和人才画像 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本筛选条件 */}
          <BasicFiltersPanel
            config={config.basicFilters}
            onUpdate={updateBasicFilters}
            onRecommendPositions={recommendPositions}
            onRecommendCompanies={recommendCompanies}
            isLoading={isAILoading}
          />

          {/* JD输入区 */}
          <JobDescriptionPanel
            value={config.jobDescription}
            onChange={(value) => setConfig(prev => ({ ...prev, jobDescription: value }))}
            onOptimize={optimizeJD}
            isLoading={isLoading}
            isExpanded={expandedSection === 'jd'}
            onToggleExpanded={() => setExpandedSection(expandedSection === 'jd' ? null : 'jd')}
          />

          {/* 人才画像区 */}
          <TalentProfilePanel
            value={config.talentProfile}
            onChange={(value) => setConfig(prev => ({ ...prev, talentProfile: value }))}
            onOptimize={optimizeProfile}
            isLoading={isLoading}
            isExpanded={expandedSection === 'profile'}
            onToggleExpanded={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
          />

          {/* 生成筛选标准 */}
          <FilterCriteriaPanel
            criteria={config.filterCriteria}
            onGenerate={generateFilterCriteria}
            isLoading={isLoading}
            hasJDOrProfile={!!config.jobDescription || !!config.talentProfile}
          />
        </div>

        {/* 右侧：AI助手聊天 */}
        <AIAssistantChat
          messages={chatMessages}
          input={chatInput}
          onInputChange={setChatInput}
          onSendMessage={sendChatMessage}
          onApplySuggestion={applySuggestion}
          isLoading={isChatLoading}
          shouldHighlight={shouldHighlightAI}
        />
      </div>
    </div>
  );
};

export default AIFilterEditor; 