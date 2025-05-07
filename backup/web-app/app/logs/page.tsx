"use client";

import React from "react";
import AppLayout from "../../components/layout/AppLayout";
import LogViewer from "../../components/LogViewer";

export default function LogsPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">操作日志</h1>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              导出日志
            </button>
            <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors">
              清除日志
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <LogViewer />
        </div>
      </div>
    </AppLayout>
  );
} 