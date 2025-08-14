"use client";

import React, { Suspense } from "react";
import AIFilterEditor from "../../components/RuleEditor/AIFilterEditor";
import { ArrowLeft, Brain, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

// 创建一个包装组件来处理Suspense
function AIFilterEditorWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
      </div>
    }>
      <AIFilterEditor />
    </Suspense>
  );
}

export default function AIRulesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Brain className="w-6 h-6 mr-2 text-purple-500" />
                  AI智能筛选
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  使用AI大模型进行智能人才筛选，告别繁琐的关键词配置
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm flex items-center">
                <Sparkles className="w-4 h-4 mr-1" />
                AI增强版
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="container mx-auto px-4 py-8">
        {/* 功能介绍卡片 */}
        <div className="mb-8 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">智能理解</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI深度理解JD需求和人才画像，无需手动配置复杂规则</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">智能优化</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI助手实时优化筛选策略，提供专业建议和改进方案</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">精准匹配</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">基于语义理解的精准匹配，显著提升筛选质量和效率</p>
            </div>
          </div>
        </div>

        {/* AI筛选编辑器 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <AIFilterEditorWrapper />
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>AI模型实时在线，随时为您优化筛选策略</span>
          </div>
        </div>
      </div>
    </div>
  );
} 