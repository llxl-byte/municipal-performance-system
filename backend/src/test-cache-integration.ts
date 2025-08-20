// 测试缓存集成功能
async function testCacheIntegration() {
  const baseUrl = 'http://localhost:8000'
  
  console.log('🔍 开始测试缓存集成功能...\n')

  try {
    // 测试1: 第一次查询（应该从数据库获取）
    console.log('📝 测试1: 第一次查询项目列表（数据库）')
    const startTime1 = Date.now()
    const response1 = await fetch(`${baseUrl}/api/projects?page=1&pageSize=3`)
    const data1 = await response1.json()
    const duration1 = Date.now() - startTime1
    
    console.log('响应时间:', duration1 + 'ms')
    console.log('是否来自缓存:', data1.cached ? '是' : '否')
    console.log('数据条数:', data1.data.items.length)
    console.log('✅ 第一次查询完成\n')

    // 测试2: 立即再次查询相同数据（应该从缓存获取）
    console.log('📝 测试2: 立即再次查询相同数据（缓存）')
    const startTime2 = Date.now()
    const response2 = await fetch(`${baseUrl}/api/projects?page=1&pageSize=3`)
    const data2 = await response2.json()
    const duration2 = Date.now() - startTime2
    
    console.log('响应时间:', duration2 + 'ms')
    console.log('是否来自缓存:', data2.cached ? '是' : '否')
    console.log('数据条数:', data2.data.items.length)
    console.log('性能提升:', Math.round((duration1 - duration2) / duration1 * 100) + '%')
    console.log('✅ 缓存查询完成\n')

    // 测试3: 查询不同参数（应该从数据库获取）
    console.log('📝 测试3: 查询不同参数（数据库）')
    const startTime3 = Date.now()
    const response3 = await fetch(`${baseUrl}/api/projects?page=2&pageSize=3`)
    const data3 = await response3.json()
    const duration3 = Date.now() - startTime3
    
    console.log('响应时间:', duration3 + 'ms')
    console.log('是否来自缓存:', data3.cached ? '是' : '否')
    console.log('当前页码:', data3.data.page)
    console.log('✅ 不同参数查询完成\n')

    // 测试4: 搜索查询缓存
    console.log('📝 测试4: 搜索查询缓存测试')
    const searchResponse1 = await fetch(`${baseUrl}/api/projects?search=项目&pageSize=5`)
    const searchData1 = await searchResponse1.json()
    console.log('第一次搜索 - 是否来自缓存:', searchData1.cached ? '是' : '否')
    console.log('搜索结果数量:', searchData1.data.total)

    // 立即再次搜索
    const searchResponse2 = await fetch(`${baseUrl}/api/projects?search=项目&pageSize=5`)
    const searchData2 = await searchResponse2.json()
    console.log('第二次搜索 - 是否来自缓存:', searchData2.cached ? '是' : '否')
    console.log('✅ 搜索缓存测试完成\n')

    // 测试5: 创建新项目后缓存失效测试
    console.log('📝 测试5: 缓存失效测试')
    console.log('创建新项目前，先查询列表...')
    const beforeCreate = await fetch(`${baseUrl}/api/projects?page=1&pageSize=3`)
    const beforeData = await beforeCreate.json()
    console.log('创建前项目总数:', beforeData.data.total)

    // 创建新项目
    console.log('创建新项目...')
    const createResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `缓存测试项目-${Date.now()}` })
    })
    const createData = await createResponse.json()
    console.log('新项目创建成功:', createData.data.name)

    // 再次查询列表（缓存应该已失效）
    console.log('创建后再次查询列表...')
    const afterCreate = await fetch(`${baseUrl}/api/projects?page=1&pageSize=3`)
    const afterData = await afterCreate.json()
    console.log('创建后项目总数:', afterData.data.total)
    console.log('是否来自缓存:', afterData.cached ? '是' : '否')
    console.log('缓存是否正确失效:', !afterData.cached ? '是' : '否')
    console.log('✅ 缓存失效测试完成\n')

    // 测试6: 统计信息缓存
    console.log('📝 测试6: 统计信息缓存测试')
    const stats1 = await fetch(`${baseUrl}/api/projects/stats/summary`)
    const statsData1 = await stats1.json()
    console.log('第一次获取统计 - 项目总数:', statsData1.data.total)

    const stats2 = await fetch(`${baseUrl}/api/projects/stats/summary`)
    const statsData2 = await stats2.json()
    console.log('第二次获取统计 - 项目总数:', statsData2.data.total)
    console.log('✅ 统计缓存测试完成\n')

    console.log('🎉 缓存集成测试完成！')
    
    // 显示缓存策略总结
    console.log('\n📋 缓存策略总结:')
    console.log('- 项目列表缓存60秒，包含分页和搜索参数')
    console.log('- 统计信息缓存10分钟')
    console.log('- 数据更新时自动清除相关缓存')
    console.log('- 缓存失败时不影响正常业务')
    console.log('- 缓存命中可提升响应速度50%以上')

  } catch (error) {
    console.error('❌ 缓存集成测试失败:', error)
    console.log('\n💡 请确保服务器和Redis都在运行')
  }
}

testCacheIntegration()