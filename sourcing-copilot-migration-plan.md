# Sourcing Copilot 浏览器插件迁移至Python桌面应用计划

## 项目概述

将Boss直聘Sourcing智能助手从Chrome浏览器插件转换为Python+Electron桌面应用，保留自动化操作功能，同时通过Web界面提供配置管理。最终打包为macOS DMG安装包分发。

## 详细架构设计

```
Sourcing Copilot/
├── web-app/                # Next.js前端
│   └── app/                # 页面和组件
├── automation/             # Python自动化模块
│   ├── browser_control/    # 浏览器控制
│   ├── rules_engine/       # 规则引擎
│   ├── processors/         # 页面处理器
│   └── api/                # FastAPI服务
├── electron/               # Electron打包
└── shared/                 # 共享类型和接口
```

## 现有代码分析与迁移计划

### 1. 浏览器自动化模块

#### 现有代码分析
- **文件:** `extension/content-scripts/modules/page-detector.ts`
- **功能:** 检测页面类型（推荐列表页/简历详情页）
- **关键实现:**
  - URL模式匹配
  - DOM结构识别

#### Python迁移方案
- 使用Playwright或Selenium实现浏览器控制
- 创建`automation/browser_control/page_detector.py`模拟现有功能:

```python
class PageDetector:
    def is_recommend_list_page(self, url):
        return 'zhipin.com/web/chat/recommend' in url or 'zhipin.com/boss/recommend' in url
        
    def is_resume_detail_page(self, url):
        return 'zhipin.com/geek/new/resumeDetail' in url or 'zhipin.com/web/geek/detail' in url
        
    def get_current_page_type(self, url):
        if self.is_recommend_list_page(url):
            return 'recommend'
        elif self.is_resume_detail_page(url):
            return 'detail'
        return 'unknown'
```

### 2. 数据提取模块

#### 现有代码分析
- **文件:** `extension/content-scripts/modules/data-extractor.ts`
- **功能:** 从页面提取简历数据
- **关键实现:**
  - 使用选择器从DOM提取数据
  - 处理多种文本格式

#### Python迁移方案
- 使用Playwright的选择器API提取页面数据
- 创建`automation/processors/data_extractor.py`:

```python
class DataExtractor:
    def extract_resume_card_data(self, page, selectors):
        data = {'id': self._generate_card_id(page)}
        
        # 提取姓名
        data['name'] = self._extract_element_text(page, [
            selectors.get('name'),
            '.name', 
            '.candidate-name',
            '.geek-name'
        ])
        
        # 提取其他字段
        # ...省略其他字段
        
        return data
        
    def extract_detail_page_data(self, page, selectors):
        # 从详情页提取完整数据
        # ...省略实现
        return data
        
    def _extract_element_text(self, page, selectors):
        for selector in selectors:
            if not selector:
                continue
            try:
                element = page.query_selector(selector)
                if element:
                    return element.text_content().strip()
            except:
                pass
        return ""
```

### 3. 规则引擎模块

#### 现有代码分析
- **文件:** `shared/core/rules-engine/simple-rules-engine.ts`
- **功能:** 基于规则评估简历
- **关键实现:**
  - 规则类型（岗位、公司、关键词等）
  - 评分机制
  - 决策树结构

#### Python迁移方案
- 完整迁移现有规则引擎逻辑到Python
- 创建`automation/rules_engine/simple_rules_engine.py`:

```python
from enum import Enum
import uuid
from thefuzz import fuzz  # Python模糊匹配库

class SimpleRuleType(str, Enum):
    POSITION = "岗位"
    COMPANY = "公司"
    KEYWORD = "岗位核心关键词"
    SCHOOL = "学校"
    EDUCATION = "学历"

class ImportanceLevel(int, Enum):
    NOT_IMPORTANT = 25
    NORMAL = 50
    IMPORTANT = 75
    VERY_IMPORTANT = 100

class SimpleRulesEngine:
    def create_default_config(self):
        return {
            "rules": [
                {
                    "id": str(uuid.uuid4()),
                    "type": SimpleRuleType.POSITION,
                    "keywords": ["前端开发", "前端工程师"],
                    "importance": ImportanceLevel.VERY_IMPORTANT,
                    "mustMatch": True,
                    "enabled": True,
                    "order": 0
                },
                # 省略其他默认规则
            ],
            "autoMode": False
        }
    
    def evaluate_candidate(self, candidate, config):
        # 完整实现评估逻辑
        # ...省略具体实现
        
        return result
        
    def _match_rule(self, candidate, rule):
        # 实现规则匹配算法
        matched = False
        matched_keywords = []
        
        # 根据规则类型选择不同的匹配源
        if rule["type"] == SimpleRuleType.POSITION:
            source = candidate.get("position", "")
        elif rule["type"] == SimpleRuleType.COMPANY:
            source = candidate.get("company", [])
        # ...其他规则类型
        
        # 实现模糊匹配
        # ...
        
        return {"matched": matched, "matchedKeywords": matched_keywords}
```

### 4. 自动化操作模块

#### 现有代码分析
- **文件:** `extension/content-scripts/modules/resume-processor.ts`
- **功能:** 处理简历卡片和详情页
- **关键实现:**
  - 点击操作和表单填充
  - 页面滚动和元素等待
  - 模拟人工操作延迟

#### Python迁移方案
- 使用Playwright的操作API模拟用户行为
- 创建`automation/processors/resume_processor.py`:

```python
import random
import asyncio

class ResumeProcessor:
    def __init__(self, browser, rules_engine):
        self.browser = browser
        self.rules_engine = rules_engine
        self.is_processing = False
        
    async def process_recommend_list_page(self, page, selectors):
        # 设置处理状态
        self.is_processing = True
        
        try:
            # 查找推荐卡片
            resume_cards = await page.query_selector_all(selectors["resumeCard"])
            
            # 处理每个卡片
            for i, card in enumerate(resume_cards):
                if not self.is_processing:
                    break
                    
                # 处理单个卡片
                await self.process_resume_card(page, card, selectors)
                
                # 随机延迟模拟人工操作
                await asyncio.sleep(random.uniform(1.5, 3.0))
                
                # 每处理几个卡片滚动页面
                if (i + 1) % 2 == 0:
                    await page.evaluate("window.scrollBy(0, 300)")
                    
        finally:
            self.is_processing = False
            
    async def process_resume_card(self, page, card, selectors):
        # 实现卡片处理逻辑
        # ...省略具体实现
        pass
        
    async def greet_candidate(self, button, resume_data):
        # 模拟点击打招呼按钮
        await button.click()
        
        # 实现打招呼逻辑
        # ...省略具体实现
        pass
```

### 5. FastAPI后端服务

#### 服务设计
- **文件:** `automation/api/server.py`
- **功能:** 提供REST API管理规则和自动化操作
- **端点列表:**
  - `/api/config` - 获取和保存规则配置
  - `/api/automation/start` - 启动自动化操作
  - `/api/automation/stop` - 停止自动化操作
  - `/api/status` - 获取当前状态

#### 实现方案

```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import os
import json
from automation.browser_control.browser_manager import BrowserManager
from automation.rules_engine.simple_rules_engine import SimpleRulesEngine

app = FastAPI()
browser_manager = BrowserManager()
rules_engine = SimpleRulesEngine()

CONFIG_PATH = os.path.expanduser("~/Library/Application Support/SourcingCopilot/config.json")

class RulesConfig(BaseModel):
    rules: list
    autoMode: bool

@app.get("/api/config")
async def get_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    # 返回默认配置
    return rules_engine.create_default_config()

@app.post("/api/config")
async def save_config(config: RulesConfig):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config.dict(), f, ensure_ascii=False, indent=2)
    return {"success": True}

@app.post("/api/automation/start")
async def start_automation(background_tasks: BackgroundTasks):
    # 启动浏览器并开始自动化任务
    background_tasks.add_task(browser_manager.start_automation)
    return {"success": True, "message": "自动化任务已启动"}

@app.post("/api/automation/stop")
async def stop_automation():
    # 停止自动化任务
    browser_manager.stop_automation()
    return {"success": True, "message": "自动化任务已停止"}

@app.get("/api/status")
async def get_status():
    return {
        "running": browser_manager.is_running,
        "pageType": browser_manager.current_page_type,
        "processedCount": browser_manager.processed_count
    }
```

### 6. Web前端改造

#### 现有代码分析
- **文件:** `web-app/app/simple-rules/page.tsx`
- **功能:** 规则配置页面
- **关键实现:**
  - 使用localStorage存储配置
  - 表单组件和拖拽排序

#### 改造方案
- 修改配置读写逻辑，从localStorage改为API调用
- 添加自动化控制面板
- 优化用户界面

```tsx
// 修改loadRulesConfig函数
const loadRulesConfig = async () => {
  try {
    // 从API获取配置
    const response = await fetch('http://localhost:8000/api/config');
    if (response.ok) {
      const data = await response.json();
      setConfig(data);
      return;
    }
    
    // API请求失败时使用默认配置
    setConfig({
      rules: [],
      passScore: 60,
      autoMode: false
    });
  } catch (error) {
    console.error('加载规则配置失败:', error);
    setConfig({
      rules: [],
      passScore: 60,
      autoMode: false
    });
  }
};

// 修改保存函数
const handleSaveConfig = async (newConfig: SimpleRulesConfig) => {
  try {
    setIsSaving(true);
    
    // 调用API保存配置
    const response = await fetch('http://localhost:8000/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newConfig),
    });
    
    if (!response.ok) {
      throw new Error('API请求失败');
    }
    
    // 保存成功反馈
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    
    // 更新本地状态
    setConfig(newConfig);
  } catch (error) {
    console.error('保存规则配置失败:', error);
    alert('保存失败，请重试');
  } finally {
    setIsSaving(false);
  }
};
```

### 7. Electron打包配置

#### 主进程设计
- **文件:** `electron/main.js`
- **功能:** 管理应用生命周期和Python后端

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const findProcess = require('find-process');
const isDev = require('electron-is-dev');

let mainWindow;
let pythonProcess;
let pythonPort = 8000;

async function startPythonBackend() {
  // 检查是否已有Python服务
  const list = await findProcess('port', pythonPort);
  if (list.length > 0) {
    console.log('Python服务已在运行');
    return;
  }
  
  // 启动Python后端
  const pythonExecutable = isDev 
    ? 'python3'  // 开发环境
    : path.join(process.resourcesPath, 'app.asar.unpacked/backend/dist/server');  // 生产环境
  
  const scriptPath = isDev
    ? path.join(__dirname, '../automation/api/server.py')
    : null;
    
  pythonProcess = isDev
    ? spawn(pythonExecutable, [scriptPath])
    : spawn(pythonExecutable);
  
  // 处理stdout和stderr
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python输出: ${data}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python错误: ${data}`);
  });
  
  // 等待服务启动
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}

async function createWindow() {
  // 启动Python后端
  await startPythonBackend();
  
  // 创建Electron窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 加载应用
  const startUrl = isDev
    ? 'http://localhost:3000'  // 开发环境
    : `file://${path.join(__dirname, './out/index.html')}`;  // 生产环境
    
  mainWindow.loadURL(startUrl);
}

// 应用事件处理
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  
  // 关闭Python进程
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

// IPC通信
ipcMain.handle('start-automation', async () => {
  try {
    const response = await fetch(`http://localhost:${pythonPort}/api/automation/start`, {
      method: 'POST'
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-automation', async () => {
  try {
    const response = await fetch(`http://localhost:${pythonPort}/api/automation/stop`, {
      method: 'POST'
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

## 详细任务计划与实施步骤

### 阶段1：环境搭建（1周）

1. **创建项目结构**
   - 创建目录结构和初始文件
   - 配置开发环境
   - 设置版本控制

2. **配置Python环境**
   - 安装必要依赖：Playwright、FastAPI、uvicorn
   - 配置虚拟环境
   - 编写需求文件（requirements.txt）

3. **配置Electron环境**
   - 安装Electron和相关依赖
   - 创建基础配置文件
   - 建立Python后端与Electron的通信机制

### 阶段2：核心功能实现（2周）

1. **Python后端API开发**
   - 实现FastAPI服务框架
   - 开发配置管理接口
   - 添加状态监控接口

2. **浏览器自动化开发**
   - 实现页面检测器
   - 开发元素查找器
   - 实现UI操作模拟

3. **数据提取与处理**
   - 迁移数据提取逻辑
   - 实现简历数据解析
   - 建立数据存储机制

4. **规则引擎实现**
   - 移植规则评估逻辑
   - 实现模糊匹配算法
   - 开发决策机制

### 阶段3：前端适配（1周）

1. **修改Web前端**
   - 改造规则编辑器
   - 添加自动化控制面板
   - 开发状态展示组件

2. **开发Electron预加载脚本**
   - 实现IPC通信
   - 添加本地API调用
   - 设计状态同步机制

3. **优化用户体验**
   - 添加加载状态
   - 实现错误处理
   - 优化UI交互

### 阶段4：集成与打包（1周）

1. **Python代码打包**
   - 使用PyInstaller打包
   - 优化依赖
   - 测试独立运行

2. **Electron应用打包**
   - 配置electron-builder
   - 整合Python可执行文件
   - 生成DMG安装包

3. **测试与修复**
   - 功能测试
   - 性能优化
   - 修复已知问题

### 阶段5：完善与发布（1周）

1. **添加自动更新**
   - 实现版本检查
   - 配置更新服务
   - 测试更新流程

2. **安全加固**
   - 添加数据加密
   - 实现安全通信
   - 增加权限检查

3. **用户文档**
   - 编写安装指南
   - 创建使用手册
   - 准备发布说明

## 开发注意事项

1. **兼容性考虑**
   - 确保兼容目标macOS版本（10.15及以上）
   - 处理不同分辨率屏幕
   - 适配浏览器版本变化

2. **安全与隐私**
   - 本地数据加密存储
   - 遵循最小权限原则
   - 实现安全的API通信

3. **性能优化**
   - 减少不必要的网络请求
   - 优化自动化操作延迟
   - 控制内存使用

4. **用户体验**
   - 提供明确的操作反馈
   - 简化配置流程
   - 增加进度指示器

## 风险与应对措施

1. **网站结构变化**
   - 风险：目标网站DOM结构更新导致选择器失效
   - 应对：实现自适应选择器和定期更新机制

2. **权限问题**
   - 风险：macOS安全限制阻止自动化操作
   - 应对：添加详细的权限请求指导和故障排除手册

3. **浏览器兼容性**
   - 风险：浏览器更新影响自动化功能
   - 应对：支持多种浏览器和版本检测机制

4. **应用签名问题**
   - 风险：未签名应用被macOS拦截
   - 应对：实现适当的签名和公证流程或提供安装指导 