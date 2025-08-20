import { PrismaClient } from '@prisma/client'

// 创建全局Prisma客户端实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 优雅关闭数据库连接
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})