// 测试文件上传的边界情况
import * as XLSX from 'xlsx'
import FormData from 'form-data'
import fetch from 'node-fetch'

// 测试空Excel文件
async function testEmptyExcelFile() {
  try {
    console.log('🧪 测试空Excel文件...')
    
    // 创建空的Excel文件
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet([]) // 空工作表
    XLSX.utils.book_append_sheet(workbook, worksheet, '空表')
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    const formData = new FormData()
    formData.append('file', buffer, {
      filename: '空文件.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    })

    const result = await response.json()
    console.log('📋 空Excel文件响应:', response.status, result.message)
    
    if (response.status === 400 && result.message.includes('没有找到有效的项目数据')) {
      console.log('✅ 空Excel文件测试成功 - 正确处理了空文件')
    } else {
      console.error('❌ 空Excel文件测试失败')
    }

  } catch (error) {
    console.error('❌ 空Excel文件测试错误:', error)
  }
}

// 测试包含空行和无效数据的Excel文件
async function testExcelWithInvalidData() {
  try {
    console.log('\n🧪 测试包含无效数据的Excel文件...')
    
    // 创建包含各种边界情况的Excel文件
    const testData = [
      ['项目名称'], // 表头
      ['正常项目1'],
      [''], // 空行
      [null], // null值
      ['   '], // 只有空格
      ['正常项目2'],
      ['x'.repeat(250)], // 超长项目名称（超过200字符限制）
      ['正常项目3'],
      [], // 完全空行
      ['正常项目4']
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(testData)
    XLSX.utils.book_append_sheet(workbook, worksheet, '测试数据')
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    const formData = new FormData()
    formData.append('file', buffer, {
      filename: '包含无效数据.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    })

    const result = await response.json()
    console.log('📋 无效数据Excel响应:', response.status)
    
    if (response.ok && result.data) {
      const { parsing } = result.data
      console.log(`📊 解析结果: ${parsing.totalRows}行 → ${parsing.validRows}有效行 → ${parsing.extractedProjects}个项目`)
      console.log(`⚠️ 错误数量: ${parsing.errors.length}`)
      
      if (parsing.errors.length > 0) {
        console.log('错误详情:')
        parsing.errors.forEach((error: string) => console.log(`  - ${error}`))
      }
      
      console.log('✅ 无效数据Excel测试成功 - 正确处理了边界情况')
    } else {
      console.error('❌ 无效数据Excel测试失败')
    }

  } catch (error) {
    console.error('❌ 无效数据Excel测试错误:', error)
  }
}

// 测试大文件上传
async function testLargeExcelFile() {
  try {
    console.log('\n🧪 测试大Excel文件...')
    
    // 创建包含大量数据的Excel文件
    const testData = [['项目名称']] // 表头
    
    // 添加1000行数据
    for (let i = 1; i <= 1000; i++) {
      testData.push([`大型项目${i.toString().padStart(4, '0')}`])
    }

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(testData)
    XLSX.utils.book_append_sheet(workbook, worksheet, '大量数据')
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    console.log(`📁 大文件大小: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`)
    
    const formData = new FormData()
    formData.append('file', buffer, {
      filename: '大文件测试.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const startTime = Date.now()
    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    })
    const endTime = Date.now()

    const result = await response.json()
    console.log(`📋 大文件响应: ${response.status} (耗时: ${endTime - startTime}ms)`)
    
    if (response.ok && result.data) {
      const { parsing, import: importResult } = result.data
      console.log(`📊 处理结果: ${parsing.extractedProjects}个项目，新增${importResult.insertedRows}个`)
      console.log('✅ 大文件测试成功')
    } else {
      console.error('❌ 大文件测试失败:', result.message)
    }

  } catch (error) {
    console.error('❌ 大文件测试错误:', error)
  }
}

// 测试没有文件的请求
async function testNoFileUpload() {
  try {
    console.log('\n🧪 测试没有文件的上传请求...')
    
    const formData = new FormData()
    // 不添加任何文件

    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    })

    const result = await response.json()
    console.log('📋 无文件上传响应:', response.status, result.message)
    
    if (response.status === 400 && result.message.includes('没有接收到文件')) {
      console.log('✅ 无文件上传测试成功 - 正确处理了缺少文件的情况')
    } else {
      console.error('❌ 无文件上传测试失败')
    }

  } catch (error) {
    console.error('❌ 无文件上传测试错误:', error)
  }
}

// 运行所有边界情况测试
async function runEdgeCaseTests() {
  console.log('🚀 开始运行文件上传边界情况测试...')
  console.log('请确保后端服务器正在运行 (npm run dev)')
  
  await testEmptyExcelFile()
  await testExcelWithInvalidData()
  await testLargeExcelFile()
  await testNoFileUpload()
  
  console.log('\n🏁 所有边界情况测试完成!')
}

// 直接运行测试
runEdgeCaseTests().catch(console.error)