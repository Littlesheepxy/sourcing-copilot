/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 导出为静态HTML
  distDir: 'out', // 输出目录
  trailingSlash: true, // 在URL末尾添加斜杠
  images: {
    unoptimized: true, // 静态导出时禁用图像优化
  },
};

module.exports = nextConfig; 