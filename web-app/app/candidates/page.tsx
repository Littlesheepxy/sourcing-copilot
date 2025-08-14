"use client";

import React, { useEffect, useState } from 'react';
import { getApiService, CandidateData } from '../../lib/api-service';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  
  // 加载候选人数据
  useEffect(() => {
    loadCandidates();
    // 设置定时刷新（每30秒刷新一次）
    const intervalId = setInterval(loadCandidates, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // 从API加载候选人数据
  const loadCandidates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiService = getApiService();
      const response = await apiService.getCandidates(100, 0);
      
      if (response.success) {
        // 检查API返回的数据
        if (Array.isArray(response.data)) {
          setCandidates(response.data);
        } else if (response.data && typeof response.data === 'object') {
          // 使用类型断言避免TypeScript错误
          const responseObj = response.data as Record<string, any>;
          if ('candidates' in responseObj && Array.isArray(responseObj.candidates)) {
            setCandidates(responseObj.candidates);
          } else {
            setCandidates([]);
          }
        } else {
          setCandidates([]);
        }
      } else if (!response.success) {
        setError(response.error || '获取候选人数据失败');
      }
    } catch (error) {
      console.error('加载候选人数据失败', error);
      setError(error instanceof Error ? error.message : '加载候选人数据失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 统计不同状态的候选人数量
  const totalCount = candidates.length;
  const contactedCount = candidates.filter(c => c.status === 'contacted').length;
  const processingCount = candidates.filter(c => c.status === 'processing').length;
  const rejectedCount = candidates.filter(c => c.status === 'rejected').length;
  
  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-6">候选人管理</h1>
          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                placeholder="搜索候选人..."
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </div>
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={loadCandidates}
            >
              {isLoading ? '加载中...' : '刷新'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="sr-only">关闭</span>
              <svg className="fill-current h-5 w-5" role="button" viewBox="0 0 20 20">
                <path d="M14.348 14.849a1 1 0 01-1.414 0L10 11.414l-2.93 2.93a1 1 0 01-1.414-1.414l2.93-2.93-2.93-2.93a1 1 0 011.414-1.414l2.93 2.93 2.93-2.93a1 1 0 011.414 1.414l-2.93 2.93 2.93 2.93a1 1 0 010 1.414z"></path>
              </svg>
            </button>
          </div>
        )}

        {/* 候选人统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">总候选人</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">已联系</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{contactedCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">待处理</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{processingCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">已拒绝</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{rejectedCount}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 候选人列表 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    姓名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    职位
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    公司
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    学历
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    AI评估
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                            {candidate.name ? candidate.name.charAt(0) : '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {candidate.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {candidate.experience}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {candidate.position || '未知职位'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {(() => {
                            const company = candidate.company || '未知公司';
                            // 如果公司信息包含分号分隔的多个公司，进行格式化处理
                            if (company.includes(';')) {
                              const companies = company.split(';').map(c => c.trim()).filter(c => c);
                              if (companies.length > 1) {
                                return (
                                  <div className="space-y-1 relative group">
                                    {companies.slice(0, 2).map((comp, index) => (
                                      <div key={index} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        {comp}
                                      </div>
                                    ))}
                                    {companies.length > 2 && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        +{companies.length - 2} 更多
                                      </div>
                                    )}
                                    {/* 工具提示：显示完整公司列表 */}
                                    <div className="absolute z-10 invisible group-hover:visible bg-black text-white text-xs rounded py-2 px-3 -top-2 left-full ml-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="space-y-1">
                                        {companies.map((comp, index) => (
                                          <div key={index}>• {comp}</div>
                                        ))}
                                      </div>
                                      <div className="absolute -left-1 top-3 w-2 h-2 bg-black transform rotate-45"></div>
                                    </div>
                                  </div>
                                );
                              }
                            }
                            return company;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {candidate.education || '未知学历'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {candidate.raw_data?.ai_evaluation ? (
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              candidate.raw_data.ai_evaluation.passed 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {candidate.raw_data.ai_evaluation.passed ? '✅ 通过' : '❌ 不通过'}
                            </span>
                            {candidate.raw_data.ai_evaluation.score !== undefined && (
                              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                {candidate.raw_data.ai_evaluation.score}分
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">未评估</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          candidate.status === 'contacted' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : candidate.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                              : candidate.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {candidate.status === 'contacted' 
                            ? '已联系' 
                            : candidate.status === 'processing'
                              ? '待处理' 
                              : candidate.status === 'rejected'
                                ? '已拒绝'
                                : '新候选人'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          查看
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                          更新
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">暂无候选人数据</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        使用Chrome扩展在Boss直聘网站上收集候选人
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          查看使用教程
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* 分页 */}
          <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {isLoading ? '加载中...' : 
                   candidates.length > 0 
                     ? `显示 ${candidates.length} 个候选人` 
                     : '暂无数据'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 候选人详情模态框 */}
        {selectedCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold">{selectedCandidate.name}</h3>
                  <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedCandidate.status === 'contacted' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : selectedCandidate.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                        : selectedCandidate.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {selectedCandidate.status === 'contacted' 
                      ? '已联系' 
                      : selectedCandidate.status === 'processing'
                        ? '待处理' 
                        : selectedCandidate.status === 'rejected'
                          ? '已拒绝'
                          : '新候选人'}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedCandidate(null)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* AI评估结果 */}
                {selectedCandidate.raw_data?.ai_evaluation && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300">🤖 AI智能评估</h4>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedCandidate.raw_data.ai_evaluation.passed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {selectedCandidate.raw_data.ai_evaluation.passed ? '✅ 通过' : '❌ 不通过'}
                        </span>
                        {selectedCandidate.raw_data.ai_evaluation.score !== undefined && (
                          <span className="text-lg font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 px-3 py-1 rounded">
                            {selectedCandidate.raw_data.ai_evaluation.score}分
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {(selectedCandidate.raw_data.ai_evaluation.reason || selectedCandidate.raw_data.ai_evaluation.rejectReason) && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">评估原因</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded">
                          {selectedCandidate.raw_data.ai_evaluation.reason || selectedCandidate.raw_data.ai_evaluation.rejectReason}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCandidate.raw_data.ai_evaluation.highlights && selectedCandidate.raw_data.ai_evaluation.highlights.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">✨ 候选人优势</p>
                          <ul className="space-y-1">
                            {selectedCandidate.raw_data.ai_evaluation.highlights.map((highlight, index) => (
                              <li key={index} className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                • {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {selectedCandidate.raw_data.ai_evaluation.concerns && selectedCandidate.raw_data.ai_evaluation.concerns.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">⚠️ 关注点</p>
                          <ul className="space-y-1">
                            {selectedCandidate.raw_data.ai_evaluation.concerns.map((concern, index) => (
                              <li key={index} className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                                • {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 基本信息 */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-3">基本信息</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">姓名</p>
                      <p className="text-sm font-normal">{selectedCandidate.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">学历</p>
                      <p className="text-sm font-normal">{selectedCandidate.education || "未知"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">工作经验</p>
                      <p className="text-sm font-normal">{selectedCandidate.experience || "未知"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">当前/上一家公司</p>
                      <div className="text-sm font-normal">
                        {(() => {
                          const company = selectedCandidate.company || '未知';
                          // 如果公司信息包含分号分隔的多个公司，进行格式化处理
                          if (company.includes(';')) {
                            const companies = company.split(';').map(c => c.trim()).filter(c => c);
                            if (companies.length > 1) {
                              return (
                                <div className="space-y-1 relative group">
                                  {companies.map((comp, index) => (
                                    <div key={index} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                      {comp}
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                          }
                          return company;
                        })()}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">毕业院校</p>
                      <p className="text-sm font-normal">{selectedCandidate.school || "未知"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">期望职位</p>
                      <p className="text-sm font-normal">{selectedCandidate.position || "未知"}</p>
                    </div>
                  </div>
                  
                  {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">技能</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 