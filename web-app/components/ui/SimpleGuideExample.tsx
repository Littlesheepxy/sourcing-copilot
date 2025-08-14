'use client';

import { DriveStep } from 'driver.js';
import { useUserGuide } from '../../hooks/useUserGuide';

export default function SimpleGuideExample() {
  // 定义引导步骤
  const steps: DriveStep[] = [
    {
      element: '#step1',
      popover: {
        title: '欢迎！',
        description: '这是第一步，欢迎使用我们的应用！',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#step2',
      popover: {
        title: '功能介绍',
        description: '这里是主要功能区域，您可以在这里进行各种操作。',
        side: 'right',
        align: 'center'
      }
    },
    {
      element: '#step3',
      popover: {
        title: '设置选项',
        description: '在这里您可以调整各种设置来个性化您的体验。',
        side: 'top',
        align: 'end'
      }
    }
  ];

  // 使用用户引导 Hook
  const {
    isActive,
    hasCompleted,
    startGuide,
    stopGuide,
    resetCompletion
  } = useUserGuide(steps, {
    storageKey: 'simpleGuideCompleted',
    autoStart: false
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            用户引导演示
          </h1>
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={startGuide}
              disabled={isActive}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {isActive ? '引导进行中...' : '开始引导'}
            </button>
            <button
              onClick={stopGuide}
              disabled={!isActive}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              停止引导
            </button>
            <button
              onClick={resetCompletion}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              重置状态
            </button>
          </div>
          <div className="text-sm text-gray-600">
            状态: {isActive ? '引导进行中' : hasCompleted ? '已完成引导' : '未开始'}
          </div>
        </div>

        {/* 演示内容 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 第一步 */}
          <div
            id="step1"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              快速开始
            </h3>
            <p className="text-gray-600 text-sm">
              这是您开始使用应用的第一步。点击上方的"开始引导"按钮来体验完整的引导流程。
            </p>
          </div>

          {/* 第二步 */}
          <div
            id="step2"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              主要功能
            </h3>
            <p className="text-gray-600 text-sm">
              这里展示了应用的核心功能。用户引导会详细介绍每个功能的使用方法。
            </p>
          </div>

          {/* 第三步 */}
          <div
            id="step3"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              个性化设置
            </h3>
            <p className="text-gray-600 text-sm">
              在这里您可以根据个人喜好调整应用设置，让使用体验更加符合您的需求。
            </p>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            使用说明
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• <strong>开始引导</strong>: 点击"开始引导"按钮启动用户引导流程</p>
            <p>• <strong>停止引导</strong>: 在引导过程中可以随时停止</p>
            <p>• <strong>重置状态</strong>: 清除已完成的记录，可以重新体验引导</p>
            <p>• <strong>自动记忆</strong>: 系统会记住您是否已完成引导，避免重复显示</p>
          </div>
        </div>
      </div>
    </div>
  );
} 