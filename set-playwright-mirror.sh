#!/bin/zsh

# 设置Playwright下载镜像源为npmmirror
export PLAYWRIGHT_DOWNLOAD_HOST=https://registry.npmmirror.com/-/binary/playwright

# 显示当前设置
echo "已设置Playwright下载源为: $PLAYWRIGHT_DOWNLOAD_HOST"

# 提示用户如何永久设置
echo "提示: 要永久设置此环境变量，请将以下行添加到您的 ~/.zshrc 文件中:"
echo "export PLAYWRIGHT_DOWNLOAD_HOST=https://registry.npmmirror.com/-/binary/playwright" 