"use client";

import React, { useState, ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

type DashboardCardProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  variant?: "default" | "gradient" | "highlighted";
  headerExtra?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>;

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  children,
  collapsible = false,
  variant = "default",
  headerExtra,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  ...htmlProps
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // 基础样式
  const baseCardClass = "rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden";
  
  // 根据变体设置不同的样式
  const variantClasses = {
    default: "bg-white dark:bg-slate-800",
    gradient: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-1.5",
    highlighted: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 p-1.5",
  };
  
  const headerBaseClass = "flex items-center justify-between mb-3";
  
  const bodyBaseClass = collapsed ? "hidden" : "";
  
  return (
    <div 
      className={`${baseCardClass} ${variantClasses[variant]} ${className}`}
      {...htmlProps}
    >
      {variant !== "default" ? (
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm p-5 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className={`${headerBaseClass} ${headerClassName}`}>
            <div className="flex items-center">
              {icon && <div className="mr-2">{icon}</div>}
              <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
            </div>
            <div className="flex items-center">
              {headerExtra}
              {collapsible && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
          <div className={`${bodyBaseClass} ${bodyClassName}`}>{children}</div>
        </div>
      ) : (
        <div className="p-5">
          <div className={`${headerBaseClass} ${headerClassName}`}>
            <div className="flex items-center">
              {icon && <div className="mr-2">{icon}</div>}
              <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
            </div>
            <div className="flex items-center">
              {headerExtra}
              {collapsible && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
          <div className={`${bodyBaseClass} ${bodyClassName}`}>{children}</div>
        </div>
      )}
    </div>
  );
};

export default DashboardCard; 