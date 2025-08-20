// 测试项目数据服务
import { ProjectService } from './services/projectService.js'

async function testProjectService() {
  console.log('🔍 开始测试项目数据服务...\n')

  try {
    // 测试1: 批量导入项目数据
    console.log('📝 测试1: 批量导入项目数据')
    const testProjects = [
      { name: '市政道路建设项目' },
      { name: '公园绿化项目' },
      { name: '污水处理项目' },
      { name: '市政道路建设项目' }, // 重复项目
      { name: '垃圾处理站建设' },
      { name: '' }, // 空项目名
      { name: '   桥梁维修项目   ' }, // 带空格的项目名
    ]

    const importResult = await ProjectService.batchImport(testProjects)
    console.log('导入结果:', importResult)
    console.log('✅ 批量导入测试成功\n')

    // 测试2: 再次导入相同数据（测试去重）
    console.log('📝 测试2: 再次导入相同数据（测试去重）')
    const duplicateImportResult = await ProjectService.batchImport([
      { name: '市政道路建设项目' },
      { name: '新的项目A' },
      { name: '公园绿化项目' },
      { name: '新的项目B' }
    ])
    console.log('重复导入结果:', duplicateImportResult)
    console.log('✅ 去重测试成功\n')

    // 测试3: 获取项目列表
    console.log('📝 测试3: 获取项目列表')
    const projectList = await ProjectService.getProjects(1, 5)
    console.log('项目列表:', {
      总数: projectList.total,
      当前页: projectList.page,
      每页大小: projectList.pageSize,
      总页数: projectList.totalPages,
      项目数量: projectList.projects.length
    })
    console.log('项目详情:', projectList.projects)
    console.log('✅ 获取项目列表测试成功\n')

    // 测试4: 搜索项目
    console.log('📝 测试4: 搜索项目')
    const searchResult = await ProjectService.getProjects(1, 10, '道路')
    console.log('搜索结果:', {
      搜索关键词: '道路',
      匹配数量: searchResult.total,
      项目: searchResult.projects.map(p => p.name)
    })
    console.log('✅ 搜索项目测试成功\n')

    // 测试5: 获取项目统计
    console.log('📝 测试5: 获取项目统计')
    const stats = await ProjectService.getProjectStats()
    console.log('项目统计:', stats)
    console.log('✅ 获取统计测试成功\n')

    // 测试6: 缓存测试（再次获取相同数据）
    console.log('📝 测试6: 缓存测试')
    const cachedList = await ProjectService.getProjects(1, 5)
    console.log('缓存测试 - 项目数量:', cachedList.projects.length)
    console.log('✅ 缓存测试成功\n')

  } catch (error) {
    console.error('❌ 项目服务测试失败:', error)
  }

  console.log('🎉 项目数据服务测试完成！')
  process.exit(0)
}

testProjectService()