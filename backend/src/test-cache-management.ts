// 测试缓存管理功能
async function testCacheManagement() {
  const baseUrl = 'http://localhost:8000'
  
  console.log('🔍 开始测试缓存管理功能...\n')

  try {
    // 测试1: 缓存连接测试
    console.log('📝 测试1: 缓存连接测试')
    const pingResponse = await fetch(`${baseUrl}/api/cache/ping`)
    const pingData = await pingResponse.json()
    console.log('连接状态:', pingData.data.connected ? '正常' : '异常')
    console.log('Ping结果:', pingData.data.ping)
    console.log('✅ 连接测试完成\n')

    // 先创建一些缓存数据
    console.log('📝 准备测试数据: 创建一些缓存')
    await fetch(`${baseUrl}/api/projects?page=1&pageSize=3`)
    await fetch(`${baseUrl}/api/projects?search=项目&pageSize=5`)
    await fetch(`${baseUrl}/api/projects/stats/summary`)
    console.log('✅ 测试数据准备完成\n')

    // 测试2: 获取缓存统计
    console.log('📝 测试2: 获取缓存统计')
    const statsResponse = await fetch(`${baseUrl}/api/cache/stats`)
    const statsData = await statsResponse.json()
    console.log('缓存键数量:', statsData.data.keyCount)
    console.log('内存使用:', statsData.data.memoryUsage.used)
    console.log('最大内存:', statsData.data.memoryUsage.max)
    console.log('✅ 缓存统计测试完成\n')

    // 测试3: 获取缓存键列表
    console.log('📝 测试3: 获取缓存键列表')
    const keysResponse = await fetch(`${baseUrl}/api/cache/keys`)
    const keysData = await keysResponse.json()
    console.log('总键数:', keysData.data.totalKeys)
    console.log('键详情:')
    keysData.data.keys.forEach((key: any, index: number) => {
      console.log(`  ${index + 1}. ${key.key} (${key.type}, TTL: ${key.ttl})`)
    })
    console.log('✅ 缓存键列表测试完成\n')

    // 测试4: 清除项目相关缓存
    console.log('📝 测试4: 清除项目相关缓存')
    const clearProjectsResponse = await fetch(`${baseUrl}/api/cache/projects`, {
      method: 'DELETE'
    })
    const clearProjectsData = await clearProjectsResponse.json()
    console.log('清除结果:', clearProjectsData.message)
    console.log('✅ 项目缓存清除测试完成\n')

    // 验证缓存是否被清除
    console.log('📝 验证缓存清除效果')
    const afterClearResponse = await fetch(`${baseUrl}/api/projects?page=1&pageSize=3`)
    const afterClearData = await afterClearResponse.json()
    console.log('查询后是否来自缓存:', afterClearData.cached ? '是（清除失败）' : '否（清除成功）')
    console.log('✅ 缓存清除验证完成\n')

    // 测试5: 缓存性能对比
    console.log('📝 测试5: 缓存性能对比')
    
    // 第一次查询（数据库）
    const start1 = Date.now()
    await fetch(`${baseUrl}/api/projects?page=2&pageSize=5`)
    const duration1 = Date.now() - start1
    
    // 第二次查询（缓存）
    const start2 = Date.now()
    const cachedResponse = await fetch(`${baseUrl}/api/projects?page=2&pageSize=5`)
    const duration2 = Date.now() - start2
    const cachedData = await cachedResponse.json()
    
    console.log('数据库查询时间:', duration1 + 'ms')
    console.log('缓存查询时间:', duration2 + 'ms')
    console.log('性能提升:', Math.round((duration1 - duration2) / duration1 * 100) + '%')
    console.log('是否来自缓存:', cachedData.cached ? '是' : '否')
    console.log('✅ 性能对比测试完成\n')

    console.log('🎉 缓存管理功能测试完成！')
    
    // 显示缓存管理API总结
    console.log('\n📖 缓存管理API端点:')
    console.log('- GET    /api/cache/ping      - 测试缓存连接')
    console.log('- GET    /api/cache/stats     - 获取缓存统计')
    console.log('- GET    /api/cache/keys      - 获取缓存键列表')
    console.log('- DELETE /api/cache/projects  - 清除项目相关缓存')
    console.log('- DELETE /api/cache/all       - 清除所有缓存')

  } catch (error) {
    console.error('❌ 缓存管理测试失败:', error)
    console.log('\n💡 请确保服务器和Redis都在运行')
  }
}

testCacheManagement()