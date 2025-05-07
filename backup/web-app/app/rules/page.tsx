"use client";

import React from "react";
import AppLayout from "../../components/layout/AppLayout";
import RuleEditor from "../../components/RuleEditor";

export default function RulesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">规则设置</h1>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            在此页面可以设置筛选候选人的规则，系统将根据这些规则自动处理简历数据。请设置条件组合，支持嵌套的AND/OR逻辑。
          </p>
          
          <RuleEditor />
        </div>
      </div>
    </AppLayout>
  );
} 