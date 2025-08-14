#!/bin/bash

# 设置API URL环境变量
export NEXT_PUBLIC_API_URL=http://localhost:8000

# 进入web-app目录
cd "$(dirname "$0")"

# 启动Next.js应用
echo "启动前端应用，API URL: $NEXT_PUBLIC_API_URL"
npm run dev 