"use client";

import React from 'react';
import { Target, Brain, Loader } from 'lucide-react';

interface FilterCriteriaPanelProps {
  criteria: string;
  onGenerate: () => void;
  isLoading: boolean;
  hasJDOrProfile: boolean;
}

const FilterCriteriaPanel: React.FC<FilterCriteriaPanelProps> = ({
  criteria,
  onGenerate,
  isLoading,
  hasJDOrProfile
}) => {
  if (!hasJDOrProfile) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Target className="w-5 h-5 mr-2 text-purple-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">AI智能筛选标准</h3>
        </div>
        <button
          onClick={onGenerate}
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
      
      {criteria && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {criteria}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FilterCriteriaPanel; 