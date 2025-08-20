// Redis缓存工具
import { createClient } from 'redis'

// 创建Redis客户端
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

// 连接错误处理
redis.on('error', (err) => {
  console.error('❌ Redis连接错误:', err)
})

redis.on('connect', () => {
  console.log('✅ Redis连接成功')
})

// 连接到Redis
redis.connect().catch(console.error)

// 缓存工具类
export class CacheService {
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值（会自动JSON序列化）
   * @param ttl 过期时间（秒），默认60秒
   */
  static async set(key: string, value: any, ttl: number = 60): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      await redis.setEx(key, ttl, serializedValue)
      console.log(`📦 缓存已设置: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      console.error('❌ 设置缓存失败:', error)
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值（自动JSON反序列化）或null
   */
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      if (value === null) {
        console.log(`🔍 缓存未命中: ${key}`)
        return null
      }
      console.log(`🎯 缓存命中: ${key}`)
      return JSON.parse(value) as T
    } catch (error) {
      console.error('❌ 获取缓存失败:', error)
      return null
    }
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key)
      console.log(`🗑️ 缓存已删除: ${key}`)
    } catch (error) {
      console.error('❌ 删除缓存失败:', error)
    }
  }

  /**
   * 删除匹配模式的所有缓存
   * @param pattern 匹配模式，如 "projects:*"
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(keys)
        console.log(`🗑️ 批量删除缓存: ${keys.length}个键`)
      }
    } catch (error) {
      console.error('❌ 批量删除缓存失败:', error)
    }
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('❌ 检查缓存存在性失败:', error)
      return false
    }
  }

  /**
   * 获取缓存剩余过期时间
   * @param key 缓存键
   * @returns 剩余秒数，-1表示永不过期，-2表示不存在
   */
  static async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key)
    } catch (error) {
      console.error('❌ 获取缓存TTL失败:', error)
      return -2
    }
  }
}

export { redis }