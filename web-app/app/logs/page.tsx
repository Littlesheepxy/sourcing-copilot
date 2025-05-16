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

  // 操作类型列表（用于筛选）
  const actionTypes = [
    { value: 'all', label: '全部' },
    { value: '候选人分析', label: '候选人分析' },
    { value: '查看候选人', label: '查看候选人' },
    { value: '更新候选人状态', label: '状态更新' },
    { value: '自动打招呼', label: '自动打招呼' },
    { value: 'AI分析', label: 'AI分析' }
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
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-6">操作日志</h1>
          <div className="flex space-x-2">
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              onClick={handleExportLogs}
              disabled={isLoading || logs.length === 0}
            >
              {isLoading ? '处理中...' : '导出日志'}
            </button>
            <button 
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50"
              onClick={handleClearLogs}
              disabled={isLoading || logs.length === 0}
            >
              {isLoading ? '处理中...' : '清除日志'}
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
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
            <h2 className="text-xl font-semibold">操作日志</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadLogs}
                disabled={isLoading}
                className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              >
                {isLoading ? '加载中...' : '刷新'}
              </button>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                {actionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="搜索日志..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>
          
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            {isLoading && logs.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : filteredLogs.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      时间
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      详情
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      数据
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLogs.map((log, index) => (
                    <tr 
                      key={log.id || index} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleLogClick(log)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 max-w-md truncate">
                        {log.details}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {log.data ? (
                          <button
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLogClick(log);
                            }}
                          >
                            {getDataSummary(log)}
                          </button>
                        ) : "无数据"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">暂无操作日志</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  使用Chrome扩展开始自动化操作，日志将在此处显示
                </p>
              </div>
            )}
          </div>
          
          {filteredLogs.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              显示 {filteredLogs.length} 条日志（共 {logs.length} 条）
            </div>
          )}
        </div>
        
        {/* 日志详情弹窗 */}
        {selectedLog && showData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">日志详情</h3>
                <button 
                  onClick={() => setShowData(false)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">时间</p>
                  <p className="text-sm font-normal text-gray-900 dark:text-gray-100">
                    {formatDateTime(selectedLog.timestamp)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">操作</p>
                  <p className="text-sm font-normal">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionStyle(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">详情</p>
                <p className="text-sm font-normal text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {selectedLog.details}
                </p>
              </div>
              
              {selectedLog.data && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">数据</p>
                  <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">
                    <pre className="text-xs text-gray-900 dark:text-gray-100">
                      {JSON.stringify(selectedLog.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-right">
                <button
                  onClick={() => setShowData(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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