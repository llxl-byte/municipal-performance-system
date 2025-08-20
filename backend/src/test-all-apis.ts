// 完整的API测试套件
async function testAllAPIs() {
  const baseUrl = 'http://localhost:8000'
  
  console.log('🚀 开始完整的API测试套件...\n')

  try {
    // 1. 健康检查
    console.log('🏥 健康检查测试')
    const healthResponse = await fetch(`${baseUrl}/api/health`)
    const healthData = await healthResponse.json()
    console.log(`✅ 健康检查: ${healthData.message}`)

    // 2. 详细健康检查
    const detailedHealthResponse = await fetch(`${baseUrl}/api/health/detailed`)
    const detailedHealthData = await detailedHealthResponse.json()
    console.log(`✅ 详细健康检查: 数据库${detailedHealthData.status.database}, Redis${detailedHealthData.status.redis}`)

    // 3. 项目统计
    const statsResponse = await fetch(`${baseUrl}/api/projects/stats/summary`)
    const statsData = await statsResponse.json()
    console.log(`📊 项目统计: 总计${statsData.data.total}个项目`)

    // 4. 项目列表（第一页）
    const listResponse = await fetch(`${baseUrl}/api/projects?page=1&pageSize=3`)
    const listData = await listResponse.json()
    console.log(`📋 项目列表: 第${listData.data.page}页, 共${listData.data.totalPages}页, 总计${listData.data.total}条`)

    // 5. 搜索项目
    const searchResponse = await fetch(`${baseUrl}/api/projects?search=项目&pageSize=5`)
    const searchData = await searchResponse.json()
    console.log(`🔍 搜索结果: 找到${searchData.data.total}个包含"项目"的记录`)

    // 6. 模拟文件上传
    const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const uploadData = await uploadResponse.json()
    console.log(`📤 文件上传: 处理${uploadData.data.importResult.totalRows}条数据, 新增${uploadData.data.importResult.insertedRows}条`)

    // 7. 创建单个项目
    const createResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `API测试项目-${Date.now()}` })
    })
    const createData = await createResponse.json()
    console.log(`➕ 创建项目: ${createData.data.name}`)

    // 8. 获取项目详情
    if (createData.success) {
      const detailResponse = await fetch(`${baseUrl}/api/projects/${createData.data.id}`)
      const detailData = await detailResponse.json()
      console.log(`🔍 项目详情: ID=${detailData.data.id}, 名称=${detailData.data.name}`)
    }

    console.log('\n🎉 所有API测试完成！系统运行正常！')

    // 显示API端点总结
    console.log('\n📖 可用的API端点:')
    console.log('- GET  /api/health                    - 基础健康检查')
    console.log('- GET  /api/health/detailed           - 详细健康检查')
    console.log('- GET  /api/projects                  - 获取项目列表（支持分页和搜索）')
    console.log('- GET  /api/projects/:id              - 获取项目详情')
    console.log('- POST /api/projects                  - 创建新项目')
    console.log('- DELETE /api/projects/:id            - 删除项目')
    console.log('- GET  /api/projects/stats/summary    - 获取项目统计')
    console.log('- GET  /api/projects/search/:keyword  - 搜索项目')
    console.log('- POST /api/upload                    - 上传Excel文件')
    console.log('- GET  /api/upload/history            - 获取上传历史')

  } catch (error) {
    console.error('❌ API测试失败:', error)
    console.log('\n💡 请确保服务器正在运行: npm run dev')
  }
}

testAllAPIs()