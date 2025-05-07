"use client";

import React from 'react';
import { useStore } from '../../store/store';

// 预设颜色列表
const presetColors = [
  { name: '蓝色', value: '#3182ce', gradient: 'from-blue-400 to-blue-600' },
  { name: '青色', value: '#0d9488', gradient: 'from-teal-400 to-teal-600' },
  { name: '绿色', value: '#16a34a', gradient: 'from-green-400 to-green-600' },
  { name: '紫色', value: '#8b5cf6', gradient: 'from-purple-400 to-purple-600' },
  { name: '粉色', value: '#ec4899', gradient: 'from-pink-400 to-pink-600' },
  { name: '橙色', value: '#f97316', gradient: 'from-orange-400 to-orange-600' },
];

const ColorPicker: React.FC = () => {
  const { themeConfig, setPrimaryColor } = useStore();
  
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
      <h3 className="text-base font-medium mb-3">主题颜色</h3>
      <div className="grid grid-cols-3 gap-3">
        {presetColors.map((color) => (
          <button
            key={color.value}
            onClick={() => setPrimaryColor(color.value)}
            className={`
              relative flex flex-col items-center p-2 rounded-lg transition-all
              ${themeConfig.primaryColor === color.value 
                ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-offset-white ring-slate-900/10 dark:ring-white/20' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
            `}
            aria-label={`选择${color.name}主题`}
          >
            <div 
              className={`w-full h-8 rounded-md bg-gradient-to-r ${color.gradient} mb-1`}
            ></div>
            <span className="text-xs text-slate-700 dark:text-slate-300">{color.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <label htmlFor="custom-color" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          自定义颜色
        </label>
        <div className="flex space-x-2">
          <input
            type="color"
            id="custom-color"
            value={themeConfig.primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-8 w-8 p-0 border-0 cursor-pointer rounded overflow-hidden"
          />
          <input
            type="text"
            value={themeConfig.primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="flex-1 px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            placeholder="#RRGGBB"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          更改主题颜色将影响应用程序中的按钮、链接和强调元素。
        </p>
      </div>
    </div>
  );
};

export default ColorPicker; 