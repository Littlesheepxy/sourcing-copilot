"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, Bot, User } from 'lucide-react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIAssistantChatProps {
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onApplySuggestion: (suggestion: string) => void;
  isLoading: boolean;
  shouldHighlight?: boolean; // 新增：是否应该高亮显示
}

const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  messages,
  input,
  onInputChange,
  onSendMessage,
  onApplySuggestion,
  isLoading,
  shouldHighlight = false
}) => {
  const [isHighlighted, setIsHighlighted] = useState(false);

  // 监听shouldHighlight变化，触发高亮动效
  useEffect(() => {
    if (shouldHighlight) {
      setIsHighlighted(true);
      // 1.5秒后自动取消高亮
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldHighlight]);
  return (
    <div 
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-fit lg:sticky lg:top-4 transition-all duration-500 ${
        isHighlighted 
          ? 'transform scale-105 shadow-2xl ring-4 ring-purple-500/50 ring-opacity-75' 
          : ''
      }`} 
      data-guide="ai-assistant"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-indigo-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">AI助手</h3>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">在线</span>
        </div>
      </div>
      
      {/* 聊天消息区 */}
      <div className="flex-1 p-4 space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : message.type === 'system'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
            } rounded-lg p-3`}>
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.suggestions && (
                    <div className="mt-3 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => onApplySuggestion(suggestion)}
                          className="block w-full text-left text-xs bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 px-2 py-1 rounded border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 聊天输入区 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="问我任何关于招聘筛选的问题..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <button
            onClick={onSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantChat; 