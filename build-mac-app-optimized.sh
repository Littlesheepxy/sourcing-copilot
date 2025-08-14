#!/bin/bash

echo "🚀 开始打包 Sourcing Copilot Mac 应用 (优化版)..."

# 检查是否在macOS上运行
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 错误: 此脚本只能在 macOS 上运行"
    exit 1
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf electron/dist
rm -rf web-app/.next
rm -rf web-app/out
rm -rf build
rm -rf dist

# 安装依赖
echo "📦 安装依赖..."
cd web-app && npm install && cd ..
cd electron && npm install && cd ..

# 构建前端应用为静态文件
echo "🔨 构建前端应用 (静态导出)..."
cd web-app
npm run build
cd ..

# 检查前端构建结果
if [ ! -d "web-app/out" ]; then
    echo "❌前端构建失败，未找到 out 目录"
    exit 1
fi

echo "✅ 前端构建完成，生成了 $(du -sh web-app/out | cut -f1) 的静态文件"

# 确保数据库文件存在
echo "📊 准备数据库文件..."
if [ ! -f "automation/sourcing_copilot.db" ]; then
    echo "创建初始数据库文件..."
    cd automation
    python3 -c "from database.db import init_db; init_db()"
    cd ..
fi

if [ -f "automation/sourcing_copilot.db" ]; then
    echo "✅ 数据库文件准备完成，大小: $(du -sh automation/sourcing_copilot.db | cut -f1)"
else
    echo "⚠️  数据库文件不存在，将在首次运行时创建"
fi

# 使用PyInstaller打包Python后端
echo "🐍 打包Python后端..."
pip install pyinstaller

# 创建build目录
mkdir -p build

# 获取当前目录的绝对路径
CURRENT_DIR=$(pwd)

pyinstaller --name=sourcing-copilot-server \
    --onefile \
    --hidden-import=automation \
    --hidden-import=automation.api \
    --hidden-import=automation.api.server \
    --hidden-import=uvicorn \
    --hidden-import=fastapi \
    --hidden-import=playwright \
    --hidden-import=requests \
    --add-data="${CURRENT_DIR}/automation:automation" \
    --distpath=build \
    --workpath=build/work \
    --specpath=build \
    --exclude-module=myenv \
    --exclude-module=backup \
    --console \
    electron_backend.py

# 检查Python构建结果
if [ ! -f "build/sourcing-copilot-server" ]; then
    echo "❌ Python后端打包失败"
    exit 1
fi

echo "✅ Python后端打包完成，大小: $(du -sh build/sourcing-copilot-server | cut -f1)"

# 打包Electron应用
echo "⚡打包Electron应用..."
cd electron
npm run build:mac
cd ..

# 检查最终结果
if [ -f "electron/dist/Sourcing Copilot-1.0.0.dmg" ]; then
    echo "✅ 打包完成!"
    echo "📱 应用位置: electron/dist/Sourcing Copilot-1.0.0.dmg"
    echo "📊 文件大小: $(du -sh electron/dist/Sourcing\ Copilot-1.0.0.dmg | cut -f1)"
    echo ""
    echo "🔑 默认登录账号:"
    echo "   用户名: admin, 密码: admin123"
    echo "   用户名: user,  密码: user123"
    echo "   用户名: demo,  密码: demo123"
    echo ""
    echo "📋 使用说明:"
    echo "1. 将 .dmg 文件发送给用户"
    echo "2. 用户双击 .dmg 文件"
    echo "3. 将应用拖拽到 Applications 文件夹"
    echo "4. 启动应用并使用上述账号登录"
    echo ""
    echo "🎯 优化效果:"
    echo "- 忽略了虚拟环境 (myenv/)"
    echo "- 忽略了备份文件 (backup/)"
    echo "- 只包含必要的运行文件"
    echo "- 使用静态文件导出减少体积"
    echo ""
    echo "💾 数据库存储:"
    echo "- 开发环境: automation/sourcing_copilot.db"
    echo "- Mac App: ~/Library/Application Support/SourcingCopilot/"
    echo "- 数据不会因应用更新而丢失"
else
    echo "❌ 打包失败，请检查错误信息"
    exit 1
fi 