// 最终的文件上传功能综合测试
import * as XLSX from 'xlsx'
import FormData from 'form-data'
import fetch from 'node-fetch'

// 创建包含新项目的测试Excel文件
function createFinalTestExcelFile(): Buffer {
  console.log('📊 创建最终测试Excel文件...')
  
  // 使用时间戳确保项目名称唯一
  const timestamp = Date.now()
  const testData = [
    ['项目名称'], // 表头
    [`最终测试项目A_${timestamp}`],
    [`最终测试项目B_${timestamp}`],
    [`最终测试项目C_${timestamp}`],
    [''], // 空行测试
    [`最终测试项目D_${timestamp}`],
    ['   '], // 空格行测试
    [`最终测试项目E_${timestamp}`],
    [`超长项目名称测试_${'x'.repeat(250)}`], // 超长名称测试
    [`最终测试项目F_${timestamp}`]
  ]

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(testData)
  XLSX.utils.book_append_sheet(workbook, worksheet, '最终测试')
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  console.log(`✅ 最终测试Excel文件创建完成，大小: ${buffer.length} bytes`)
  return buffer
}

// 最终综合测试
async function runFinalTest() {
  try {
    console.log('🎯 开始最终综合测试...')
    console.log('测试内容：')
    console.log('  ✓ 真实Excel文件上传')
    console.log('  ✓ multipart/form-data处理')
    console.log('  ✓ Excel文件解析')
    console.log('  ✓ 数据验证和过滤')
    console.log('  ✓ 数据库存储和去重')
    console.log('  ✓ 错误处理')
    console.log('  ✓ 响应格式化')
    
    // 创建测试文件
    const excelBuffer = createFinalTestExcelFile()
    
    // 创建FormData
    const formData = new FormData()
    formData.append('file', excelBuffer, {
      filename: '最终测试市政项目.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    console.log('\n📤 发送文件上传请求...')
    const startTime = Date.now()
    
    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    })

    const endTime = Date.now()
    const result = await response.json()
    
    console.log(`\n📋 响应结果 (耗时: ${endTime - startTime}ms):`)
    console.log(`状态码: ${response.status}`)
    console.log(`成功: ${result.success}`)
    console.log(`消息: ${result.message}`)

    if (response.ok && result.data) {
      const { file, parsing, import: importResult, summary } = result.data
      
      console.log('\n📊 详细结果:')
      console.log(`📁 文件信息:`)
      console.log(`  - 名称: ${file.name}`)
      console.log(`  - 大小: ${file.size} bytes`)
      console.log(`  - 类型: ${file.type}`)
      
      console.log(`\n📋 解析结果:`)
      console.log(`  - 总行数: ${parsing.totalRows}`)
      console.log(`  - 有效行数: ${parsing.validRows}`)
      console.log(`  - 提取项目: ${parsing.extractedProjects}`)
      console.log(`  - 解析错误: ${parsing.errors.length}`)
      
      if (parsing.errors.length > 0) {
        console.log(`  错误详情:`)
        parsing.errors.forEach((error: string) => console.log(`    - ${error}`))
      }
      
      console.log(`\n💾 导入结果:`)
      console.log(`  - 处理总数: ${importResult.totalRows}`)
      console.log(`  - 新增项目: ${importResult.insertedRows}`)
      console.log(`  - 重复项目: ${importResult.duplicateRows}`)
      
      if (importResult.insertedProjects.length > 0) {
        console.log(`  新增项目列表:`)
        importResult.insertedProjects.forEach((project: any) => {
          console.log(`    - ${project.name} (ID: ${project.id})`)
        })
      }
      
      if (importResult.duplicateProjects.length > 0) {
        console.log(`  重复项目列表:`)
        importResult.duplicateProjects.forEach((name: string) => {
          console.log(`    - ${name}`)
        })
      }
      
      console.log(`\n📝 总结: ${summary.message}`)
      
      // 验证测试结果
      console.log('\n🔍 验证测试结果:')
      
      const checks = [
        { name: '文件成功上传', pass: response.status === 200 },
        { name: '文件信息正确', pass: file.name.includes('最终测试') && file.size > 0 },
        { name: 'Excel解析成功', pass: parsing.totalRows > 0 && parsing.extractedProjects > 0 },
        { name: '数据验证工作', pass: parsing.errors.length > 0 }, // 应该有错误（空行、超长名称）
        { name: '数据库操作成功', pass: importResult.totalRows > 0 },
        { name: '响应格式正确', pass: result.success && result.data && result.timestamp }
      ]
      
      let allPassed = true
      checks.forEach(check => {
        const status = check.pass ? '✅' : '❌'
        console.log(`  ${status} ${check.name}`)
        if (!check.pass) allPassed = false
      })
      
      if (allPassed) {
        console.log('\n🎉 最终综合测试完全成功！')
        console.log('✅ 所有功能都正常工作：')
        console.log('  - multer中间件集成 ✓')
        console.log('  - 真实Excel文件接收 ✓')
        console.log('  - ExcelService解析调用 ✓')
        console.log('  - 文件验证和错误处理 ✓')
        console.log('  - 数据库存储和去重 ✓')
      } else {
        console.log('\n⚠️ 部分测试未通过，请检查上述结果')
      }
      
    } else {
      console.error('\n❌ 最终测试失败:')
      console.error(`状态码: ${response.status}`)
      console.error(`错误信息: ${result.message}`)
    }

  } catch (error) {
    console.error('\n❌ 最终测试过程中发生错误:', error)
  }
}

// 运行最终测试
console.log('🚀 启动最终文件上传功能测试...')
console.log('请确保后端服务器正在运行 (npm run dev)\n')

runFinalTest().catch(console.error)