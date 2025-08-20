// 测试数据库连接的脚本
import { prisma } from './lib/database.js'

async function testDatabase() {
  try {
    console.log('🔍 测试数据库连接...')
    
    // 测试连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功！')
    
    // 测试创建数据
    const testProject = await prisma.project.create({
      data: {
        name: '测试项目-' + Date.now()
      }
    })
    console.log('✅ 创建测试数据成功：', testProject)
    
    // 测试查询数据
    const allProjects = await prisma.project.findMany()
    console.log('✅ 查询所有项目：', allProjects)
    
    // 清理测试数据
    await prisma.project.delete({
      where: { id: testProject.id }
    })
    console.log('✅ 清理测试数据成功')
    
  } catch (error) {
    console.error('❌ 数据库测试失败：', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 数据库连接已关闭')
  }
}

testDatabase()