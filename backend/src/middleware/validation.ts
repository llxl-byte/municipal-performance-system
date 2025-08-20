// 请求验证中间件
import { Context, Next } from 'hono'
import { z, ZodSchema } from 'zod'
import { ResponseHelper } from '../lib/response.js'

// 验证中间件工厂函数
export function validateRequest(schema: {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}) {
  return async (c: Context, next: Next) => {
    try {
      // 验证请求体
      if (schema.body) {
        const body = await c.req.json().catch(() => ({}))
        const validatedBody = schema.body.parse(body)
        c.set('validatedBody', validatedBody)
      }

      // 验证查询参数
      if (schema.query) {
        const query = c.req.query()
        const validatedQuery = schema.query.parse(query)
        c.set('validatedQuery', validatedQuery)
      }

      // 验证路径参数
      if (schema.params) {
        const params = c.req.param()
        const validatedParams = schema.params.parse(params)
        c.set('validatedParams', validatedParams)
      }

      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        
        return ResponseHelper.error(
          c,
          `参数验证失败: ${errorMessages}`,
          400,
          'VALIDATION_ERROR'
        )
      }
      throw error
    }
  }
}

// 常用验证模式
export const ValidationSchemas = {
  // 分页查询参数
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    pageSize: z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: z.string().optional().default('')
  }),

  // 项目创建
  createProject: z.object({
    name: z.string().min(1, '项目名称不能为空').max(200, '项目名称过长')
  }),

  // ID参数
  idParam: z.object({
    id: z.string().transform(val => parseInt(val))
  }),

  // 关键词参数
  keywordParam: z.object({
    keyword: z.string().min(1, '搜索关键词不能为空')
  })
}