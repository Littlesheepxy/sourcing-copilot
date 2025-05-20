"use client";

import React, { useState, ReactNode } from "react";
import DashboardCard from "./DashboardCard";

type Tab = {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
};

type TabsCardProps = {
  title: string;
  icon?: ReactNode;
  tabs: Tab[];
  collapsible?: boolean;
  variant?: "default" | "gradient" | "highlighted";
  className?: string;
};

const TabsCard: React.FC<TabsCardProps> = ({
  title,
  icon,
  tabs,
  collapsible = false,
  variant = "default",
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <DashboardCard
      title={title}
      icon={icon}
      collapsible={collapsible}
      variant={variant}
      className={className}
      bodyClassName="space-y-4"
    >
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center py-2 px-4 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tabs.map((tab) => (
          <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
            {tab.content}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default TabsCard; 