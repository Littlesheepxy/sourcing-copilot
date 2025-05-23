"use client";

import React from 'react';
import { Users, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface TalentProfilePanelProps {
  value: string;
  onChange: (value: string) => void;
  onOptimize: () => void;
  isLoading: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

// 人才画像模板
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

const TalentProfilePanel: React.FC<TalentProfilePanelProps> = ({
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
              onOptimize();
            }}
            disabled={isLoading || !value}
            className="px-3 py-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-md text-sm hover:from-green-600 hover:to-teal-600 disabled:opacity-50 flex items-center"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            AI完善
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      
      {isExpanded && (
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
                  onClick={() => onChange(template.content)}
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
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="描述理想候选人的特征，包括技能水平、工作经验、性格特点、成长潜力等..."
              className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {value.length} 字符
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentProfilePanel; 