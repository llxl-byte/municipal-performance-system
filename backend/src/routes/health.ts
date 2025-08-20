// 健康检查路由
import { Hono } from 'hono'
import { prisma } from '../lib/database.js'
import { redis } from '../lib/redis.js'

const healthRoutes = new Hono()

// 基础健康检查
healthRoutes.get('/health', async (c) => {
  return c.json({
    success: true,
    message: '服务正常运行',
    service: 'municipal-performance-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 详细健康检查（包含数据库和Redis状态）
healthRoutes.get('/health/detailed', async (c) => {
  const health = {
    success: true,
    service: 'municipal-performance-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    status: {
      database: 'unknown',
      redis: 'unknown'
    }
  }

  // 检查数据库连接
  try {
    await prisma.$queryRaw`SELECT 1`
    health.status.database = 'healthy'
  } catch (error) {
    health.status.database = 'unhealthy'
    health.success = false
  }

  // 检查Redis连接
  try {
    await redis.ping()
    health.status.redis = 'healthy'
  } catch (error) {
    health.status.redis = 'unhealthy'
    health.success = false
  }

  const statusCode = health.success ? 200 : 503
  return c.json(health, statusCode)
})

export { healthRoutes }