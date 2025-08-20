import React from 'react'
import { Layout as AntLayout, Menu, Typography, Space } from 'antd'
import { 
  HomeOutlined, 
  TableOutlined, 
  UploadOutlined,
  SettingOutlined,
  BugOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Content, Sider } = AntLayout
const { Title } = Typography

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/projects',
      icon: <TableOutlined />,
      label: '项目管理',
    },
    {
      key: '/upload',
      icon: <UploadOutlined />,
      label: '文件上传',
    },
    {
      key: '/test',
      icon: <BugOutlined />,
      label: '系统测试',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        width={240}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo区域 */}
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <Space direction="vertical" size={4}>
            <SettingOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
              市政业绩管理
            </Title>
          </Space>
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            border: 'none',
            marginTop: '8px'
          }}
        />
      </Sider>

      {/* 主内容区域 */}
      <AntLayout>
        {/* 顶部导航 */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Title level={4} style={{ margin: 0, color: '#333' }}>
            {menuItems.find(item => item.key === location.pathname)?.label || '市政业绩管理系统'}
          </Title>
          
          <Space>
            <span style={{ color: '#666' }}>
              欢迎使用市政业绩管理系统
            </span>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content style={{ 
          margin: '24px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'auto'
        }}>
          <div style={{ padding: '24px' }}>
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout