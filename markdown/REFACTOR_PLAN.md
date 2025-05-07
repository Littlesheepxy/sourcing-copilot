# Boss直聘 Sourcing智能助手 - 重构方案

## 一、项目背景与目标

### 现状分析
目前我们有两套功能相似但代码分离的系统：
1. **Web管理后台**：基于Next.js + Tailwind CSS + Zustand开发的管理界面
2. **Chrome插件**：基于Manifest V3的浏览器扩展

### 重构目标
建立一个统一的代码架构，实现核心功能的代码共享，同时保持UI的独立适配，以便于：
1. 功能一致性保障
2. 减少维护成本
3. 加速新功能开发
4. 提高代码质量

## 二、架构设计

### 1. 整体架构

采用"共享核心+差异化UI"的分层架构：

```
sourcing-copilot/
├── shared/                      # 共享代码
│   ├── core/                    # 核心业务逻辑
│   │   ├── rules-engine/        # 规则引擎
│   │   ├── ai-service/          # AI服务调用
│   │   └── data-processor/      # 数据处理
│   ├── hooks/                   # 共享React Hooks
│   ├── utils/                   # 通用工具函数
│   └── types/                   # TypeScript类型定义
│
├── web-app/                     # Web应用
│   ├── app/                     # Next.js页面
│   ├── components/              # Web专用组件
│   │   ├── layout/              # 布局组件
│   │   └── ui/                  # UI组件
│   ├── store/                   # Web端状态管理
│   │   └── adapters/            # Web存储适配器
│   └── public/                  # 静态资源
│
├── extension/                   # Chrome插件
│   ├── sidebar/                 # 侧边栏应用
│   │   ├── components/          # 侧边栏UI组件
│   │   └── styles/              # 侧边栏样式
│   ├── popup/                   # 弹出窗口
│   ├── store/                   # 插件状态管理
│   │   └── adapters/            # Chrome存储适配器
│   ├── content-scripts/         # 内容脚本
│   ├── background/              # 后台脚本
│   ├── manifest.json            # 插件配置
│   └── icons/                   # 插件图标
│
├── packages/                    # 抽象的功能包
│   ├── store-factory/           # 状态管理工厂
│   └── ui-components/           # 通用UI组件库
│
└── scripts/                     # 构建脚本
    ├── build-web.js             # Web构建脚本
    └── build-extension.js       # 插件构建脚本
```

## 三、重构进度

### 阶段1：基础架构搭建 (已完成)
- [x] 创建项目文件夹结构
- [x] 设置TypeScript类型定义
- [x] 创建通用工具函数
- [x] 设置构建脚本

### 阶段2：共享核心代码实现 (已完成)
- [x] 规则引擎模块
  - [x] 类型定义
  - [x] 规则评估器
  - [x] 规则生成器
- [x] AI服务模块
  - [x] 类型定义
  - [x] AI服务客户端
- [x] 数据处理模块
  - [x] 类型定义
  - [x] 简历提取器
  - [x] 数据转换器
- [x] 状态管理工厂
  - [x] 类型定义
  - [x] 创建存储函数
- [x] 通用Hook实现
  - [x] 规则钩子
  - [x] AI聊天钩子

### 阶段3：Web应用迁移 (待开始)
- [ ] 迁移页面结构
- [ ] 适配UI组件
- [x] 实现Web存储适配器
- [ ] 测试Web应用功能

### 阶段4：Chrome扩展迁移 (待开始)
- [ ] 实现侧边栏应用
- [ ] 适配内容脚本
- [x] 实现Chrome存储适配器
- [ ] 完善Manifest配置
- [ ] 测试扩展功能

### 阶段5：集成测试与优化 (待开始)
- [ ] 端到端测试
- [ ] 性能优化
- [ ] 代码质量检查
- [ ] 文档完善

## 四、下一步计划

1. 迁移Web应用组件，将现有的RuleEditor和AIChat组件适配到新架构
2. 实现Chrome扩展的侧边栏UI，以及简历数据提取功能
3. 完善构建和发布流程
4. 编写测试用例和文档 