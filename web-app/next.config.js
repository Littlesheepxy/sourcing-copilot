/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['../shared', '../packages'],
  experimental: {
    externalDir: true,
    swcMinify: true,
  },
  webpack: (config, { isServer }) => {
    // 添加对共享目录的解析
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../shared');
    config.resolve.alias['@packages'] = path.resolve(__dirname, '../packages');
    
    return config;
  },
};

module.exports = nextConfig; 