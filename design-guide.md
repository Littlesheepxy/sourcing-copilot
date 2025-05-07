# Sourcing Copilot 设计风格指南

## 设计系统概览

Sourcing Copilot采用现代、简洁且专业的设计风格，融合了以下关键元素：

### 色彩系统

- **主色调**：蓝紫色系 (#3f51b5 至 #303f9f)
- **强调色**：
  - 蓝色：#3b82f6 (用于按钮、链接等交互元素)
  - 紫色：用于图标背景
  - 红色：#f44336 (用于警告和删除操作)
- **渐变色**：from-blue-500 via-purple-500 to-pink-500 (用于品牌标识和特殊元素)
- **暗色模式**：深色背景为 #1e293b (slate-900)，组件背景为 #334155 (slate-800)

### 排版

- **字体家族**：-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
- **字重使用**：
  - 标题：font-bold
  - 副标题：font-medium
  - 正文：font-normal
- **大小规范**：
  - 大标题：text-3xl (1.875rem)
  - 副标题：text-2xl (1.5rem)
  - 组件标题：text-lg (1.125rem)
  - 正文：text-sm (0.875rem) 到 text-base (1rem)

### 间距和布局

- **卡片间距**：gap-4 (1rem) 或 gap-6 (1.5rem)
- **内边距**：
  - 容器：p-4 (1rem) 到 p-6 (1.5rem)
  - 按钮：px-4 py-2 (水平1rem，垂直0.5rem)
- **边框圆角**：rounded-lg (0.5rem) 或 rounded-xl (0.75rem)
- **阴影样式**：shadow-sm

### 组件样式

#### 卡片

```css
bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
```

#### 按钮

- **主按钮**：
```css
bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md
```

- **次级按钮**：
```css
bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md
```

- **危险按钮**：
```css
bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md
```

#### 导航项

```css
flex items-center px-3 py-2 rounded-md text-sm font-medium
```

**激活状态**：
```css
bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300
```

**非激活状态**：
```css
text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60
```

### 动画

使用Framer Motion库添加细腻的动画效果：
- 悬停缩放 `whileHover={{ scale: 1.03 }}`
- 点击反馈 `whileTap={{ scale: 0.97 }}`
- 图标旋转 `whileHover={{ rotate: 5 }}`
- 渐入动画 `variants={cardVariants}` 配合stagger效果

### 图标系统

使用Lucide React图标库，保持一致的图标风格:
- 大小一般为 `w-5 h-5`
- 圆形图标背景使用 `rounded-full p-2 bg-[color]-100 dark:bg-[color]-900/30 text-[color]-600 dark:text-[color]-400`

## 框架和技术栈

- **UI框架**：React + Next.js
- **样式系统**：Tailwind CSS
- **动画库**：Framer Motion
- **图标库**：Lucide React
- **主题系统**：next-themes (支持亮色/暗色模式)

## 设计原则

1. **一致性**：在整个应用中保持视觉语言一致
2. **响应式**：适应不同屏幕尺寸
3. **无障碍**：考虑色彩对比度和键盘导航
4. **层次感**：通过大小、色彩和间距创建清晰的视觉层次
5. **微交互**：使用细腻的动画提升用户体验 