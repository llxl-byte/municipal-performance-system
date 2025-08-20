/**
 * 📚 知识点：项目数据展示页面
 * 
 * 这个页面展示了如何使用ProTable组件来实现：
 * 1. 数据列表展示
 * 2. 搜索功能
 * 3. 分页功能
 * 4. 响应式布局
 */

import React from 'react'
import { Typography, Space, Card, Alert } from 'antd'
import ProjectTable from '../components/ProjectTable'

const { Title, Paragraph } = Typography

const ProjectsPage: React.FC = () => {
  return (
    <div style={{ padding: '0 24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 📚 页面头部信息 */}
        <div>
          <Title level={2}>📋 项目数据管理</Title>
          <Paragraph>
            在这里您可以查看、搜索和管理所有项目数据。支持分页展示、实时搜索和数据导出功能。
          </Paragraph>
        </div>

        {/* 📚 功能说明提示 */}
        <Alert
          message="功能说明"
          description={
            <div>
              <p>• <strong>搜索功能</strong>：在项目名称列输入关键词进行实时搜索</p>
              <p>• <strong>分页功能</strong>：支持自定义每页显示条数，快速跳转到指定页面</p>
              <p>• <strong>排序功能</strong>：点击列标题可按ID、创建时间、更新时间排序</p>
              <p>• <strong>工具栏</strong>：提供刷新、密度调整、全屏、列设置等功能</p>
            </div>
          }
          type="info"
          showIcon
          closable
        />

        {/* 📚 ProTable数据表格 */}
        <Card 
          bordered={false}
          style={{ 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}
        >
          <ProjectTable />
        </Card>
      </Space>
    </div>
  )
}

export default ProjectsPage