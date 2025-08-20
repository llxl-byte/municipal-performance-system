// 数据库连接工具
import { PrismaClient } from '@prisma/client'

// 创建Prisma客户端实例
// 在开发环境中启用查询日志，便于调试
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
})

// 优雅关闭数据库连接
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export { prisma }