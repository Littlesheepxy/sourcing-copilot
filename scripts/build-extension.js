/**
 * Chrome扩展构建脚本
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('开始构建Chrome扩展...');

// 工作目录
const rootDir = path.resolve(__dirname, '..');
const extensionDir = path.join(rootDir, 'extension');
const distDir = path.join(rootDir, 'dist');

try {
  // 清理输出目录
  if (fs.existsSync(distDir)) {
    console.log('清理输出目录...');
    execSync('rm -rf dist', { cwd: rootDir, stdio: 'inherit' });
  }
  
  // 创建输出目录
  console.log('创建输出目录...');
  fs.mkdirSync(distDir, { recursive: true });
  
  // 安装依赖
  console.log('安装依赖...');
  execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
  
  // 执行构建
  console.log('编译TypeScript...');
  execSync('npx tsc -p extension/tsconfig.json', { cwd: rootDir, stdio: 'inherit' });
  
  // 复制静态文件
  console.log('复制静态文件...');
  
  // 复制manifest.json
  fs.copyFileSync(
    path.join(extensionDir, 'manifest.json'),
    path.join(distDir, 'manifest.json')
  );
  
  // 复制图标
  const iconsDir = path.join(extensionDir, 'icons');
  const distIconsDir = path.join(distDir, 'icons');
  
  if (fs.existsSync(iconsDir)) {
    fs.mkdirSync(distIconsDir, { recursive: true });
    
    const icons = fs.readdirSync(iconsDir);
    icons.forEach(icon => {
      fs.copyFileSync(
        path.join(iconsDir, icon),
        path.join(distIconsDir, icon)
      );
    });
  }
  
  // 复制HTML文件
  const htmlFiles = [
    { src: path.join(extensionDir, 'popup/popup.html'), dest: path.join(distDir, 'popup.html') },
    { src: path.join(extensionDir, 'sidebar/sidebar.html'), dest: path.join(distDir, 'sidebar.html') }
  ];
  
  htmlFiles.forEach(file => {
    if (fs.existsSync(file.src)) {
      fs.copyFileSync(file.src, file.dest);
    }
  });
  
  // 打包扩展
  console.log('打包扩展...');
  execSync('cd dist && zip -r ../sourcing-copilot-extension.zip *', { cwd: rootDir, stdio: 'inherit' });
  
  console.log('Chrome扩展构建完成！输出文件: ./sourcing-copilot-extension.zip');
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
} 