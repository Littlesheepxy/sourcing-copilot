"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/store';

// 消息类型
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { deepseekConfig, setAIChatLoading } = useStore();

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExpanded]);

  // 聊天面板展开时聚焦输入框
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  // 处理消息发送
  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;
    
    // 新增用户消息
    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setAIChatLoading(true);
    
    try {
      // 调用AI API获取响应
      const response = await callAIService(userMessage.content);
      
      // 添加AI响应
      const aiMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('调用AI服务出错:', error);
      
      // 添加错误消息
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setAIChatLoading(false);
    }
  };

  // 调用AI服务
  const callAIService = async (prompt: string): Promise<string> => {
    if (!deepseekConfig.apiKey) {
      return '请先在设置中配置API密钥';
    }

    try {
      // 准备API调用参数
      const url = `${deepseekConfig.apiBaseUrl}/chat/completions`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekConfig.apiKey}`
        },
        body: JSON.stringify({
          model: deepseekConfig.modelName,
          messages: [
            { role: 'system', content: '你是Boss直聘Sourcing智能助手，你可以帮助用户分析候选人简历、生成打招呼信息、筛选候选人和提供招聘建议。' },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: prompt }
          ],
          temperature: deepseekConfig.temperature,
          max_tokens: deepseekConfig.maxTokens
        })
      });
      
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('AI响应格式错误');
      }
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  };

  // 处理键盘输入
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 自动调整输入框高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div 
      className={`fixed bottom-0 right-4 z-50 w-full max-w-md transition-all duration-300 ease-in-out ${
        isExpanded ? 'h-[600px]' : 'h-14'
      }`}
    >
      {/* 聊天头部 */}
      <div 
        className="bg-blue-600 dark:bg-blue-800 text-white p-3 rounded-t-lg cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="ml-2 font-medium">AI智能助手</h3>
        </div>
        <div>
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </div>
      
      {/* 聊天内容区域 */}
      {isExpanded && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 border-t-0 rounded-b-lg flex flex-col h-[calc(100%-3.5rem)]">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-600 dark:text-blue-400">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-200">Boss直聘Sourcing智能助手</p>
                  <p className="mt-1">有任何问题都可以向我提问！</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-gray-100 dark:bg-slate-800 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-200">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-150"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 输入区域 */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-end space-x-2">
              <div className="flex-1 min-h-[40px] bg-gray-100 dark:bg-slate-800 rounded-lg p-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-0 focus:ring-0 resize-none text-gray-900 dark:text-gray-200 max-h-[150px] min-h-[24px]"
                  placeholder="输入问题..."
                  rows={1}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={inputValue.trim() === '' || isLoading}
                className={`p-2 rounded-lg ${
                  inputValue.trim() === '' || isLoading
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 