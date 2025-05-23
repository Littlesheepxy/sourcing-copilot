"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertCircle, AlertTriangle, CheckCircle, Circle, ArrowRight, 
  ExternalLink, Calendar, Users, FilePlus, Settings, Bot, Play, StopCircle, Crown, ChevronUp, ChevronDown, TrendingUp, Award,
  Clock, FileText, Brain, KanbanSquare, Zap, MessageCircle, LightbulbIcon, HelpCircle
} from "lucide-react";
import { useStore } from "../store/store";
import { 
  SummarySection, 
  TaskCenterSection, 
  IncentiveSection, 
  SupportSection 
} from './Dashboard';
import DashboardCard from "./ui/DashboardCard";
import TabsCard from "./ui/TabsCard";
import VerticalTabsCard from "./ui/VerticalTabsCard";
import PositionProgress from "./Dashboard/PositionProgress";
import AutomationStatus from "./Dashboard/AutomationStatus"; 
import QuickAccessGrid from "./Dashboard/QuickAccessGrid";

// 引导步骤
const steps = [
  "进入推荐牛人页面", 
  "设置筛选规则", 
  "启动自动化"
];

export default function Homepage() {
  const { setActiveModule } = useStore();
  
  // 系统状态
  const [systemStatus, setSystemStatus] = useState({
    running: false,
    processedCount: 0,
    pageType: '未知',
    greetedCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLaunchOptions, setShowLaunchOptions] = useState(false);
  
  // 当前流程步骤
  const [currentStep, setCurrentStep] = useState(0);
  
  // 计算是否准备就绪
  const pageDetected = systemStatus.pageType === '推荐列表';
  const hasRules = true; // 假设已有规则，实际应从API获取
  const readyToStart = pageDetected && hasRules;
  
  // 处理下一步操作
  const handleNextStep = () => {
    if (!pageDetected) {
      // 启动Chrome浏览器并导航到Boss直聘，使用默认配置文件保留登录信息
      launchBrowserWithOptions();
    } else if (!hasRules) {
      // 跳转到AI智能筛选
      handleNavClick('ai-rules');
    } else {
      // 启动自动化
      startAutomation();
    }
  };
  
  // 处理导航点击
  const handleNavClick = (module: 'candidates' | 'rules' | 'simple-rules' | 'ai-rules' | 'logs' | 'ai-chat' | 'settings') => {
    setActiveModule(module);
  };
  
  // 获取系统状态
  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus({
          running: data.running,
          processedCount: data.processedCount || 0,
          pageType: formatPageType(data.pageType),
          greetedCount: Math.floor(data.processedCount * 0.7) || 0
        });
        
        // 更新当前步骤
        if (data.pageType !== 'recommend') {
          setCurrentStep(0);
        } else if (hasRules) {
          setCurrentStep(data.running ? 2 : 1);
        } else {
          setCurrentStep(1);
        }
      }
    } catch (error) {
      console.error('获取状态失败:', error);
      setErrorMessage('无法连接到后端服务，请确保服务正在运行');
    }
  };
  
  // 检测浏览器
  const detectBrowser = async () => {
    setDetecting(true);
    setErrorMessage(null);
    try {
      const response = await fetch('http://localhost:8000/api/detect', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.connected) {
          setSystemStatus(prev => ({
            ...prev,
            pageType: formatPageType(data.pageType)
          }));
          
          // 更新当前步骤
          if (data.pageType !== 'recommend') {
            setCurrentStep(0);
          } else if (hasRules) {
            setCurrentStep(1);
          } else {
            setCurrentStep(1);
          }
        } else if (data.success) {
          // 浏览器检测成功但未连接
          setErrorMessage(data.message || '未检测到Boss直聘页面，请前往Boss直聘网站');
        }
      } else {
        setErrorMessage('检测浏览器失败，请稍后重试');
      }
    } catch (error) {
      console.error('检测浏览器失败:', error);
      setErrorMessage('检测浏览器失败，请确保服务正在运行');
    } finally {
      setDetecting(false);
    }
  };
  
  // 启动Chrome浏览器
  const launchBrowser = async (forceNew = false, useDefaultProfile = true) => {
    setLaunching(true);
    setErrorMessage(null);
    try {
      // 调用后端API启动系统Chrome浏览器（以调试模式）
      // 这确保使用的是用户电脑本身的Chrome而不是Playwright内置浏览器
      // 使用系统Chrome可以有效绕过Boss直聘的反爬机制
      const response = await fetch('http://localhost:8000/api/browser/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://www.zhipin.com/web/boss/recommend',
          force_new: forceNew,  // 通常应该为false，避免创建多个浏览器实例
          use_default_profile: useDefaultProfile,  // 新增：是否使用默认配置文件
          wait_for_pages: true  // 新增：等待现有页面而不是创建新页面
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 浏览器启动成功，更新状态
        if (data.connected) {
          setSystemStatus(prev => ({
            ...prev,
            pageType: formatPageType(data.pageType || 'unknown')
          }));
          
          // 更新当前步骤
          if ((data.pageType || 'unknown') === 'recommend') {
            setCurrentStep(1);
          }
        } else {
          // 浏览器启动但未连接到目标页面
          setErrorMessage(data.message || '浏览器已启动，但未能连接到Boss直聘页面，请稍后重试检测');
          
          // 5秒后再次检测
          setTimeout(detectBrowser, 5000);
        }
      } else {
        // 如果启动失败，显示错误消息并提供手动操作指南
        setErrorMessage(
          data.message || 
          '启动浏览器失败，请尝试手动启动Chrome：\n' +
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9222'
        );
      }
    } catch (error) {
      console.error('启动浏览器失败:', error);
      setErrorMessage('启动浏览器失败，请确保服务正在运行');
    } finally {
      setLaunching(false);
    }
  };
  
  // 启动浏览器的高级选项
  const launchBrowserWithOptions = async () => {
    // 显示选项对话框或直接使用默认配置文件启动
    await launchBrowser(false, true);  // 使用默认配置文件
  };

  // 启动全新浏览器实例（独立配置文件）
  const launchCleanBrowser = async () => {
    await launchBrowser(false, false);  // 使用独立配置文件
  };
  
  // 启动自动化
  const startAutomation = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('http://localhost:8000/api/automation/start', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        await fetchStatus();
      } else {
        setErrorMessage('启动失败: ' + data.message);
      }
    } catch (error) {
      console.error('启动失败:', error);
      setErrorMessage('启动失败，请检查服务是否运行');
    } finally {
      setLoading(false);
    }
  };
  
  // 停止自动化
  const stopAutomation = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('http://localhost:8000/api/automation/stop', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        await fetchStatus();
      } else {
        setErrorMessage('停止失败: ' + data.message);
      }
    } catch (error) {
      console.error('停止失败:', error);
      setErrorMessage('停止失败，请检查服务是否运行');
    } finally {
      setLoading(false);
    }
  };
  
  // 格式化页面类型
  const formatPageType = (type) => {
    switch (type) {
      case 'recommend':
        return '推荐列表';
      case 'detail':
        return '简历详情';
      default:
        return '未知';
    }
  };
  
  // 点击关闭错误提示
  const closeError = () => {
    setErrorMessage(null);
  };
  
  // 联系客服
  const handleContactSupport = () => {
    window.open('https://slack.com/app_redirect?channel=U08G73V05TM', '_blank');
  };
  
  // 组件加载时获取状态和检测浏览器
  useEffect(() => {
    fetchStatus();
    detectBrowser();
    
    // 定时刷新状态
    const intervalId = setInterval(fetchStatus, 5000);
    
    // 清理定时器
    return () => clearInterval(intervalId);
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLaunchOptions) {
        const target = event.target as Element;
        if (!target.closest('.launch-options-container')) {
          setShowLaunchOptions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLaunchOptions]);

  // 模拟数据
  const timeStats = {
    savedHours: 24,
    efficiency: 35
  };
  
  const resumeStats = {
    total: systemStatus.processedCount + 20,
    processed: systemStatus.processedCount,
    greeted: systemStatus.greetedCount
  };
  
  const aiSuggestion = "将筛选条件中的'工作年限'从3年调整到2年可提高匹配率25%";
  
  const positionProgress = {
    total: 100,
    matched: 65,
    contacted: 42,
    replied: 18
  };
  
  const automationStatus = {
    running: systemStatus.running,
    taskCount: 80,
    completedTasks: systemStatus.processedCount,
    nextScheduledTime: systemStatus.running ? "今天 15:30" : undefined
  };
  
  const rankingData = {
    industry: "互联网",
    ranking: 12,
    totalCompanies: 230,
    change: 3
  };
  
  const trendItems = [
    { name: "平均招聘效率", value: 4.8, change: 12 },
    { name: "简历处理速度", value: 56, change: 8 },
    { name: "候选人回复率", value: "32%", change: -5 }
  ];
  
  const achievements = [
    { id: "1", name: "效率之星", icon: "🚀", description: "一天内处理50份简历", unlocked: true },
    { id: "2", name: "招聘达人", icon: "🏆", description: "成功招聘10名员工", unlocked: true },
    { id: "3", name: "沟通高手", icon: "💬", description: "回复率达到40%", unlocked: false, progress: { current: 32, total: 40 } },
    { id: "4", name: "规则大师", icon: "📋", description: "创建5条高效筛选规则", unlocked: false, progress: { current: 3, total: 5 } },
    { id: "5", name: "AI助手", icon: "🤖", description: "使用AI优化10次搜索", unlocked: false, progress: { current: 4, total: 10 } },
    { id: "6", name: "全能选手", icon: "⭐", description: "使用所有功能模块", unlocked: false, progress: { current: 3, total: 5 } }
  ];
  
  const tips = [
    { id: "1", title: "快速筛选技巧", content: "使用「Ctrl+F」在候选人列表中快速查找关键词，提高筛选效率。" },
    { id: "2", title: "自动化提醒", content: "设置每日提醒，系统会在指定时间自动执行筛选任务并向您推送结果。" },
    { id: "3", title: "简历评分技巧", content: "关注候选人技能匹配度评分，分数越高表示越符合您的职位要求。" }
  ];
  
  const faqs = [
    { id: "1", question: "如何创建自定义筛选规则？", answer: "进入「规则设置」页面，点击「新建规则」按钮，设置筛选条件后保存即可。" },
    { id: "2", question: "系统支持哪些招聘网站？", answer: "目前支持Boss直聘、拉勾网、智联招聘等主流招聘平台，未来将支持更多平台。" },
    { id: "3", question: "如何导出候选人数据？", answer: "在「候选人管理」页面，选择需要导出的候选人，点击「导出」按钮即可下载Excel格式文件。" }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-full xl:max-w-7xl mx-auto">
      {/* 顶部标题与状态指示器 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">仪表盘</h1>
          
          {/* 系统状态指示器 */}
          <div className="flex items-center space-x-2 text-sm">
          <div className={`w-3 h-3 rounded-full ${systemStatus.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 dark:text-gray-300">
              {systemStatus.running ? '自动化运行中' : '自动化已停止'}
            </span>
          </div>
        </div>
        
        {/* 错误消息提示 */}
        {errorMessage && (
        <div className="mb-4 sm:mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button 
              onClick={closeError}
              className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <span className="sr-only">关闭</span>
              &times;
            </button>
          </div>
        )}
        
      {/* 价值摘要区（顶部横幅） */}
      <div className="mb-4 sm:mb-6">
        <DashboardCard 
          title="我的助理报告" 
          icon={<Brain className="h-5 w-5 text-indigo-500" />}
          collapsible
          variant="default"
          className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-800/70 dark:to-gray-700/70"
        >
          <SummarySection 
            timeStats={timeStats}
            resumeStats={resumeStats}
            aiSuggestion={aiSuggestion}
          />
        </DashboardCard>
      </div>
      
      {/* 主内容区 - 左右分栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* 左侧主要内容区 (8/12) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* 任务中心区 */}
          <DashboardCard 
            title="职位自动化进展" 
            icon={<KanbanSquare className="h-5 w-5 text-blue-500" />}
            variant="gradient"
            collapsible
          >
            {/* 流程指示器 */}
            <div className="mb-4 sm:mb-6 bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">使用流程</span>
              </div>
              <div className="flex items-center">
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                      currentStep > index 
                        ? 'bg-green-500 text-white' 
                        : currentStep === index 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                    }`}>
                      <span className="text-xs sm:text-sm">{index + 1}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1.5 mx-1 sm:mx-2 rounded-full ${
                        currentStep > index ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {steps.map((step, index) => (
                  <span key={index} className={`text-xs ${currentStep >= index ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                    {step}
                  </span>
                ))}
              </div>
            </div>

            {/* 页面检测提示和准备状态卡片 */}
            {systemStatus.pageType !== '推荐列表' ? (
              <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-1 sm:mt-0" />
                <div className="flex-1 my-2 sm:my-0">
                  <p>请前往Boss直聘「推荐牛人」页面以启用自动化功能</p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-4">
                  <button 
                    onClick={detectBrowser} 
                    disabled={detecting}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs rounded-md bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 ${detecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {detecting ? '检测中...' : '重新检测'}
                  </button>
                  
                  <div className="relative inline-block flex-1 sm:flex-none launch-options-container">
                    <div className="flex">
                      <button 
                        onClick={() => launchBrowserWithOptions()} 
                        disabled={launching}
                        className={`flex-1 px-3 py-1 text-xs rounded-l-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 ${launching ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200 dark:hover:bg-blue-800'}`}
                      >
                        {launching ? '启动中...' : '启动浏览器'}
                      </button>
                      <button
                        onClick={() => setShowLaunchOptions(!showLaunchOptions)}
                        disabled={launching}
                        className={`px-2 py-1 text-xs rounded-r-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 border-l border-blue-200 dark:border-blue-700 ${launching ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200 dark:hover:bg-blue-800'}`}
                      >
                        ▼
                      </button>
                    </div>
                    
                    {/* 启动选项下拉菜单 */}
                    {showLaunchOptions && (
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-full whitespace-nowrap">
                        <button
                          onClick={() => {
                            launchBrowserWithOptions();
                            setShowLaunchOptions(false);
                          }}
                          disabled={launching}
                          className="block w-full px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md"
                        >
                          🔐 使用默认配置（保留登录）
                        </button>
                        <button
                          onClick={() => {
                            launchCleanBrowser();
                            setShowLaunchOptions(false);
                          }}
                          disabled={launching}
                          className="block w-full px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-md"
                        >
                          🆕 独立配置（全新浏览器）
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : !readyToStart && (
              <div className="mb-4 sm:mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
                <div className="flex items-center mb-3">
                  <div className={`w-3 h-3 mr-2 rounded-full ${readyToStart ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{readyToStart ? '准备就绪' : '准备中'}</h3>
                </div>
                
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <div className={`mt-0.5 w-5 h-5 mr-2 flex-shrink-0 ${pageDetected ? 'text-green-500' : 'text-gray-300'}`}>
                      {pageDetected ? <CheckCircle className="w-full h-full" /> : <Circle className="w-full h-full" />}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">检测到推荐牛人页面</span>
                  </li>
                  <li className="flex items-start">
                    <div className={`mt-0.5 w-5 h-5 mr-2 flex-shrink-0 ${hasRules ? 'text-green-500' : 'text-gray-300'}`}>
                      {hasRules ? <CheckCircle className="w-full h-full" /> : <Circle className="w-full h-full" />}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">已配置筛选规则</span>
                  </li>
                </ul>
                
                <button 
                  onClick={handleNextStep}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                >
                  {!pageDetected ? (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      前往Boss直聘
                    </>
                  ) : !hasRules ? (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      设置规则
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      启动自动化
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 三个模块组成的任务中心内容 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* 职位进度看板 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-full">
                <PositionProgress 
                  data={positionProgress}
                  onViewAll={() => handleNavClick('candidates')}
                />
              </div>
              
              {/* 自动化执行状态 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-full">
                <AutomationStatus 
                  status={automationStatus}
                  onStart={startAutomation}
                  onStop={stopAutomation}
                  loading={loading}
                />
              </div>
              
              {/* 快捷入口 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-full sm:col-span-2 lg:col-span-1">
                <QuickAccessGrid 
                  title="快捷入口"
                  onNavigate={handleNavClick}
                />
              </div>
            </div>
          </DashboardCard>
            </div>
        
        {/* 右侧辅助区 (4/12) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* 激励与数据区（使用垂直标签页） */}
          <VerticalTabsCard 
            title="我的成长与战绩" 
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
            variant="default"
            collapsible
            tabs={[
              {
                id: "ranking",
                label: "行业排名",
                shortLabel: "排名",
                icon: <Crown className="h-4 w-4 text-amber-500" />,
                content: (
                  <div className="py-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 text-center">{rankingData.industry} 行业</p>
                    <div className="flex items-end justify-center">
                      <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                        #{rankingData.ranking}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 mb-1.5">
                        / {rankingData.totalCompanies}
                      </span>
            </div>
                    
                    <div className="flex items-center justify-center mt-2">
                      {rankingData.change > 0 ? (
                        <>
                          <ChevronUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-500">上升 {rankingData.change} 位</span>
                        </>
                      ) : rankingData.change < 0 ? (
                        <>
                          <ChevronDown className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-500">下降 {Math.abs(rankingData.change)} 位</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">位置不变</span>
                      )}
                </div>
                </div>
                )
              },
              {
                id: "trends",
                label: "效率趋势",
                shortLabel: "效率",
                icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
                content: (
                  <div className="space-y-3">
                    {trendItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{item.value}</span>
                          {item.change > 0 ? (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                              +{item.change}%
                            </span>
                          ) : item.change < 0 ? (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded">
                              {item.change}%
                            </span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                              0%
                            </span>
                          )}
                </div>
              </div>
                    ))}
            </div>
                )
              },
              {
                id: "achievements",
                label: "成就徽章",
                shortLabel: "成就",
                icon: <Award className="h-4 w-4 text-purple-500" />,
                content: (
                  <div>
                    <div className="flex justify-end mb-3">
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                        已解锁 {achievements.filter(b => b.unlocked).length}/{achievements.length}
                      </span>
            </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {achievements.slice(0, 6).map((badge) => (
                        <div 
                          key={badge.id}
                          className={`relative p-2 rounded-lg flex flex-col items-center justify-center ${
                            badge.unlocked
                              ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                          title={badge.name + (badge.unlocked ? '' : ` - ${badge.description}`)}
                        >
                          <div className={`text-lg mb-1 ${badge.unlocked ? 'text-amber-500' : 'text-gray-400'}`}>
                            {badge.icon}
                          </div>
                          <span className={`text-xs truncate w-full text-center ${
                            badge.unlocked ? 'text-amber-800 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {badge.name}
                          </span>
                          
                          {!badge.unlocked && badge.progress && (
                            <div className="w-full mt-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                              <div 
                                className="bg-amber-400 h-1 rounded-full" 
                                style={{ width: `${(badge.progress.current / badge.progress.total) * 100}%` }}
                              ></div>
          </div>
                          )}
        </div>
                      ))}
              </div>
              </div>
                )
              }
            ]}
          />
          
          {/* 辅助支持区（使用垂直标签页） */}
          <VerticalTabsCard 
            title="智能助手与支持" 
            icon={<HelpCircle className="h-5 w-5 text-green-500" />}
            variant="default"
            collapsible
            tabs={[
              {
                id: "contact",
                label: "联系客服",
                shortLabel: "客服",
                icon: <MessageCircle className="h-4 w-4 text-indigo-500" />,
                content: (
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      遇到问题或需要帮助？我们的客服团队随时为您提供支持。
                    </p>
                    
            <button 
                      onClick={handleContactSupport}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      联系客服
            </button>
                    
                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                      <span>客服工作时间: 09:00-18:00</span>
                      <span>平均响应时间: &lt; 10分钟</span>
                    </div>
              </div>
                )
              },
              {
                id: "tips",
                label: "使用技巧",
                shortLabel: "技巧",
                icon: <LightbulbIcon className="h-4 w-4 text-amber-500" />,
                content: (
              <div>
                    {tips.map((tip, index) => (
                      <div key={index} className="mb-4 last:mb-0 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">{tip.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{tip.content}</p>
              </div>
                    ))}
              </div>
                )
              },
              {
                id: "faq",
                label: "常见问题",
                shortLabel: "问题",
                icon: <HelpCircle className="h-4 w-4 text-green-500" />,
                content: (
                  <div className="space-y-3">
                    {faqs.map((faq) => (
                      <details key={faq.id} className="text-sm">
                        <summary className="font-medium text-gray-700 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                          {faq.question}
                        </summary>
                        <p className="mt-2 pl-4 text-gray-600 dark:text-gray-300 text-xs">
                          {faq.answer}
                        </p>
                      </details>
                    ))}
              </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}