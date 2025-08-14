import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useStore } from '../store/store';

interface UserGuideProps {
  onComplete?: () => void;
}

export function useUserGuide({ onComplete }: UserGuideProps = {}) {
  const { setActiveModule } = useStore();

  useEffect(() => {
    // 自定义CSS样式
    const style = document.createElement('style');
    style.textContent = `
      .driver-popover {
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        border: 1px solid #e5e7eb !important;
        max-width: 320px !important;
      }
      
      .driver-popover-title {
        font-size: 18px !important;
        font-weight: 600 !important;
        color: #1f2937 !important;
        margin-bottom: 8px !important;
      }
      
      .driver-popover-description {
        font-size: 14px !important;
        line-height: 1.5 !important;
        color: #6b7280 !important;
        margin-bottom: 16px !important;
      }
      
      .driver-popover-footer {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
      
      .driver-popover-next-btn,
      .driver-popover-prev-btn,
      .driver-popover-close-btn {
        padding: 8px 16px !important;
        border-radius: 6px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        border: none !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
      }
      
      .driver-popover-next-btn {
        background: linear-gradient(135deg, #3b82f6, #6366f1) !important;
        color: white !important;
      }
      
      .driver-popover-next-btn:hover {
        background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
      }
      
      .driver-popover-prev-btn {
        background: #f3f4f6 !important;
        color: #374151 !important;
      }
      
      .driver-popover-prev-btn:hover {
        background: #e5e7eb !important;
      }
      
      .driver-popover-close-btn {
        background: #ef4444 !important;
        color: white !important;
      }
      
      .driver-popover-close-btn:hover {
        background: #dc2626 !important;
      }
      
      .driver-overlay {
        background: rgba(0, 0, 0, 0.5) !important;
      }
      
      .driver-highlighted-element {
        border-radius: 8px !important;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const startGuide = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '[data-guide="welcome"]',
          popover: {
            title: '🎉 欢迎使用 Sourcing Copilot',
            description: '我将为您介绍如何使用这个智能招聘助手。让我们开始这个简单的引导流程吧！',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '[data-guide="automation-progress"]',
          popover: {
            title: '📊 职位自动化进展',
            description: '这里显示您的自动化招聘进度。首先需要点击"启动浏览器"按钮，然后在打开的浏览器中登录Boss直聘并导航到"推荐牛人"页面。',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-guide="launch-browser"]',
          popover: {
            title: '🚀 启动浏览器',
            description: '点击这个按钮启动Chrome浏览器，系统会自动导航到Boss直聘的推荐牛人页面。请确保您已经登录Boss直聘账号。',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '[data-guide="detect-browser"]',
          popover: {
            title: '🔍 重新检测',
            description: '如果您已经手动打开了Boss直聘页面，可以点击"重新检测"按钮来确认页面状态。确保您在"推荐牛人"页面并完成了筛选设置。',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '[data-guide="config-status"]',
          popover: {
            title: '⚙️ 配置规则部分',
            description: '这里显示您的AI配置状态。包括AI服务、自动模式、扫描策略等设置。确保所有配置都已正确设置。',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '[data-guide="ai-rules-nav"]',
          popover: {
            title: '🧠 AI智能筛选',
            description: '点击这里可以配置AI智能筛选规则。您可以设置候选人的筛选条件，让AI帮您自动筛选合适的候选人。',
            side: 'right',
            align: 'center',
            onNextClick: () => {
              // 切换到AI规则页面
              setActiveModule('ai-rules');
              setTimeout(() => {
                driverObj.moveNext();
              }, 500);
            }
          }
        },
        {
          element: '[data-guide="ai-assistant"]',
          popover: {
            title: '💬 AI对话部分',
            description: '在AI智能筛选页面中，您可以使用右侧的AI助手功能来优化筛选条件，AI会根据您的需求提供智能建议和配置帮助。',
            side: 'left',
            align: 'center',
            onNextClick: () => {
              // 切换回主页
              setActiveModule('home');
              setTimeout(() => {
                driverObj.moveNext();
              }, 500);
            }
          }
        },
        {
          element: '[data-guide="settings-nav"]',
          popover: {
            title: '💾 保存配置部分',
            description: '在设置页面，您可以保存和管理所有的配置信息，包括AI模型设置、自动化参数等。',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: () => {
            // 动态选择可见的启动按钮
            const primaryButton = document.querySelector('[data-guide="start-automation"]') as HTMLElement;
            const secondaryButton = document.querySelector('[data-guide="start-automation-button"]') as HTMLElement;
            
            // 检查哪个按钮可见且可用
            if (primaryButton && primaryButton.offsetParent !== null) {
              return primaryButton;
            } else if (secondaryButton && secondaryButton.offsetParent !== null) {
              return secondaryButton;
            }
            
            // 如果都不可见，返回第一个作为备选
            return primaryButton || secondaryButton;
          },
          popover: {
            title: '▶️ 启动自动化',
            description: '当所有配置完成后，点击这里启动自动化流程。系统将开始自动筛选和联系候选人。',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '[data-guide="candidates-nav"]',
          popover: {
            title: '👥 候选人管理',
            description: '在这里查看所有候选人信息，包括已联系的、待联系的和已回复的候选人。您可以管理整个招聘流程。',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '[data-guide="logs-nav"]',
          popover: {
            title: '📋 操作日志',
            description: '查看详细的操作日志，包括系统执行的所有操作记录、错误信息和执行结果。方便您监控和调试。',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '[data-guide="welcome"]',
          popover: {
            title: '🎊 引导完成！',
            description: '恭喜您完成了用户引导！现在您可以开始使用Sourcing Copilot来提升您的招聘效率了。如有任何问题，请随时联系客服。',
            side: 'bottom',
            align: 'center'
          }
        }
      ],
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '完成',
      progressText: '第 {{current}} 步，共 {{total}} 步',
      onDestroyed: () => {
        onComplete?.();
      }
    });

    driverObj.drive();
  };

  return { startGuide };
}

export default useUserGuide; 