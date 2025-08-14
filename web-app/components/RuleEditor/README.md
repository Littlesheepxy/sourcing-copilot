# AI Filter Editor 组件结构

## 概述
AIFilterEditor 是AI智能筛选功能的主要组件，已经过重构以提高可维护性和代码复用性。

## 文件结构

```
RuleEditor/
├── AIFilterEditor.tsx              # 主容器组件 (重构后)
├── AIFilterEditor.old.tsx          # 原始版本 (备份)
├── index.tsx                       # 入口文件
├── panels/                         # 功能面板组件
│   ├── BasicFiltersPanel.tsx        # 基本筛选条件面板
│   ├── JobDescriptionPanel.tsx      # 职位描述面板  
│   ├── TalentProfilePanel.tsx       # 人才画像面板
│   ├── AIAssistantChat.tsx          # AI助手聊天面板
│   └── FilterCriteriaPanel.tsx      # 筛选标准生成面板
├── hooks/                          # 自定义Hooks
│   └── useAIRecommendations.ts      # AI推荐功能Hook
└── README.md                       # 本文件
```

## 组件职责

### 主组件
- **AIFilterEditor.tsx**: 核心容器组件，负责状态管理、数据流协调和业务逻辑处理

### 面板组件
- **BasicFiltersPanel**: 处理基本筛选条件（职位、公司、关键词）的输入和管理
- **JobDescriptionPanel**: 职位描述的输入、模板选择和AI优化功能
- **TalentProfilePanel**: 人才画像的输入、模板选择和AI完善功能  
- **AIAssistantChat**: AI助手聊天功能，提供实时建议和互动
- **FilterCriteriaPanel**: AI筛选标准的生成和显示

### 自定义Hooks
- **useAIRecommendations**: 封装AI推荐相关的逻辑（职位推荐、公司推荐、OpenAI API调用）

## 重构优势

1. **模块化设计**: 每个组件职责单一，易于理解和维护
2. **代码复用**: 公共逻辑提取到Hook中，避免重复代码
3. **类型安全**: 完整的TypeScript类型定义
4. **易于测试**: 独立的组件便于单元测试
5. **团队协作**: 不同开发者可以同时维护不同的面板组件

## 数据流

```
AIFilterEditor (主状态管理)
    ↓ props
BasicFiltersPanel → onUpdate → updateBasicFilters
JobDescriptionPanel → onChange → setConfig
TalentProfilePanel → onChange → setConfig  
AIAssistantChat → onSendMessage → sendChatMessage
FilterCriteriaPanel → onGenerate → generateFilterCriteria

useAIRecommendations Hook
    ↓ 
AI API调用 → 聊天消息更新
```

## 使用方式

重构后的组件使用方式与原组件完全一致，只需要引入：

```tsx
import AIFilterEditor from './components/RuleEditor/AIFilterEditor';

// 使用
<AIFilterEditor />
```

## 开发指南

### 添加新面板
1. 在 `panels/` 目录下创建新组件
2. 定义清晰的Props接口
3. 在主组件中导入并使用
4. 更新此README文档

### 修改现有面板
1. 找到对应的面板组件文件
2. 修改组件逻辑，保持接口稳定
3. 如需修改接口，同时更新主组件

### 添加新Hook
1. 在 `hooks/` 目录下创建新Hook
2. 遵循React Hook命名规范 (use开头)
3. 在需要的组件中导入使用

这种结构让代码更易维护，也便于未来的功能扩展。 