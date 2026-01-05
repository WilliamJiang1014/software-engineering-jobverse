/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // 注意：前端代码使用 axios，baseURL 已经设置为完整的 API URL
  // rewrites 主要用于处理 SSR 场景下的 API 调用
  // 由于 axios 直接发送到 API Gateway，不需要 rewrites
  // 移除 rewrites 配置，避免路径重复问题
};

module.exports = nextConfig;
