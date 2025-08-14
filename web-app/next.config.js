/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['../shared', '../packages'],
  experimental: {
    externalDir: true,
    swcMinify: true,
  },
  // 生成静态文件用于Electron打包
  output: 'export',
  trailingSlash: true,
  // 设置资源路径前缀为相对路径，确保在file://协议下能正确加载
  assetPrefix: './',
  images: {
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    // 添加对共享目录的解析
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../shared');
    config.resolve.alias['@packages'] = path.resolve(__dirname, '../packages');
    
    return config;
  },
};

module.exports = nextConfig; 