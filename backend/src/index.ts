import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

// 导入路由
import { healthRoutes } from './routes/health.js'
import { uploadRoutes } from './routes/upload.js'
import { projectRoutes } from './routes/projects.js'
import { cacheRoutes } from './routes/cache.js'
import { errorHandler } from './middleware/error.js'

const app = new Hono()

// 全局中间件
app.use('*', logger()) // 请求日志
app.use('*', prettyJSON()) // 美化JSON输出

// 配置CORS中间件
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// 根路径
app.get('/', (c) => {
  return c.json({ 
    message: '🏛️ 市政业绩管理系统API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      projects: '/api/projects',
      upload: '/api/upload',
      cache: '/api/cache'
    }
  })
})

// 注册路由
app.route('/api', healthRoutes)
app.route('/api', uploadRoutes)
app.route('/api', projectRoutes)
app.route('/api', cacheRoutes)

// 全局错误处理（必须放在最后）
app.onError(errorHandler)

// 404处理
app.notFound((c) => {
  return c.json({
    success: false,
    message: '接口不存在',
    path: c.req.path
  }, 404)
})

const port = Number(process.env.PORT) || 8000
console.log(`🚀 服务器启动在端口 ${port}`)
console.log(`📖 API文档: http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})