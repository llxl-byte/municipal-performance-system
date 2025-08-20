// 统一响应格式工具
import { Context } from 'hono'

// 标准响应接口
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  code?: string
  timestamp?: string
  cached?: boolean
}

// 分页响应接口
export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 响应工具类
export class ResponseHelper {
  /**
   * 成功响应
   */
  static success<T>(
    c: Context,
    data?: T,
    message: string = '操作成功',
    statusCode: number = 200
  ) {
    return c.json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    } as ApiResponse<T>, statusCode as any)
  }

  /**
   * 分页成功响应
   */
  static paginated<T>(
    c: Context,
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    message: string = '查询成功'
  ) {
    const totalPages = Math.ceil(total / pageSize)
    
    return c.json({
      success: true,
      message,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages
      } as PaginatedResponse<T>,
      timestamp: new Date().toISOString()
    } as ApiResponse<PaginatedResponse<T>>)
  }

  /**
   * 错误响应
   */
  static error(
    c: Context,
    message: string,
    statusCode: number = 400,
    code?: string
  ) {
    return c.json({
      success: false,
      message,
      code,
      timestamp: new Date().toISOString()
    } as ApiResponse, statusCode as any)
  }

  /**
   * 缓存响应（带缓存标识）
   */
  static cached<T>(
    c: Context,
    data: T,
    message: string = '查询成功（缓存）'
  ) {
    return c.json({
      success: true,
      message,
      data,
      cached: true,
      timestamp: new Date().toISOString()
    } as ApiResponse<T>)
  }
}