// 测试真实文件上传功能
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import FormData from 'form-data'
import fetch from 'node-fetch'

// 创建测试Excel文件
function createTestExcelFile(): Buffer {
  console.log('📊 创建测试Excel文件...')
  
  // 测试数据
  const testData = [
    ['项目名称'], // 表头
    ['市政道路建设项目'],
    ['公园绿化项目'],
    ['污水处理项目'],
    ['垃圾处理站建设'],
    ['桥梁维修项目'],
    ['路灯安装项目'],
    ['绿化带维护项目'],
    ['地铁站建设项目'],
    ['公交站台改造'],
    ['人行道修缮工程']
  ]

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(testData)
  
  // 添加工作表
  XLSX.utils.book_append_sheet(workbook, worksheet, '市政项目')
  
  // 生成Excel文件缓冲区
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  console.log(`✅ 测试Excel文件创建完成，大小: ${buffer.length} bytes`)
  return buffer
}

// 测试文件上传API
async function testFileUpload() {
  try {
    console.log('🧪 开始测试真实文件上传功能...')
    
    // 创建测试Excel文件
    const excelBuffer = createTestExcelFile()
    
    // 创建FormData
    const formData = new FormData()
    formData.append('file', excelBuffer, {
      filename: '测试市政项目.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    // 发送POST请求
    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    })

    const result = await response.json()
    
    console.log('📤 上传响应状态:', response.status)
    console.log('📋 上传响应结果:')
    console.log(JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log('✅ 文件上传测试成功!')
      
      // 显示详细信息
      if (result.data) {
        const { file, parsing, import: importResult, summary } = result.data
        
        console.log('\n📊 处理详情:')
        console.log(`文件: ${file.name} (${file.size} bytes)`)
        console.log(`解析: ${parsing.totalRows}行 → ${parsing.validRows}有效行 → ${parsing.extractedProjects}个项目`)
        console.log(`导入: 新增${importResult.insertedRows}个，重复${importResult.duplicateRows}个`)
        
        if (parsing.errors.length > 0) {
          console.log('\n⚠️ 解析警告:')
          parsing.errors.forEach((error: string) => console.log(`  - ${error}`))
        }
      }
    } else {
      console.error('❌ 文件上传测试失败!')
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 测试无效文件上传
async function testInvalidFileUpload() {
  try {
    console.log('\n🧪 测试无效文件上传...')
    
    // 创建一个文本文件而不是Excel文件
    const textBuffer = Buffer.from('这不是一个Excel文件', 'utf-8')
    
    const formData = new FormData()
    formData.append('file', textBuffer, {
      filename: '无效文件.txt',
      contentType: 'text/plain'
    })

    const response = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    })

    const result = await response.json()
    
    console.log('📤 无效文件上传响应状态:', response.status)
    console.log('📋 无效文件上传响应结果:')
    console.log(JSON.stringify(result, null, 2))

    if (response.status === 400) {
      console.log('✅ 无效文件验证测试成功 - 正确拒绝了非Excel文件')
    } else {
      console.error('❌ 无效文件验证测试失败 - 应该拒绝非Excel文件')
    }

  } catch (error) {
    console.error('❌ 无效文件测试过程中发生错误:', error)
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始运行文件上传测试...')
  console.log('请确保后端服务器正在运行 (npm run dev)')
  
  // 等待一下确保服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await testFileUpload()
  await testInvalidFileUpload()
  
  console.log('\n🏁 所有测试完成!')
}

// 直接运行测试
runTests().catch(console.error)

export { createTestExcelFile, testFileUpload, testInvalidFileUpload }