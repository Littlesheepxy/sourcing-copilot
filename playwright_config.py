"""
Playwright 配置文件
用于设置Playwright的下载镜像源
"""
import os
import sys

# 设置Playwright下载镜像源
os.environ["PLAYWRIGHT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"

# 设置浏览器特定镜像源
os.environ["PLAYWRIGHT_CHROMIUM_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"
os.environ["PLAYWRIGHT_FIREFOX_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright" 
os.environ["PLAYWRIGHT_WEBKIT_DOWNLOAD_HOST"] = "https://registry.npmmirror.com/-/binary/playwright"

# 设置下载连接超时（毫秒）- 增加超时时间，改善网络问题
os.environ["PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT"] = "120000"

# 确认环境变量已设置
print(f"Playwright下载源已设置为: {os.environ.get('PLAYWRIGHT_DOWNLOAD_HOST')}")
print(f"连接超时已设置为: {os.environ.get('PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT')}ms") 