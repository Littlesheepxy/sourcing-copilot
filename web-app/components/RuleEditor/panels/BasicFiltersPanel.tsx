"use client";

import React, { useState } from 'react';
import { Briefcase, Building2, Sparkles, Brain } from 'lucide-react';
import { BasicFilters } from '../../../../shared/types';

interface BasicFiltersPanelProps {
  config: BasicFilters;
  onUpdate: (filters: BasicFilters) => void;
  onRecommendPositions: () => void;
  onRecommendCompanies: () => void;
  isLoading: boolean;
}

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

const BasicFiltersPanel: React.FC<BasicFiltersPanelProps> = ({
  config,
  onUpdate,
  onRecommendPositions,
  onRecommendCompanies,
  isLoading
}) => {
  const [companyInput, setCompanyInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  // 处理职位输入
  const handlePositionChange = (value: string) => {
    onUpdate({
      ...config,
      position: value
    });
  };

  // 添加公司
  const handleAddCompany = () => {
    if (companyInput.trim() && !config.companies.includes(companyInput.trim())) {
      const newCompanies = [...config.companies, companyInput.trim()];
      onUpdate({
        ...config,
        companies: newCompanies
      });
      setCompanyInput('');
    }
  };

  // 添加关键词
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !config.keywords.includes(keywordInput.trim())) {
      const newKeywords = [...config.keywords, keywordInput.trim()];
      onUpdate({
        ...config,
        keywords: newKeywords
      });
      setKeywordInput('');
    }
  };

  // 移除公司
  const handleRemoveCompany = (company: string) => {
    const newCompanies = config.companies.filter(c => c !== company);
    onUpdate({
      ...config,
      companies: newCompanies
    });
  };

  // 移除关键词
  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = config.keywords.filter(k => k !== keyword);
    onUpdate({
      ...config,
      keywords: newKeywords
    });
  };

  // 添加推荐公司
  const handleAddRecommendedCompany = (company: string) => {
    if (!config.companies.includes(company)) {
      const newCompanies = [...config.companies, company];
      onUpdate({
        ...config,
        companies: newCompanies
      });
    }
  };

  // 添加推荐关键词
  const handleAddRecommendedKeyword = (keyword: string) => {
    if (!config.keywords.includes(keyword)) {
      const newKeywords = [...config.keywords, keyword];
      onUpdate({
        ...config,
        keywords: newKeywords
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-orange-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">基本筛选条件</h3>
          <span className="ml-2 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 px-2 py-1 rounded-full">
            必填
          </span>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {/* 岗位筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            目标岗位 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={config.position}
              onChange={(e) => handlePositionChange(e.target.value)}
              placeholder="请输入目标岗位名称"
              className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={onRecommendPositions}
              disabled={isLoading || !config.position}
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
            {config.companies.map(company => (
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
              onClick={onRecommendCompanies}
              disabled={isLoading || !config.position}
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
                  disabled={config.companies.includes(company)}
                  className={`text-xs px-3 py-1 rounded-full 
                    ${config.companies.includes(company) 
                      ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 dark:bg-gray-700 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-gray-600'
                    }`}
                >
                  {company} {!config.companies.includes(company) && '+'}
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
            {config.keywords.map(keyword => (
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
                  disabled={config.keywords.includes(keyword)}
                  className={`text-xs px-3 py-1 rounded-full 
                    ${config.keywords.includes(keyword) 
                      ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-green-700 border border-green-300 hover:bg-green-50 dark:bg-gray-700 dark:text-green-300 dark:border-green-600 dark:hover:bg-gray-600'
                    }`}
                >
                  {keyword} {!config.keywords.includes(keyword) && '+'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicFiltersPanel; 