# 如何在终端查看卡片数据提取效果

## 方法一：通过控制台输出查看

已添加详细的调试日志打印功能，运行程序时会在控制台展示以下信息：

1. **原始卡片数据**：
   - 卡片HTML结构
   - 所有row元素的内容
   - 提取到的名字
   - Boss直聘专用提取的职位信息

2. **提取结果**：
   - 使用"===="分隔的提取结果区域
   - 显示所有字段：姓名、职位、公司、教育、学校、技能等
   - 含有完整文本预览

3. **详情页数据**：
   - iframe详情页提取的原始数据
   - 最终合并后的数据

## 方法二：保存日志到文件

1. 通过API调用保存日志：
```python
from automation.processors.resume_processor import ResumeProcessor

# 初始化处理器后
processor = ResumeProcessor(browser, rules_engine, selectors)

# 保存日志 - 自动创建时间戳文件名
log_path = processor.save_processing_log()

# 或指定文件名
log_path = processor.save_processing_log("我的简历处理日志.log")
```

2. 日志文件保存在：~/Library/Application Support/SourcingCopilot/logs/

## 方法三：设置调试级别

```python
# 设置详细的调试级别
processor.set_debug_level(3)  # 0:精简 1:正常 2:详细 3:全部
```

## 直接查看的命令

如果想直接查看当前运行情况，可以使用以下命令查看最近的日志：

```bash
# 查看所有控制台输出，过滤关键信息
tail -f /path/to/your/app.log | grep -E '====='

# 只看提取结果
tail -f /path/to/your/app.log | grep -A 10 "提取结果"

# 查看卡片数据和最终合并数据的对比
tail -f /path/to/your/app.log | grep -E "卡片数据|最终合并"
```

这些输出可以帮助你确认：
1. 卡片数据是否正确提取
2. iframe详情页数据是否正确提取
3. 最终合并后的数据是否完整正确 