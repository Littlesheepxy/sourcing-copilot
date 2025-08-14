'use client';

import { useState } from 'react';
import { DriveStep } from 'driver.js';
import UserGuide from './UserGuide';

export default function GuideExample() {
  const [showGuide, setShowGuide] = useState(false);

  // 定义引导步骤
  const guideSteps: DriveStep[] = [
    {
      element: '#welcome-section',
      popover: {
        title: '欢迎使用 Sourcing Copilot',
        description: '这是您的智能招聘助手，让我们开始一个快速导览吧！',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#search-button',
      popover: {
        title: '搜索功能',
        description: '点击这里开始搜索候选人。您可以使用各种筛选条件来找到最合适的人选。',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#filter-panel',
      popover: {
        title: '筛选面板',
        description: '使用这些筛选器来精确定位您需要的候选人类型。',
        side: 'left',
        align: 'start'
      }
    },
    {
      element: '#candidate-list',
      popover: {
        title: '候选人列表',
        description: '这里显示搜索结果。您可以查看候选人的详细信息并进行操作。',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#settings-button',
      popover: {
        title: '设置',
        description: '在这里您可以配置系统偏好设置和个人资料。',
        side: 'left',
        align: 'end'
      }
    }
  ];

  const handleGuideComplete = () => {
    console.log('用户引导完成！');
    setShowGuide(false);
    // 可以在这里保存用户已完成引导的状态
    localStorage.setItem('hasCompletedGuide', 'true');
  };

  const handleGuideSkip = () => {
    console.log('用户跳过了引导');
    setShowGuide(false);
  };

  const startGuide = () => {
    setShowGuide(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* 引导组件 */}
      {showGuide && (
        <UserGuide
          steps={guideSteps}
          onComplete={handleGuideComplete}
          onSkip={handleGuideSkip}
          autoStart={true}
          config={{
            animate: true,
            smoothScroll: true,
            showProgress: true
          }}
        />
      )}

      {/* 示例页面内容 */}
      <div className="max-w-6xl mx-auto">
        {/* 欢迎区域 */}
        <div id="welcome-section" className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Sourcing Copilot Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            欢迎使用智能招聘助手！这里是您的工作台。
          </p>
          <button
            onClick={startGuide}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            开始用户引导
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 筛选面板 */}
          <div id="filter-panel" className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">筛选条件</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职位类型
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option>前端开发</option>
                    <option>后端开发</option>
                    <option>全栈开发</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    经验年限
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option>1-3年</option>
                    <option>3-5年</option>
                    <option>5年以上</option>
                  </select>
                </div>
                <button
                  id="search-button"
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition-colors"
                >
                  搜索候选人
                </button>
              </div>
            </div>
          </div>

          {/* 候选人列表 */}
          <div id="candidate-list" className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">候选人列表</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          候选人 {i}
                        </h3>
                        <p className="text-sm text-gray-600">
                          前端开发工程师 • 3年经验
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          React, TypeScript, Node.js
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-500 hover:text-blue-600 text-sm">
                          查看详情
                        </button>
                        <button className="text-green-500 hover:text-green-600 text-sm">
                          联系
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 设置按钮 */}
        <div className="fixed bottom-6 right-6">
          <button
            id="settings-button"
            className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-colors"
            title="设置"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 