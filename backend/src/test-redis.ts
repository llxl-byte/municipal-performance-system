// 测试Redis缓存功能
import { CacheService } from './lib/redis.js'

async function testRedis() {
  console.log('🔍 开始测试Redis缓存功能...\n')

  try {
    // 测试1: 基本的设置和获取
    console.log('📝 测试1: 基本缓存操作')
    const testData = {
      message: '这是测试数据',
      timestamp: new Date().toISOString(),
      numbers: [1, 2, 3, 4, 5]
    }

    await CacheService.set('test:basic', testData, 30)
    const retrieved = await CacheService.get('test:basic')
    console.log('获取的数据:', retrieved)
    console.log('✅ 基本缓存操作成功\n')

    // 测试2: 缓存存在性检查
    console.log('📝 测试2: 缓存存在性检查')
    const exists = await CacheService.exists('test:basic')
    console.log('缓存是否存在:', exists)
    
    const ttl = await CacheService.ttl('test:basic')
    console.log('缓存剩余时间:', ttl, '秒')
    console.log('✅ 存在性检查成功\n')

    // 测试3: 缓存未命中
    console.log('📝 测试3: 缓存未命中测试')
    const notFound = await CacheService.get('test:notexist')
    console.log('不存在的缓存:', notFound)
    console.log('✅ 未命中测试成功\n')

    // 测试4: 模拟项目数据缓存
    console.log('📝 测试4: 模拟项目数据缓存')
    const projectsData = {
      projects: [
        { id: 1, name: '市政道路建设项目', createdAt: new Date() },
        { id: 2, name: '公园绿化项目', createdAt: new Date() },
        { id: 3, name: '污水处理项目', createdAt: new Date() }
      ],
      total: 3,
      page: 1,
      pageSize: 10
    }

    const cacheKey = 'projects:page:1:size:10:search:'
    await CacheService.set(cacheKey, projectsData, 60)
    
    const cachedProjects = await CacheService.get(cacheKey)
    console.log('缓存的项目数据:', cachedProjects)
    console.log('✅ 项目数据缓存成功\n')

    // 测试5: 批量删除缓存
    console.log('📝 测试5: 批量删除缓存')
    await CacheService.set('projects:page:1', { data: 'test1' }, 60)
    await CacheService.set('projects:page:2', { data: 'test2' }, 60)
    await CacheService.set('projects:search:test', { data: 'test3' }, 60)
    
    console.log('删除所有projects相关缓存...')
    await CacheService.deletePattern('projects:*')
    console.log('✅ 批量删除成功\n')

    // 清理测试数据
    await CacheService.delete('test:basic')
    console.log('🧹 测试数据清理完成')

  } catch (error) {
    console.error('❌ Redis测试失败:', error)
  }

  console.log('\n🎉 Redis缓存测试完成！')
  process.exit(0)
}

testRedis()