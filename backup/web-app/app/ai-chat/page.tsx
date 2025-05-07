"use client";

import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { useStore } from '../../store/store';
import { Button } from '../../components/ui/button';

// 消息类型
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { deepseekConfig, setAIChatLoading } = useStore();

  // 组件加载时显示欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: '你好！我是Boss直聘Sourcing智能助手，有什么可以帮助你的吗？',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 页面加载时聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto">
        {/* 修改标题样式，使用渐变背景 */}
        <div className="mb-6">
          <div className="inline-block gradient-border px-5 py-3 rounded-full shadow-md">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-2">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">AI 智能助手</h1>
            </div>
          </div>
        </div>
        
        {/* 聊天区域 - 添加渐变边框 */}
        <div className="p-[2px] flex-1 rounded-lg gradient-border mb-4">
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg h-full p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * Math.min(index, 5) }}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-200 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div 
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="max-w-[80%] bg-gray-100 dark:bg-slate-800 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-200 shadow-sm">
                    <div className="flex space-x-2 items-center">
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          </div>
        </div>
        
        {/* 输入区域 - 添加渐变边框 */}
        <div className="p-[2px] rounded-lg gradient-border mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3">
            <div className="flex items-end space-x-2">
              <div className="flex-1 min-h-[40px] bg-gray-100 dark:bg-slate-800 rounded-lg p-3">
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
              {/* 自定义渐变发送按钮 */}
              <div 
                onClick={!isLoading && inputValue.trim() !== '' ? handleSendMessage : undefined}
                className={`h-10 w-10 rounded-full gradient-border flex items-center justify-center ${
                  inputValue.trim() === '' || isLoading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer shadow-md hover:opacity-90'
                }`}
              >
                <Send className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 