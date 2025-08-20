// 测试服务器API接口
async function testServer() {
  const baseUrl = 'http://localhost:8000'
  
  console.log('🔍 开始测试服务器API接口...\n')

  try {
    // 测试1: 根路径
    console.log('📝 测试1: 根路径 GET /')
    const rootResponse = await fetch(baseUrl)
    const rootData = await rootResponse.json()
    console.log('状态码:', rootResponse.status)
    console.log('响应数据:', rootData)
    console.log('✅ 根路径测试成功\n')

    // 测试2: 健康检查
    console.log('📝 测试2: 健康检查 GET /api/health')
    const healthResponse = await fetch(`${baseUrl}/api/health`)
    const healthData = await healthResponse.json()
    console.log('状态码:', healthResponse.status)
    console.log('响应数据:', healthData)
    console.log('✅ 健康检查测试成功\n')

    // 测试3: 详细健康检查
    console.log('📝 测试3: 详细健康检查 GET /api/health/detailed')
    const detailedHealthResponse = await fetch(`${baseUrl}/api/health/detailed`)
    const detailedHealthData = await detailedHealthResponse.json()
    console.log('状态码:', detailedHealthResponse.status)
    console.log('响应数据:', detailedHealthData)
    console.log('✅ 详细健康检查测试成功\n')

    // 测试4: 404错误
    console.log('📝 测试4: 404错误 GET /api/notfound')
    const notFoundResponse = await fetch(`${baseUrl}/api/notfound`)
    const notFoundData = await notFoundResponse.json()
    console.log('状态码:', notFoundResponse.status)
    console.log('响应数据:', notFoundData)
    console.log('✅ 404错误处理测试成功\n')

  } catch (error) {
    console.error('❌ 服务器测试失败:', error)
    console.log('\n💡 请确保服务器正在运行: npm run dev')
  }

  console.log('🎉 服务器API测试完成！')
}

testServer()