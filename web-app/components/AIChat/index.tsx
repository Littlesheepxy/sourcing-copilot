"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createAIChatStore } from '../../../shared/hooks/useAIChat';
import { WebStorageAdapter } from '../../store/adapters/webStorageAdapter';
import { useAiConfig } from '../../hooks/useConfig';
import MarkdownRenderer from './MarkdownRenderer';

// 创建AI聊天存储
const useAIChat = createAIChatStore(new WebStorageAdapter('sc_'));

const AIChat = () => {
  const { apiKey, modelProvider, modelVersion } = useAiConfig();
  const {
    config,
    messages,
    isLoading,
    sendMessage: sendAIMessage,
    sendMessageStream,
    clearMessages,
    setConfig,
  } = useAIChat();
  
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 检测客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 配置AI服务
  useEffect(() => {
    if (isClient && !isInitialized && apiKey) {
      // 配置AI服务参数
      const aiConfig = {
        apiKey: apiKey,
        apiBaseUrl: 'https://chat.inhyperloop.com/v1',
        modelName: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000
      };
      
      setConfig(aiConfig);
      setIsInitialized(true);
      
      // 如果没有消息，添加欢迎消息
      if (messages.length === 0) {
        setTimeout(() => {
          addWelcomeMessage();
        }, 500);
      }
    }
  }, [isClient, apiKey, isInitialized, messages.length, setConfig]);
  
  // 添加欢迎消息
  const addWelcomeMessage = () => {
    // 这里可以添加系统欢迎消息
    // 但目前的hook设计不支持直接添加助手消息，所以我们暂时跳过
  };
  
  // 清空对话
  const handleClearMessages = () => {
    clearMessages();
    setStreamingContent('');
    setError(null);
    setShowClearConfirm(false);
  };
  
  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);
  
  // 点击容器时聚焦输入框
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };
  
  // 发送消息到AI (使用流式输出)
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isStreaming) return;
    
    // 清空输入和错误
    const messageContent = input.trim();
    setInput('');
    setError(null);
    setStreamingContent('');
    setIsStreaming(true);
    
    try {
      // 使用流式发送消息
      await sendMessageStream(messageContent, (chunk: string) => {
        setStreamingContent(prev => prev + chunk);
      });
    } catch (error: any) {
      console.error('AI请求失败:', error);
      setError(error.message || '与AI通信时出错，请稍后再试');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };
  
  // 快速开始建议
  const quickStartSuggestions = [
    "帮我分析一个前端工程师的简历",
    "写一份邀请候选人面试的消息",
    "这个候选人适合什么样的职位？",
    "如何评估候选人的技术能力？"
  ];
  
  // 处理快速建议点击
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };
  
  // 将规则应用到筛选器
  const applyRuleToFilter = (jsonString: string) => {
    try {
      const match = jsonString.match(/```json\n([\s\S]*?)\n```/);
      if (!match) throw new Error('无法提取JSON规则');
      
      const ruleJson = JSON.parse(match[1]);
      setError('规则应用功能将在后续版本中实现');
    } catch (error) {
      console.error('应用规则失败:', error);
      setError('应用规则失败，请检查规则格式。');
    }
  };
  
  if (!isClient) return null;
  
  return (
    <div className="flex flex-col h-full" onClick={handleContainerClick}>
      <div className="flex flex-col h-full relative">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100/30 to-transparent dark:from-blue-900/20 rounded-full blur-3xl transform translate-x-20 -translate-y-10 z-0"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-green-100/30 to-transparent dark:from-green-900/20 rounded-full blur-3xl transform -translate-x-20 translate-y-10 z-0"></div>
        
        {/* 聊天头部 */}
        {messages.length > 0 && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI智能助手</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 刷新按钮 */}
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={isLoading || isStreaming}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="清空对话"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* 清空确认对话框 */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setShowClearConfirm(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div 
              className="relative bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">清空对话</h4>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                确定要清空当前对话吗？此操作无法撤销。
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClearMessages}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  确定清空
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 relative">
          {/* 如果没有消息，显示欢迎界面和快速开始 */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  欢迎使用AI智能助手
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  我是你的专业招聘助手，可以帮你分析简历、筛选候选人、撰写邮件和提供招聘建议。
                </p>
              </div>
              
              {/* 快速开始建议 */}
              <div className="w-full max-w-2xl">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">快速开始：</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quickStartSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-3 text-left text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* 显示消息 */}
          {messages.map((message, index) => {
            // 跳过系统初始消息
            if (index === 0 && message.role === 'system') return null;
            
            return (
              <div 
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 ml-8' 
                    : message.role === 'system'
                      ? 'bg-gray-50 dark:bg-gray-800'
                      : 'bg-green-50 dark:bg-green-900/20 mr-8'
                }`}
              >
                <div className="flex items-center mb-3">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {message.role === 'user' ? '你' : message.role === 'system' ? '系统' : 'AI助手'}
                  </span>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  {message.role === 'user' ? (
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-0">
                      {message.content}
                    </p>
                  ) : (
                    <MarkdownRenderer 
                      content={message.content}
                      className="text-sm"
                    />
                  )}
                </div>
                
                {/* 如果是AI消息且包含JSON，显示应用按钮 */}
                {message.role === 'assistant' && message.content.includes('```json') && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button 
                      onClick={() => applyRuleToFilter(message.content)}
                      className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
                    >
                      应用此规则
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* 流式输出显示 */}
          {isStreaming && streamingContent && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 mr-8">
              <div className="flex items-center mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">AI助手</span>
                <div className="ml-2 flex space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer 
                  content={streamingContent}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          
          {/* 加载指示器 - 只在非流式模式下显示 */}
          {(isLoading && !isStreaming) && (
            <div className="flex items-center justify-center p-6">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">AI思考中...</span>
            </div>
          )}
          
          {/* 错误信息 */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 */}
        <div className="relative mt-auto z-50">
          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center space-x-3 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                onClick={(e) => e.stopPropagation()}
                placeholder="请描述你想要咨询的问题..."
                className="flex-1 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                disabled={isLoading || isStreaming}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || isStreaming}
                className={`h-11 w-11 rounded-lg gradient-border flex items-center justify-center shrink-0 ${
                  !input.trim() || isLoading || isStreaming
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer shadow-md hover:opacity-90'
                }`}
              >
                {(isLoading || isStreaming) ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat; 