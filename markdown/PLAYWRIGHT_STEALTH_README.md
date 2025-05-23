# Playwright反爬虫解决方案

## 问题描述

在使用Playwright自动化浏览Boss直聘等网站时，可能会遇到被识别为机器人的问题，导致简历详情页从HTML变成了Canvas渲染的内容，无法直接通过DOM提取数据。

## 解决方案：使用stealth.min.js

本项目集成了`stealth.min.js`脚本，该脚本可以帮助Playwright伪装成真实浏览器，避免被网站的反爬虫机制检测到。

### 工作原理

`stealth.min.js`通过以下方式帮助规避机器人检测：

1. 隐藏Webdriver特征（navigator.webdriver = false）
2. 模拟真实浏览器插件（修改navigator.plugins）
3. 添加语言设置（navigator.languages）
4. 防止Canvas指纹识别
5. 随机化用户代理
6. 修改WebGL参数

### 如何使用

以下修改已经集成到`automation/browser_control/browser_manager.py`文件中：

1. 在`BrowserManager`初始化时设置stealth.js路径：
```python
self.stealth_js_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "stealth.min.js")
```

2. 在启动浏览器或连接现有浏览器时加载stealth.js脚本：
```python
if os.path.exists(self.stealth_js_path):
    with open(self.stealth_js_path, "r") as f:
        stealth_script = f.read()
    await self.page.add_init_script(stealth_script)
    print("已加载stealth.min.js脚本，提高反爬能力")
```

### 测试脚本

项目根目录下提供了`test_stealth.py`脚本，用于测试stealth.min.js的效果。运行以下命令进行测试：

```bash
python test_stealth.py
```

脚本会：
1. 启动浏览器并加载stealth.min.js
2. 访问机器人检测测试网站，检查是否通过了基本的机器人检测
3. 访问Boss直聘网站，验证是否能正常显示内容

### 常见问题

1. **stealth.min.js文件不存在**
   解决方案：请确保项目根目录下有stealth.min.js文件，如果没有，可以运行：
   ```bash
   curl -s https://raw.githubusercontent.com/berstend/puppeteer-extra/master/packages/puppeteer-extra-plugin-stealth/evasions/utils/stealth.min.js -o stealth.min.js
   ```

2. **仍然被识别为机器人**
   - 检查stealth.min.js是否正确加载
   - 确保用户代理设置为最新版本的Chrome
   - 尝试不同的浏览器设置，如禁用WebRTC、启用指纹保护等

3. **Canvas渲染的内容无法提取**
   如果简历仍然以Canvas形式渲染，可以使用OCR技术提取内容，项目中的OCR功能可以帮助识别Canvas内容。

### 进一步改进

- 定期更新stealth.min.js脚本以应对网站反爬机制的更新
- 结合其他反爬技术，如旋转代理IP、模拟人类行为等
- 考虑使用第三方库如puppeteer-extra-plugin-stealth的完整功能

## 参考资料

- [Playwright官方文档](https://playwright.dev/)
- [puppeteer-extra-plugin-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth)
- [机器人检测测试网站](https://bot.sannysoft.com/) 