import React, { useState } from 'react'
import { 
  Upload, 
  Button, 
  Progress, 
  Alert, 
  Statistic, 
  Row, 
  Col, 
  Typography,
  message
} from 'antd'
import { 
  InboxOutlined, 
  ExclamationCircleOutlined,
  FileExcelOutlined
} from '@ant-design/icons'
import type { UploadProps, UploadFile } from 'antd'
import { uploadApi } from '../services/api'
import { UploadResult, UploadComponentProps, UploadStatus } from '../types/upload'

const { Text } = Typography
const { Dragger } = Upload

/**
 * 📚 知识点3: React函数组件
 * 使用React.FC类型定义函数组件，提供类型安全
 * 组件名使用PascalCase命名规范
 */
const UploadComponent: React.FC<UploadComponentProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 10,
  disabled = false,
  showResult = true
}) => {
  /**
   * 📚 知识点4: React Hooks - useState
   * useState用于管理组件内部状态
   * 返回[状态值, 更新状态的函数]
   */
  const [uploading, setUploading] = useState(false)           // 是否正在上传
  const [uploadProgress, setUploadProgress] = useState(0)     // 上传进度(0-100)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null) // 上传结果
  const [error, setError] = useState<string | null>(null)     // 错误信息
  const [fileList, setFileList] = useState<UploadFile[]>([])  // 文件列表

  /**
   * 📚 知识点5: 文件验证函数
   * 在文件上传前进行格式和大小验证
   * 返回boolean值决定是否允许上传
   */
  const beforeUpload = (file: File): boolean => {
    console.log('📁 验证上传文件:', file.name)
    
    // 检查文件类型 - 支持Excel格式
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel' ||
                   file.name.toLowerCase().endsWith('.xlsx') ||
                   file.name.toLowerCase().endsWith('.xls')
    
    if (!isExcel) {
      const errorMsg = '只能上传Excel文件(.xlsx, .xls)！'
      message.error(errorMsg)
      onUploadError?.(errorMsg) // 调用错误回调
      return false
    }

    // 检查文件大小
    const isLtMaxSize = file.size / 1024 / 1024 < maxFileSize
    if (!isLtMaxSize) {
      const errorMsg = `文件大小不能超过${maxFileSize}MB！`
      message.error(errorMsg)
      onUploadError?.(errorMsg)
      return false
    }

    console.log('✅ 文件验证通过')
    return true
  }

  /**
   * 📚 知识点6: 异步函数处理
   * async/await用于处理异步操作（如文件上传）
   * try/catch用于错误处理
   */
  const handleUpload = async (file: File): Promise<void> => {
    console.log('🚀 开始上传文件:', file.name)
    
    // 重置状态
    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setUploadResult(null)

    try {
      /**
       * 📚 知识点7: 进度模拟
       * 使用setInterval创建定时器模拟上传进度
       * 实际项目中可以使用XMLHttpRequest的progress事件
       */
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval) // 清除定时器
            return 90
          }
          return prev + 10
        })
      }, 200)

      // 调用API上传文件
      const response = await uploadApi.uploadFile(file)
      
      // 清除进度定时器并设置完成
      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log('📋 上传响应:', response)

      if (response.success) {
        setUploadResult(response.data)
        message.success('文件上传成功！')
        onUploadSuccess?.(response.data) // 调用成功回调
        console.log('✅ 文件上传和处理完成')
      } else {
        throw new Error(response.message || '上传失败')
      }

    } catch (err: any) {
      console.error('❌ 上传失败:', err)
      const errorMessage = err.message || '上传过程中发生错误'
      setError(errorMessage)
      message.error('上传失败：' + errorMessage)
      setUploadProgress(0)
      onUploadError?.(errorMessage) // 调用错误回调
    } finally {
      setUploading(false) // 无论成功失败都要重置上传状态
    }
  }

  /**
   * 📚 知识点8: 自定义上传逻辑
   * Ant Design Upload组件允许自定义上传行为
   * 通过customRequest属性替换默认的上传逻辑
   */
  const customRequest = (options: any) => {
    const { file, onSuccess, onError } = options
    
    handleUpload(file)
      .then(() => onSuccess?.({}))
      .catch((err) => onError?.(err))
  }

  /**
   * 📚 知识点9: 事件处理函数
   * 处理文件列表变化，确保只保留最新的一个文件
   */
  const handleChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList]
    
    // 只保留最新的一个文件
    newFileList = newFileList.slice(-1)
    
    setFileList(newFileList)
  }

  /**
   * 📚 知识点10: 工具函数
   * 格式化文件大小显示，提升用户体验
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 📚 知识点11: 重置函数
   * 提供重置功能，清除所有状态
   */
  const resetUpload = (): void => {
    setFileList([])
    setUploadResult(null)
    setError(null)
    setUploadProgress(0)
    setUploading(false)
  }

  /**
   * 📚 知识点12: JSX渲染
   * 返回组件的UI结构，使用条件渲染显示不同状态
   */
  return (
    <div>
      {/* 文件上传区域 */}
      <Dragger
        name="file"
        multiple={false}
        fileList={fileList}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        onChange={handleChange}
        disabled={disabled || uploading}
        showUploadList={{
          showPreviewIcon: false,
          showRemoveIcon: !uploading,
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">
          点击或拖拽Excel文件到此区域上传
        </p>
        <p className="ant-upload-hint">
          支持.xlsx和.xls格式，文件大小不超过{maxFileSize}MB
        </p>
      </Dragger>

      {/* 上传进度显示 */}
      {uploading && (
        <div style={{ marginTop: '16px' }}>
          <Progress 
            percent={uploadProgress} 
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
            正在上传和处理文件，请稍候...
          </Text>
        </div>
      )}

      {/* 错误信息显示 */}
      {error && (
        <Alert
          message="上传失败"
          description={error}
          type="error"
          icon={<ExclamationCircleOutlined />}
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginTop: '16px' }}
        />
      )}

      {/* 上传结果显示 */}
      {showResult && uploadResult && (
        <div style={{ marginTop: '16px' }}>
          <Alert
            message={uploadResult.summary.message}
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          {/* 统计数据 */}
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={6}>
              <Statistic
                title="文件大小"
                value={formatFileSize(uploadResult.file.size)}
                prefix={<FileExcelOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="解析行数"
                value={uploadResult.parsing.totalRows}
                suffix={`/ ${uploadResult.parsing.validRows}有效`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="新增项目"
                value={uploadResult.import.insertedRows}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="重复项目"
                value={uploadResult.import.duplicateRows}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>

          {/* 重置按钮 */}
          <Button 
            onClick={resetUpload}
            style={{ marginTop: '8px' }}
          >
            重新上传
          </Button>
        </div>
      )}
    </div>
  )
}

export default UploadComponent