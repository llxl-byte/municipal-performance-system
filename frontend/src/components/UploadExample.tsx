import React from 'react'
import { Card, Typography, Space, Divider } from 'antd'
import UploadComponent from './UploadComponent'
import { UploadResult } from '../types/upload'

const { Title, Paragraph, Text } = Typography

/**
 * 📚 知识点：组件使用示例
 * 
 * 这个文件展示了如何使用UploadComponent组件
 * 包含了各种使用场景和配置选项
 */

const UploadExample: React.FC = () => {
  /**
   * 📚 知识点：回调函数处理
   * 
   * 当上传成功时，这个函数会被调用
   * 你可以在这里处理上传结果，比如：
   * - 显示成功消息
   * - 更新页面数据
   * - 跳转到其他页面
   * - 发送统计数据等
   */
  const handleUploadSuccess = (result: UploadResult) => {
    console.log('🎉 上传成功！', result)
    
    // 这里可以添加你的业务逻辑
    // 例如：刷新项目列表、显示通知等
    
    // 示例：如果有新项目插入，可以做一些特殊处理
    if (result.import.insertedRows > 0) {
      console.log(`成功导入 ${result.import.insertedRows} 个新项目`)
    }
    
    // 示例：如果有重复项目，可以给用户提示
    if (result.import.duplicateRows > 0) {
      console.log(`跳过了 ${result.import.duplicateRows} 个重复项目`)
    }
  }

  /**
   * 📚 知识点：错误处理
   * 
   * 当上传失败时，这个函数会被调用
   * 你可以在这里处理错误，比如：
   * - 记录错误日志
   * - 显示详细错误信息
   * - 提供重试机制
   * - 发送错误报告等
   */
  const handleUploadError = (error: string) => {
    console.error('❌ 上传失败：', error)
    
    // 这里可以添加错误处理逻辑
    // 例如：发送错误报告、显示帮助信息等
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题和说明 */}
        <div>
          <Title level={2}>📤 文件上传组件示例</Title>
          <Paragraph>
            这里展示了如何使用 UploadComponent 组件的各种配置选项。
            该组件是可复用的，可以在项目的任何地方使用。
          </Paragraph>
        </div>

        {/* 基础用法 */}
        <Card title="基础用法" size="small">
          <Paragraph>
            <Text strong>最简单的使用方式：</Text>
          </Paragraph>
          <UploadComponent 
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Card>

        <Divider />

        {/* 自定义配置 */}
        <Card title="自定义配置" size="small">
          <Paragraph>
            <Text strong>自定义文件大小限制和其他选项：</Text>
          </Paragraph>
          <UploadComponent 
            maxFileSize={5}  // 限制文件大小为5MB
            showResult={true} // 显示上传结果
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Card>

        <Divider />

        {/* 禁用状态 */}
        <Card title="禁用状态" size="small">
          <Paragraph>
            <Text strong>禁用上传功能：</Text>
          </Paragraph>
          <UploadComponent 
            disabled={true}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Card>

        <Divider />

        {/* 不显示结果 */}
        <Card title="简化版本" size="small">
          <Paragraph>
            <Text strong>不显示上传结果，只处理回调：</Text>
          </Paragraph>
          <UploadComponent 
            showResult={false}  // 不显示上传结果
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Card>

        {/* 使用说明 */}
        <Card title="组件特性说明" size="small">
          <Space direction="vertical">
            <Text>🎯 <strong>主要特性：</strong></Text>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li><strong>文件验证</strong>：自动验证Excel文件格式和大小</li>
              <li><strong>进度显示</strong>：实时显示上传进度</li>
              <li><strong>错误处理</strong>：友好的错误提示和处理</li>
              <li><strong>结果展示</strong>：详细的上传结果统计</li>
              <li><strong>可配置</strong>：支持多种配置选项</li>
              <li><strong>回调支持</strong>：成功和失败回调函数</li>
            </ul>
            
            <Text>⚙️ <strong>配置选项：</strong></Text>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li><code>maxFileSize</code>：最大文件大小（MB）</li>
              <li><code>disabled</code>：是否禁用上传</li>
              <li><code>showResult</code>：是否显示上传结果</li>
              <li><code>onUploadSuccess</code>：上传成功回调</li>
              <li><code>onUploadError</code>：上传失败回调</li>
            </ul>

            <Text>🔧 <strong>技术实现：</strong></Text>
            <ul style={{ marginLeft: '20px' }}>
              <li>基于 Ant Design Upload 组件</li>
              <li>TypeScript 类型安全</li>
              <li>React Hooks 状态管理</li>
              <li>自定义上传逻辑</li>
              <li>响应式设计</li>
            </ul>
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default UploadExample