// 缓存中间件
import { Context, Next } from 'hono'
import { CacheService } from '../lib/redis.js'

/**
 * 缓存中间件工厂函数
 * @param keyGenerator 缓存键生成函数
 * @param ttl 缓存时间（秒）
 * @returns Hono中间件
 */
export function cacheMiddleware(
  keyGenerator: (c: Context) => string,
  ttl: number = 60
) {
  return async (c: Context, next: Next) => {
    const cacheKey = keyGenerator(c)
    
    try {
      // 尝试从缓存获取数据
      const cachedData = await CacheService.get(cacheKey)
      
      if (cachedData !== null) {
        // 缓存命中，直接返回缓存数据
        console.log(`🎯 缓存命中: ${cacheKey}`)
        return c.json({
          success: true,
          message: cachedData.message || '查询成功（缓存）',
          data: cachedData.data || cachedData,
          cached: true,
          timestamp: new Date().toISOString()
        })
      }
      
      console.log(`🔍 缓存未命中: ${cacheKey}`)
      
      // 缓存未命中，继续执行后续处理
      await next()
      
      // 处理完成后，尝试将结果存入缓存
      try {
        const response = await c.res.clone().json()
        if (response.success && response.data) {
          await CacheService.set(cacheKey, response, ttl)
          console.log(`📦 数据已缓存: ${cacheKey} (TTL: ${ttl}s)`)
        }
      } catch (cacheError) {
        console.error('❌ 缓存存储失败:', cacheError)
      }
      
    } catch (error) {
      console.error('❌ 缓存中间件错误:', error)
      // 缓存出错时，继续正常流程
      await next()
    }
  }
}

/**
 * 缓存失效中间件
 * 用于在数据更新后清除相关缓存
 */
export function invalidateCacheMiddleware(
  patternGenerator: (c: Context) => string
) {
  return async (c: Context, next: Next) => {
    await next()
    
    try {
      // 如果操作成功，清除相关缓存
      const response = await c.res.clone().json()
      if (response.success) {
        const pattern = patternGenerator(c)
        await CacheService.deletePattern(pattern)
      }
    } catch (error) {
      console.error('❌ 缓存失效中间件错误:', error)
    }
  }
}