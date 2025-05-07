/**
 * 规则引擎主面板组件
 */
import React, { useState } from 'react';
import { RulesList } from './RulesList';
import { RuleEditor } from './RuleEditor';
import { AIRecommendationPanel } from './AIRecommendation';
import { Rule, AIRecommendation } from '../../shared/types';
import { useFilterStore } from '../store/filterStore';

// 导入模拟的DeepSeek服务API
// 实际项目中应该直接导入真实API
const mockGetAIRecommendation = async (position: string): Promise<AIRecommendation> => {
  // 这里模拟一个API调用
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    rules: [
      { type: 'position', name: '岗位匹配', weight: 100, order: 0 },
      { type: 'keyword', name: '技能关键词', weight: 90, order: 1 },
      { type: 'company', name: '公司背景', weight: 80, order: 2 },
      { type: 'education', name: '学历要求', weight: 60, order: 3 },
      { type: 'school', name: '学校背景', weight: 50, order: 4 }
    ],
    companies: [
      '字节跳动', '腾讯', '阿里巴巴', '百度', '美团', '京东', '快手', 
      '网易', '小米', '华为', '滴滴'
    ],
    keywords: [
      'React', 'JavaScript', 'TypeScript', 'Vue', 'Webpack', 'Node.js',
      'HTML5', 'CSS3', 'SASS/LESS', '微信小程序', '移动端开发',
      'Redux', 'Vuex', '前端工程化', '组件开发', '性能优化'
    ],
    explanation: '根据前端开发岗位的要求，技能关键词应该具有较高权重，优质公司背景也很重要。建议优先关注技术栈匹配度和大厂经验。'
  };
};

export const RuleEnginePanel: React.FC = () => {
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [aiRecommendation, setAIRecommendation] = useState<AIRecommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  
  const {
    activeTab,
    setActiveTab,
    currentFilterConfig,
    updateConfig
  } = useFilterStore();
  
  // 切换模式
  const toggleMode = () => {
    updateConfig({
      mode: currentFilterConfig.mode === 'auto' ? 'manual' : 'auto'
    });
  };
  
  // 处理阈值变更
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      updateConfig({
        autoGreetThreshold: Math.max(0, Math.min(100, value))
      });
    }
  };
  
  // 获取AI建议
  const fetchAIRecommendation = async () => {
    setIsLoadingRecommendation(true);
    
    try {
      // 这里使用模拟API，实际项目中应该使用真实API
      const position = currentFilterConfig.positionKeywords[0] || '前端开发';
      const recommendation = await mockGetAIRecommendation(position);
      setAIRecommendation(recommendation);
    } catch (error) {
      console.error('获取AI建议失败', error);
    } finally {
      setIsLoadingRecommendation(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-medium">Boss直聘智能筛选规则引擎</h1>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-white text-opacity-80">
              {currentFilterConfig.mode === 'auto' ? '自动筛选' : '人工校准'}
            </span>
            <button
              onClick={toggleMode}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                currentFilterConfig.mode === 'auto' ? 'bg-green-400' : 'bg-gray-300'
              }`}
            >
              <span 
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  currentFilterConfig.mode === 'auto' ? 'translate-x-6' : 'translate-x-1'
                }`} 
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* 主内容区域 */}
      <div className="flex-grow overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 左侧配置区域 */}
          <div className="space-y-4">
            {/* 规则列表卡片 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <RulesList onEdit={setEditingRule} />
            </div>
            
            {/* 自动打招呼阈值设置 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium text-gray-800 mb-3">自动打招呼阈值设置</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">最低匹配分数:</span>
                  <span className="text-sm font-medium text-blue-600">{currentFilterConfig.autoGreetThreshold}分</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentFilterConfig.autoGreetThreshold}
                  onChange={handleThresholdChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  设置筛选匹配分数达到多少分时自动打招呼。当前设置为{currentFilterConfig.autoGreetThreshold}分，
                  {currentFilterConfig.mode === 'auto' 
                    ? '系统将自动向匹配度高的候选人打招呼。' 
                    : '当前为人工校准模式，系统不会自动打招呼。'}
                </p>
              </div>
            </div>
          </div>
          
          {/* 右侧AI推荐区域 */}
          <div>
            <AIRecommendationPanel
              recommendation={aiRecommendation}
              isLoading={isLoadingRecommendation}
              onRefresh={fetchAIRecommendation}
            />
          </div>
        </div>
      </div>
      
      {/* 规则编辑弹窗 */}
      <RuleEditor
        rule={editingRule}
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
      />
    </div>
  );
};