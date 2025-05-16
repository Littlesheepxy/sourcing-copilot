/**
 * Boss直聘 Sourcing 智能助手 - 后台脚本主入口
 * 整合规则评估器和消息处理模块
 */

import { initializeMessageListeners } from './modules/message-handler';
import { rulesEvaluator } from './modules/rules-evaluator';
import { LogicalOperator } from '../../shared/core/rules-engine/types';

console.log('Boss直聘 Sourcing 智能助手 - 后台服务已启动');

/**
 * 初始化扩展
 */
function initializeExtension(): void {
  // 初始化消息监听器
  initializeMessageListeners();
  
  // 设置侧边栏行为 - 点击扩展图标时打开侧边栏
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(error => console.error('设置侧边栏行为失败:', error));
}

/**
 * 监听标签页更新事件，在Boss直聘网站上启用侧边栏
 */
// @ts-ignore - 忽略可能的类型错误，确保兼容性
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab?.url) return;
  
  const url = new URL(tab.url);
  // 在Boss直聘网站上启用侧边栏
  if (url.hostname.includes('zhipin.com')) {
    try {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'sidebar.html',
        enabled: true
      });
      console.log('Boss直聘网站侧边栏已启用');
    } catch (error) {
      console.error('设置侧边栏选项失败:', error);
    }
  } else {
    // 在其他网站上禁用侧边栏
    try {
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false
      });
    } catch (error) {
      console.error('禁用侧边栏失败:', error);
    }
  }
});

/**
 * 监听扩展安装或更新事件
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装，初始化扩展配置
    chrome.storage.local.set({
      // 初始化筛选规则
      filterRules: {
        operator: LogicalOperator.AND,
        conditions: [],
        enabled: true
      },
      // 初始化模式（校准模式/自动模式）
      mode: 'calibration', // 'calibration' 或 'automatic'
      // 初始化日志
      logs: [],
      // 初始化标记数据
      markedData: {
        positive: [], // 人工标记为符合的简历
        negative: []  // 人工标记为不符合的简历
      },
      // 字段映射配置
      selectors: {
        name: ".name",
        education: ".base-info.job-detail",
        experience: ".base-info.job-detail",
        school: ".edu-exp-box .text",
        company: ".work-exp-box .text",
        position: ".job-header",
        skills: ".tag-list",
        greetButton: ".btn-greet",
        resumeCard: ".recommend-card-wrap",
        detailPage: {
          container: ".detail-content",
          workExperience: ".work-exp-box",
          educationExperience: ".edu-exp-box",
          projectExperience: ".project-exp-box",
          expectation: ".expect-box"
        }
      },
      // 初始化系统设置
      systemSettings: {
        processingSpeed: 'normal',
        maxCandidates: '50' 
      },
      // 初始化为需要用户确认
      autoStart: false, // 设置为false，表示不会自动开始处理
      needConfirmation: true // 需要用户确认
    }, () => {
      console.log('扩展初始化配置完成');
    });
  }
});

// 初始化扩展
initializeExtension(); 