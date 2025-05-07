# Boss直聘 Sourcing 智能助手

一个基于Chrome插件（Manifest V3）+ Next.js + Tailwind CSS + Zustand + DeepSeek API开发的智能招聘助手，帮助招聘人员高效筛选Boss直聘上的候选人。

## 技术栈

- **前端框架**：Next.js
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **AI 集成**：DeepSeek API
- **Chrome 扩展**：Manifest V3
- **模糊搜索**：Fuse.js
- **存储**：IndexedDB / Chrome Storage API

## 功能描述

### 核心功能

1. **数据采集**：
   - 从Boss直聘推荐榜单页面自动抓取简历数据
   - 支持详情页深度数据提取

2. **智能筛选**：
   - 自定义筛选规则（学历、学校、公司、岗位、关键词）
   - 支持AND/OR复杂逻辑
   - 可视化拖动规则编辑器
   - 自然语言生成筛选规则

3. **双模式操作**：
   - **人机混合校准模式**：HR手动标记简历，AI学习优化规则
   - **自动筛选模式**：自动筛选并打招呼

4. **AI增强**：
   - 简历详情页AI分析
   - 岗位匹配度评估
   - 潜在关键词自动提取
   - 基于人工标记数据学习并优化规则

5. **自动化操作**：
   - 满足条件的简历自动打招呼
   - 随机延迟与鼠标轨迹模拟（防封机制）

6. **数据与分析**：
   - 操作日志记录
   - 成功率数据统计
   - AI辅助规则优化建议

## 开发进度

- [x] 项目初始化与文档创建
- [x] 插件主结构搭建（background、content script、popup UI）
- [x] 简历数据采集逻辑（列表页与详情页）
- [x] 规则编辑器组件
- [x] 自然语言规则生成界面
- [x] 模式切换器与人工标记功能
- [x] 详情页数据提取与AI分析
- [x] 自动打招呼与防封机制
- [x] Zustand状态管理实现
- [x] 日志记录系统
- [ ] AI关键词提取与规则优化闭环（DeepSeek API集成）
- [ ] UI优化与主题切换完善

## 安装与开发

### 前提条件

- Node.js 16+
- npm 或 yarn

### 开发环境设置

1. 克隆仓库:

```bash
git clone <repository-url>
cd sourcing-copilot
```

2. 安装依赖:

```bash
npm install
```

3. 开发模式运行:

```bash
npm run dev
```

4. 构建Chrome扩展:

```bash
npm run build
```

构建完成后，`dist` 目录包含可加载到Chrome的扩展文件。

### 安装Chrome扩展

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启 "开发者模式"
3. 点击 "加载已解压的扩展程序"
4. 选择项目的 `dist` 目录

## 关键逻辑说明

### 1. 筛选引擎 (Rule Engine)

筛选引擎是核心组件，处理两种操作模式：
- 在校准模式下：记录人工判断结果，不执行自动操作
- 在自动模式下：应用规则进行筛选并自动打招呼

规则引擎支持复杂的条件组合（AND/OR逻辑），并可通过可视化编辑器调整。规则结构示例：

```json
{
  "operator": "AND",
  "conditions": [
    {
      "field": "education",
      "operator": "contains",
      "value": "本科"
    },
    {
      "operator": "OR",
      "conditions": [
        {
          "field": "company",
          "operator": "contains",
          "value": "阿里"
        },
        {
          "field": "company",
          "operator": "contains",
          "value": "腾讯"
        }
      ]
    }
  ]
}
```

### 2. 模式切换机制

通过统一的状态管理，系统可以无缝切换两种工作模式：
- **校准模式**：启用人工标记UI，收集数据用于AI学习
- **自动模式**：应用当前规则自动筛选和操作

切换逻辑通过Zustand状态控制所有依赖组件的行为变化。

### 3. 详情页AI分析逻辑

1. 列表页初步筛选通过的简历触发详情页访问
2. 详情页数据提取（完整工作经历、教育背景、项目经验等）
3. 数据传输至DeepSeek API进行深度分析
4. AI返回匹配度评分和关键词提取
5. 基于AI结果决定是否执行"打招呼"

### 4. 人机协作闭环

1. 校准模式下收集人工标记数据
2. 将标记数据传输给DeepSeek API学习
3. AI生成优化后的规则建议
4. 用户确认后更新现有规则
5. 切换至自动模式验证效果

## 配置文件

系统使用配置文件定义简历字段与页面元素的映射关系，支持动态更新：

```json
{
  "name": ".name",
  "education": "div.base-info.join-text-wrap",
  "experience": "div.base-info.join-text-wrap",
  "school": "div.timeline-wrap.edu-exps div.join-text-wrap",
  "company": "div.timeline-wrap.work-exps div.join-text-wrap",
  "position": "div.row.row-flex.geek-desc",
  "skills": "div.tags",
  "greetButton": "button.btn.btn-greet",
  "detailPage": {
    "container": "div.resume-detail-wrap",
    "workExperience": "div.geek-work-experience-wrap",
    "educationExperience": "div.geek-education-experience-wrap",
    "projectExperience": "div.geek-project-experience-wrap",
    "expectation": "div.geek-expect-wrap"
  }
}
```

## 后续开发计划

### 近期计划

1. DeepSeek API正式集成：替换当前的模拟AI响应
2. 云端数据同步：支持团队共享规则和标记数据
3. 高级筛选规则：支持更多复杂条件和权重设置
4. 性能优化：优化大量简历处理时的性能

### 长期规划

1. 支持更多招聘平台
2. 数据分析仪表板：提供更详细的招聘效果分析
3. 简历质量打分系统：AI评估简历整体质量
4. 求职者回复自动回复功能

## 贡献指南

欢迎提交问题和拉取请求。对于重大更改，请先开Issue讨论您想要更改的内容。

## 许可证

[MIT](LICENSE) 