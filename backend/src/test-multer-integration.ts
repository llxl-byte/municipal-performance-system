// 测试multer中间件集成
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { fileUploadMiddleware } from './middleware/multer.js'
import { ExcelService } from './services/excel.js'

// 创建测试应用
const testApp = new Hono()

// 测试路由
testApp.post('/test-upload', fileUploadMiddleware, async (c) => {
  try {
    console.log('🧪 测试multer中间件集成...')

    // 检查上传错误
    const uploadError = c.get('uploadError')
    if (uploadError) {
      console.error('❌ 上传错误:', uploadError)
      return c.json({ success: false, error: uploadError }, 400)
    }

    // 获取上传的文件
    const uploadedFile = c.get('uploadedFile')
    if (!uploadedFile) {
      console.error('❌ 没有接收到文件')
      return c.json({ success: false, error: '没有接收到文件' }, 400)
    }

    console.log(`📁 接收到文件: ${uploadedFile.originalname}`)
    console.log(`📊 文件大小: ${uploadedFile.size} bytes`)
    console.log(`📋 文件类型: ${uploadedFile.mimetype}`)

    // 验证文件
    const validation = ExcelService.validateExcelFile(uploadedFile.buffer, uploadedFile.originalname)
    if (!validation.valid) {
      console.error('❌ 文件验证失败:', validation.error)
      return c.json({ success: false, error: validation.error }, 400)
    }

    console.log('✅ 文件验证通过')

    // 解析Excel
    const parseResult = ExcelService.parseExcelBuffer(uploadedFile.buffer)
    console.log(`📊 解析结果: ${parseResult.totalRows}行 → ${parseResult.validRows}有效行 → ${parseResult.projects.length}个项目`)

    if (parseResult.errors.length > 0) {
      console.log('⚠️ 解析警告:')
      parseResult.errors.forEach(error => console.log(`  - ${error}`))
    }

    return c.json({
      success: true,
      message: 'multer中间件集成测试成功',
      data: {
        file: {
          name: uploadedFile.originalname,
          size: uploadedFile.size,
          type: uploadedFile.mimetype
        },
        parsing: {
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          projects: parseResult.projects.length,
          errors: parseResult.errors
        }
      }
    })

  } catch (error: any) {
    console.error('❌ 测试过程中发生错误:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 根路径
testApp.get('/', (c) => {
  return c.json({ 
    message: '🧪 Multer集成测试服务器',
    endpoints: {
      upload: 'POST /test-upload'
    }
  })
})

// 启动测试服务器
const testPort = 8001
console.log(`🧪 启动multer集成测试服务器在端口 ${testPort}`)
console.log(`📖 测试地址: http://localhost:${testPort}`)
console.log('使用以下命令测试:')
console.log('curl -X POST -F "file=@your-excel-file.xlsx" http://localhost:8001/test-upload')

serve({
  fetch: testApp.fetch,
  port: testPort
})