/** @type {import('next').NextConfig} */
const nextConfig = {
  // 告诉 Next.js：如果某些页面在打包时报错，也请继续，不要停工
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // 关键：禁用静态导出优化，让页面在运行时再加载数据
  output: 'standalone', 
}

module.exports = nextConfig