#!/bin/bash

echo "停止现有API服务器进程..."
pkill -f "uvicorn automation.api.server:app"

echo "等待3秒..."
sleep 3

echo "启动API服务器..."
cd $(dirname "$0")
python3 -m uvicorn automation.api.server:app --reload --host 0.0.0.0 --port 8000 &

echo "API服务器启动完成，运行在 http://localhost:8000"
echo "您可以在浏览器访问 http://localhost:8000/docs 查看API文档"
echo "按 Ctrl+C 停止此脚本（API服务器将继续在后台运行）" 