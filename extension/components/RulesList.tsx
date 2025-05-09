/**
 * 可拖拽的规则列表组件
 */
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Rule, RuleType } from '../../shared/types';
import { useFilterStore } from '../store/filterStore';

// 规则类型颜色映射
const ruleTypeColors: Record<RuleType, string> = {
  [RuleType.POSITION]: 'bg-blue-500',
  [RuleType.COMPANY]: 'bg-purple-500',
  [RuleType.KEYWORD]: 'bg-green-500',
  [RuleType.SCHOOL]: 'bg-yellow-500',
  [RuleType.EDUCATION]: 'bg-orange-500'
};

// 规则类型图标映射
const ruleTypeIcons: Record<RuleType, string> = {
  [RuleType.POSITION]: '💼',
  [RuleType.COMPANY]: '🏢',
  [RuleType.KEYWORD]: '🔑',
  [RuleType.SCHOOL]: '🎓',
  [RuleType.EDUCATION]: '📚'
};

interface RuleItemProps {
  rule: Rule;
  index: number;
  onEdit: (rule: Rule) => void;
}

// 单个规则项
const RuleItem: React.FC<RuleItemProps> = ({ rule, index, onEdit }) => {
  const updateRule = useFilterStore(state => state.updateRule);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // 切换规则开关
  const toggleEnabled = () => {
    updateRule(rule.id, { enabled: !rule.enabled });
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 rounded-lg border shadow-sm transition-all ${
        transform ? 'shadow-lg scale-105' : ''
      } ${rule.enabled ? 'bg-white' : 'bg-gray-100'}`}
    >
      <div className="flex items-center p-4">
        {/* 拖拽手柄 */}
        <div 
          {...attributes} 
          {...listeners}
          className="mr-3 cursor-move text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
        
        {/* 规则类型标记 */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${ruleTypeColors[rule.type]}`}>
          <span className="text-white">{ruleTypeIcons[rule.type]}</span>
        </div>
        
        {/* 规则信息 */}
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <h3 className={`font-medium ${rule.enabled ? 'text-gray-800' : 'text-gray-500'}`}>
              {rule.name}
            </h3>
            <div className="flex items-center">
              {/* 权重标签 */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                rule.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                权重 {rule.weight}
              </span>
            </div>
          </div>
          
          {/* 规则详情 */}
          {rule.items && rule.items.length > 0 && (
            <p className={`mt-1 text-sm ${rule.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
              {rule.items.slice(0, 3).join(', ')}
              {rule.items.length > 3 && `... 等${rule.items.length}项`}
            </p>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center ml-4">
          {/* 编辑按钮 */}
          <button
            onClick={() => onEdit(rule)}
            className="p-1 rounded-full text-gray-400 hover:text-blue-500 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          
          {/* 启用/禁用开关 */}
          <button
            onClick={toggleEnabled}
            className={`ml-2 relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
              rule.enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span 
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                rule.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} 
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// 规则列表组件
export const RulesList: React.FC<{onEdit?: (rule: Rule) => void}> = ({ onEdit }) => {
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const { rules } = useFilterStore(state => state.currentFilterConfig);
  const reorderRules = useFilterStore(state => state.reorderRules);
  
  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // 处理拖放结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // 获取规则ID列表
      const ruleIds = rules.map(rule => rule.id);
      
      // 获取拖拽前后的索引
      const oldIndex = ruleIds.indexOf(active.id.toString());
      const newIndex = ruleIds.indexOf(over.id.toString());
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // 移动规则ID
        const newRuleIds = arrayMove(ruleIds, oldIndex, newIndex);
        
        // 更新规则顺序
        reorderRules(newRuleIds);
      }
    }
  };
  
  // 编辑规则
  const handleEditRule = (rule: Rule) => {
    if (onEdit) {
      onEdit(rule);
    } else {
      setEditingRule(rule);
    }
  };
  
  // 按顺序排序规则
  const sortedRules = [...rules].sort((a, b) => a.order - b.order);
  const ruleIds = sortedRules.map(rule => rule.id);
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">筛选规则</h2>
        <p className="text-sm text-gray-500">拖拽规则调整顺序</p>
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={ruleIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedRules.map((rule, index) => (
              <RuleItem 
                key={rule.id} 
                rule={rule} 
                index={index} 
                onEdit={handleEditRule}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {/* 编辑规则弹窗 - 可以根据需要实现 */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">编辑规则</h2>
            {/* 这里可以实现编辑规则的表单 */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2"
              >
                取消
              </button>
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 