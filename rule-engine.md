# Boss直聘 Sourcing智能助手 - 规则引擎说明文档

## 规则引擎概述

规则引擎是Boss直聘Sourcing智能助手的核心组件，负责根据预设规则对候选人进行智能筛选和评分。项目中实现了两套规则引擎系统：一套是基于权重的评分规则引擎（FilterEngine），另一套是基于条件组合的逻辑规则引擎（RulesEvaluator）。两种规则引擎系统各自适用于不同的筛选场景。

## 已集成的规则引擎

规则引擎已经集成到项目中的以下位置：

1. **权重评分规则引擎**：位于 `shared/core/rules-engine/filter-engine.ts`
2. **逻辑条件规则引擎**：
   - 评估器: `shared/core/rules-engine/evaluator.ts`
   - 类型定义: `shared/core/rules-engine/types.ts`
   - 规则生成器: `shared/core/rules-engine/builder.ts`
3. **前端集成**：
   - 后台服务: `extension/background/index.ts`
   - 规则编辑UI: `extension/modal/rule-modal.html` 和 `extension/dist/modal/rule-modal.js`

## ⚠️ 规则引擎实现不一致问题

**警告**：目前，规则引擎的两种实现之间存在不一致的问题。

### 不一致问题详情

1. **UI与后端逻辑不匹配**：
   - 当前规则编辑器弹窗 (`extension/modal/rule-modal.html`) 实现的是通用的逻辑条件规则引擎UI
   - 它支持的是通用字段、条件操作符和值的设置，没有特定的规则类型和权重设定
   - 但后端 (`shared/core/rules-engine/filter-engine.ts`) 实现的是特定的权重评分规则引擎

2. **缺失的特定规则类型**：
   - 当前规则编辑器没有体现出权重评分规则引擎支持的特定规则类型：
     - 岗位（硬条件）
     - 公司（包含竞对公司）
     - 关键词（技能关键词）
     - 学校（优先考虑）
     - 学历

3. **缺少权重设置**：
   - 当前规则编辑器没有权重设置功能，而权重是权重评分引擎的核心

4. **数据结构差异**：
   - 逻辑条件规则引擎使用的是通用的条件和规则组结构
   - 权重评分规则引擎使用的是特定的规则类型和权重结构

## 两种规则引擎对比

### 1. 权重评分规则引擎 (FilterEngine)

该规则引擎基于加权评分系统，适用于需要综合考量多个因素并给出分数的场景。

**核心特点**：
- 支持规则权重设置（0-100）
- 按规则顺序依次评估
- 支持硬性条件（必须满足）和软性条件（加权计算）
- 最终给出0-100的综合评分
- 支持人工校准/自动筛选两种模式

**适用场景**：
- 需要进行评分筛选的情况
- 需要多维度综合评估的场景
- 有优先级区分的筛选规则

### 2. 逻辑条件规则引擎 (RulesEvaluator)

该规则引擎基于布尔逻辑，适用于需要精确定义复杂逻辑条件组合的场景。

**核心特点**：
- 支持复杂逻辑条件组合（AND/OR嵌套）
- 每个条件返回布尔值（匹配/不匹配）
- 支持多种比较操作符（等于、包含、正则匹配等）
- 支持条件组的嵌套（构建复杂逻辑树）
- 提供详细的匹配/不匹配信息

**适用场景**：
- 需要精确定义复杂筛选逻辑的场景
- 需要构建决策树的场景
- 规则编辑器UI界面的后端支持

## 当前规则编辑器UI的实现

当前的规则编辑器UI实现在`extension/modal/rule-modal.html`和`extension/dist/modal/rule-modal.js`中，具有以下特点：

1. **通用字段选择**：
   ```javascript
   const fieldOptions = [
     {value: "education", label: "学历"},
     {value: "school", label: "学校"},
     {value: "company", label: "公司"},
     {value: "position", label: "岗位"},
     {value: "experience", label: "经验年限"},
     {value: "skills", label: "技能标签"}
   ]
   ```

2. **通用条件操作符**：
   ```javascript
   const operatorOptions = [
     {value: ConditionOperator.CONTAINS, label: "包含"},
     {value: ConditionOperator.EQUALS, label: "等于"},
     {value: ConditionOperator.NOT_EQUALS, label: "不等于"},
     {value: ConditionOperator.STARTS_WITH, label: "开头是"},
     {value: ConditionOperator.ENDS_WITH, label: "结尾是"},
     {value: ConditionOperator.GREATER_THAN, label: "大于"},
     {value: ConditionOperator.LESS_THAN, label: "小于"},
     {value: ConditionOperator.REGEX, label: "正则匹配"}
   ]
   ```

3. **逻辑操作符**：
   ```javascript
   const LogicalOperator = {
     AND: "AND", 
     OR: "OR"
   }
   ```

4. **没有权重设置界面**：当前UI没有实现权重配置功能，仅支持逻辑条件的配置。

## 设计原则

1. **可配置性**：支持自定义规则、权重和阈值
2. **透明度**：筛选过程和评分细节可追踪和解释
3. **自适应**：根据人工反馈持续优化规则
4. **高效性**：快速处理大量候选人数据

## 权重评分规则引擎详解

权重评分规则引擎支持以下五种基本规则类型：

| 规则类型 | 说明 | 优先级 | 评估方式 |
|---------|------|-------|---------|
| 岗位(POSITION) | 职位名称匹配度 | 最高 | 硬性条件，不匹配直接拒绝 |
| 公司(COMPANY) | 工作经历中的公司背景 | 高 | 按公司类型(目标/竞对/普通)不同权重 |
| 关键词(KEYWORD) | 技能和经验关键词 | 中高 | 关键词匹配度计算 |
| 学校(SCHOOL) | 教育背景中的学校 | 中 | 是否匹配目标学校列表 |
| 学历(EDUCATION) | 最高学历要求 | 中低 | 是否达到要求的学历水平 |

### 工作流程

1. **规则优先级评估**：
   - 首先检查岗位规则(硬性条件)
   - 不满足岗位条件直接拒绝
   - 满足后按规则顺序依次评估其他规则

2. **评分计算逻辑**：
   - 每条规则根据权重贡献分数
   - 最终得分 = (各规则得分之和 / 总权重) * 100
   - 得分范围：0-100分

3. **决策逻辑**：
   - 人工校准模式：显示评分，等待人工决策
   - 自动筛选模式：根据阈值自动决定打招呼或跳过

### 规则定义示例

```typescript
// 规则结构
interface Rule {
  id: string;           // 规则ID
  type: RuleType;       // 规则类型
  name: string;         // 规则名称
  weight: number;       // 权重 (0-100)
  enabled: boolean;     // 是否启用
  order: number;        // 顺序
  items?: string[];     // 对于公司和关键词，可以有多个项目
  threshold?: number;   // 阈值 (对于某些规则)
}
```

## 逻辑条件规则引擎详解

逻辑条件规则引擎基于条件和规则组的概念：

### 条件类型

```typescript
// 条件操作符枚举
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  REGEX = 'regex',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists'
}

// 条件定义
export interface Condition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  enabled: boolean;
}
```

### 规则组结构

```typescript
// 逻辑操作符枚举
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR'
}

// 规则组定义
export interface RuleGroup {
  id: string;
  operator: LogicalOperator;
  conditions: (Condition | RuleGroup)[];
  enabled: boolean;
}
```

### 当前规则可视化编辑器

项目集成了规则可视化编辑器（`extension/modal/rule-modal.html`），提供的界面主要支持逻辑条件规则引擎：

- 支持拖拽操作
- 支持添加/删除条件
- 支持嵌套条件组
- 支持规则导入/导出
- 支持AI辅助生成规则
- 支持规则测试

**但缺少权重评分规则引擎所需的UI组件**：
- 没有专门的规则类型选择
- 没有规则权重设置界面
- 没有规则优先级/顺序调整
- 没有自动打招呼阈值设置

## 改进建议

为解决规则引擎实现不一致的问题，建议采取以下措施：

1. **更新规则编辑器UI**：
   - 添加规则类型选择（岗位、公司、关键词等）
   - 添加权重设置滑块（0-100）
   - 实现规则拖拽排序功能
   - 添加阈值设置界面

2. **规则适配器实现**：
   - 在`extension/dist/modal/rule-modal.js`中添加规则数据结构转换功能
   - 将通用逻辑条件规则结构转换为权重评分规则结构
   - 在保存前进行数据结构转换

3. **统一API接口**：
   - 统一两种规则引擎的外部接口
   - 使用适配器模式进行内部转换

## 实现细节

### 权重评分规则引擎

```typescript
// 评估候选人
evaluateCandidate(candidate: CandidateData): FilterResult {
  // 对规则按顺序排序
  const sortedRules = [...this.config.rules]
    .filter(rule => rule.enabled)
    .sort((a, b) => a.order - b.order);
  
  // 首先检查岗位是否匹配（硬条件）
  const positionRule = sortedRules.find(r => r.type === RuleType.POSITION);
  if (positionRule) {
    const positionMatched = this.checkPositionMatch(candidate.position, this.config.positionKeywords);
    
    // 如果岗位不匹配且是硬条件，则直接拒绝
    if (!positionMatched) {
      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        score: 0,
        matchDetails: [/* ... */],
        action: 'skip',
        timestamp: Date.now()
      };
    }
  }
  
  // 评估其他规则...
  
  // 计算最终得分
  const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  
  // 决定行动
  let action: FilterResult['action'] = 'skip';
  if (this.config.mode === 'auto') {
    // 自动模式下，根据阈值决定是否打招呼
    action = finalScore >= this.config.autoGreetThreshold ? 'greet' : 'skip';
  } else {
    // 人工校准模式
    action = 'manual';
  }
  
  return { /* 结果 */ };
}
```

### 逻辑条件规则引擎

```typescript
// 评估规则组
evaluateRules(context: EvaluationContext, rules: RuleGroup): EvaluationResult {
  if (!rules.enabled) {
    return { matched: false, matchedConditions: [], unmatchedConditions: [] };
  }
  
  const matchedConditions: string[] = [];
  const unmatchedConditions: string[] = [];
  
  // 如果没有条件，默认为true
  if (!rules.conditions || rules.conditions.length === 0) {
    return { matched: true, matchedConditions, unmatchedConditions };
  }
  
  const results = rules.conditions.map(condition => {
    const matched = this.evaluateCondition(context, condition);
    
    if (matched) {
      if ('field' in condition) {
        matchedConditions.push(condition.id);
      }
    } else {
      if ('field' in condition) {
        unmatchedConditions.push(condition.id);
      }
    }
    
    return matched;
  });
  
  // 根据逻辑运算符计算最终结果
  const matched = rules.operator === LogicalOperator.AND
    ? results.every(Boolean)
    : results.some(Boolean);
  
  return { matched, matchedConditions, unmatchedConditions };
}
```

## 实际使用场景

1. **人工校准模式**：
   - 使用权重评分规则引擎评估候选人
   - 显示评分和匹配详情
   - 人工决定是否打招呼
   - 记录人工决策结果，用于AI学习

2. **自动筛选模式**：
   - 使用权重评分规则引擎评估候选人
   - 基于设定的阈值自动决策
   - 自动执行对应操作（打招呼/跳过）

3. **规则编辑器**：
   - 使用逻辑条件规则引擎构建复杂条件
   - 提供可视化界面编辑规则
   - 支持导入/导出和测试功能

## 规则引擎集成入口

项目中的规则引擎集成在以下几个主要入口：

1. **扩展后台脚本**：
   ```typescript
   // extension/background/index.ts
   import { RulesEvaluator } from '../../shared/core/rules-engine/evaluator';
   
   // 初始化规则引擎
   const rulesEvaluator = new RulesEvaluator();
   
   // 处理评估请求
   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
     if (message.type === 'evaluateResume') {
       try {
         const result = rulesEvaluator.evaluateRules(
           { data: message.resumeData },
           message.rules
         );
         sendResponse({ result });
       } catch (error) {
         sendResponse({ error: error.message });
       }
       return true;
     }
     // ...
   });
   ```

2. **规则编辑器 UI**：
   ```javascript
   // extension/dist/modal/rule-modal.js
   function handleTestRules() {
     const testData = testDataInput.value.trim();
     if (testData) {
       try {
         const data = JSON.parse(testData);
         // 发送消息给后台脚本评估规则
         const result = await chrome.runtime.sendMessage({
           type: "evaluateRules",
           rules: currentRules,
           data: data
         });
         // 显示结果...
       } catch (error) {
         // 处理错误...
       }
     }
   }
   ```

## 结语

规则引擎是Boss直聘Sourcing智能助手的核心，虽然当前存在两种实现不一致的问题，但通过适当的改进和适配可以解决这一问题。规则引擎的两种实现各有优势，一起使用可以提供更灵活的筛选功能，满足不同场景下的需求。 