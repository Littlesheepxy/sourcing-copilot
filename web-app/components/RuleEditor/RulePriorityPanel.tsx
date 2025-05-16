"use client";

import React, { useState } from 'react';
import { RulePriority } from '../../../shared/types';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RulePriorityPanelProps {
  rulePriorities: RulePriority[];
  updateRulePriorities: (priorities: RulePriority[]) => void;
}

// 单个可拖拽的优先级项
const SortableRulePriorityItem = ({ 
  priority 
}: { 
  priority: RulePriority 
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: priority.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-2"
    >
      <div {...attributes} {...listeners} className="cursor-move p-1 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="12" r="1"></circle>
          <circle cx="9" cy="5" r="1"></circle>
          <circle cx="9" cy="19" r="1"></circle>
          <circle cx="15" cy="12" r="1"></circle>
          <circle cx="15" cy="5" r="1"></circle>
          <circle cx="15" cy="19" r="1"></circle>
        </svg>
      </div>
      <span className="flex-grow font-medium">{priority.name}</span>
      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">权重: {priority.weight}</span>
    </div>
  );
};

const RulePriorityPanel: React.FC<RulePriorityPanelProps> = ({ 
  rulePriorities, 
  updateRulePriorities 
}) => {
  const [showAIOptimization, setShowAIOptimization] = useState(false);
  
  // AI优化建议示例
  const aiSuggestions: RulePriority[] = [
    { id: "skills", name: "技能标签", weight: 5 },
    { id: "experience", name: "工作经验", weight: 4 },
    { id: "education", name: "学历要求", weight: 3 },
    { id: "school", name: "学校背景", weight: 2 }
  ];
  
  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      // 获取项目的旧索引和新索引
      const oldIndex = rulePriorities.findIndex(p => p.id === active.id);
      const newIndex = rulePriorities.findIndex(p => p.id === over?.id);
      
      // 移动数组中的项目
      const newPriorities = arrayMove(rulePriorities, oldIndex, newIndex);
      
      // 重新计算权重
      const updatedPriorities = newPriorities.map((priority, index) => ({
        ...priority,
        weight: newPriorities.length - index // 反向计算权重，位置越高权重越大
      }));
      
      // 更新规则优先级
      updateRulePriorities(updatedPriorities);
    }
  };
  
  // 应用AI优化建议
  const applyAISuggestions = () => {
    updateRulePriorities(aiSuggestions);
    setShowAIOptimization(false);
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">规则优先顺序</h2>
        <button 
          onClick={() => setShowAIOptimization(!showAIOptimization)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          AI优化建议
        </button>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        拖拽调整规则应用的优先顺序，越靠上优先级越高。系统会自动根据位置计算权重值。
      </p>
      
      {/* AI优化建议面板 */}
      {showAIOptimization && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">AI优化建议</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            根据当前岗位和行业趋势，建议调整规则优先级如下：
          </p>
          <ol className="list-decimal pl-5 text-sm text-gray-700 dark:text-gray-300 mb-3 space-y-1">
            <li>技能标签 - 权重提高到 5（对于技术岗位更为重要）</li>
            <li>工作经验 - 保持权重 4</li>
            <li>学历要求 - 降低到权重 3</li>
            <li>学校背景 - 保持权重 2</li>
          </ol>
          <button 
            onClick={applyAISuggestions}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            应用这些建议
          </button>
        </div>
      )}
      
      {/* 可拖拽列表 */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={rulePriorities.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {rulePriorities.map(priority => (
              <SortableRulePriorityItem 
                key={priority.id} 
                priority={priority} 
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default RulePriorityPanel; 