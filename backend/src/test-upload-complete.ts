// 完整的上传功能测试脚本
// 📚 知识点：这个脚本会测试整个上传流程，帮助诊断问题

import { promises as fs } from 'fs'
import path from 'path'
import { ExcelService } from './services/excel.js'
import { ProjectService } from './services/projectService.js'
import { prisma } from './lib/database.js'
import { redis } from './lib/redis.js'

async function testCompleteUploadFlow() {
  console.log('🧪 开始完整上传流程测试...\n')

  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...')
    try {
      await prisma.$connect()
      const result = await prisma.$queryRaw`SELECT 1 as test`
      console.log('✅ 数据库连接成功:', result)
    } catch (error) {
      console.error('❌ 数据库连接失败:', error)
      throw error
    }

    // 2. 测试Redis连接
    console.log('\n2️⃣ 测试Redis连接...')
    try {
      await redis.ping()
      console.log('✅ Redis连接成功')
    } catch (error) {
      console.error('❌ Redis连接失败:', error)
      console.log('⚠️ 继续测试，但缓存功能可能不可用')
    }

    // 3. 创建测试Excel文件
    console.log('\n3️⃣ 创建测试Excel文件...')
    const testExcelPath = await createTestExcelFile()
    console.log('✅ 测试Excel文件创建成功:', testExcelPath)

    // 4. 测试Excel解析
    console.log('\n4️⃣ 测试Excel解析...')
    const fileBuffer = await fs.readFile(testExcelPath)
    
    // 验证文件
    const validation = ExcelService.validateExcelFile(fileBuffer, 'test.xlsx')
    if (!validation.valid) {
      throw new Error(`文件验证失败: ${validation.error}`)
    }
    console.log('✅ 文件验证通过')

    // 解析文件
    const parseResult = ExcelService.parseExcelBuffer(fileBuffer)
    console.log('✅ Excel解析结果:')
    console.log(`   - 总行数: ${parseResult.totalRows}`)
    console.log(`   - 有效行数: ${parseResult.validRows}`)
    console.log(`   - 项目数量: ${parseResult.projects.length}`)
    console.log(`   - 错误数量: ${parseResult.errors.length}`)
    
    if (parseResult.errors.length > 0) {
      console.log('   - 错误详情:', parseResult.errors)
    }

    // 5. 测试数据导入
    console.log('\n5️⃣ 测试数据导入...')
    const projectsData = parseResult.projects.map(name => ({ name }))
    
    if (projectsData.length === 0) {
      throw new Error('没有有效的项目数据可导入')
    }

    const importResult = await ProjectService.batchImport(projectsData)
    console.log('✅ 数据导入结果:')
    console.log(`   - 总行数: ${importResult.totalRows}`)
    console.log(`   - 新增行数: ${importResult.insertedRows}`)
    console.log(`   - 重复行数: ${importResult.duplicateRows}`)
    console.log(`   - 新增项目: ${importResult.insertedProjects.map(p => p.name).join(', ')}`)
    
    if (importResult.duplicateProjects.length > 0) {
      console.log(`   - 重复项目: ${importResult.duplicateProjects.join(', ')}`)
    }

    // 6. 测试数据查询
    console.log('\n6️⃣ 测试数据查询...')
    const queryResult = await ProjectService.getProjects(1, 10, '')
    console.log('✅ 数据查询结果:')
    console.log(`   - 总数: ${queryResult.total}`)
    console.log(`   - 当前页: ${queryResult.page}`)
    console.log(`   - 页大小: ${queryResult.pageSize}`)
    console.log(`   - 项目列表: ${queryResult.projects.map(p => p.name).join(', ')}`)

    // 7. 测试搜索功能
    console.log('\n7️⃣ 测试搜索功能...')
    if (queryResult.projects.length > 0) {
      const firstProject = queryResult.projects[0]
      const searchKeyword = firstProject.name.substring(0, 3) // 取前3个字符搜索
      const searchResult = await ProjectService.getProjects(1, 10, searchKeyword)
      console.log(`✅ 搜索结果 (关键词: "${searchKeyword}"):`)
      console.log(`   - 找到: ${searchResult.total} 个项目`)
      console.log(`   - 项目列表: ${searchResult.projects.map(p => p.name).join(', ')}`)
    }

    // 8. 测试统计功能
    console.log('\n8️⃣ 测试统计功能...')
    const stats = await ProjectService.getProjectStats()
    console.log('✅ 统计结果:')
    console.log(`   - 项目总数: ${stats.total}`)
    console.log(`   - 最后更新: ${stats.lastUpdated}`)

    // 9. 清理测试文件
    console.log('\n9️⃣ 清理测试文件...')
    await fs.unlink(testExcelPath)
    console.log('✅ 测试文件清理完成')

    console.log('\n🎉 所有测试通过！上传功能正常工作。')

  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    console.error('错误详情:', error.stack)
    
    // 提供诊断建议
    console.log('\n🔧 诊断建议:')
    if (error.message.includes('数据库')) {
      console.log('- 检查PostgreSQL是否正在运行')
      console.log('- 检查DATABASE_URL环境变量是否正确')
      console.log('- 运行 npm run db:push 确保数据库表已创建')
    }
    if (error.message.includes('Redis')) {
      console.log('- 检查Redis是否正在运行')
      console.log('- 检查REDIS_URL环境变量是否正确')
    }
    if (error.message.includes('Excel') || error.message.includes('解析')) {
      console.log('- 检查Excel文件格式是否正确')
      console.log('- 确保第一列包含项目名称')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * 📚 知识点：创建测试Excel文件
 * 使用xlsx库创建一个包含测试数据的Excel文件
 */
async function createTestExcelFile(): Promise<string> {
  const XLSX = await import('xlsx')
  
  // 创建测试数据
  const testData = [
    ['项目名称'], // 表头
    ['市政道路建设项目A'],
    ['公园绿化工程B'],
    ['污水处理厂建设C'],
    ['城市照明改造D'],
    ['桥梁维修工程E'],
    [''], // 空行测试
    ['地铁站建设F'],
    ['垃圾处理中心G']
  ]

  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(testData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

  // 保存文件
  const testFilePath = path.join(process.cwd(), 'test-upload.xlsx')
  XLSX.writeFile(workbook, testFilePath)
  
  return testFilePath
}

/**
 * 📚 知识点：环境检查函数
 * 检查必要的环境变量和依赖
 */
async function checkEnvironment() {
  console.log('🔍 检查环境配置...')
  
  const requiredEnvVars = ['DATABASE_URL']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ 缺少必要的环境变量:', missingVars.join(', '))
    console.log('请创建.env文件并设置以下变量:')
    missingVars.forEach(varName => {
      if (varName === 'DATABASE_URL') {
        console.log(`${varName}=postgresql://username:password@localhost:5432/database_name`)
      } else if (varName === 'REDIS_URL') {
        console.log(`${varName}=redis://localhost:6379`)
      }
    })
    process.exit(1)
  }
  
  console.log('✅ 环境变量检查通过')
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  checkEnvironment()
    .then(() => testCompleteUploadFlow())
    .catch(console.error)
}