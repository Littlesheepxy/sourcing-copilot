/**
 * 筛选结果日志组件
 * 用于展示候选人筛选历史和统计信息
 */
import React, { useState } from 'react';
import { FilterResult } from '../../shared/types';
import { useFilterStore } from '../store/filterStore';

// 筛选结果统计数据
interface FilterStats {
  total: number;
  greetCount: number;
  skipCount: number;
  manualCount: number;
  averageScore: number;
  highestScore: number;
}

// 计算筛选统计数据
const calculateStats = (results: FilterResult[]): FilterStats => {
  if (!results.length) {
    return {
      total: 0,
      greetCount: 0,
      skipCount: 0,
      manualCount: 0,
      averageScore: 0,
      highestScore: 0
    };
  }
  
  const greetCount = results.filter(r => r.action === 'greet').length;
  const skipCount = results.filter(r => r.action === 'skip').length;
  const manualCount = results.filter(r => r.action === 'manual').length;
  
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const averageScore = Math.round(totalScore / results.length);
  
  const highestScore = Math.max(...results.map(r => r.score));
  
  return {
    total: results.length,
    greetCount,
    skipCount,
    manualCount,
    averageScore,
    highestScore
  };
};

export const FilterResults: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'greet' | 'skip' | 'manual'>('all');
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  
  const filterResults = useFilterStore(state => state.filterResults);
  const clearFilterResults = useFilterStore(state => state.clearFilterResults);
  
  // 根据标签筛选结果
  const filteredResults = selectedTab === 'all'
    ? filterResults
    : filterResults.filter(result => result.action === selectedTab);
  
  // 计算统计数据
  const stats = calculateStats(filterResults);
  
  // 切换详情展开状态
  const toggleExpandResult = (id: string) => {
    if (expandedResult === id) {
      setExpandedResult(null);
    } else {
      setExpandedResult(id);
    }
  };
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // 清空筛选结果
  const handleClearResults = () => {
    if (window.confirm('确定要清空所有筛选记录吗？此操作不可撤销。')) {
      clearFilterResults();
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部统计区域 */}
      <div className="bg-white p-4 shadow-sm border-b">
        <h2 className="text-lg font-medium text-gray-800 mb-3">筛选结果统计</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* 总筛选数 */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600 mb-1">总筛选数</div>
            <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
          </div>
          
          {/* 打招呼数 */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600 mb-1">已打招呼</div>
            <div className="text-2xl font-bold text-green-800">
              {stats.greetCount}
              <span className="text-sm font-normal ml-1">
                ({stats.total ? Math.round((stats.greetCount / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
          
          {/* 跳过数 */}
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-sm text-red-600 mb-1">已跳过</div>
            <div className="text-2xl font-bold text-red-800">
              {stats.skipCount}
              <span className="text-sm font-normal ml-1">
                ({stats.total ? Math.round((stats.skipCount / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
          
          {/* 人工处理数 */}
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-sm text-yellow-600 mb-1">人工处理</div>
            <div className="text-2xl font-bold text-yellow-800">
              {stats.manualCount}
              <span className="text-sm font-normal ml-1">
                ({stats.total ? Math.round((stats.manualCount / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
          
          {/* 平均分数 */}
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600 mb-1">平均分数</div>
            <div className="text-2xl font-bold text-purple-800">{stats.averageScore}</div>
          </div>
          
          {/* 最高分数 */}
          <div className="bg-indigo-50 rounded-lg p-3">
            <div className="text-sm text-indigo-600 mb-1">最高分数</div>
            <div className="text-2xl font-bold text-indigo-800">{stats.highestScore}</div>
          </div>
        </div>
      </div>
      
      {/* 筛选结果列表 */}
      <div className="flex-grow overflow-auto">
        <div className="p-4">
          {/* 标签切换和操作按钮 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedTab === 'all' 
                    ? 'bg-white shadow-sm text-gray-800' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedTab('all')}
              >
                全部
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedTab === 'greet' 
                    ? 'bg-white shadow-sm text-gray-800' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedTab('greet')}
              >
                已打招呼
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedTab === 'skip' 
                    ? 'bg-white shadow-sm text-gray-800' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedTab('skip')}
              >
                已跳过
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedTab === 'manual' 
                    ? 'bg-white shadow-sm text-gray-800' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedTab('manual')}
              >
                人工处理
              </button>
            </div>
            
            <button
              onClick={handleClearResults}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none"
            >
              清空记录
            </button>
          </div>
          
          {/* 结果列表 */}
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m-6-8h6M5 8h14M5 16h14M5 12h14" />
              </svg>
              <h3 className="text-gray-600 font-medium mb-2">暂无筛选记录</h3>
              <p className="text-gray-500 text-sm">
                当您开始筛选候选人时，结果将显示在这里
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map(result => (
                <div 
                  key={result.candidateId + result.timestamp}
                  className="bg-white rounded-lg border shadow-sm overflow-hidden"
                >
                  {/* 结果头部 */}
                  <div className="flex items-center p-3 border-b">
                    <div 
                      className={`w-2 h-2 rounded-full mr-2 ${
                        result.action === 'greet' ? 'bg-green-500' :
                        result.action === 'skip' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                    />
                    <div className="flex-grow">
                      <div className="font-medium">{result.candidateName}</div>
                      <div className="text-xs text-gray-500">{formatTime(result.timestamp)}</div>
                    </div>
                    <div className="flex items-center">
                      <div className={`text-sm font-medium px-2 py-1 rounded-md ${
                        result.score >= 80 ? 'bg-green-100 text-green-800' :
                        result.score >= 60 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.score}分
                      </div>
                      <button
                        onClick={() => toggleExpandResult(result.candidateId + result.timestamp)}
                        className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${
                          expandedResult === result.candidateId + result.timestamp ? 'transform rotate-180' : ''
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* 展开的详情 */}
                  {expandedResult === result.candidateId + result.timestamp && (
                    <div className="p-3 bg-gray-50 text-sm">
                      <h4 className="font-medium text-gray-700 mb-2">匹配详情</h4>
                      <div className="space-y-2">
                        {result.matchDetails.map((detail, index) => (
                          <div key={index} className="flex items-center">
                            <div 
                              className={`w-3 h-3 rounded-full mr-2 ${
                                detail.matched ? 'bg-green-500' : 'bg-red-500'
                              }`} 
                            />
                            <div className="flex-grow">
                              <div className="flex justify-between">
                                <span>{detail.ruleName}</span>
                                <span className="font-medium">
                                  {detail.matched ? `+${detail.score}` : '0'}
                                </span>
                              </div>
                              {detail.details && (
                                <p className="text-xs text-gray-500 mt-1">{detail.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between">
                        <div className="text-gray-600">
                          最终操作: 
                          <span className={`ml-1 font-medium ${
                            result.action === 'greet' ? 'text-green-600' :
                            result.action === 'skip' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {result.action === 'greet' ? '已打招呼' :
                             result.action === 'skip' ? '已跳过' : '人工处理'}
                          </span>
                        </div>
                        
                        <div className="text-gray-600">
                          ID: <span className="font-mono text-xs">{result.candidateId.substring(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 