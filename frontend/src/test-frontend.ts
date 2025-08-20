// 前端API测试
import { projectApi, healthApi } from './services/api'

async function testFrontendAPI() {
  console.log('🔍 开始测试前端API服务...\n')

  try {
    // 测试1: 健康检查
    console.log('📝 测试1: 健康检查')
    const healthResponse = await healthApi.checkHealth()
    console.log('健康检查结果:', healthResponse.success ? '✅ 成功' : '❌ 失败')
    console.log('服务信息:', healthResponse.data)

    // 测试2: 获取项目统计
    console.log('\n📝 测试2: 获取项目统计')
    const statsResponse = await projectApi.getStats()
    console.log('统计结果:', statsResponse.success ? '✅ 成功' : '❌ 失败')
    console.log('项目总数:', statsResponse.data?.total)

    // 测试3: 获取项目列表
    console.log('\n📝 测试3: 获取项目列表')
    const projectsResponse = await projectApi.getProjects(1, 5)
    console.log('项目列表:', projectsResponse.success ? '✅ 成功' : '❌ 失败')
    console.log('项目数量:', projectsResponse.data?.items.length)
    console.log('总页数:', projectsResponse.data?.totalPages)

    // 测试4: 搜索项目
    console.log('\n📝 测试4: 搜索项目')
    const searchResponse = await projectApi.getProjects(1, 10, '项目')
    console.log('搜索结果:', searchResponse.success ? '✅ 成功' : '❌ 失败')
    console.log('匹配项目:', searchResponse.data?.total)

    console.log('\n🎉 前端API测试完成！')

  } catch (error) {
    console.error('❌ 前端API测试失败:', error)
    console.log('\n💡 请确保后端服务器正在运行')
  }
}

// 如果在Node.js环境中运行
if (typeof window === 'undefined') {
  testFrontendAPI()
}

export { testFrontendAPI }