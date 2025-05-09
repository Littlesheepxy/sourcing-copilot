"use client";

import React, { useState, useEffect } from 'react';
import { BasicFilters } from '../../../shared/types';

interface BasicFiltersPanelProps {
  basicFilters: BasicFilters;
  updateBasicFilters: (filters: BasicFilters) => void;
}

const BasicFiltersPanel: React.FC<BasicFiltersPanelProps> = ({ 
  basicFilters, 
  updateBasicFilters 
}) => {
  // 本地状态
  const [position, setPosition] = useState(basicFilters.position || '');
  const [companyInput, setCompanyInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  
  // 公司推荐选项
  const companyRecommendations = [
    '阿里', '腾讯', '百度', '字节跳动', '华为', '美团', '京东', '网易',
    '滴滴', '小米', '拼多多', '快手', 'bilibili', '蚂蚁', '360', '新浪'
  ];
  
  // 关键词推荐选项
  const keywordRecommendations = [
    'Java', 'Python', 'C++', 'JavaScript', 'React', 'Vue', 'Angular', 'Node.js',
    '微服务', '分布式', '云计算', '大数据', '人工智能', '机器学习', '深度学习',
    'Spring Boot', 'Docker', 'Kubernetes', 'DevOps', 'CI/CD', 'MySQL', 'Redis', 'MongoDB'
  ];
  
  // 处理数据更新
  useEffect(() => {
    // 更新基本筛选条件
    updateBasicFilters({
      position,
      companies: [...basicFilters.companies],
      keywords: [...basicFilters.keywords]
    });
  }, [position]);
  
  // 添加公司
  const handleAddCompany = () => {
    if (companyInput.trim() && !basicFilters.companies.includes(companyInput.trim())) {
      const newCompanies = [...basicFilters.companies, companyInput.trim()];
      updateBasicFilters({
        ...basicFilters,
        companies: newCompanies
      });
      setCompanyInput('');
    }
  };
  
  // 添加关键词
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !basicFilters.keywords.includes(keywordInput.trim())) {
      const newKeywords = [...basicFilters.keywords, keywordInput.trim()];
      updateBasicFilters({
        ...basicFilters,
        keywords: newKeywords
      });
      setKeywordInput('');
    }
  };
  
  // 移除公司
  const handleRemoveCompany = (company: string) => {
    const newCompanies = basicFilters.companies.filter(c => c !== company);
    updateBasicFilters({
      ...basicFilters,
      companies: newCompanies
    });
  };
  
  // 移除关键词
  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = basicFilters.keywords.filter(k => k !== keyword);
    updateBasicFilters({
      ...basicFilters,
      keywords: newKeywords
    });
  };
  
  // 添加推荐公司
  const handleAddRecommendedCompany = (company: string) => {
    if (!basicFilters.companies.includes(company)) {
      const newCompanies = [...basicFilters.companies, company];
      updateBasicFilters({
        ...basicFilters,
        companies: newCompanies
      });
    }
  };
  
  // 添加推荐关键词
  const handleAddRecommendedKeyword = (keyword: string) => {
    if (!basicFilters.keywords.includes(keyword)) {
      const newKeywords = [...basicFilters.keywords, keyword];
      updateBasicFilters({
        ...basicFilters,
        keywords: newKeywords
      });
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">基本筛选条件</h2>
      
      {/* 岗位筛选 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          岗位（必填）：
        </label>
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="请输入岗位名称"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
        />
        <p className="text-xs text-gray-500 mt-1">例如：Java工程师、产品经理、UI设计师等</p>
      </div>
      
      {/* 公司筛选 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          公司（必填）：
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {basicFilters.companies.map(company => (
            <span 
              key={company}
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-sm flex items-center"
            >
              {company}
              <button 
                onClick={() => handleRemoveCompany(company)}
                className="ml-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 h-5 w-5 inline-flex items-center justify-center"
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
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          />
          <button
            onClick={handleAddCompany}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            添加
          </button>
        </div>
        
        {/* 推荐公司 */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">AI推荐公司</h3>
          <div className="flex flex-wrap gap-2">
            {companyRecommendations.map(company => (
              <button
                key={company}
                onClick={() => handleAddRecommendedCompany(company)}
                disabled={basicFilters.companies.includes(company)}
                className={`text-xs px-2 py-1 rounded-full 
                  ${basicFilters.companies.includes(company) 
                    ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 dark:bg-gray-700 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-gray-600'
                  }`}
              >
                {company} {!basicFilters.companies.includes(company) && '+'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 关键词筛选 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          关键词（可选）：
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {basicFilters.keywords.map(keyword => (
            <span 
              key={keyword}
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-sm flex items-center"
            >
              {keyword}
              <button 
                onClick={() => handleRemoveKeyword(keyword)}
                className="ml-1 rounded-full hover:bg-green-200 dark:hover:bg-green-800 h-5 w-5 inline-flex items-center justify-center"
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
            placeholder="输入关键词并回车添加"
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          />
          <button
            onClick={handleAddKeyword}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            添加
          </button>
        </div>
        
        {/* 推荐关键词 */}
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">AI推荐关键词</h3>
          <div className="flex flex-wrap gap-2">
            {keywordRecommendations.map(keyword => (
              <button
                key={keyword}
                onClick={() => handleAddRecommendedKeyword(keyword)}
                disabled={basicFilters.keywords.includes(keyword)}
                className={`text-xs px-2 py-1 rounded-full 
                  ${basicFilters.keywords.includes(keyword) 
                    ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-green-700 border border-green-300 hover:bg-green-50 dark:bg-gray-700 dark:text-green-300 dark:border-green-600 dark:hover:bg-gray-600'
                  }`}
              >
                {keyword} {!basicFilters.keywords.includes(keyword) && '+'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicFiltersPanel; 