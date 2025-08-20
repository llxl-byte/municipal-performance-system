// 快速API测试
import fetch from 'node-fetch'

async function quickTest() {
  console.log('🧪 快速API测试...')
  
  try {
    // 测试健康检查
    console.log('1️⃣ 测试健康检查...')
    const response = await fetch('http://localhost:8000/api/health')
    const data = await response.json()
    console.log('✅ 健康检查:', data)

    // 测试项目列表
    console.log('2️⃣ 测试项目列表...')
    const projectsResponse = await fetch('http://localhost:8000/api/projects')
    const projectsData = await projectsResponse.json()
    console.log('✅ 项目列表:', projectsData.data?.total || 0, '个项目')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

quickTest()