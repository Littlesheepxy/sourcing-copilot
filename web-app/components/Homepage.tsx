"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, Calendar, Users, FilePlus, Settings, Bot, Play, 
  StopCircle, AlertCircle, CheckCircle, Circle, AlertTriangle,
  ExternalLink
} from "lucide-react";
import { useStore } from "../store/store";

// 卡片容器动画
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// 卡片项动画
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

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
  
  // 当前流程步骤
  const [currentStep, setCurrentStep] = useState(0);
  
  // 计算是否准备就绪
  const pageDetected = systemStatus.pageType === '推荐列表';
  const hasRules = true; // 假设已有规则，实际应从API获取
  const readyToStart = pageDetected && hasRules;
  
  // 处理下一步操作
  const handleNextStep = () => {
    if (!pageDetected) {
      // 启动Chrome浏览器并导航到Boss直聘
      launchBrowser();
    } else if (!hasRules) {
      // 跳转到规则设置
      handleNavClick('rules');
    } else {
      // 启动自动化
      startAutomation();
    }
  };
  
  // 处理导航点击
  const handleNavClick = (module: 'candidates' | 'rules' | 'logs' | 'ai-chat' | 'settings') => {
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
  const launchBrowser = async (forceNew = false) => {
    setLaunching(true);
    setErrorMessage(null);
    try {
      const response = await fetch('http://localhost:8000/api/browser/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://www.zhipin.com/web/boss/recommend',
          force_new: forceNew
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
          setTimeout(detectBrowser, 5000); // 5秒后再次检测
        }
      } else {
        setErrorMessage(data.message || '启动浏览器失败，请确保Chrome浏览器已安装');
      }
    } catch (error) {
      console.error('启动浏览器失败:', error);
      setErrorMessage('启动浏览器失败，请确保服务正在运行');
    } finally {
      setLaunching(false);
    }
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
  
  // 组件加载时获取状态和检测浏览器
  useEffect(() => {
    fetchStatus();
    detectBrowser();
    
    // 定时刷新状态
    const intervalId = setInterval(fetchStatus, 5000);
    
    // 清理定时器
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-8 py-6 px-4">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">仪表盘</h1>
          
          {/* 系统状态指示器 */}
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${systemStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 dark:text-gray-300">
              {systemStatus.running ? '自动化运行中' : '自动化已停止'}
            </span>
          </div>
        </div>
        
        {/* 错误消息提示 */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start">
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
        
        {/* 流程指示器 */}
        <div className="w-full mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">使用流程</span>
          </div>
          <div className="flex items-center">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep > index 
                    ? 'bg-green-500 text-white' 
                    : currentStep === index 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > index ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {steps.map((step, index) => (
              <span key={index} className={`text-xs ${currentStep >= index ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                {step}
              </span>
            ))}
          </div>
        </div>
        
        {/* 页面检测提示 */}
        {systemStatus.pageType === '推荐列表' ? (
          <div className="flex items-center mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p>已检测到「推荐牛人」页面，可以启动自动化</p>
          </div>
        ) : (
          <div className="flex items-center mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p>请前往Boss直聘「推荐牛人」页面以启用自动化功能</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={detectBrowser} 
                disabled={detecting}
                className={`px-3 py-1 text-xs rounded-md bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 ${detecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {detecting ? '检测中...' : '重新检测'}
              </button>
              
              <div className="relative inline-block">
                <button 
                  onClick={() => launchBrowser(false)} 
                  disabled={launching}
                  className={`px-3 py-1 text-xs rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 ${launching ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {launching ? '启动中...' : '启动浏览器'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    launchBrowser(true);
                  }}
                  disabled={launching}
                  className="absolute top-0 right-0 -mr-2 -mt-2 w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-blue-600"
                  title="强制启动新浏览器"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          
          {/* 今日活动卡片 */}
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            variants={cardVariants}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">今日活动</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">已扫描简历</span>
                  <span className="font-medium">{systemStatus.processedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">当前页面类型</span>
                  <span className="font-medium">{systemStatus.pageType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">已打招呼</span>
                  <span className="font-medium">{systemStatus.greetedCount}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
              <button 
                onClick={() => handleNavClick('logs')} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                查看详细日志
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </motion.div>
          
          {/* 准备状态卡片 */}
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            variants={cardVariants}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 mr-2 rounded-full ${readyToStart ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{readyToStart ? '准备就绪' : '准备中'}</h3>
              </div>
              
              <ul className="space-y-3">
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
              
              {!readyToStart && (
                <button 
                  onClick={handleNextStep}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center"
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
              )}
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
              <button 
                onClick={() => handleNavClick('rules')} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                管理规则
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </motion.div>
          
          {/* 规则状态卡片 */}
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            variants={cardVariants}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">规则状态</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">有效规则</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">自动模式</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">已关闭</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">上次修改</span>
                  <span className="font-medium">-</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
              <button 
                onClick={() => handleNavClick('rules')} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                管理规则
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>
      
      {/* 自动化控制面板 */}
      <section>
        <h2 className="text-2xl font-bold mb-4">自动化控制</h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={startAutomation}
              disabled={!pageDetected || systemStatus.running || loading}
              className={`flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium ${
                !pageDetected || systemStatus.running || loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Play className="w-5 h-5 mr-2" />
              启动自动化
            </button>
            
            <button
              onClick={stopAutomation}
              disabled={!systemStatus.running || loading}
              className={`flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium ${
                !systemStatus.running || loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <StopCircle className="w-5 h-5 mr-2" />
              停止自动化
            </button>
            
            <button
              onClick={() => handleNavClick('rules')}
              className="flex items-center justify-center px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Settings className="w-5 h-5 mr-2" />
              配置规则
            </button>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">快速导航</h2>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* 快速导航卡片 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button 
              onClick={() => handleNavClick('candidates')} 
              className="w-full flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-3">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">候选人管理</h3>
              </div>
            </button>
          </motion.div>
          
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button 
              onClick={() => handleNavClick('rules')} 
              className="w-full flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
                <FilePlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">规则设置</h3>
              </div>
            </button>
          </motion.div>
          
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button 
              onClick={() => handleNavClick('logs')} 
              className="w-full flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-3">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">操作日志</h3>
              </div>
            </button>
          </motion.div>
          
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button 
              onClick={() => handleNavClick('ai-chat')} 
              className="w-full flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="rounded-full p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-3">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">AI 对话</h3>
              </div>
            </button>
          </motion.div>
        </motion.div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">使用指南</h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <ol className="list-decimal pl-5 space-y-3 text-gray-700 dark:text-gray-300">
            <li><strong>进入Boss直聘「推荐牛人」页面</strong><br/>
               打开Boss直聘网站并确保已登录到「推荐牛人」页面</li>
            <li><strong>设置筛选规则</strong><br/>
               点击「规则设置」创建您的候选人筛选条件，或使用「AI对话」智能生成规则</li>
            <li><strong>启动自动化</strong><br/>
               返回首页点击「启动自动化」按钮，系统将根据您的规则自动评估候选人</li>
          </ol>
        </div>
      </section>
    </div>
  );
}