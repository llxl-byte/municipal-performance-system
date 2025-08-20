import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Typography, Space, Button, Alert } from 'antd'
import { 
  ProjectOutlined, 
  UploadOutlined, 
  DatabaseOutlined,
  RightOutlined,
  TableOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph } = Typography

interface SystemStats {
  totalProjects: number
  lastUpdated: string
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取系统统计信息
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/projects/stats/summary')
        const data = await response.json()
        
        if (data.success) {
          setStats({
            totalProjects: data.data.total,
            lastUpdated: data.data.lastUpdated
          })
        }
      } catch (error) {
        console.error('获取统计信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div>
      {/* 欢迎区域 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          🏛️ 欢迎使用市政业绩管理系统
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          这是一个现代化的市政项目管理平台，支持Excel文件上传、数据查询、搜索和分页展示等功能。
        </Paragraph>
      </div>

      {/* 系统状态提示 */}
      <Alert
        message="系统运行正常"
        description="所有服务正常运行，数据库和缓存连接正常。"
        type="success"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="项目总数"
              value={stats?.totalProjects || 0}
              loading={loading}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="数据更新时间"
              value={stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : '暂无数据'}
              loading={loading}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="系统版本"
              value="v1.0.0"
              prefix={<UploadOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              hoverable
              onClick={() => navigate('/projects')}
              style={{ cursor: 'pointer' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <TableOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>项目管理</Title>
                  <Paragraph style={{ margin: '8px 0 0 0', color: '#666' }}>
                    查看、搜索和管理所有项目数据
                  </Paragraph>
                </div>
                <Button type="link" icon={<RightOutlined />}>
                  进入管理
                </Button>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={8}>
            <Card 
              hoverable
              onClick={() => navigate('/upload')}
              style={{ cursor: 'pointer' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <UploadOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>文件上传</Title>
                  <Paragraph style={{ margin: '8px 0 0 0', color: '#666' }}>
                    上传Excel文件，批量导入项目数据
                  </Paragraph>
                </div>
                <Button type="link" icon={<RightOutlined />}>
                  开始上传
                </Button>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <DatabaseOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>数据统计</Title>
                  <Paragraph style={{ margin: '8px 0 0 0', color: '#666' }}>
                    查看系统数据统计和分析报告
                  </Paragraph>
                </div>
                <Button type="link" icon={<RightOutlined />} disabled>
                  即将推出
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 系统特性 */}
      <Card title="系统特性">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" size="small">
              <Title level={5}>✨ 核心功能</Title>
              <ul style={{ paddingLeft: '20px', color: '#666' }}>
                <li>Excel文件上传和解析</li>
                <li>项目数据查询和搜索</li>
                <li>分页展示和数据管理</li>
                <li>重复数据自动去重</li>
              </ul>
            </Space>
          </Col>
          
          <Col xs={24} sm={12}>
            <Space direction="vertical" size="small">
              <Title level={5}>🚀 技术特性</Title>
              <ul style={{ paddingLeft: '20px', color: '#666' }}>
                <li>Redis缓存优化性能</li>
                <li>响应式设计适配移动端</li>
                <li>TypeScript类型安全</li>
                <li>现代化UI组件库</li>
              </ul>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default HomePage