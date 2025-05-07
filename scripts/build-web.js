/**
 * Web应用构建脚本
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('开始构建Web应用...');

// 工作目录
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');

try {
  // 清理输出目录
  if (fs.existsSync(outDir)) {
    console.log('清理输出目录...');
    execSync('rm -rf out', { cwd: rootDir, stdio: 'inherit' });
  }
  
  // 安装依赖
  console.log('安装依赖...');
  execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
  
  // 执行构建
  console.log('执行Next.js构建...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  
  console.log('Web应用构建完成！输出目录: ./out');
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
} 