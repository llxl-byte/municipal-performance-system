/**
 * 📚 知识点：Hono.js文件上传中间件
 * 
 * 这个中间件使用Hono.js的内置formData方法处理文件上传
 * 相比传统的multer，这种方式更适合现代的Web框架
 */

import { Context } from 'hono'
import { createMiddleware } from 'hono/factory'

/**
 * 📚 知识点：文件验证配置
 * 定义支持的文件类型和大小限制
 */
const FILE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB限制
  allowedExtensions: ['.xlsx', '.xls'],
  allowedMimeTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/octet-stream' // 有时Excel文件会被识别为这个类型
  ]
}

/**
 * 📚 知识点：文件验证函数
 * 验证上传文件的格式和大小
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // 检查文件是否存在
  if (!file || !file.name) {
    return { valid: false, error: '没有接收到文件' }
  }

  // 检查文件大小
  if (file.size > FILE_CONFIG.maxSize) {
    const maxSizeMB = FILE_CONFIG.maxSize / (1024 * 1024)
    return { valid: false, error: `文件大小超过限制（最大${maxSizeMB}MB）` }
  }

  // 检查文件是否为空
  if (file.size === 0) {
    return { valid: false, error: '文件为空' }
  }

  // 检查文件扩展名
  const hasValidExtension = FILE_CONFIG.allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  )

  if (!hasValidExtension) {
    return { 
      valid: false, 
      error: `只支持Excel文件格式(${FILE_CONFIG.allowedExtensions.join(', ')})` 
    }
  }

  // 检查MIME类型（可选，因为有些浏览器可能不正确设置）
  if (file.type && !FILE_CONFIG.allowedMimeTypes.includes(file.type)) {
    console.warn(`⚠️ 文件MIME类型不匹配: ${file.type}，但扩展名有效，继续处理`)
  }

  return { valid: true }
}

/**
 * 📚 知识点：Hono.js文件上传中间件
 * 
 * 这个中间件处理multipart/form-data格式的文件上传
 * 使用现代的Web API而不是传统的multer库
 */
export const fileUploadMiddleware = createMiddleware(async (c: Context, next) => {
  const startTime = Date.now()
  
  try {
    console.log('📤 开始处理文件上传请求...')
    
    // 检查Content-Type
    const contentType = c.req.header('content-type')
    if (!contentType || !contentType.includes('multipart/form-data')) {
      const error = '请使用multipart/form-data格式上传文件'
      console.error('❌ Content-Type错误:', contentType)
      c.set('uploadError', error)
      await next()
      return
    }

    // 解析FormData
    console.log('📋 解析FormData...')
    const formData = await c.req.formData()
    const file = formData.get('file') as File

    if (!file) {
      const error = '没有接收到文件，请确保字段名为"file"'
      console.error('❌ 文件缺失')
      c.set('uploadError', error)
      await next()
      return
    }

    console.log(`📁 接收到文件: ${file.name} (${file.size} bytes, ${file.type})`)

    // 验证文件
    const validation = validateFile(file)
    if (!validation.valid) {
      console.error('❌ 文件验证失败:', validation.error)
      c.set('uploadError', validation.error)
      await next()
      return
    }

    console.log('✅ 文件验证通过')

    // 转换为Buffer
    console.log('🔄 转换文件为Buffer...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 存储文件信息到context
    const uploadedFile: UploadedFile = {
      originalname: file.name,
      mimetype: file.type || 'application/octet-stream',
      size: file.size,
      buffer: buffer
    }

    c.set('uploadedFile', uploadedFile)

    const processingTime = Date.now() - startTime
    console.log(`✅ 文件上传处理完成，耗时: ${processingTime}ms`)

    await next()

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error(`❌ 文件上传处理失败 (耗时: ${processingTime}ms):`, error)
    
    let errorMessage = '文件上传处理失败'
    
    // 根据错误类型提供更友好的错误信息
    if (error.name === 'TypeError' && error.message.includes('formData')) {
      errorMessage = '文件格式错误，请确保使用正确的表单格式'
    } else if (error.message.includes('size')) {
      errorMessage = '文件过大，请选择较小的文件'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    c.set('uploadError', errorMessage)
    await next()
  }
})

// 文件信息接口
export interface UploadedFile {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}