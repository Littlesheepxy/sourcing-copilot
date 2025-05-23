"use client";

import React, { useEffect, useState } from 'react';
import { LogEntry, getLogService } from '../../lib/log-service';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showData, setShowData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 日志类型选项
  const logTypes = [
    { value: 'all', label: '全部' },
    { value: '候选人分析', label: '候选人分析' },
    { value: '查看候选人', label: '查看候选人' },
    { value: '更新候选人状态', label: '更新状态' },
    { value: '自动打招呼', label: '自动打招呼' },
  ];

  // 加载日志
  useEffect(() => {
    loadLogs();
    // 设置定时刷新（每30秒刷新一次）
    const intervalId = setInterval(loadLogs, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // 从日志服务加载日志
  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const logService = getLogService();
      const entries = await logService.getEntries();
      setLogs(entries);
    } catch (error) {
      console.error('加载日志失败', error);
      setError(error instanceof Error ? error.message : '加载日志失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    // 先按操作类型筛选
    if (filterType !== 'all' && log.action !== filterType) {
      return false;
    }
    
    // 再按搜索词筛选
    if (!filter) return true;
    
    const lowerFilter = filter.toLowerCase();
    return (
      log.action?.toLowerCase().includes(lowerFilter) ||
      log.details?.toLowerCase().includes(lowerFilter) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(lowerFilter))
    );
  });

  // 格式化日期时间
  const formatDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date);
    } catch (error) {
      return timestamp;
    }
  };

  // 清空日志
  const handleClearLogs = async () => {
    if (!window.confirm('确定要清空所有日志吗？此操作不可撤销。')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const logService = getLogService();
      await logService.clearLogs();
      setLogs([]);
      setSelectedLog(null);
    } catch (error) {
      console.error('清空日志失败', error);
      setError(error instanceof Error ? error.message : '清空日志失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 导出日志
  const handleExportLogs = async () => {
    if (logs.length === 0) {
      alert('没有日志可导出');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const logService = getLogService();
      const json = await logService.exportLogs();
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `sourcing_logs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('导出日志失败', error);
      setError(error instanceof Error ? error.message : '导出日志失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 查看日志详情和数据
  const handleLogClick = (log: LogEntry) => {
    setSelectedLog(log);
    setShowData(true);
  };

  // 获取操作标签样式
  const getActionStyle = (action: string) => {
    switch (action) {
      case '自动打招呼': 
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case '人工标记':
      case '标记候选人':
      case '更新候选人状态':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'AI分析':
      case 'AI分析结果':
      case '候选人分析':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case '查看候选人':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case '系统错误':
      case '操作失败':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // 获取数据展示摘要
  const getDataSummary = (log: LogEntry) => {
    if (!log.data) return '无数据';
    
    try {
      // 针对不同类型的日志提供不同的摘要
      if (log.action === '候选人分析' && log.data.name) {
        return `候选人: ${log.data.name}`;
      }
      
      if (log.action === '查看候选人' && log.data.candidateId) {
        return `ID: ${log.data.candidateId}`;
      }
      
      if (log.action === '更新候选人状态' && log.data.previousStatus && log.data.newStatus) {
        return `${log.data.previousStatus} → ${log.data.newStatus}`;
      }
      
      if (typeof log.data === 'object') {
        const keys = Object.keys(log.data).filter(k => 
          k !== 'id' && k !== 'timestamp' && 
          log.data[k] !== null && log.data[k] !== undefined
        );
        
        if (keys.length > 0) {
          return `${keys.join(', ')}`;
        }
      }
      
      return '查看详情';
    } catch (e) {
      return '数据格式错误';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">操作日志</h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="flex-1 min-w-[200px]">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {logTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 md:w-64">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="搜索日志..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 w-full md:w-auto">
            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
            <button
              onClick={handleExportLogs}
              disabled={isLoading || logs.length === 0}
              className="flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-800 dark:text-green-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出
            </button>
            <button
              onClick={handleClearLogs}
              disabled={isLoading || logs.length === 0}
              className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-800 dark:text-red-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              清空
            </button>
          </div>
        </div>
        
        {isLoading && logs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            {filter || filterType !== 'all' ? '没有匹配的日志记录' : '暂无日志记录'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => handleLogClick(log)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <div className="flex items-center">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full mr-2 ${getActionStyle(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {log.details}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </div>
                </div>
                {log.data && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {getDataSummary(log)}
                    </span>
                    <button className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">
                      查看详情
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* 分页控件 */}
        {logs.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              共 <span className="font-medium">{logs.length}</span> 条记录
              {filterType !== 'all' || filter ? 
                `，匹配 ${filteredLogs.length} 条` : ''}
            </div>
          </div>
        )}
      </div>
      
      {/* 日志详情模态框 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-bold">日志详情</h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-4rem)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">操作类型</p>
                  <p className={`mt-1 px-2.5 py-1 text-xs font-medium rounded-full inline-block ${getActionStyle(selectedLog.action)}`}>
                    {selectedLog.action}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">时间</p>
                  <p className="mt-1 text-sm">{formatDateTime(selectedLog.timestamp)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">详情</p>
                <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                  {selectedLog.details}
                </p>
              </div>
              
              {selectedLog.data && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">数据</p>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 