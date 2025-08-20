/**
 * 📚 知识点：真实文件上传测试
 * 
 * 这个测试文件用于验证后端的真实文件上传功能
 * 包括multer中间件、Excel解析和数据库存储
 */

import * as XLSX from 'xlsx'
import FormData from 'form-data'
import fetch from 'node-fetch'

// 测试配置
const API_BASE_URL = 'http://localhost:8000/api'

/**
 * 📚 知识点：创建测试Excel文件
 * 使用xlsx库创建一个包含测试数据的Excel文件
 */
function createTestExcelBuffer(): Buffer {
  console.log('📊 创建测试Excel文件...')
  
  // 创建测试数据
  const testData = [
    ['项目名称'], // 表头
    ['市政道路建设项目A'],
    ['城市绿化工程B'],
    ['污水处理厂升级改造'],
    ['公园景观设计项目'],
    [''], // 空行测试
    ['桥梁维修工程'],
    ['地铁站点建设'],
    ['智慧城市信息化项目'],
    ['垃圾分类处理设施'],
    ['社区文化中心建设']
  ]

  // 创建工作簿和工作表
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(testData)
  
  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '项目列表')
  
  // 生成Excel文件的Buffer
  const buffer = XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx' 
  })
  
  console.log(`✅ 测试Excel文件创建完成，大小: ${buffer.length} bytes`)
  return buffer
}

/**
 * 📚 知识点：测试文件上传API
 * 使用FormData和fetch模拟前端的文件上传请求
 */
async function testFileUpload(): Promise<void> {
  try {
    console.log('\n🚀 开始测试真实文件上传功能...')
    
    // 创建测试Excel文件
    const excelBuffer = createTestExcelBuffer()
    
    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', excelBuffer, {
      filename: 'test-projects.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    console.log('📤 发送文件上传请求...')
    
    // 发送上传请求
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // 不要手动设置Content-Type，让FormData自动设置
        ...formData.getHeaders()
      }
    })
    
    console.log(`📋 响应状态: ${response.status} ${response.statusText}`)
    
    // 解析响应
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ 文件上传成功！')
      console.log('📊 上传结果:')
      console.log(`   文件名: ${result.data.file.name}`)
      console.log(`   文件大小: ${result.data.file.size} bytes`)
      console.log(`   解析行数: ${result.data.parsing.totalRows}`)
      console.log(`   有效行数: ${result.data.parsing.validRows}`)
      console.log(`   提取项目: ${result.data.parsing.extractedProjects}`)
      console.log(`   新增项目: ${result.data.import.insertedRows}`)
      console.log(`   重复项目: ${result.data.import.duplicateRows}`)
      
      if (result.data.parsing.errors.length > 0) {
        console.log('⚠️ 解析警告:')
        result.data.parsing.errors.forEach((error: string) => {
          console.log(`   - ${error}`)
        })
      }
      
      if (result.data.import.insertedProjects.length > 0) {
        console.log('🆕 新增项目列表:')
        result.data.import.insertedProjects.forEach((project: any) => {
          console.log(`   - ID: ${project.id}, 名称: ${project.name}`)
        })
      }
      
      if (result.data.import.duplicateProjects.length > 0) {
        console.log('🔄 重复项目列表:')
        result.data.import.duplicateProjects.forEach((name: string) => {
          console.log(`   - ${name}`)
        })
      }
      
    } else {
      console.error('❌ 文件上传失败:')
      console.error(`   错误信息: ${result.message}`)
      console.error(`   详细信息:`, result)
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

/**
 * 📚 知识点：测试无效文件上传
 * 测试各种错误情况的处理
 */
async function testInvalidFileUpload(): Promise<void> {
  console.log('\n🧪 测试无效文件上传处理...')
  
  const testCases = [
    {
      name: '测试非Excel文件',
      filename: 'test.txt',
      content: Buffer.from('这是一个文本文件'),
      contentType: 'text/plain'
    },
    {
      name: '测试空文件',
      filename: 'empty.xlsx',
      content: Buffer.alloc(0),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  ]
  
  for (const testCase of testCases) {
    try {
      console.log(`\n📝 ${testCase.name}...`)
      
      const formData = new FormData()
      formData.append('file', testCase.content, {
        filename: testCase.filename,
        contentType: testCase.contentType
      })
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.log(`✅ 正确拒绝了无效文件: ${result.message}`)
      } else {
        console.log(`❌ 意外接受了无效文件`)
      }
      
    } catch (error) {
      console.log(`✅ 正确处理了错误: ${error}`)
    }
  }
}

/**
 * 📚 知识点：测试大文件上传
 * 测试文件大小限制
 */
async function testLargeFileUpload(): Promise<void> {
  console.log('\n📏 测试大文件上传限制...')
  
  try {
    // 创建一个超过10MB的大文件
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024) // 11MB
    
    const formData = new FormData()
    formData.append('file', largeBuffer, {
      filename: 'large-file.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.log(`✅ 正确拒绝了大文件: ${result.message}`)
    } else {
      console.log(`❌ 意外接受了大文件`)
    }
    
  } catch (error) {
    console.log(`✅ 正确处理了大文件错误: ${error}`)
  }
}

/**
 * 📚 知识点：测试重复上传
 * 测试数据去重功能
 */
async function testDuplicateUpload(): Promise<void> {
  console.log('\n🔄 测试重复数据上传...')
  
  try {
    // 创建包含重复数据的Excel文件
    const duplicateData = [
      ['项目名称'],
      ['重复测试项目A'],
      ['重复测试项目B'],
      ['重复测试项目A'], // 重复
      ['重复测试项目C'],
      ['重复测试项目B']  // 重复
    ]
    
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(duplicateData)
    XLSX.utils.book_append_sheet(workbook, worksheet, '重复测试')
    
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })
    
    const formData = new FormData()
    formData.append('file', buffer, {
      filename: 'duplicate-test.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ 重复数据测试完成')
      console.log(`   解析项目数: ${result.data.parsing.extractedProjects}`)
      console.log(`   新增项目数: ${result.data.import.insertedRows}`)
      console.log(`   重复项目数: ${result.data.import.duplicateRows}`)
    } else {
      console.error('❌ 重复数据测试失败:', result.message)
    }
    
  } catch (error) {
    console.error('❌ 重复数据测试错误:', error)
  }
}

/**
 * 📚 知识点：主测试函数
 * 按顺序执行所有测试用例
 */
async function runAllTests(): Promise<void> {
  console.log('🧪 开始执行真实文件上传功能测试套件')
  console.log('=' .repeat(50))
  
  // 等待服务器启动
  console.log('⏳ 等待服务器启动...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  try {
    // 测试健康检查
    console.log('\n🏥 测试服务器连接...')
    const healthResponse = await fetch(`${API_BASE_URL}/health`)
    if (healthResponse.ok) {
      console.log('✅ 服务器连接正常')
    } else {
      console.error('❌ 服务器连接失败')
      return
    }
    
    // 执行各项测试
    await testFileUpload()
    await testInvalidFileUpload()
    await testLargeFileUpload()
    await testDuplicateUpload()
    
    console.log('\n' + '='.repeat(50))
    console.log('🎉 所有测试完成！')
    
  } catch (error) {
    console.error('❌ 测试套件执行失败:', error)
  }
}

// 运行测试
runAllTests().catch(console.error)

export { runAllTests, testFileUpload, testInvalidFileUpload }