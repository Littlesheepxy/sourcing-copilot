# Playwright 中国镜像源配置指南

本项目已配置 Playwright 使用 npmmirror 国内镜像源，加速浏览器下载。

## 当前配置

已设置环境变量：
```
PLAYWRIGHT_DOWNLOAD_HOST=https://registry.npmmirror.com/-/binary/playwright
```

## 使用方式

### 1. 临时使用（当前终端会话）

运行项目根目录下的脚本：
```bash
source ./set-playwright-mirror.sh
```

### 2. 永久配置（已完成）

已将以下配置添加到 `~/.zshrc` 文件：
```bash
export PLAYWRIGHT_DOWNLOAD_HOST=https://registry.npmmirror.com/-/binary/playwright
```

### 3. Python代码中使用

在需要使用Playwright的Python脚本开头导入配置文件：
```python
import sys
import os

# 导入配置（确保路径正确）
sys.path.append('/path/to/project/root')
import playwright.config  # 这会自动设置环境变量
```

## 验证配置

验证镜像源设置是否生效：
```bash
echo $PLAYWRIGHT_DOWNLOAD_HOST
```

## 重置为默认源

如需恢复使用官方默认下载源，请执行：
```bash
unset PLAYWRIGHT_DOWNLOAD_HOST
```

并从 `~/.zshrc` 文件中删除相应配置行。 