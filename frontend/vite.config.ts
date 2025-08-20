import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // 生产环境构建优化
  build: {
    // 输出目录
    outDir: 'dist',
    // 生成源码映射
    sourcemap: false,
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 将React相关库打包到一个chunk
          'react-vendor': ['react', 'react-dom'],
          // 将Ant Design打包到一个chunk
          'antd-vendor': ['antd', '@ant-design/pro-components'],
          // 将工具库打包到一个chunk
          'utils-vendor': ['axios', 'dayjs']
        }
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除console.log
        drop_console: true,
        // 移除debugger
        drop_debugger: true,
      },
    },
    // 资源内联阈值
    assetsInlineLimit: 4096,
    // 启用CSS代码分割
    cssCodeSplit: true,
  },
  // 预览服务器配置
  preview: {
    port: 4173,
    host: true,
  },
})