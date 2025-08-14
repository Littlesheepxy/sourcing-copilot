# AI服务配置说明

## 当前状态（企业版）

当前系统配置为企业版模式，AI服务已预配置为使用OpenAI GPT-4o模型，用户无法修改AI配置。

### 配置详情

- **AI服务提供商**: OpenAI
- **AI模型**: GPT-4o
- **API密钥**: 企业级预配置
- **配置权限**: 只读（不可编辑）

### 功能特性

✅ 智能简历分析  
✅ AI对话助手  
✅ 自动化筛选  
✅ 智能推荐  

## 商业化配置

当需要开放AI配置编辑功能时，可以通过以下方式启用：

### 1. 环境变量控制

在 `.env.local` 文件中设置：

```bash
# 启用AI配置编辑
NEXT_PUBLIC_ENABLE_AI_CONFIG_EDIT=true

# 设置内部API密钥（可选）
NEXT_PUBLIC_INTERNAL_OPENAI_API_KEY=your-actual-api-key
```

### 2. 代码修改

在 `lib/config.ts` 中修改 `isAiConfigEditable` 函数：

```typescript
export function isAiConfigEditable(): boolean {
  // 检查环境变量
  if (process.env.NEXT_PUBLIC_ENABLE_AI_CONFIG_EDIT === 'true') {
    return true;
  }
  
  // 或者根据用户订阅状态判断
  // return userSubscription?.plan === 'premium';
  
  return false;
}
```

### 3. 用户界面变更

当启用编辑功能后，设置页面的AI配置部分将：

- 显示可编辑的输入框
- 允许用户选择不同的AI服务提供商
- 支持自定义API密钥输入
- 提供模型版本选择

## 安全注意事项

1. **API密钥安全**: 确保生产环境中的API密钥通过安全的方式设置
2. **权限控制**: 考虑基于用户角色或订阅状态控制配置权限
3. **使用监控**: 监控API使用量和成本
4. **备用方案**: 为不同用户群体提供不同的AI服务等级

## 文件结构

```
web-app/
├── lib/config.ts              # 配置管理核心文件
├── hooks/useConfig.ts         # React配置钩子
├── app/settings/page.tsx      # 设置页面
├── components/ConfigStatus.tsx # 配置状态组件
└── AI_CONFIG_README.md        # 本说明文档
```

## 系统配置说明

### 自动模式
- **状态**: 固定启用
- **说明**: 系统默认启用自动模式，无需用户配置

### 扫描间隔
- **策略**: 智能随机间隔
- **说明**: 后端使用随机值策略，前端不提供配置选项

### 每日处理量
- **配置**: 用户可调整（10-200人/天）
- **默认值**: 50人/天
- **说明**: 唯一可配置的系统参数

## 更新历史

- **v1.0**: 初始企业版配置，固定使用OpenAI GPT-4o
- **v1.1**: 简化系统配置，固定自动模式和智能扫描策略
- **未来**: 计划支持多AI服务商和用户自定义配置 