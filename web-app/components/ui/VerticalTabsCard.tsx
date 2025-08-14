"use client";

import React, { useState, ReactNode } from "react";
import DashboardCard from "./DashboardCard";
import { Construction } from "lucide-react";

type Tab = {
  id: string;
  label: string;
  shortLabel: string; // 短标签，两个字
  icon?: ReactNode;
  content: ReactNode;
};

type VerticalTabsCardProps = {
  title: string;
  icon?: ReactNode;
  tabs: Tab[];
  collapsible?: boolean;
  variant?: "default" | "gradient" | "highlighted";
  className?: string;
  disabled?: boolean;
  disabledMessage?: string;
};

const VerticalTabsCard: React.FC<VerticalTabsCardProps> = ({
  title,
  icon,
  tabs,
  collapsible = false,
  variant = "default",
  className = "",
  disabled = false,
  disabledMessage = "功能开发中"
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <DashboardCard
      title={title}
      icon={icon}
      collapsible={collapsible}
      variant={variant}
      className={className}
      bodyClassName="pb-0"
    >
      <div className={`flex flex-col space-y-2 ${disabled ? 'relative' : ''}`}>
        {/* 蒙版层 */}
        {disabled && (
          <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg z-10 flex flex-col items-center justify-center">
            <Construction className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {disabledMessage}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              等待SaaS版本上线
            </p>
          </div>
        )}

        {/* 标签列表 */}
        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex flex-col items-center py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
            >
              {tab.icon && <div className="mb-1">{tab.icon}</div>}
              <span>{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* 标签内容 */}
        <div className="py-4">
          {tabs.map((tab) => (
            <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};

export default VerticalTabsCard; 