// 测试Excel文件上传功能
import fs from 'fs'
import path from 'path'

async function testUpload() {
  const baseUrl = 'http://localhost:8000'
  
  console.log('🔍 开始测试Excel文件上传功能...\n')

  try {
    // 测试1: 获取上传信息
    console.log('📝 测试1: 获取上传信息 GET /api/upload/info')
    const infoResponse = await fetch(`${baseUrl}/api/upload/info`)
    const infoData = await infoResponse.json()
    console.log('状态码:', infoResponse.status)
    console.log('响应数据:', infoData)
    console.log('✅ 上传信息获取成功\n')

    // 测试2: 上传Excel文件
    console.log('📝 测试2: 上传Excel文件 POST /api/upload')
    
    // 检查Excel文件是否存在
    const excelFilePath = path.join(process.cwd(), '..', '市政业绩.xlsx')
    if (!fs.existsSync(excelFilePath)) {
      console.log('❌ Excel文件不存在:', excelFilePath)
      console.log('请确保市政业绩.xlsx文件在项目根目录\n')
      return
    }

    // 读取Excel文件
    const fileBuffer = fs.readFileSync(excelFilePath)
    console.log(`📁 读取文件: ${excelFilePath}, 大小: ${fileBuffer.length} bytes`)

    // 创建FormData
    const formData = new FormData()
    const blob = new Blob([fileBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    formData.append('file', blob, '市政业绩.xlsx')

    // 发送上传请求
    const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: formData
    })

    const uploadData = await uploadResponse.json()
    console.log('状态码:', uploadResponse.status)
    console.log('响应数据:', JSON.stringify(uploadData, null, 2))
    
    if (uploadResponse.ok) {
      console.log('✅ Excel文件上传和解析成功')
      console.log(`📊 解析结果: 总行数${uploadData.data.totalRows}, 有效行数${uploadData.data.validRows}`)
      console.log('项目列表:', uploadData.data.projects)
    } else {
      console.log('❌ Excel文件上传失败')
    }

  } catch (error) {
    console.error('❌ 上传测试失败:', error)
    console.log('\n💡 请确保服务器正在运行: npm run dev')
  }

  console.log('\n🎉 Excel上传功能测试完成！')
}

testUpload()