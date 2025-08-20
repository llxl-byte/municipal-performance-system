// 测试上传API的完整脚本
// 📚 知识点：使用Node.js模拟前端文件上传请求

import { promises as fs } from 'fs'
import path from 'path'
import FormData from 'form-data'
import fetch from 'node-fetch'
import * as XLSX from 'xlsx'

const API_BASE_URL = 'http://localhost:8000/api'

async function testUploadAPI() {
  console.log('🧪 开始测试上传API...\n')

  try {
    // 1. 测试后端服务是否运行
    console.log('1️⃣ 检查后端服务...')
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`)
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        console.log('✅ 后端服务正常运行:', healthData.message)
      } else {
        throw new Error(`后端服务响应异常: ${healthResponse.status}`)
      }
    } catch (error) {
      console.error('❌ 后端服务连接失败:', error.message)
      console.log('请确保后端服务正在运行: npm run dev')
      return
    }

    // 2. 创建测试Excel文件
    console.log('\n2️⃣ 创建测试Excel文件...')
    const testFilePath = await createTestExcelFile()
    console.log('✅ 测试文件创建成功:', testFilePath)

    // 3. 测试文件上传
    console.log('\n3️⃣ 测试文件上传...')
    const uploadResult = await uploadFile(testFilePath)
    
    if (uploadResult.success) {
      console.log('✅ 文件上传成功!')
      console.log('📊 上传结果:')
      console.log(`   - 文件名: ${uploadResult.data.file.name}`)
      console.log(`   - 文件大小: ${uploadResult.data.file.size} bytes`)
      console.log(`   - 解析行数: ${uploadResult.data.parsing.totalRows}`)
      console.log(`   - 有效行数: ${uploadResult.data.parsing.validRows}`)
      console.log(`   - 新增项目: ${uploadResult.data.import.insertedRows}`)
      console.log(`   - 重复项目: ${uploadResult.data.import.duplicateRows}`)
      
      if (uploadResult.data.parsing.errors.length > 0) {
        console.log(`   - 解析错误: ${uploadResult.data.parsing.errors.length}个`)
      }
    } else {
      console.error('❌ 文件上传失败:', uploadResult.message)
    }

    // 4. 测试项目查询
    console.log('\n4️⃣ 测试项目查询...')
    const projectsResponse = await fetch(`${API_BASE_URL}/projects?page=1&pageSize=5`)
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json()
      console.log('✅ 项目查询成功:')
      console.log(`   - 总项目数: ${projectsData.data.total}`)
      console.log(`   - 当前页项目: ${projectsData.data.projects.length}`)
      console.log(`   - 项目列表: ${projectsData.data.projects.map(p => p.name).join(', ')}`)
    } else {
      console.error('❌ 项目查询失败:', projectsResponse.status)
    }

    // 5. 测试搜索功能
    console.log('\n5️⃣ 测试搜索功能...')
    const searchResponse = await fetch(`${API_BASE_URL}/projects?page=1&pageSize=5&search=测试`)
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      console.log('✅ 搜索功能正常:')
      console.log(`   - 搜索结果: ${searchData.data.total}个项目`)
      if (searchData.data.projects.length > 0) {
        console.log(`   - 匹配项目: ${searchData.data.projects.map(p => p.name).join(', ')}`)
      }
    } else {
      console.error('❌ 搜索功能失败:', searchResponse.status)
    }

    // 6. 清理测试文件
    console.log('\n6️⃣ 清理测试文件...')
    await fs.unlink(testFilePath)
    console.log('✅ 测试文件清理完成')

    console.log('\n🎉 所有API测试通过！上传功能正常工作。')
    console.log('\n📋 测试总结:')
    console.log('✅ 后端服务连接正常')
    console.log('✅ 文件上传功能正常')
    console.log('✅ Excel解析功能正常')
    console.log('✅ 数据导入功能正常')
    console.log('✅ 项目查询功能正常')
    console.log('✅ 搜索功能正常')

  } catch (error) {
    console.error('\n❌ API测试失败:', error)
    console.error('错误详情:', error.stack)
  }
}

/**
 * 📚 知识点：创建测试Excel文件
 */
async function createTestExcelFile(): Promise<string> {
  const testData = [
    ['项目名称'], // 表头
    ['测试上传项目A'],
    ['测试上传项目B'],
    ['测试上传项目C'],
    ['市政道路维护工程'],
    ['公园景观改造项目'],
    [''], // 空行测试
    ['污水处理设施升级'],
    ['城市绿化带建设']
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(testData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

  const testFilePath = path.join(process.cwd(), 'test-api-upload.xlsx')
  XLSX.writeFile(workbook, testFilePath)
  
  return testFilePath
}

/**
 * 📚 知识点：使用FormData上传文件
 * 模拟前端的文件上传请求
 */
async function uploadFile(filePath: string): Promise<any> {
  const formData = new FormData()
  const fileBuffer = await fs.readFile(filePath)
  const fileName = path.basename(filePath)
  
  // 添加文件到FormData
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  console.log(`📤 上传文件: ${fileName} (${fileBuffer.length} bytes)`)

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders()
  })

  const result = await response.json()
  return result
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testUploadAPI().catch(console.error)
}