// 文件上传路由
import { Hono } from 'hono'
import { ProjectService } from '../services/projectService.js'
import { ExcelService } from '../services/excel.js'
import { ResponseHelper } from '../lib/response.js'
import { fileUploadMiddleware, UploadedFile } from '../middleware/multer.js'

const uploadRoutes = new Hono()

/**
 * 📚 知识点：完善的文件上传接口
 * 
 * 这个接口处理完整的Excel文件上传流程：
 * 1. 接收和验证文件
 * 2. 解析Excel内容
 * 3. 数据去重和存储
 * 4. 返回详细结果
 */
uploadRoutes.post('/upload', fileUploadMiddleware, async (c) => {
  const requestId = Math.random().toString(36).substr(2, 9)
  const startTime = Date.now()
  
  try {
    console.log(`📤 [${requestId}] 接收到文件上传请求`)

    // 检查是否有上传错误
    const uploadError = c.get('uploadError')
    if (uploadError) {
      console.error(`❌ [${requestId}] 文件上传错误:`, uploadError)
      return ResponseHelper.error(c, uploadError, 400)
    }

    // 获取上传的文件
    const uploadedFile: UploadedFile = c.get('uploadedFile')
    if (!uploadedFile) {
      console.error(`❌ [${requestId}] 没有接收到文件`)
      return ResponseHelper.error(c, '没有接收到文件，请选择Excel文件上传', 400)
    }

    console.log(`📁 [${requestId}] 处理文件: ${uploadedFile.originalname} (${uploadedFile.size} bytes, ${uploadedFile.mimetype})`)

    // 二次验证Excel文件格式（中间件已经做了基础验证）
    console.log(`🔍 [${requestId}] 验证Excel文件格式...`)
    const validation = ExcelService.validateExcelFile(uploadedFile.buffer, uploadedFile.originalname)
    if (!validation.valid) {
      console.error(`❌ [${requestId}] 文件验证失败:`, validation.error)
      return ResponseHelper.error(c, validation.error!, 400)
    }

    // 解析Excel文件
    console.log(`📊 [${requestId}] 开始解析Excel文件...`)
    const parseStartTime = Date.now()
    const parseResult = ExcelService.parseExcelBuffer(uploadedFile.buffer)
    const parseTime = Date.now() - parseStartTime
    
    // 生成解析报告
    const parseReport = ExcelService.generateParseReport(parseResult)
    console.log(`📋 [${requestId}] 解析完成 (耗时: ${parseTime}ms):\n${parseReport}`)

    // 检查解析结果
    if (parseResult.errors.length > 0) {
      console.warn(`⚠️ [${requestId}] Excel解析过程中发现 ${parseResult.errors.length} 个错误`)
      
      // 如果没有有效数据，返回错误
      if (parseResult.validRows === 0 || parseResult.projects.length === 0) {
        const errorMessage = `Excel文件解析失败，没有找到有效数据：\n${parseResult.errors.slice(0, 5).join('\n')}${parseResult.errors.length > 5 ? '\n...' : ''}`
        return ResponseHelper.error(c, errorMessage, 400)
      }
    }

    // 检查是否有有效的项目数据
    if (parseResult.projects.length === 0) {
      console.error(`❌ [${requestId}] Excel文件中没有找到有效的项目数据`)
      return ResponseHelper.error(c, 'Excel文件中没有找到有效的项目数据，请检查文件格式', 400)
    }

    // 转换为ProjectService需要的格式
    const projectsData = parseResult.projects.map(name => ({ name }))

    // 调用服务层进行批量导入
    console.log(`💾 [${requestId}] 开始导入 ${projectsData.length} 个项目到数据库...`)
    const importStartTime = Date.now()
    const importResult = await ProjectService.batchImport(projectsData)
    const importTime = Date.now() - importStartTime
    
    console.log(`✅ [${requestId}] 数据导入完成 (耗时: ${importTime}ms): 新增${importResult.insertedRows}个, 重复${importResult.duplicateRows}个`)

    // 构建详细的成功响应
    const totalTime = Date.now() - startTime
    const response = {
      file: {
        name: uploadedFile.originalname,
        size: uploadedFile.size,
        type: uploadedFile.mimetype
      },
      parsing: {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        extractedProjects: parseResult.projects.length,
        errors: parseResult.errors,
        processingTime: parseTime
      },
      import: {
        ...importResult,
        processingTime: importTime
      },
      summary: {
        message: generateSuccessMessage(uploadedFile.originalname, parseResult, importResult),
        details: {
          newProjects: importResult.insertedProjects.map(p => p.name),
          duplicateProjects: importResult.duplicateProjects,
          parseErrors: parseResult.errors
        },
        performance: {
          totalTime,
          parseTime,
          importTime,
          throughput: Math.round(parseResult.projects.length / (totalTime / 1000))
        }
      }
    }

    console.log(`🎉 [${requestId}] 文件上传和处理完成，总耗时: ${totalTime}ms`)
    return ResponseHelper.success(c, response, '文件上传成功')

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    console.error(`❌ [${requestId}] 文件上传处理失败 (耗时: ${totalTime}ms):`, error)
    
    // 根据错误类型返回更友好的错误信息
    let errorMessage = '文件上传处理失败'
    let statusCode = 500
    
    if (error.message.includes('数据库')) {
      errorMessage = '数据库操作失败，请稍后重试'
    } else if (error.message.includes('Excel') || error.message.includes('解析')) {
      errorMessage = 'Excel文件解析失败，请检查文件格式'
      statusCode = 400
    } else if (error.message.includes('内存') || error.message.includes('大小')) {
      errorMessage = '文件过大或系统资源不足，请尝试较小的文件'
      statusCode = 413
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return ResponseHelper.error(c, errorMessage, statusCode)
  }
})

/**
 * 📚 知识点：生成成功消息的辅助函数
 */
function generateSuccessMessage(filename: string, parseResult: any, importResult: any): string {
  const messages = [
    `成功处理Excel文件"${filename}"`,
    `从${parseResult.totalRows}行数据中提取${parseResult.projects.length}个项目`,
    `新增${importResult.insertedRows}个项目`
  ]
  
  if (importResult.duplicateRows > 0) {
    messages.push(`跳过${importResult.duplicateRows}个重复项目`)
  }
  
  if (parseResult.errors.length > 0) {
    messages.push(`处理过程中发现${parseResult.errors.length}个警告`)
  }
  
  return messages.join('，')
}

/**
 * 📚 知识点：获取上传统计信息
 * 
 * 这个接口返回系统的上传和项目统计信息
 */
uploadRoutes.get('/upload/stats', async (c) => {
  try {
    console.log('📊 获取上传统计信息...')
    
    // 获取项目统计
    const stats = await ProjectService.getProjectStats()
    
    // 构建统计响应
    const response = {
      projects: {
        total: stats.total,
        lastUpdated: stats.lastUpdated
      },
      system: {
        maxFileSize: '10MB',
        supportedFormats: ['.xlsx', '.xls'],
        features: [
          '自动去重',
          '批量导入',
          '错误检测',
          '进度跟踪'
        ]
      },
      tips: [
        '确保Excel文件第一列为项目名称',
        '系统会自动跳过空行和重复数据',
        '支持最大10MB的Excel文件',
        '建议使用.xlsx格式以获得最佳兼容性'
      ]
    }
    
    return ResponseHelper.success(c, response, '获取上传统计成功')

  } catch (error: any) {
    console.error('❌ 获取上传统计失败:', error)
    return ResponseHelper.error(c, error.message || '获取上传统计失败', 500)
  }
})

/**
 * 📚 知识点：获取上传历史记录
 * 
 * 这个接口可以扩展为真实的上传历史功能
 */
uploadRoutes.get('/upload/history', async (c) => {
  try {
    console.log('📋 获取上传历史记录...')
    
    // 获取查询参数
    const page = parseInt(c.req.query('page') || '1')
    const pageSize = parseInt(c.req.query('pageSize') || '10')
    
    // 这里可以实现真实的历史记录查询
    // 目前返回模拟数据作为示例
    const mockHistory = {
      items: [
        {
          id: 1,
          filename: 'projects-2024-01.xlsx',
          uploadTime: new Date().toISOString(),
          totalRows: 150,
          insertedRows: 120,
          duplicateRows: 30,
          status: 'success'
        },
        {
          id: 2,
          filename: 'municipal-data.xlsx',
          uploadTime: new Date(Date.now() - 86400000).toISOString(),
          totalRows: 200,
          insertedRows: 180,
          duplicateRows: 20,
          status: 'success'
        }
      ],
      total: 2,
      page,
      pageSize,
      totalPages: 1
    }
    
    return ResponseHelper.success(c, mockHistory, '获取上传历史成功')

  } catch (error: any) {
    console.error('❌ 获取上传历史失败:', error)
    return ResponseHelper.error(c, error.message || '获取上传历史失败', 500)
  }
})

/**
 * 📚 知识点：文件上传预检查
 * 
 * 这个接口可以在实际上传前检查文件信息
 */
uploadRoutes.post('/upload/validate', async (c) => {
  try {
    console.log('🔍 执行文件上传预检查...')
    
    const body = await c.req.json()
    const { filename, fileSize, fileType } = body
    
    if (!filename || !fileSize) {
      return ResponseHelper.error(c, '缺少必要的文件信息', 400)
    }
    
    // 验证文件扩展名
    const allowedExtensions = ['.xlsx', '.xls']
    const hasValidExtension = allowedExtensions.some(ext => 
      filename.toLowerCase().endsWith(ext)
    )
    
    if (!hasValidExtension) {
      return ResponseHelper.error(c, '只支持Excel文件格式(.xlsx, .xls)', 400)
    }
    
    // 验证文件大小
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (fileSize > maxSize) {
      return ResponseHelper.error(c, '文件大小超过限制（最大10MB）', 400)
    }
    
    // 返回验证结果
    const response = {
      valid: true,
      filename,
      fileSize,
      fileType,
      estimatedProcessingTime: Math.ceil(fileSize / (1024 * 1024)) * 2, // 估算处理时间（秒）
      recommendations: [
        '确保第一列包含项目名称',
        '删除不必要的空行以提高处理速度',
        '检查项目名称长度不超过200字符'
      ]
    }
    
    return ResponseHelper.success(c, response, '文件预检查通过')

  } catch (error: any) {
    console.error('❌ 文件预检查失败:', error)
    return ResponseHelper.error(c, error.message || '文件预检查失败', 500)
  }
})

export { uploadRoutes }