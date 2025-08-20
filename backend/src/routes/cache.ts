// 缓存管理路由
import { Hono } from 'hono'
import { CacheService, redis } from '../lib/redis.js'
import { ResponseHelper } from '../lib/response.js'
import { CacheKeys } from '../lib/cache-keys.js'

const cacheRoutes = new Hono()

// 获取缓存统计信息
cacheRoutes.get('/cache/stats', async (c) => {
  try {
    console.log('📊 获取缓存统计信息')

    // 获取Redis信息
    const info = await redis.info('memory')
    const keyCount = await redis.dbSize()
    
    // 解析内存使用信息
    const memoryLines = info.split('\r\n')
    const usedMemory = memoryLines.find(line => line.startsWith('used_memory_human:'))?.split(':')[1] || 'Unknown'
    const maxMemory = memoryLines.find(line => line.startsWith('maxmemory_human:'))?.split(':')[1] || 'Unlimited'

    const stats = {
      connected: true,
      keyCount,
      memoryUsage: {
        used: usedMemory,
        max: maxMemory
      },
      timestamp: new Date().toISOString()
    }

    return ResponseHelper.success(c, stats, '获取缓存统计成功')

  } catch (error: any) {
    console.error('❌ 获取缓存统计失败:', error)
    return ResponseHelper.error(c, error.message || '获取缓存统计失败', 500)
  }
})

// 获取所有缓存键
cacheRoutes.get('/cache/keys', async (c) => {
  try {
    console.log('🔑 获取所有缓存键')

    const keys = await redis.keys('*')
    const keyDetails = []

    // 获取每个键的详细信息
    for (const key of keys.slice(0, 20)) { // 限制显示前20个键
      try {
        const ttl = await redis.ttl(key)
        const type = await redis.type(key)
        keyDetails.push({
          key,
          type,
          ttl: ttl === -1 ? '永不过期' : ttl === -2 ? '不存在' : `${ttl}秒`
        })
      } catch (error) {
        keyDetails.push({
          key,
          type: 'unknown',
          ttl: 'error'
        })
      }
    }

    return ResponseHelper.success(c, {
      totalKeys: keys.length,
      keys: keyDetails,
      note: keys.length > 20 ? '仅显示前20个键' : '显示所有键'
    }, '获取缓存键成功')

  } catch (error: any) {
    console.error('❌ 获取缓存键失败:', error)
    return ResponseHelper.error(c, error.message || '获取缓存键失败', 500)
  }
})

// 清除所有项目相关缓存
cacheRoutes.delete('/cache/projects', async (c) => {
  try {
    console.log('🧹 清除所有项目相关缓存')

    await CacheService.deletePattern(CacheKeys.allProjectsPattern())

    return ResponseHelper.success(c, null, '项目缓存清除成功')

  } catch (error: any) {
    console.error('❌ 清除项目缓存失败:', error)
    return ResponseHelper.error(c, error.message || '清除项目缓存失败', 500)
  }
})

// 清除所有缓存
cacheRoutes.delete('/cache/all', async (c) => {
  try {
    console.log('🧹 清除所有缓存')

    await redis.flushDb()

    return ResponseHelper.success(c, null, '所有缓存清除成功')

  } catch (error: any) {
    console.error('❌ 清除所有缓存失败:', error)
    return ResponseHelper.error(c, error.message || '清除所有缓存失败', 500)
  }
})

// 测试缓存连接
cacheRoutes.get('/cache/ping', async (c) => {
  try {
    console.log('🏓 测试缓存连接')

    const result = await redis.ping()
    
    return ResponseHelper.success(c, {
      ping: result,
      connected: result === 'PONG',
      timestamp: new Date().toISOString()
    }, '缓存连接正常')

  } catch (error: any) {
    console.error('❌ 缓存连接测试失败:', error)
    return ResponseHelper.error(c, error.message || '缓存连接失败', 500)
  }
})

export { cacheRoutes }