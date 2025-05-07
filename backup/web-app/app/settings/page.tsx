"use client";

import React from "react";
import AppLayout from "../../components/layout/AppLayout";
import Settings from "../../components/ui/Settings";

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">设置</h1>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <Settings />
        </div>
      </div>
    </AppLayout>
  );
} 