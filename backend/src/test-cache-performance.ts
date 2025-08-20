// 缓存性能测试
async function testCachePerformance() {
  const baseUrl = 'http://localhost:8000'
  
  console.log('🚀 开始缓存性能测试...\n')

  try {
    // 测试1: 首次查询（缓存未命中）
    console.log('📝 测试1: 首次查询项目列表（缓存未命中）')
    const start1 = Date.now()
    const response1 = await fetch(`${baseUrl}/api/projects?page=1&pageSize=5`)
    const data1 = await response1.json()
    const time1 = Date.now() - start1
    
    console.log(`⏱️ 首次查询耗时: ${time1}ms`)
    console.log(`📊 返回数据: ${data1.data.items.length}条项目`)
    console.log(`🔍 是否来自缓存: ${data1.cached ? '是' : '否'}`)
    console.log('✅ 首次查询测试完成\n')

    // 等待1秒确保缓存已设置
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 测试2: 第二次查询（缓存命中）
    console.log('📝 测试2: 第二次查询相同数据（缓存命中）')
    const start2 = Date.now()
    const response2 = await fetch(`${baseUrl}/api/projects?page=1&pageSize=5`)
    const data2 = await response2.json()
    const time2 = Date.now() - start2
    
    console.log(`⏱️ 缓存查询耗时: ${time2}ms`)
    console.log(`📊 返回数据: ${data2.data.items.length}条项目`)
    console.log(`🔍 是否来自缓存: ${data2.cached ? '是' : '否'}`)
    console.log(`🚀 性能提升: ${((time1 - time2) / time1 * 100).toFixed(1)}%`)
    console.log('✅ 缓存命中测试完成\n')

    // 测试3: 不同参数查询（新的缓存键）
    console.log('📝 测试3: 不同参数查询（新的缓存键）')
    const start3 = Date.now()
    const response3 = await fetch(`${baseUrl}/api/projects?page=2&pageSize=3`)
    const data3 = await response3.json()
    const time3 = Date.now() - start3
    
    console.log(`⏱️ 新参数查询耗时: ${time3}ms`)
    console.log(`📊 返回数据: ${data3.data.items.length}条项目`)
    console.log(`🔍 是否来自缓存: ${data3.cached ? '是' : '否'}`)
    console.log('✅ 新参数查询测试完成\n')

    // 测试4: 搜索查询缓存
    console.log('📝 测试4: 搜索查询缓存测试')
    const start4 = Date.now()
    const response4 = await fetch(`${baseUrl}/api/projects?search=项目&pageSize=10`)
    const data4 = await response4.json()
    const time4 = Date.now() - start4
    
    console.log(`⏱️ 搜索查询耗时: ${time4}ms`)
    console.log(`📊 搜索结果: ${data4.data.total}条匹配项目`)
    console.log(`🔍 是否来自缓存: ${data4.cached ? '是' : '否'}`)
    
    // 再次搜索相同关键词
    const start4b = Date.now()
    const response4b = await fetch(`${baseUrl}/api/projects?search=项目&pageSize=10`)
    const data4b = await response4b.json()
    const time4b = Date.now() - start4b
    
    console.log(`⏱️ 重复搜索耗时: ${time4b}ms`)
    console.log(`🔍 是否来自缓存: ${data4b.cached ? '是' : '否'}`)
    console.log(`🚀 搜索性能提升: ${((time4 - time4b) / time4 * 100).toFixed(1)}%`)
    console.log('✅ 搜索缓存测试完成\n')

    // 测试5: 缓存失效测试
    console.log('📝 测试5: 缓存失效测试')
    console.log('创建新项目以触发缓存失效...')
    
    const createResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `缓存测试项目-${Date.now()}` })
    })
    const createData = await createResponse.json()
    console.log(`➕ 创建项目: ${createData.data.name}`)
    
    // 等待缓存失效处理
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 再次查询第一页数据
    const start5 = Date.now()
    const response5 = await fetch(`${baseUrl}/api/projects?page=1&pageSize=5`)
    const data5 = await response5.json()
    const time5 = Date.now() - start5
    
    console.log(`⏱️ 缓存失效后查询耗时: ${time5}ms`)
    console.log(`📊 返回数据: ${data5.data.items.length}条项目`)
    console.log(`🔍 是否来自缓存: ${data5.cached ? '是' : '否'}`)
    console.log('✅ 缓存失效测试完成\n')

    // 测试6: 并发查询测试
    console.log('📝 测试6: 并发查询测试')
    const concurrentRequests = 5
    const promises = []
    
    const concurrentStart = Date.now()
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(fetch(`${baseUrl}/api/projects?page=1&pageSize=5`))
    }
    
    const concurrentResponses = await Promise.all(promises)
    const concurrentTime = Date.now() - concurrentStart
    
    console.log(`⏱️ ${concurrentRequests}个并发请求总耗时: ${concurrentTime}ms`)
    console.log(`⚡ 平均每个请求耗时: ${(concurrentTime / concurrentRequests).toFixed(1)}ms`)
    
    let cachedCount = 0
    for (const response of concurrentResponses) {
      const data = await response.json()
      if (data.cached) cachedCount++
    }
    
    console.log(`🎯 缓存命中次数: ${cachedCount}/${concurrentRequests}`)
    console.log('✅ 并发查询测试完成\n')

    // 总结
    console.log('📊 缓存性能测试总结:')
    console.log(`- 首次查询: ${time1}ms`)
    console.log(`- 缓存查询: ${time2}ms (提升${((time1 - time2) / time1 * 100).toFixed(1)}%)`)
    console.log(`- 搜索缓存: ${time4}ms → ${time4b}ms (提升${((time4 - time4b) / time4 * 100).toFixed(1)}%)`)
    console.log(`- 并发处理: ${concurrentRequests}个请求${concurrentTime}ms`)
    console.log(`- 缓存命中率: ${(cachedCount / concurrentRequests * 100).toFixed(1)}%`)

  } catch (error) {
    console.error('❌ 缓存性能测试失败:', error)
    console.log('\n💡 请确保服务器正在运行: npm run dev')
  }

  console.log('\n🎉 缓存性能测试完成！')
}

testCachePerformance()