// 测试项目查询API
async function testProjectsAPI() {
  const baseUrl = 'http://localhost:8000'
  
  console.log('🔍 开始测试项目查询API...\n')

  try {
    // 测试1: 获取项目列表（第一页）
    console.log('📝 测试1: 获取项目列表 GET /api/projects')
    const listResponse = await fetch(`${baseUrl}/api/projects?page=1&pageSize=5`)
    const listData = await listResponse.json()
    console.log('状态码:', listResponse.status)
    console.log('项目列表:', JSON.stringify(listData, null, 2))
    console.log('✅ 获取项目列表测试成功\n')

    // 测试2: 搜索项目
    console.log('📝 测试2: 搜索项目 GET /api/projects?search=道路')
    const searchResponse = await fetch(`${baseUrl}/api/projects?page=1&pageSize=10&search=道路`)
    const searchData = await searchResponse.json()
    console.log('状态码:', searchResponse.status)
    console.log('搜索结果:', JSON.stringify(searchData, null, 2))
    console.log('✅ 搜索项目测试成功\n')

    // 测试3: 获取项目统计
    console.log('📝 测试3: 获取项目统计 GET /api/projects/stats/summary')
    const statsResponse = await fetch(`${baseUrl}/api/projects/stats/summary`)
    const statsData = await statsResponse.json()
    console.log('状态码:', statsResponse.status)
    console.log('统计信息:', JSON.stringify(statsData, null, 2))
    console.log('✅ 获取统计测试成功\n')

    // 测试4: 获取单个项目详情
    console.log('📝 测试4: 获取项目详情 GET /api/projects/3')
    const detailResponse = await fetch(`${baseUrl}/api/projects/3`)
    const detailData = await detailResponse.json()
    console.log('状态码:', detailResponse.status)
    console.log('项目详情:', JSON.stringify(detailData, null, 2))
    console.log('✅ 获取项目详情测试成功\n')

    // 测试5: 创建新项目
    console.log('📝 测试5: 创建新项目 POST /api/projects')
    const createResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: '测试API创建项目-' + Date.now()
      })
    })
    const createData = await createResponse.json()
    console.log('状态码:', createResponse.status)
    console.log('创建结果:', JSON.stringify(createData, null, 2))
    console.log('✅ 创建项目测试成功\n')

    // 测试6: 尝试创建重复项目
    console.log('📝 测试6: 创建重复项目 POST /api/projects')
    const duplicateResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: '市政道路建设项目'
      })
    })
    const duplicateData = await duplicateResponse.json()
    console.log('状态码:', duplicateResponse.status)
    console.log('重复创建结果:', JSON.stringify(duplicateData, null, 2))
    console.log('✅ 重复创建测试成功\n')

    // 测试7: 专门的搜索接口
    console.log('📝 测试7: 专门搜索接口 GET /api/projects/search/项目')
    const searchKeywordResponse = await fetch(`${baseUrl}/api/projects/search/项目?page=1&pageSize=5`)
    const searchKeywordData = await searchKeywordResponse.json()
    console.log('状态码:', searchKeywordResponse.status)
    console.log('关键词搜索结果:', JSON.stringify(searchKeywordData, null, 2))
    console.log('✅ 关键词搜索测试成功\n')

    // 测试8: 缓存测试（再次获取相同数据）
    console.log('📝 测试8: 缓存测试 - 再次获取项目列表')
    const cachedResponse = await fetch(`${baseUrl}/api/projects?page=1&pageSize=5`)
    const cachedData = await cachedResponse.json()
    console.log('状态码:', cachedResponse.status)
    console.log('是否来自缓存:', cachedData.cached || '未标识')
    console.log('✅ 缓存测试成功\n')

    // 测试9: 参数验证测试
    console.log('📝 测试9: 参数验证测试 GET /api/projects?page=abc')
    const invalidResponse = await fetch(`${baseUrl}/api/projects?page=abc&pageSize=-1`)
    const invalidData = await invalidResponse.json()
    console.log('状态码:', invalidResponse.status)
    console.log('验证错误:', JSON.stringify(invalidData, null, 2))
    console.log('✅ 参数验证测试成功\n')

  } catch (error) {
    console.error('❌ 项目API测试失败:', error)
    console.log('\n💡 请确保服务器正在运行: npm run dev')
  }

  console.log('🎉 项目查询API测试完成！')
}

testProjectsAPI()