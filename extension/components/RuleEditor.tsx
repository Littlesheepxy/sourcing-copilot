/**
 * 规则编辑表单组件
 */
import React, { useState, useEffect } from 'react';
import { Rule, RuleType } from '../../shared/types';
import { useFilterStore } from '../store/filterStore';

interface RuleEditorProps {
  rule: Rule | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({ rule, isOpen, onClose }) => {
  const updateRule = useFilterStore(state => state.updateRule);
  
  const [formData, setFormData] = useState<Partial<Rule>>({
    name: '',
    weight: 50,
    enabled: true,
    items: []
  });
  
  const [newItem, setNewItem] = useState('');
  
  // 规则类型标签映射
  const ruleTypeLabels: Record<RuleType, string> = {
    [RuleType.POSITION]: '岗位',
    [RuleType.COMPANY]: '公司',
    [RuleType.KEYWORD]: '关键词',
    [RuleType.SCHOOL]: '学校',
    [RuleType.EDUCATION]: '学历'
  };
  
  // 表单初始化
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        weight: rule.weight,
        enabled: rule.enabled,
        items: rule.items || []
      });
    }
  }, [rule]);
  
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // 处理权重变化
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFormData(prev => ({
      ...prev,
      weight: isNaN(value) ? 0 : Math.max(0, Math.min(100, value))
    }));
  };
  
  // 添加项目
  const handleAddItem = () => {
    if (!newItem.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem.trim()]
    }));
    
    setNewItem('');
  };
  
  // 删除项目
  const handleDeleteItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }));
  };
  
  // 保存规则
  const handleSave = () => {
    if (!rule || !formData.name) return;
    
    updateRule(rule.id, {
      name: formData.name,
      weight: formData.weight,
      enabled: formData.enabled,
      items: formData.items
    });
    
    onClose();
  };
  
  // 如果不是打开状态或没有规则，不渲染
  if (!isOpen || !rule) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">编辑规则</h2>
          <div className="px-2 py-1 rounded-md bg-gray-100 text-sm text-gray-700">
            {ruleTypeLabels[rule.type]}
          </div>
        </div>
        
        <div className="space-y-4">
          {/* 规则名称 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              规则名称
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* 权重 */}
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              权重 ({formData.weight})
            </label>
            <input
              type="range"
              id="weight"
              name="weight"
              min="0"
              max="100"
              value={formData.weight}
              onChange={handleWeightChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
          
          {/* 启用/禁用开关 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={formData.enabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
              启用规则
            </label>
          </div>
          
          {/* 项目列表 - 仅对支持项目的规则类型显示 */}
          {[RuleType.COMPANY, RuleType.KEYWORD, RuleType.SCHOOL, RuleType.EDUCATION].includes(rule.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {ruleTypeLabels[rule.type]}列表
              </label>
              
              {/* 添加新项目 */}
              <div className="flex mb-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder={`添加${ruleTypeLabels[rule.type]}`}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none"
                >
                  添加
                </button>
              </div>
              
              {/* 项目列表 */}
              <div className="bg-gray-50 rounded-md p-2 max-h-40 overflow-y-auto">
                {(formData.items || []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    暂无{ruleTypeLabels[rule.type]}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {(formData.items || []).map((item, index) => (
                      <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded-md">
                        <span className="text-sm text-gray-700">{item}</span>
                        <button
                          onClick={() => handleDeleteItem(index)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2 hover:bg-gray-300 focus:outline-none"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}; 