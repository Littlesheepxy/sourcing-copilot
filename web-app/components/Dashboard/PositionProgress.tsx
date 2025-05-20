"use client";

import React from "react";
import { Zap } from "lucide-react";

type PositionProgressProps = {
  data: {
    total: number;
    matched: number;
    contacted: number;
    replied: number;
  };
  onViewAll: () => void;
};

const PositionProgress: React.FC<PositionProgressProps> = ({
  data,
  onViewAll
}) => {
  // 计算百分比
  const matchedPercent = (data.matched / data.total) * 100 || 0;
  const contactedPercent = (data.contacted / data.total) * 100 || 0;
  const repliedPercent = (data.replied / data.total) * 100 || 0;

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">职位进度看板</h3>
      
      <div className="space-y-4">
        {/* 匹配简历 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">匹配简历</span>
            <span className="font-medium">{data.matched}/{data.total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${matchedPercent}%` }}
            ></div>
          </div>
        </div>
        
        {/* 已联系 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">已联系</span>
            <span className="font-medium">{data.contacted}/{data.total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${contactedPercent}%` }}
            ></div>
          </div>
        </div>
        
        {/* 有回应 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">有回应</span>
            <span className="font-medium">{data.replied}/{data.total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${repliedPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onViewAll}
        className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
      >
        查看全部候选人
        <Zap className="ml-1 h-4 w-4" />
      </button>
    </div>
  );
};

export default PositionProgress; 