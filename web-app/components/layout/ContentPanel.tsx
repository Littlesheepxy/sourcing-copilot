"use client";

import React from 'react';
import { useStore } from '../../store/store';
import { motion, AnimatePresence } from 'framer-motion';

// 导入各模块组件
import CandidatesPage from '../../app/candidates/page';
import LogsPage from '../../app/logs/page';
import SettingsPage from '../../app/settings/page';
// RulesPage 已弃用，不再导入
import AIChatPage from '../../app/ai-chat/page';
import Homepage from '../Homepage';
import SimpleRulesPage from '../../app/simple-rules/page';

// 动画设置
const containerVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.3
    }
  },
  exit: { opacity: 0, x: -20 }
};

export default function ContentPanel() {
  const { activeModule } = useStore();
  
  // 根据活动模块渲染对应内容
  const renderContent = () => {
    switch (activeModule) {
      case 'home':
        return <Homepage />;
      case 'candidates':
        return <CandidatesPage />;
      case 'rules':
        // 高级规则已弃用，使用简单规则页面
        return <SimpleRulesPage />;
      case 'simple-rules':
        return <SimpleRulesPage />;
      case 'logs':
        return <LogsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'ai-chat':
        return <AIChatPage />;
      default:
        return <Homepage />;
    }
  };

  return (
    <div className="w-full overflow-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeModule}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="min-h-screen"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 