"use client";

import React, { useEffect, useState } from 'react';
import { getLogService } from '../lib/log-service';
import { getApiService, CandidateData } from '../lib/api-service';

export default function CandidateViewer() {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 从API获取候选人数据
  useEffect(() => {
    fetchCandidates();
  }, []);
  
  // 获取候选人列表
  const fetchCandidates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiService = getApiService();
      const response = await apiService.getCandidates();
      
      if (response.success && Array.isArray(response.data)) {
        setCandidates(response.data);
      } else {
        console.error('获取候选人失败', response.error);
        setError(response.error || '获取候选人失败');
        
        // 如果API失败，尝试从日志中获取数据作为备份
        const logService = getLogService();
        const candidateLogs = await logService.getEntriesByAction('候选人分析');
        
        // 从日志中提取候选人数据
        const extractedCandidates = candidateLogs
          .filter(log => log.data) // 确保有数据
          .map(log => log.data as CandidateData);
          
        if (extractedCandidates.length > 0) {
          setCandidates(extractedCandidates);
          setError('使用本地缓存数据，API连接失败');
        }
      }
    } catch (error) {
      console.error('获取候选人出错', error);
      setError(error instanceof Error ? error.message : '未知错误');
      
      // 同样尝试从日志中获取数据作为备份
      const logService = getLogService();
      const candidateLogs = await logService.getEntriesByAction('候选人分析');
      const extractedCandidates = candidateLogs
        .filter(log => log.data)
        .map(log => log.data as CandidateData);
        
      if (extractedCandidates.length > 0) {
        setCandidates(extractedCandidates);
        setError('使用本地缓存数据，API连接失败');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 获取候选人详情
  const fetchCandidateDetails = async (id: string) => {
    if (!id) return null;
    
    try {
      const apiService = getApiService();
      const response = await apiService.getCandidateById(id);
      
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('获取候选人详情失败', error);
    }
    
    return null;
  };
  
  // 添加示例候选人数据(仅用于演示)
  const addExampleCandidate = async () => {
    const logService = getLogService();
    
    const exampleCandidate: CandidateData = {
      id: `candidate_${Date.now()}`,
      name: `张三${Math.floor(Math.random() * 100)}`,
      education: '本科',
      experience: '3年',
      skills: ['JavaScript', 'React', 'TypeScript', 'Node.js'],
      company: '某科技有限公司',
      school: '某大学',
      position: '前端工程师',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      detail: {
        workExperience: `
某科技有限公司 | 前端工程师 | 2020-2023
负责公司主要产品的前端开发和维护，参与多个项目的架构设计和技术选型。
使用React和TypeScript进行开发，优化了产品性能和用户体验。

某互联网公司 | 初级前端工程师 | 2018-2020
参与公司电商平台的开发和维护，负责多个页面组件的开发。
使用Vue.js和Element UI进行开发，实现了多个复杂交互功能。
        `,
        educationExperience: `
某大学 | 计算机科学与技术 | 本科 | 2014-2018
主修课程：数据结构、算法、计算机网络、操作系统、数据库系统等。
        `,
        projectExperience: `
企业管理系统 | 前端负责人 | 2021-2022
使用React和TypeScript开发的企业内部管理系统，包含人事、财务、客户管理等多个模块。
负责前端架构设计、组件开发和性能优化，实现了系统的高效稳定运行。

电商平台改版 | 核心开发 | 2019-2020
参与公司电商平台的全面改版，使用Vue.js重构了整个前端系统。
负责购物车、订单和支付等核心模块的开发，优化了用户购物流程，提升了转化率。
        `,
        expectation: `
期望职位：高级前端工程师
期望薪资：25K-30K
期望城市：上海
        `
      }
    };
    
    // 记录候选人数据到日志
    await logService.log(
      '候选人分析', 
      `分析了候选人 ${exampleCandidate.name} 的简历，匹配度较高。`, 
      exampleCandidate
    );
    
    // 刷新候选人列表
    await fetchCandidates();
  };
  
  // 查看候选人详情
  const viewCandidateDetail = async (candidate: CandidateData) => {
    setIsLoading(true);
    
    try {
      // 尝试获取完整的候选人详情
      const fullCandidate = await fetchCandidateDetails(candidate.id);
      
      if (fullCandidate) {
        setSelectedCandidate(fullCandidate);
      } else {
        // 如果API获取失败，使用传入的候选人数据
        setSelectedCandidate(candidate);
      }
      
      // 记录查看操作到日志
      const logService = getLogService();
      await logService.log(
        '查看候选人', 
        `查看了候选人 ${candidate.name} 的详细信息`, 
        { candidateId: candidate.id, viewTime: new Date().toISOString() }
      );
    } catch (error) {
      console.error('查看候选人详情失败', error);
      // 使用传入的候选人数据作为备份
      setSelectedCandidate(candidate);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 更新候选人状态
  const updateCandidateStatus = async (candidate: CandidateData, status: CandidateData['status']) => {
    if (!candidate || !candidate.id) return;
    
    setIsLoading(true);
    
    try {
      const apiService = getApiService();
      const logService = getLogService();
      
      // 调用API更新状态
      const response = await apiService.updateCandidateStatus(candidate.id, status);
      
      if (response.success) {
        // 记录状态更新到日志
        await logService.log(
          '更新候选人状态', 
          `候选人 ${candidate.name} 状态已更新为 ${status}`, 
          { 
            candidateId: candidate.id, 
            previousStatus: candidate.status, 
            newStatus: status,
            updateTime: new Date().toISOString() 
          }
        );
        
        // 关闭详情模态框
        setSelectedCandidate(null);
        
        // 刷新候选人列表
        await fetchCandidates();
      } else {
        console.error('更新候选人状态失败', response.error);
      }
    } catch (error) {
      console.error('更新候选人状态出错', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 获取状态标签样式
  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'contacted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'hired': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // 获取状态显示文本
  const getStatusText = (status?: string) => {
    switch (status) {
      case 'new': return '新候选人';
      case 'processing': return '跟进中';
      case 'contacted': return '已联系';
      case 'rejected': return '已淘汰';
      case 'hired': return '已录用';
      default: return '未知状态';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">候选人列表</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchCandidates}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? '加载中...' : '刷新列表'}
          </button>
          <button
            onClick={addExampleCandidate}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            添加示例候选人
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/50 dark:text-red-300 dark:border-red-700" role="alert">
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
      
      {isLoading && candidates.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">正在加载候选人数据...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">暂无候选人数据</p>
          <button
            onClick={addExampleCandidate}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            添加示例数据
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => (
            <div 
              key={candidate.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => viewCandidateDetail(candidate)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold">{candidate.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(candidate.status)}`}>
                  {getStatusText(candidate.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-medium">期望职位:</span> {candidate.position || "未知"}
                </div>
                <div>
                  <span className="font-medium">教育背景:</span> {candidate.education}
                </div>
                <div>
                  <span className="font-medium">毕业学校:</span> {candidate.school || "未知"}
                </div>
                <div>
                  <span className="font-medium">当前公司:</span> {candidate.company || "未知"}
                </div>
                <div>
                  <span className="font-medium">工作经验:</span> {candidate.experience}
                </div>
                <div>
                  <span className="font-medium">匹配度:</span> <span className="text-green-600 dark:text-green-400 font-semibold">{candidate.matchScore || candidate.match || "85"}%</span>
                </div>
              </div>
              
              {candidate.skills && candidate.skills.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1">技能:</h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, index) => (
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
              
              {candidate.greeting && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-medium mb-1">打招呼语:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {candidate.greeting}
                  </p>
                </div>
              )}
              
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                {candidate.createdAt && (
                  <p>添加时间: {new Date(candidate.createdAt).toLocaleString('zh-CN')}</p>
                )}
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm font-medium transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    viewCandidateDetail(candidate);
                  }}
                >
                  查看详情
                </button>
                <button
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    candidate.status === 'contacted' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newStatus = candidate.status === 'contacted' ? 'processing' : 'contacted';
                    updateCandidateStatus(candidate, newStatus);
                  }}
                >
                  {candidate.status === 'contacted' ? '已打招呼' : '标记已打招呼'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 候选人详情模态框 */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <h3 className="text-2xl font-bold">{selectedCandidate.name}</h3>
                <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(selectedCandidate.status)}`}>
                  {getStatusText(selectedCandidate.status)}
                </span>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                disabled={isLoading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">姓名</p>
                    <p className="text-sm font-normal">{selectedCandidate.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">教育背景</p>
                    <p className="text-sm font-normal">{selectedCandidate.education}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">工作经验</p>
                    <p className="text-sm font-normal">{selectedCandidate.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">当前/上一家公司</p>
                    <p className="text-sm font-normal">{selectedCandidate.company || "未知"}</p>
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
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  {selectedCandidate.createdAt && (
                    <p>添加时间: {new Date(selectedCandidate.createdAt).toLocaleString('zh-CN')}</p>
                  )}
                  {selectedCandidate.updatedAt && (
                    <p>更新时间: {new Date(selectedCandidate.updatedAt).toLocaleString('zh-CN')}</p>
                  )}
                </div>
              </div>
              
              {/* 工作经历 */}
              {selectedCandidate.detail?.workExperience && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-3">工作经历</h4>
                  <pre className="text-sm whitespace-pre-wrap">
                    {selectedCandidate.detail.workExperience}
                  </pre>
                </div>
              )}
              
              {/* 教育经历 */}
              {selectedCandidate.detail?.educationExperience && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-3">教育经历</h4>
                  <pre className="text-sm whitespace-pre-wrap">
                    {selectedCandidate.detail.educationExperience}
                  </pre>
                </div>
              )}
              
              {/* 项目经历 */}
              {selectedCandidate.detail?.projectExperience && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-3">项目经历</h4>
                  <pre className="text-sm whitespace-pre-wrap">
                    {selectedCandidate.detail.projectExperience}
                  </pre>
                </div>
              )}
              
              {/* 期望 */}
              {selectedCandidate.detail?.expectation && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-3">期望</h4>
                  <pre className="text-sm whitespace-pre-wrap">
                    {selectedCandidate.detail.expectation}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                关闭
              </button>
              
              {selectedCandidate.status !== 'rejected' && (
                <button
                  onClick={() => updateCandidateStatus(selectedCandidate, 'rejected')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? '处理中...' : '不合适'}
                </button>
              )}
              
              {selectedCandidate.status !== 'contacted' && (
                <button
                  onClick={() => updateCandidateStatus(selectedCandidate, 'contacted')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? '处理中...' : '标记为已联系'}
                </button>
              )}
              
              {selectedCandidate.status !== 'hired' && (
                <button
                  onClick={() => updateCandidateStatus(selectedCandidate, 'hired')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? '处理中...' : '标记为已录用'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 