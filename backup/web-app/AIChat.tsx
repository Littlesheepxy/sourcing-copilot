"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/store';

// 临时声明Chrome类型
declare const chrome: {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
  }
};

// 消息类型
interface Message {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

// AI对话状态
interface AIState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// DeepSeek API调用函数
async function callDeepSeekAPI(messages: Message[], config: any) {
  const { apiKey, apiBaseUrl, modelName, maxTokens, temperature } = config;
  
  if (!apiKey) {
    throw new Error('请先设置DeepSeek API密钥');
  }
  
  try {
    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages.map(({ role, content }) => ({
          role: role === 'system' ? 'system' : role === 'assistant' ? 'assistant' : 'user',
          content
        })),
        max_tokens: maxTokens,
        temperature: temperature
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || '请求失败');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API请求失败:', error);
    throw error;
  }
}

const AIChat = () => {
  const { deepseekConfig, setAIChatLoading, updateDeepSeekConfig } = useStore();
  const [state, setState] = useState<AIState>({
    messages: [
      {
        role: 'system',
        content: '我是一个招聘助手AI，可以帮助你根据自然语言描述生成筛选规则。请描述你想要筛选的候选人标准，我将为你生成规则。'
      }
    ],
    isLoading: false,
    error: null
  });
  
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState(deepseekConfig.apiKey || '');
  const [showSettings, setShowSettings] = useState(!deepseekConfig.apiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // 检测客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);
  
  // 保存API设置
  const saveApiSettings = () => {
    updateDeepSeekConfig({ apiKey });
    setShowSettings(false);
  };
  
  // 发送消息到AI
  const sendMessage = async () => {
    if (!input.trim() || state.isLoading) return;
    
    // 创建用户消息
    const userMessage: Message = { role: 'user', content: input };
    
    // 更新状态，添加用户消息并设置加载状态
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null
    }));
    
    // 设置全局加载状态
    setAIChatLoading(true);
    
    // 清空输入
    setInput('');
    
    try {
      // 调用DeepSeek API
      const messages = [...state.messages, userMessage];
      const content = await callDeepSeekAPI(messages, deepseekConfig);
      
      // 创建AI响应消息
      const assistantMessage: Message = {
        role: 'assistant',
        content
      };
      
      // 更新状态，添加AI响应
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }));
    } catch (error: any) {
      console.error('AI请求失败:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '与AI通信时出错，请稍后再试'
      }));
    } finally {
      // 重置全局加载状态
      setAIChatLoading(false);
    }
  };
  
  // 将规则应用到筛选器
  const applyRuleToFilter = (jsonString: string) => {
    try {
      // 提取JSON字符串
      const match = jsonString.match(/```json\n([\s\S]*?)\n```/);
      if (!match) throw new Error('无法提取JSON规则');
      
      const ruleJson = JSON.parse(match[1]);
      
      // 发送消息到背景脚本，更新规则
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ 
          type: 'updateRules', 
          rules: ruleJson 
        }, () => {
          // 添加成功消息
          setState(prev => ({
            ...prev,
            messages: [
              ...prev.messages,
              { role: 'system', content: '规则已成功应用到筛选器。' }
            ]
          }));
        });
      }
    } catch (error) {
      console.error('应用规则失败:', error);
      setState(prev => ({
        ...prev,
        error: '应用规则失败，请检查规则格式。'
      }));
    }
  };
  
  if (!isClient) return null;
  
  return (
    <div className="space-y-4">
      {/* API设置面板 */}
      {showSettings && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm mb-4 border border-blue-200 dark:border-blue-900">
          <h3 className="text-lg font-semibold mb-3">配置DeepSeek API</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API密钥
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                placeholder="sk-xxxxxxxx"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                在DeepSeek控制面板获取API密钥: <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://platform.deepseek.com/</a>
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={saveApiSettings}
                disabled={!apiKey.trim()}
                className={`px-4 py-2 rounded text-white ${
                  !apiKey.trim() 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex flex-col h-[500px] relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI 对话助手</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            配置API
          </button>
        </div>
        
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100/30 to-transparent dark:from-blue-900/20 rounded-full blur-3xl transform translate-x-20 -translate-y-10 z-0"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-green-100/30 to-transparent dark:from-green-900/20 rounded-full blur-3xl transform -translate-x-20 translate-y-10 z-0"></div>
        
        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 z-10">
          {state.messages.map((message, index) => {
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
          {state.isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">AI思考中...</span>
            </div>
          )}
          
          {/* 错误信息 */}
          {state.error && (
            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
              <p className="text-sm">{state.error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 */}
        <div className="flex space-x-2 z-10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="描述你想要筛选的候选人标准..."
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            disabled={state.isLoading || !deepseekConfig.apiKey}
          />
          <button
            onClick={sendMessage}
            disabled={state.isLoading || !deepseekConfig.apiKey}
            className={`px-4 py-2 rounded text-white ${
              state.isLoading || !deepseekConfig.apiKey
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat; 