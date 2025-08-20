// 分片上传路由
// 📚 知识点：后端分片上传处理，支持大文件上传和断点续传

import { Hono } from 'hono'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { z } from 'zod'

const app = new Hono()

// 📚 知识点：上传会话存储
// 在实际项目中，这应该存储在Redis或数据库中
interface UploadSession {
  uploadId: string
  fileName: string
  fileSize: number
  fileHash: string
  chunkSize: number
  totalChunks: number
  uploadedChunks: Set<number>
  createdAt: Date
  tempDir: string
}

const uploadSessions = new Map<string, UploadSession>()

// 📚 知识点：临时文件目录
const TEMP_DIR = path.join(process.cwd(), 'temp', 'uploads')
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// 确保目录存在
async function ensureDir(dir: string) {
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

// 初始化目录
ensureDir(TEMP_DIR)
ensureDir(UPLOAD_DIR)

/**
 * 📚 知识点：生成上传ID
 * 
 * 生成唯一的上传会话ID
 */
function generateUploadId(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * 📚 知识点：清理过期会话
 * 
 * 定期清理超过24小时的上传会话
 */
function cleanupExpiredSessions() {
  const now = new Date()
  const expiredSessions: string[] = []

  for (const [uploadId, session] of uploadSessions.entries()) {
    const age = now.getTime() - session.createdAt.getTime()
    if (age > 24 * 60 * 60 * 1000) { // 24小时
      expiredSessions.push(uploadId)
    }
  }

  expiredSessions.forEach(async (uploadId) => {
    const session = uploadSessions.get(uploadId)
    if (session) {
      try {
        await fs.rmdir(session.tempDir, { recursive: true })
        console.log(`🧹 清理过期上传会话: ${uploadId}`)
      } catch (error) {
        console.error(`清理会话失败: ${uploadId}`, error)
      }
      uploadSessions.delete(uploadId)
    }
  })
}

// 每小时清理一次过期会话
setInterval(cleanupExpiredSessions, 60 * 60 * 1000)

/**
 * 📚 知识点：初始化上传会话
 * 
 * POST /api/upload/init
 * 创建新的上传会话，返回uploadId
 */
app.post('/init', async (c) => {
  try {
    const initSchema = z.object({
      fileName: z.string().min(1).max(255),
      fileSize: z.number().positive(),
      fileHash: z.string().length(64), // SHA-256 hash
      chunkSize: z.number().positive(),
      totalChunks: z.number().positive()
    })

    const body = await c.req.json()
    const { fileName, fileSize, fileHash, chunkSize, totalChunks } = initSchema.parse(body)

    console.log(`📋 初始化上传会话: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`)

    // 📚 知识点：文件去重检查
    // 检查是否已存在相同哈希的文件
    const existingFile = path.join(UPLOAD_DIR, `${fileHash}.xlsx`)
    try {
      await fs.access(existingFile)
      console.log(`✅ 文件已存在，跳过上传: ${fileHash}`)
      return c.json({
        success: true,
        message: '文件已存在',
        uploadId: fileHash,
        skipUpload: true,
        filePath: existingFile
      })
    } catch {
      // 文件不存在，继续上传流程
    }

    const uploadId = generateUploadId()
    const tempDir = path.join(TEMP_DIR, uploadId)
    
    // 创建临时目录
    await ensureDir(tempDir)

    // 创建上传会话
    const session: UploadSession = {
      uploadId,
      fileName,
      fileSize,
      fileHash,
      chunkSize,
      totalChunks,
      uploadedChunks: new Set(),
      createdAt: new Date(),
      tempDir
    }

    uploadSessions.set(uploadId, session)

    console.log(`✅ 上传会话创建成功: ${uploadId}`)

    return c.json({
      success: true,
      message: '上传会话初始化成功',
      uploadId,
      tempDir
    })

  } catch (error) {
    console.error('❌ 初始化上传会话失败:', error)
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : '初始化失败'
    }, 400)
  }
})

/**
 * 📚 知识点：检查已上传分片
 * 
 * GET /api/upload/chunks/:uploadId
 * 返回已上传的分片列表，用于断点续传
 */
app.get('/chunks/:uploadId', async (c) => {
  try {
    const uploadId = c.req.param('uploadId')
    const session = uploadSessions.get(uploadId)

    if (!session) {
      return c.json({
        success: false,
        message: '上传会话不存在'
      }, 404)
    }

    return c.json({
      success: true,
      uploadedChunks: Array.from(session.uploadedChunks),
      totalChunks: session.totalChunks
    })

  } catch (error) {
    console.error('❌ 检查分片状态失败:', error)
    return c.json({
      success: false,
      message: '检查分片状态失败'
    }, 500)
  }
})

/**
 * 📚 知识点：上传分片
 * 
 * POST /api/upload/chunk
 * 接收并保存单个分片
 */
app.post('/chunk', async (c) => {
  try {
    const formData = await c.req.formData()
    const chunk = formData.get('chunk') as File
    const uploadId = formData.get('uploadId') as string
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const chunkSize = parseInt(formData.get('chunkSize') as string)

    if (!chunk || !uploadId || isNaN(chunkIndex)) {
      return c.json({
        success: false,
        message: '缺少必要参数'
      }, 400)
    }

    const session = uploadSessions.get(uploadId)
    if (!session) {
      return c.json({
        success: false,
        message: '上传会话不存在'
      }, 404)
    }

    // 检查分片是否已上传
    if (session.uploadedChunks.has(chunkIndex)) {
      console.log(`⏭️ 分片 ${chunkIndex} 已存在，跳过`)
      return c.json({
        success: true,
        message: '分片已存在'
      })
    }

    console.log(`📤 接收分片 ${chunkIndex + 1}/${session.totalChunks} (${(chunkSize / 1024).toFixed(1)}KB)`)

    // 保存分片到临时文件
    const chunkPath = path.join(session.tempDir, `chunk_${chunkIndex}`)
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
    
    await fs.writeFile(chunkPath, chunkBuffer)

    // 📚 知识点：分片完整性验证
    // 验证分片大小
    if (chunkBuffer.length !== chunkSize) {
      console.warn(`⚠️ 分片大小不匹配: 期望${chunkSize}, 实际${chunkBuffer.length}`)
    }

    // 标记分片已上传
    session.uploadedChunks.add(chunkIndex)

    console.log(`✅ 分片 ${chunkIndex} 保存成功 (${session.uploadedChunks.size}/${session.totalChunks})`)

    return c.json({
      success: true,
      message: '分片上传成功',
      uploadedChunks: session.uploadedChunks.size,
      totalChunks: session.totalChunks
    })

  } catch (error) {
    console.error('❌ 分片上传失败:', error)
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : '分片上传失败'
    }, 500)
  }
})

/**
 * 📚 知识点：合并分片
 * 
 * POST /api/upload/merge
 * 将所有分片合并成完整文件
 */
app.post('/merge', async (c) => {
  try {
    const mergeSchema = z.object({
      uploadId: z.string(),
      fileName: z.string(),
      totalChunks: z.number().positive()
    })

    const body = await c.req.json()
    const { uploadId, fileName, totalChunks } = mergeSchema.parse(body)

    const session = uploadSessions.get(uploadId)
    if (!session) {
      return c.json({
        success: false,
        message: '上传会话不存在'
      }, 404)
    }

    // 检查所有分片是否都已上传
    if (session.uploadedChunks.size !== totalChunks) {
      return c.json({
        success: false,
        message: `分片不完整: ${session.uploadedChunks.size}/${totalChunks}`
      }, 400)
    }

    console.log(`🔗 开始合并分片: ${fileName}`)

    // 📚 知识点：流式合并分片
    // 使用流式处理避免大文件占用过多内存
    const finalPath = path.join(UPLOAD_DIR, `${session.fileHash}.xlsx`)
    const writeStream = await fs.open(finalPath, 'w')

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(session.tempDir, `chunk_${i}`)
        const chunkData = await fs.readFile(chunkPath)
        await writeStream.write(chunkData)
        
        // 删除临时分片文件
        await fs.unlink(chunkPath)
      }
    } finally {
      await writeStream.close()
    }

    // 📚 知识点：文件完整性验证
    // 验证合并后的文件大小
    const stats = await fs.stat(finalPath)
    if (stats.size !== session.fileSize) {
      await fs.unlink(finalPath) // 删除损坏的文件
      throw new Error(`文件大小不匹配: 期望${session.fileSize}, 实际${stats.size}`)
    }

    // 清理临时目录和会话
    await fs.rmdir(session.tempDir, { recursive: true })
    uploadSessions.delete(uploadId)

    console.log(`✅ 文件合并完成: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`)

    // 📚 这里可以调用Excel解析服务处理文件
    // const parseResult = await ExcelService.parseExcelFile(finalPath)

    return c.json({
      success: true,
      message: '文件上传成功',
      data: {
        fileName,
        fileSize: stats.size,
        filePath: finalPath,
        uploadId: session.fileHash
      }
    })

  } catch (error) {
    console.error('❌ 合并分片失败:', error)
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : '合并分片失败'
    }, 500)
  }
})

/**
 * 📚 知识点：取消上传
 * 
 * DELETE /api/upload/:uploadId
 * 取消上传并清理临时文件
 */
app.delete('/:uploadId', async (c) => {
  try {
    const uploadId = c.req.param('uploadId')
    const session = uploadSessions.get(uploadId)

    if (!session) {
      return c.json({
        success: false,
        message: '上传会话不存在'
      }, 404)
    }

    // 清理临时文件
    try {
      await fs.rmdir(session.tempDir, { recursive: true })
    } catch (error) {
      console.warn('清理临时文件失败:', error)
    }

    // 删除会话
    uploadSessions.delete(uploadId)

    console.log(`🗑️ 上传会话已取消: ${uploadId}`)

    return c.json({
      success: true,
      message: '上传已取消'
    })

  } catch (error) {
    console.error('❌ 取消上传失败:', error)
    return c.json({
      success: false,
      message: '取消上传失败'
    }, 500)
  }
})

/**
 * 📚 知识点：获取上传状态
 * 
 * GET /api/upload/status/:uploadId
 * 获取上传进度和状态信息
 */
app.get('/status/:uploadId', async (c) => {
  try {
    const uploadId = c.req.param('uploadId')
    const session = uploadSessions.get(uploadId)

    if (!session) {
      return c.json({
        success: false,
        message: '上传会话不存在'
      }, 404)
    }

    const progress = (session.uploadedChunks.size / session.totalChunks) * 100

    return c.json({
      success: true,
      data: {
        uploadId,
        fileName: session.fileName,
        fileSize: session.fileSize,
        totalChunks: session.totalChunks,
        uploadedChunks: session.uploadedChunks.size,
        progress: Math.round(progress * 100) / 100,
        createdAt: session.createdAt
      }
    })

  } catch (error) {
    console.error('❌ 获取上传状态失败:', error)
    return c.json({
      success: false,
      message: '获取上传状态失败'
    }, 500)
  }
})

export default app