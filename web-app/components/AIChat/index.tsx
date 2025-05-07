"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createAIChatStore } from '../../../shared/hooks/useAIChat';
import { WebStorageAdapter } from '../../store/adapters/webStorageAdapter';

// 创建AI聊天存储
const useAIChat = createAIChatStore(new WebStorageAdapter('sc_'));

// 消息类型及AI服务逻辑已由共享钩子处理

const AIChat = () => {
  const {
    config,
    messages,
    isLoading,
    sendMessage: sendAIMessage,
    clearMessages,
  } = useAIChat();
  
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // 检测客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 点击容器时聚焦输入框
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };
  
  // 发送消息到AI
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // 清空输入和错误
    setInput('');
    setError(null);
    
    try {
      // 使用共享钩子发送消息
      await sendAIMessage(input);
    } catch (error: any) {
      console.error('AI请求失败:', error);
      setError(error.message || '与AI通信时出错，请稍后再试');
    }
  };
  
  // 将规则应用到筛选器 - 此功能需要改为使用共享规则钩子
  const applyRuleToFilter = (jsonString: string) => {
    try {
      // 提取JSON字符串
      const match = jsonString.match(/```json\n([\s\S]*?)\n```/);
      if (!match) throw new Error('无法提取JSON规则');
      
      const ruleJson = JSON.parse(match[1]);
      
      // 这里需要改为使用共享规则钩子更新规则 - 暂时注释掉
      /*
      // 使用共享规则钩子更新规则
      const rulesStore = useRules();
      rulesStore.resetRules();
      rulesStore.updateRule('root', ruleJson);
      
      // 添加成功消息
      addSystemMessage('规则已成功应用到筛选器。');
      */
      
      // 临时显示成功
      setError('规则应用功能尚未实现');
    } catch (error) {
      console.error('应用规则失败:', error);
      setError('应用规则失败，请检查规则格式。');
    }
  };
  
  if (!isClient) return null;
  
  return (
    <div className="flex flex-col h-full" onClick={handleContainerClick}>
      <div className="flex flex-col h-full relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI 对话助手</h2>
          {!config.apiKey && (
            <div className="text-sm text-amber-500">
              <span>请在设置页面配置API密钥</span>
            </div>
          )}
        </div>
        
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100/30 to-transparent dark:from-blue-900/20 rounded-full blur-3xl transform translate-x-20 -translate-y-10 z-0"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-green-100/30 to-transparent dark:from-green-900/20 rounded-full blur-3xl transform -translate-x-20 translate-y-10 z-0"></div>
        
        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 relative">
          {messages.map((message, index) => {
            // 跳过系统初始消息
            if (index === 0 && message.role === 'system') return null;
            
            return (
              <div 
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 ml-12' 
                    : message.role === 'system'
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'bg-green-100 dark:bg-green-900/30 mr-12'
                }`}
              >
                <div className="flex items-center mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {message.role === 'user' ? '你' : message.role === 'system' ? '系统' : 'AI助手'}
                  </span>
                </div>
                
                <div className="text-sm whitespace-pre-wrap">
                  {message.content.includes('```json') ? (
                    <>
                      <div>
                        {message.content.split('```json')[0].trim()}
                      </div>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded my-2 overflow-x-auto">
                        <code>
                          {message.content.match(/```json\n([\s\S]*?)\n```/)?.[1] || ''}
                        </code>
                      </pre>
                      <div>
                        {message.content.split('```')[2]?.trim()}
                      </div>
                      <div className="mt-2">
                        <button 
                          onClick={() => applyRuleToFilter(message.content)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
                        >
                          应用此规则
                        </button>
                      </div>
                    </>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            );
          })}
          
          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">AI思考中...</span>
            </div>
          )}
          
          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 - 完全重新设计 */}
        <div className="relative mt-auto z-50">
          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center space-x-2 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                onClick={(e) => e.stopPropagation()}
                placeholder="描述你想要筛选的候选人标准..."
                className="flex-1 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                disabled={isLoading || !config.apiKey}
                autoFocus
              />
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading && input.trim() !== '') {
                    handleSendMessage();
                  }
                }}
                className={`h-10 w-10 rounded-full gradient-border flex items-center justify-center shrink-0 ${
                  !input.trim() || isLoading || !config.apiKey
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer shadow-md hover:opacity-90'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat; 