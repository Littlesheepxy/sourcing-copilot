# 候选人管理页面公司信息显示优化

## 问题描述
前端候选人管理页面中的公司列显示不准确，显示为一大串内容。经过分析发现，后端将多个公司信息使用分号（`;`）连接成字符串存储，但前端没有对这种格式进行处理。

## 问题根源
1. 后端在 `automation/processors/logging_helper.py` 第134-138行将公司数组转换为字符串：
```python
if isinstance(candidate_data["company"], list):
    company_str = "; ".join([str(c) for c in candidate_data["company"] if c])
```

2. 前端在 `web-app/app/candidates/page.tsx` 中直接显示这个字符串，没有进行格式化处理。

## 解决方案
修改前端候选人管理页面(`web-app/app/candidates/page.tsx`)，在两个地方添加公司信息格式化逻辑：

### 1. 候选人列表表格中的公司列
- 检测包含分号的公司字符串
- 将其拆分为数组并清理空白字符
- 显示前2个公司，如果超过2个则显示"+X 更多"
- 添加鼠标悬停工具提示显示完整公司列表

### 2. 候选人详情模态框中的公司信息
- 应用相同的格式化逻辑
- 在详情页显示所有公司，每个公司占一行

## 修改内容

### 表格中的公司列显示
```javascript
{(() => {
  const company = candidate.company || '未知公司';
  // 如果公司信息包含分号分隔的多个公司，进行格式化处理
  if (company.includes(';')) {
    const companies = company.split(';').map(c => c.trim()).filter(c => c);
    if (companies.length > 1) {
      return (
        <div className="space-y-1 relative group">
          {companies.slice(0, 2).map((comp, index) => (
            <div key={index} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {comp}
            </div>
          ))}
          {companies.length > 2 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{companies.length - 2} 更多
            </div>
          )}
          {/* 工具提示：显示完整公司列表 */}
          <div className="absolute z-10 invisible group-hover:visible bg-black text-white text-xs rounded py-2 px-3 -top-2 left-full ml-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="space-y-1">
              {companies.map((comp, index) => (
                <div key={index}>• {comp}</div>
              ))}
            </div>
            <div className="absolute -left-1 top-3 w-2 h-2 bg-black transform rotate-45"></div>
          </div>
        </div>
      );
    }
  }
  return company;
})()}
```

### 详情模态框中的公司信息
```javascript
{(() => {
  const company = selectedCandidate.company || '未知';
  // 如果公司信息包含分号分隔的多个公司，进行格式化处理
  if (company.includes(';')) {
    const companies = company.split(';').map(c => c.trim()).filter(c => c);
    if (companies.length > 1) {
      return (
        <div className="space-y-1">
          {companies.map((comp, index) => (
            <div key={index} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {comp}
            </div>
          ))}
        </div>
      );
    }
  }
  return company;
})()}
```

## 测试
创建了测试页面 `test-company-format.html` 来验证格式化逻辑的正确性，包含以下测试用例：
- 单个公司
- 两个公司（分号分隔）
- 多个公司（分号分隔）
- 包含空格的公司
- 未知公司
- 空值

## 效果
修改后的页面将：
1. 正确显示多个公司信息，每个公司显示为独立的标签
2. 在表格中限制显示前2个公司，避免占用过多空间
3. 提供鼠标悬停工具提示查看完整公司列表
4. 在详情页显示完整的公司列表
5. 保持暗色模式兼容性

## 兼容性
- 向后兼容：对于单个公司或不包含分号的字符串，保持原有显示方式
- 处理边界情况：空值、未知公司等特殊情况
- 支持暗色主题 