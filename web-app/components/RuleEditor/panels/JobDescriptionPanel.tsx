"use client";

import React, { useState } from 'react';
import { FileText, Wand2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface JobDescriptionPanelProps {
  value: string;
  onChange: (value: string) => void;
  onOptimize: () => void;
  isLoading: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

// JD模板
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

const JobDescriptionPanel: React.FC<JobDescriptionPanelProps> = ({
  value,
  onChange,
  onOptimize,
  isLoading,
  isExpanded,
  onToggleExpanded
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div 
        className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={onToggleExpanded}
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
              onOptimize();
            }}
            disabled={isLoading || !value}
            className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md text-sm hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center"
          >
            <Wand2 className="w-3 h-3 mr-1" />
            AI优化
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      
      {isExpanded && (
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
                  onClick={() => onChange(template.content)}
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
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="请输入详细的职位描述，包括岗位职责、任职要求、技能需求等..."
              className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {value.length} 字符
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => onChange('')}
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
  );
};

export default JobDescriptionPanel; 