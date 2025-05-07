"use client";

import React from 'react';
import AIChat from '../../components/AIChat';
import { MessageSquare } from 'lucide-react';

export default function AIPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] max-w-4xl mx-auto">
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
      
      {/* 聊天面板 */}
      <div className="gradient-border p-[2px] rounded-lg mb-4 flex-1 flex">
        <div className="bg-white dark:bg-slate-900 rounded-lg w-full p-4">
          <AIChat />
        </div>
      </div>
      
      {/* 底部信息 */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 my-4">
        <p>AI助手可以帮助你分析候选人简历、生成打招呼信息、筛选候选人和提供招聘建议</p>
      </div>
    </div>
  );
} 