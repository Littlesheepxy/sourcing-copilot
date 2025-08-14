# 数据库打包说明

## 数据库存储位置

### 开发环境
- 数据库文件：`automation/sourcing_copilot.db`
- 位置：项目根目录下

### 打包后的 Mac App
- 数据库文件：`~/Library/Application Support/SourcingCopilot/sourcing_copilot.db`
- 位置：用户应用数据目录（可读写）

## 数据库处理机制

### 1. 自动路径检测
- `automation/database/db.py` 中的 `get_database_path()` 函数会自动检测运行环境
- 开发环境：使用项目目录
- 打包环境：使用用户数据目录

### 2. 模板数据库
- 打包时会将现有数据库作为模板包含在应用中
- 首次运行时，如果用户数据库不存在，会从模板复制
- 这确保了应用有初始数据

### 3. 数据持久化
- 用户数据存储在用户目录，不会因为应用更新而丢失
- 应用卸载后，数据库文件仍然保留（除非手动删除）

## 构建流程

### 使用构建脚本
```bash
./build_app.sh
```

### 手动构建步骤
1. 构建前端：`cd web-app && npm run build`
2. 准备数据库：确保 `automation/sourcing_copilot.db` 存在
3. 构建后端：`python3 build.py`
4. 构建 Electron 应用：`cd electron && npm run build:mac`

## 数据库文件检查

### 检查当前数据库
```bash
ls -la automation/sourcing_copilot.db
```

### 检查用户数据库（打包后）
```bash
ls -la ~/Library/Application\ Support/SourcingCopilot/sourcing_copilot.db
```

## 故障排除

### 如果数据库丢失
1. 检查用户数据目录是否存在
2. 检查应用是否有写权限
3. 重新安装应用会重新创建数据库

### 如果数据库损坏
1. 删除用户数据库文件
2. 重启应用，会自动从模板重新创建

## 注意事项

1. ✅ **数据安全**：用户数据存储在用户目录，不会丢失
2. ✅ **权限正确**：用户目录有读写权限
3. ✅ **初始数据**：包含必要的初始数据库结构
4. ✅ **版本兼容**：支持数据库结构升级

## 测试建议

1. 在开发环境测试数据库功能
2. 打包后测试首次启动（模板复制）
3. 测试数据持久化（重启应用）
4. 测试应用更新后数据保留 