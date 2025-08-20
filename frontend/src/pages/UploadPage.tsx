import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Space, 
  Card, 
  Alert, 
  Statistic, 
  Row, 
  Col, 
  List, 
  Tag, 
  Button,
  message,
  Divider
} from 'antd'
import { 
  CheckCircleOutlined, 
  FileExcelOutlined,
  ReloadOutlined,
  EyeOutlined,
  RightOutlined
} from '@ant-design/icons'
import UploadComponent from '../components/UploadComponent'
import { UploadResult } from '../types/upload'

const { Title, Paragraph, Text } = Typography

const UploadPage: React.FC = () => {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const navigate = useNavigate()

  /**
   * 📚 知识点：回调函数处理
   * 当上传成功时的处理逻辑
   */
  const handleUploadSuccess = (result: UploadResult) => {
    console.log('🎉 页面级上传成功处理:', result)
    setUploadResult(result)
    
    // 📚 知识点：成功提示和用户引导
    message.success({
      content: '文件上传成功！您可以查看导入的数据。',
      duration: 5,
    })
  }

  // 📚 知识点：页面跳转功能
  const handleViewProjects = () => {
    // 跳转到项目列表页面，如果有新增项目，可以预设搜索条件
    if (uploadResult?.import.insertedProjects.length > 0) {
      // 获取第一个新增项目的名称作为搜索关键词
      const firstProject = uploadResult.import.insertedProjects[0]
      const searchKeyword = firstProject.name.split(' ')[0] // 取第一个词作为搜索关键词
      navigate(`/projects?search=${encodeURIComponent(searchKeyword)}`)
    } else {
      navigate('/projects')
    }
  }

  /**
   * 📚 知识点：错误处理
   * 当上传失败时的处理逻辑
   */
  const handleUploadError = (error: string) => {
    console.error('❌ 页面级上传错误处理:', error)
    
    // 这里可以添加页面级的错误处理逻辑
    // 例如：显示错误页面、记录日志等
  }

  // 重置上传状态
  const resetUpload = () => {
    setUploadResult(null)
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div>
          <Title level={2}>📤 文件上传</Title>
          <Paragraph>
            上传Excel文件，系统将自动解析并导入项目数据。支持重复数据检测和批量处理。
          </Paragraph>
        </div>

        {/* 上传组件 */}
        <Card title="选择Excel文件" extra={
          uploadResult && (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={resetUpload}
              type="link"
            >
              重新上传
            </Button>
          )
        }>
          {/* 📚 知识点：组件复用
               这里使用了我们刚创建的UploadComponent组件
               通过props传递配置和回调函数 */}
          <UploadComponent 
            maxFileSize={10}
            showResult={false}  // 在页面级别显示结果，组件内不显示
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Card>

        {/* 上传结果 */}
        {uploadResult && (
          <Card 
            title={
              <span>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                上传成功
              </span>
            }
          >
            {/* 总结信息 */}
            <Alert
              message={uploadResult.summary.message}
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            {/* 统计数据 */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
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

            {/* 详细结果 */}
            <Row gutter={16}>
              {/* 新增项目列表 */}
              {uploadResult.import.insertedProjects.length > 0 && (
                <Col span={12}>
                  <Card size="small" title="新增项目" type="inner">
                    <List
                      size="small"
                      dataSource={uploadResult.import.insertedProjects}
                      renderItem={(project) => (
                        <List.Item>
                          <Text>
                            <Tag color="green">ID: {project.id}</Tag>
                            {project.name}
                          </Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              )}

              {/* 重复项目列表 */}
              {uploadResult.import.duplicateProjects.length > 0 && (
                <Col span={12}>
                  <Card size="small" title="重复项目" type="inner">
                    <List
                      size="small"
                      dataSource={uploadResult.import.duplicateProjects}
                      renderItem={(name) => (
                        <List.Item>
                          <Text type="secondary">
                            <Tag color="orange">跳过</Tag>
                            {name}
                          </Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              )}
            </Row>

            {/* 解析错误 */}
            {uploadResult.parsing.errors.length > 0 && (
              <>
                <Divider />
                <Alert
                  message={`发现 ${uploadResult.parsing.errors.length} 个解析警告`}
                  type="warning"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                <List
                  size="small"
                  header={<Text strong>解析警告详情：</Text>}
                  dataSource={uploadResult.parsing.errors}
                  renderItem={(error) => (
                    <List.Item>
                      <Text type="warning">⚠️ {error}</Text>
                    </List.Item>
                  )}
                />
              </>
            )}

            {/* 📚 知识点：操作按钮区域 */}
            <Divider />
            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button 
                  type="primary"
                  size="large"
                  icon={<EyeOutlined />}
                  onClick={handleViewProjects}
                >
                  查看导入数据
                  <RightOutlined />
                </Button>
                <Button 
                  size="large"
                  onClick={resetUpload}
                  icon={<ReloadOutlined />}
                >
                  重新上传
                </Button>
              </Space>
              
              {/* 📚 提示信息 */}
              <div style={{ marginTop: '12px' }}>
                <Text type="secondary">
                  💡 点击"查看导入数据"可以立即查看刚才导入的项目
                </Text>
              </div>
            </div>
          </Card>
        )}

        {/* 使用说明 */}
        <Card title="使用说明" size="small">
          <Space direction="vertical">
            <Text>📋 <strong>Excel文件格式要求：</strong></Text>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li>支持.xlsx和.xls格式</li>
              <li>第一列为项目名称（系统会自动跳过表头）</li>
              <li>项目名称不能为空且不超过200字符</li>
              <li>文件大小不超过10MB</li>
            </ul>
            
            <Text>🔄 <strong>数据处理说明：</strong></Text>
            <ul style={{ marginLeft: '20px' }}>
              <li>系统会自动检测并跳过重复的项目名称</li>
              <li>空行和无效数据会被自动过滤</li>
              <li>处理完成后会显示详细的统计信息</li>
            </ul>
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default UploadPage