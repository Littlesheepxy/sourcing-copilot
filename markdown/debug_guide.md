# Sourcing Copilot API调试指南

## 问题概述
目前系统中模拟数据（候选人管理和日志）可以正确显示在前端，但真实数据的API返回是空值。

## 问题分析

通过代码审查，我发现了以下可能的问题点：

### 1. 前后端数据流路径差异

系统存在两条数据获取路径：
- **模拟数据路径**：通过前端`web-app/app/api/candidates/shared-storage.ts`中的`generateSampleCandidates()`提供模拟数据
- **真实数据路径**：通过`automation/api/server.py`中的`get_candidates()`接口获取真实数据

### 2. 真实数据存储问题

真实候选人数据应存储在：
```
~/Library/Application Support/SourcingCopilot/candidates.json
```

API调用时会先尝试从此文件读取数据，如果失败则尝试从浏览器管理器获取。但有可能：
1. 该文件不存在
2. 文件格式不正确
3. 文件权限问题
4. 文件内容为空数组

### 3. 浏览器管理器回退机制

如果JSON文件读取失败，代码会尝试从`browser_manager.get_greeted_candidates()`获取候选人数据，但这依赖：
1. `self.resume_processor`是否已初始化
2. 候选人日志文件(`self.resume_processor.candidates_log`)是否存在及可读

## 调试步骤

### 1. 检查数据文件是否存在

```bash
ls -la ~/Library/Application\ Support/SourcingCopilot/
```

查看是否存在`candidates.json`文件及其权限。

### 2. 检查数据文件内容

```bash
cat ~/Library/Application\ Support/SourcingCopilot/candidates.json
```

检查文件内容是否为空数组`[]`或格式不正确。

### 3. 在后端API中添加调试日志

在`automation/api/server.py`的`get_candidates()`函数中添加详细日志：

```python
@app.get("/api/candidates")
async def get_candidates(limit: int = 100):
    """获取已打招呼的候选人列表"""
    try:
        # 首先尝试读取JSON格式的候选人数据
        json_file = os.path.expanduser("~/Library/Application Support/SourcingCopilot/candidates.json")
        print(f"DEBUG: 尝试读取候选人数据文件: {json_file}")
        print(f"DEBUG: 文件是否存在: {os.path.exists(json_file)}")
        
        if os.path.exists(json_file):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    candidates = json.load(f)
                
                print(f"DEBUG: 成功读取JSON文件，包含{len(candidates)}条记录")
                # 返回最新的limit条记录
                return {"success": True, "data": candidates[:limit]}
            except Exception as e:
                print(f"DEBUG: 读取JSON候选人数据失败: {e}")
        
        # 如果JSON文件不存在或读取失败，尝试从浏览器管理器获取数据
        print(f"DEBUG: 尝试从浏览器管理器获取候选人数据")
        print(f"DEBUG: browser_manager已初始化: {browser_manager is not None}")
        print(f"DEBUG: resume_processor已初始化: {browser_manager.resume_processor is not None if browser_manager else False}")
        
        candidates = browser_manager.get_greeted_candidates(limit)
        print(f"DEBUG: 从浏览器管理器获取到{len(candidates)}条候选人记录")
        return {"success": True, "data": candidates}
    except Exception as e:
        print(f"DEBUG: 获取候选人数据失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}
```

### 4. 在前端添加详细日志输出

在`web-app/lib/api-service.ts`中的`request`方法中增加更详细的调试信息：

```typescript
private async request<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<ApiResponse<T>> {
  try {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`DEBUG: 开始API请求: ${method} ${url}`);
    
    // ... 现有代码 ...
    
    const response = await fetch(url, options);
    console.log(`DEBUG: 收到响应状态: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type');
    console.log(`DEBUG: 响应内容类型: ${contentType}`);
    
    let result: any;
    
    if (contentType?.includes('application/json')) {
      result = await response.json();
      console.log(`DEBUG: API JSON响应:`, result);
      
      // 检查数据结构
      if (result.data) {
        console.log(`DEBUG: 响应包含data字段，类型: ${Array.isArray(result.data) ? 'Array' : typeof result.data}`);
        if (Array.isArray(result.data)) {
          console.log(`DEBUG: 数组长度: ${result.data.length}`);
        }
      } else {
        console.log(`DEBUG: 响应不包含data字段!`);
      }
      
      // ... 现有代码 ...
    }
  } catch (error) {
    // ... 现有代码 ...
  }
}
```

### 5. 检查API连接配置

确认前端的API基础URL配置是否正确，在`web-app/lib/api-service.ts`中:

```typescript
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  // ...
};
```

确保服务器正在运行在正确的端口上，并且前端能够连接到这个地址。

### 6. 检查浏览器管理器的初始化

确保`browser_manager`正确初始化，在`automation/api/server.py`中应检查：

```python
# 全局实例
browser_manager = BrowserManager()
```

如果浏览器管理器未正确初始化，那么`browser_manager.get_greeted_candidates()`可能会返回空列表。

### 7. 手动创建测试数据

如果上述步骤无法解决问题，可以尝试手动创建测试数据文件：

```bash
mkdir -p ~/Library/Application\ Support/SourcingCopilot/

cat > ~/Library/Application\ Support/SourcingCopilot/candidates.json << 'EOF'
[
  {
    "id": "test_1",
    "name": "测试用户1",
    "education": "本科",
    "experience": "3年",
    "skills": ["测试", "调试"],
    "createdAt": "2023-10-10T10:10:10Z"
  }
]
EOF
```

然后刷新前端页面，检查是否能正确显示数据。

## 可能的解决方案

1. 确保`candidates.json`文件存在且有正确的数据格式
2. 确保API服务器正确运行在设置的端口上
3. 确保前端的API基础URL配置正确指向API服务器
4. 确保浏览器管理器正确初始化并且已经处理了一些候选人数据
5. 考虑添加额外的错误处理和日志记录，以便更好地诊断问题 