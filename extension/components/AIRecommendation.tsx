/**
 * AI建议组件 - 用于展示DeepSeek的智能建议
 */
import React, { useState } from 'react';
import { AIRecommendation, Rule, RuleType, CompanyType } from '../../shared/types';
import { useFilterStore } from '../store/filterStore';

interface AIRecommendationProps {
  recommendation: AIRecommendation | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const AIRecommendationPanel: React.FC<AIRecommendationProps> = ({
  recommendation,
  isLoading,
  onRefresh
}) => {
  const [selectedTab, setSelectedTab] = useState<'rules' | 'companies' | 'keywords'>('rules');
  
  const {
    updateRule,
    reorderRules,
    addCompany,
    addKeyword,
    currentFilterConfig
  } = useFilterStore();
  
  // 应用规则建议
  const applyRulesRecommendation = () => {
    if (!recommendation?.rules.length) return;
    
    // 获取当前规则映射
    const ruleMap = new Map(
      currentFilterConfig.rules.map(rule => [rule.type, rule])
    );
    
    // 更新规则权重和顺序
    recommendation.rules.forEach((recRule, index) => {
      const existingRule = ruleMap.get(recRule.type as RuleType);
      if (existingRule && recRule.weight) {
        updateRule(existingRule.id, {
          weight: recRule.weight,
          order: index
        });
      }
    });
    
    // 重新排序规则
    const newOrder = recommendation.rules
      .map(recRule => {
        const rule = ruleMap.get(recRule.type as RuleType);
        return rule?.id;
      })
      .filter(Boolean) as string[];
    
    if (newOrder.length) {
      reorderRules(newOrder);
    }
  };
  
  // 应用公司建议
  const applyCompaniesRecommendation = () => {
    if (!recommendation?.companies.length) return;
    
    // 获取当前已有公司
    const existingCompanies = new Set(
      currentFilterConfig.companies.map(company => company.name.toLowerCase())
    );
    
    // 添加新公司
    recommendation.companies.forEach(company => {
      if (!existingCompanies.has(company.toLowerCase())) {
        // 默认为普通公司类型
        addCompany(company, CompanyType.NORMAL);
      }
    });
  };
  
  // 应用关键词建议
  const applyKeywordsRecommendation = () => {
    if (!recommendation?.keywords.length) return;
    
    // 获取当前已有关键词
    const existingKeywords = new Set(
      currentFilterConfig.keywords.map(keyword => keyword.toLowerCase())
    );
    
    // 添加新关键词
    recommendation.keywords.forEach(keyword => {
      if (!existingKeywords.has(keyword.toLowerCase())) {
        addKeyword(keyword);
      }
    });
  };
  
  // 一键应用所有建议
  const applyAllRecommendations = () => {
    applyRulesRecommendation();
    applyCompaniesRecommendation();
    applyKeywordsRecommendation();
  };
  
  // 加载状态
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">AI正在生成建议...</span>
        </div>
      </div>
    );
  }
  
  // 无建议时
  if (!recommendation) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m0 16v1m-8-8h1m15 0h1m-2.475-6.5l-.7.7m-12.65-.7l.7.7m12.65 12.1l-.7-.7m-12.65.7l.7-.7M12 12.5a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
          <h3 className="text-gray-600 font-medium mb-2">暂无AI建议</h3>
          <p className="text-gray-500 text-sm mb-4">点击刷新按钮获取针对当前岗位的智能建议</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            获取AI建议
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 头部说明 */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">AI智能建议</h3>
          <button
            onClick={onRefresh}
            className="text-white opacity-80 hover:opacity-100 focus:outline-none"
            title="刷新建议"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* AI解释 */}
      {recommendation.explanation && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 text-sm text-blue-800">
          <p>{recommendation.explanation}</p>
        </div>
      )}
      
      {/* 标签页切换 */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              selectedTab === 'rules' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('rules')}
          >
            规则顺序和权重
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              selectedTab === 'companies' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('companies')}
          >
            推荐公司
            {recommendation.companies.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                {recommendation.companies.length}
              </span>
            )}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              selectedTab === 'keywords' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('keywords')}
          >
            关键词
            {recommendation.keywords.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                {recommendation.keywords.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-4">
        {/* 规则内容 */}
        {selectedTab === 'rules' && (
          <div>
            {recommendation.rules.length > 0 ? (
              <div className="space-y-2">
                {recommendation.rules.map((rule, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                    <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-medium text-sm mr-2">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-gray-800">
                        {rule.name || getRuleTypeName(rule.type as RuleType)}
                      </div>
                      {rule.weight && (
                        <div className="text-sm text-gray-500">
                          权重: {rule.weight}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={applyRulesRecommendation}
                  className="mt-3 w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none"
                >
                  应用规则建议
                </button>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">无规则建议</p>
            )}
          </div>
        )}
        
        {/* 公司内容 */}
        {selectedTab === 'companies' && (
          <div>
            {recommendation.companies.length > 0 ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {recommendation.companies.map((company, index) => (
                    <div key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {company}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={applyCompaniesRecommendation}
                  className="mt-3 w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none"
                >
                  添加推荐公司
                </button>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">无公司建议</p>
            )}
          </div>
        )}
        
        {/* 关键词内容 */}
        {selectedTab === 'keywords' && (
          <div>
            {recommendation.keywords.length > 0 ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {recommendation.keywords.map((keyword, index) => (
                    <div key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={applyKeywordsRecommendation}
                  className="mt-3 w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none"
                >
                  添加推荐关键词
                </button>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">无关键词建议</p>
            )}
          </div>
        )}
      </div>
      
      {/* 底部操作栏 */}
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={applyAllRecommendations}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
        >
          一键应用所有建议
        </button>
      </div>
    </div>
  );
};

// 辅助函数 - 获取规则类型名称
function getRuleTypeName(type: RuleType): string {
  const nameMap: Record<RuleType, string> = {
    [RuleType.POSITION]: '岗位',
    [RuleType.COMPANY]: '公司',
    [RuleType.KEYWORD]: '关键词',
    [RuleType.SCHOOL]: '学校',
    [RuleType.EDUCATION]: '学历'
  };
  
  return nameMap[type] || '未知规则';
} 