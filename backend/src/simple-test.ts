// 简单的系统测试脚本
import { prisma } from './lib/database.js'

async function simpleTest() {
  console.log('🧪 开始简单系统测试...')

  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 2. 测试数据库查询
    console.log('2️⃣ 测试数据库查询...')
    const count = await prisma.project.count()
    console.log(`✅ 当前项目数量: ${count}`)

    // 3. 测试插入数据
    console.log('3️⃣ 测试插入数据...')
    const testProject = await prisma.project.create({
      data: {
        name: `测试项目_${Date.now()}`
      }
    })
    console.log(`✅ 插入测试项目成功: ${testProject.name}`)

    // 4. 测试查询数据
    console.log('4️⃣ 测试查询数据...')
    const projects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    console.log(`✅ 查询到 ${projects.length} 个项目:`)
    projects.forEach(p => console.log(`   - ${p.name}`))

    // 5. 清理测试数据
    console.log('5️⃣ 清理测试数据...')
    await prisma.project.delete({
      where: { id: testProject.id }
    })
    console.log('✅ 测试数据清理完成')

    console.log('\n🎉 所有测试通过！系统正常工作。')

  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    
    if (error.code === 'P1001') {
      console.log('\n🔧 数据库连接失败，请检查:')
      console.log('- PostgreSQL是否正在运行')
      console.log('- DATABASE_URL是否正确')
      console.log('- 数据库是否存在')
    } else if (error.code === 'P2002') {
      console.log('\n🔧 数据重复错误，这是正常的去重功能')
    } else {
      console.log('\n🔧 其他错误，请检查日志')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试
simpleTest().catch(console.error)