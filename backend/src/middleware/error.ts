// 统一错误处理中间件
import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

// 自定义错误类型
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// 全局错误处理器
export const errorHandler = (error: Error, c: Context) => {
  console.error('❌ 服务器错误:', {
    message: error.message,
    stack: error.stack,
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString()
  })

  // HTTP异常处理
  if (error instanceof HTTPException) {
    return c.json({
      success: false,
      message: error.message,
      code: 'HTTP_EXCEPTION'
    }, error.status)
  }

  // 自定义应用错误
  if (error instanceof AppError) {
    return c.json({
      success: false,
      message: error.message,
      code: error.code || 'APP_ERROR'
    }, error.statusCode as any)
  }

  // Prisma数据库错误
  if (error.name === 'PrismaClientKnownRequestError') {
    return handlePrismaError(error, c)
  }

  // 验证错误（Zod等）
  if (error.name === 'ZodError') {
    return c.json({
      success: false,
      message: '请求参数验证失败',
      code: 'VALIDATION_ERROR',
      details: error.message
    }, 400)
  }

  // 默认服务器错误
  return c.json({
    success: false,
    message: '服务器内部错误',
    code: 'INTERNAL_SERVER_ERROR'
  }, 500)
}

// Prisma错误处理
function handlePrismaError(error: any, c: Context) {
  switch (error.code) {
    case 'P2002':
      return c.json({
        success: false,
        message: '数据已存在，不能重复创建',
        code: 'DUPLICATE_ERROR'
      }, 409)
    
    case 'P2025':
      return c.json({
        success: false,
        message: '记录不存在',
        code: 'NOT_FOUND'
      }, 404)
    
    default:
      return c.json({
        success: false,
        message: '数据库操作失败',
        code: 'DATABASE_ERROR'
      }, 500)
  }
}