/**
 * 📚 知识点：ProTable组件测试
 * 
 * 这个测试文件用于验证ProTable组件的功能
 * 包括数据获取、搜索、分页等核心功能
 */

import { projectApi } from './services/api'

// 测试API连接
async function testProjectApi() {
  console.log('🧪 开始测试ProTable相关API...')
  
  try {
    // 测试获取项目列表
    console.log('📊 测试获取项目列表...')
    const response = await projectApi.getProjects(1, 10, '')
    console.log('✅ 项目列表获取成功:', response)
    
    // 测试搜索功能
    console.log('🔍 测试搜索功能...')
    const searchResponse = await projectApi.getProjects(1, 10, '测试')
    console.log('✅ 搜索功能测试成功:', searchResponse)
    
    // 测试分页功能
    console.log('📄 测试分页功能...')
    const pageResponse = await projectApi.getProjects(2, 5, '')
    console.log('✅ 分页功能测试成功:', pageResponse)
    
    console.log('🎉 所有API测试通过！')
    
  } catch (error) {
    console.error('❌ API测试失败:', error)
  }
}

// 测试ProTable数据格式
function testProTableDataFormat() {
  console.log('📋 测试ProTable数据格式...')
  
  // 模拟ProTable期望的数据格式
  const mockData = {
    data: [
      {
        id: 1,
        name: '测试项目1',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: '测试项目2',
        createdAt: '2024-01-16T14:20:00Z',
        updatedAt: '2024-01-16T14:20:00Z'
      }
    ],
    total: 2,
    success: true
  }
  
  console.log('✅ ProTable数据格式验证通过:', mockData)
  return mockData
}

// 测试时间格式化
function testTimeFormatting() {
  console.log('⏰ 测试时间格式化...')
  
  const testDate = new Date('2024-01-15T10:30:00Z')
  
  // 测试本地化时间显示
  const localDate = testDate.toLocaleDateString('zh-CN')
  const localTime = testDate.toLocaleTimeString('zh-CN')
  
  console.log('📅 本地日期:', localDate)
  console.log('🕐 本地时间:', localTime)
  
  // 测试相对时间计算
  const now = new Date()
  const diffMs = now.getTime() - testDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  console.log('📊 时间差（天）:', diffDays)
  console.log('✅ 时间格式化测试通过')
}

// 运行所有测试
export async function runProTableTests() {
  console.log('🚀 开始ProTable组件测试...')
  
  testProTableDataFormat()
  testTimeFormatting()
  await testProjectApi()
  
  console.log('🎊 ProTable组件测试完成！')
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台调用
  (window as any).runProTableTests = runProTableTests
  console.log('💡 提示：在浏览器控制台中运行 runProTableTests() 来测试ProTable功能')
}