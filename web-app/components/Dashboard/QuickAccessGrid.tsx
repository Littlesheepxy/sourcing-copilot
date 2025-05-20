"use client";

import React, { ReactNode } from "react";
import { Users, Settings, BookOpen, MessageSquare } from "lucide-react";

type QuickAccessItem = {
  id: string;
  label: string;
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
  onClick: () => void;
};

type QuickAccessGridProps = {
  title: string;
  onNavigate: (route: string) => void;
};

const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({ title, onNavigate }) => {
  // 定义快捷入口项
  const quickAccessItems: QuickAccessItem[] = [
    {
      id: "candidates",
      label: "候选人",
      icon: <Users className="h-6 w-6" />,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      onClick: () => onNavigate("candidates")
    },
    {
      id: "rules",
      label: "规则设置",
      icon: <Settings className="h-6 w-6" />,
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      onClick: () => onNavigate("rules")
    },
    {
      id: "logs",
      label: "操作日志",
      icon: <BookOpen className="h-6 w-6" />,
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      onClick: () => onNavigate("logs")
    },
    {
      id: "ai-chat",
      label: "AI对话",
      icon: <MessageSquare className="h-6 w-6" />,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      onClick: () => onNavigate("ai-chat")
    }
  ];

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">🚀 {title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {quickAccessItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`${item.bgColor} p-4 rounded-xl flex flex-col items-center text-center transition-all duration-200 hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-700`}
          >
            <div className={`${item.iconColor} mb-2`}>
              {item.icon}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickAccessGrid; 