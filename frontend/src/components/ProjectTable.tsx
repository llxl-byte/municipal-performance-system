/**
 * 📚 知识点：ProTable组件实现
 * 
 * ProTable是Ant Design Pro Components中的高级表格组件
 * 它提供了以下核心功能：
 * 1. 内置搜索功能 - 无需手动实现搜索框
 * 2. 分页功能 - 自动处理分页逻辑
 * 3. 加载状态 - 自动显示loading效果
 * 4. 列配置 - 灵活的列定义和渲染
 * 5. 工具栏 - 可自定义的操作按钮
 */

import React, { useRef, useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ProTable, ActionType, ProColumns, StatisticCard } from '@ant-design/pro-components'
import { Button, Tag, Space, message, Row, Col, Statistic } from 'antd'
import { ReloadOutlined, SearchOutlined, DatabaseOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { projectApi, Project, PaginatedResponse } from '../services/api'
import dayjs from 'dayjs' // 引入 dayjs
import 'dayjs/locale/zh-cn' // 引入中文语言包
dayjs.locale('zh-cn') // 设置全局语言为中文

/**
 * 📚 知识点：ProColumns类型定义
 * 
 * ProColumns是ProTable的列配置类型
 * 每一列都可以配置：
 * - title: 列标题
 * - dataIndex: 数据字段名
 * - key: 唯一标识
 * - render: 自定义渲染函数
 * - search: 是否支持搜索
 * - sorter: 是否支持排序
 */
const ProjectTable: React.FC = () => {
  // 📚 知识点：useRef获取ProTable实例
  // ActionType提供了表格的操作方法，如刷新、重置等
  const actionRef = useRef<ActionType>()
  
  // 📚 知识点：URL状态管理
  // 使用React Router的hooks来管理URL参数，实现搜索条件持久化
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // 📚 知识点：统计数据状态管理
  const [stats, setStats] = useState({
    total: 0,
    lastUpdated: '',
    loading: true
  })
  
  // 📚 知识点：从URL获取初始搜索参数
  const getInitialParams = () => {
    return {
      current: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      name: searchParams.get('search') || ''
    }
  }

  // 📚 知识点：获取统计数据
  const fetchStats = async () => {
    try {
      const response = await projectApi.getStats()
      if (response.success && response.data) {
        setStats({
          total: response.data.total,
          lastUpdated: response.data.lastUpdated,
          loading: false
        })
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  // 📚 知识点：组件挂载时获取统计数据
  useEffect(() => {
    fetchStats()
  }, [])

  // 📚 知识点：URL参数同步函数
  const updateUrlParams = (params: any) => {
    const newSearchParams = new URLSearchParams()
    
    // 只保存有意义的参数到URL
    if (params.current && params.current !== 1) {
      newSearchParams.set('page', params.current.toString())
    }
    if (params.pageSize && params.pageSize !== 10) {
      newSearchParams.set('pageSize', params.pageSize.toString())
    }
    if (params.name && params.name.trim()) {
      newSearchParams.set('search', params.name.trim())
    }
    
    // 更新URL，但不触发页面刷新
    setSearchParams(newSearchParams, { replace: true })
  }

  /**
   * 📚 知识点：ProTable的request函数
   * 
   * request是ProTable的核心配置，用于获取数据
   * 参数包含：
   * - current: 当前页码
   * - pageSize: 每页条数  
   * - [key]: 搜索参数（对应列的dataIndex）
   * 
   * 返回值必须包含：
   * - data: 数据数组
   * - total: 总条数
   * - success: 是否成功
   */
  const fetchProjects = async (params: any) => {
    try {
      console.log('📊 ProTable请求参数:', params)
      
      // 📚 知识点：参数处理和URL同步
      // ProTable会自动传入分页和搜索参数
      const { current = 1, pageSize = 10, name = '' } = params
      
      // 📚 同步参数到URL
      updateUrlParams({ current, pageSize, name })
      
      // 调用API获取数据
      const response = await projectApi.getProjects(current, pageSize, name)
      
      if (response.success && response.data) {
        console.log('✅ 数据获取成功:', response.data)
        
        // 📚 知识点：返回格式转换
        // 需要将API返回的格式转换为ProTable期望的格式
        const result = {
          data: response.data.items || [],
          total: response.data.total || 0,
          success: true,
        }
        
        // 📚 更新统计数据
        setStats(prev => ({
          ...prev,
          total: result.total,
          lastUpdated: new Date().toISOString()
        }))
        
        return result
      } else {
        throw new Error(response.message || '获取数据失败')
      }
    } catch (error) {
      console.error('❌ 获取项目数据失败:', error)
      message.error('获取数据失败，请稍后重试')
      
      // 📚 知识点：错误处理
      // 即使出错也要返回正确的格式
      return {
        data: [],
        total: 0,
        success: false,
      }
    }
  }

  /**
   * 📚 知识点：列配置定义
   * 
   * 每一列的配置说明：
   * - valueType: 值类型，影响搜索框类型和显示格式
   * - hideInSearch: 是否在搜索表单中隐藏
   * - sorter: 排序配置
   * - render: 自定义渲染
   */
  const columns: ProColumns<Project>[] = [
    {
      title: '项目ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      valueType: 'digit',
      hideInSearch: true, // 📚 ID通常不需要搜索
      sorter: true,
      render: (text) => (
        <Tag color="blue">#{text}</Tag>
      ),
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      valueType: 'text',
      // 📚 知识点：搜索配置
      // 不设置hideInSearch，默认会在搜索表单中显示
      ellipsis: true, // 文本过长时显示省略号
      copyable: true, // 支持复制
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ID: {record.id}
          </div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      // valueType: 'dateTime', // 移除此行
      width: 180,
      hideInSearch: true,
      sorter: true,
      render: (text) => {
        // 📚 知识点：时间格式化
        const date = dayjs(text as string)
        // 如果日期无效，则显示“无效日期”
        if (!date.isValid()) {
          return <span style={{ color: '#f5222d' }}>无效日期</span>
        }
        return (
          <div>
            <div>{date.format('YYYY-MM-DD')}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {date.format('HH:mm:ss')}
            </div>
          </div>
        )
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      // valueType: 'dateTime', // 移除此行
      width: 180,
      hideInSearch: true,
      sorter: true,
      render: (text) => {
        const date = dayjs(text as string)
        // 如果日期无效，则显示“无效日期”
        if (!date.isValid()) {
          return <span style={{ color: '#f5222d' }}>无效日期</span>
        }
        const now = dayjs()
        const diffDays = now.diff(date, 'day')
        
        // 📚 知识点：相对时间显示
        let timeAgo = ''
        if (diffDays === 0) {
          timeAgo = '今天'
        } else if (diffDays === 1) {
          timeAgo = '昨天'
        } else if (diffDays < 7) {
          timeAgo = `${diffDays}天前`
        } else {
          timeAgo = date.format('YYYY-MM-DD')
        }
        
        return (
          <div>
            <div>{timeAgo}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {date.format('HH:mm:ss')}
            </div>
          </div>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            onClick={() => {
              message.info(`查看项目: ${record.name}`)
            }}
          >
            查看
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger
            onClick={() => {
              message.warning(`删除功能待实现: ${record.name}`)
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 📚 知识点：数据统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <StatisticCard
            statistic={{
              title: '项目总数',
              value: stats.total,
              icon: <DatabaseOutlined style={{ color: '#1890ff' }} />,
              loading: stats.loading,
            }}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <StatisticCard
            statistic={{
              title: '最后更新',
              value: stats.lastUpdated ? dayjs(stats.lastUpdated).format('YYYY-MM-DD HH:mm:ss') : '暂无数据',
              icon: <ClockCircleOutlined style={{ color: '#52c41a' }} />,
              loading: stats.loading,
            }}
          />
        </Col>
        <Col xs={24} sm={24} md={8}>
          <StatisticCard
            statistic={{
              title: '数据状态',
              value: '正常',
              icon: <SearchOutlined style={{ color: '#faad14' }} />,
              loading: stats.loading,
            }}
          />
        </Col>
      </Row>

      {/* 📚 知识点：ProTable核心配置 */}
      <ProTable<Project>
        // 📚 表格基础配置
        columns={columns}
        request={fetchProjects}
        actionRef={actionRef}
        
        // 📚 分页配置 - 支持URL同步
        pagination={{
          defaultPageSize: getInitialParams().pageSize,
          defaultCurrent: getInitialParams().current,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        
        // 📚 搜索表单配置 - 支持URL同步
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false, // 默认展开搜索表单
          optionRender: (searchConfig, formProps, dom) => [
            ...dom.reverse(), // 📚 调整按钮顺序
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={() => {
                actionRef.current?.reload()
                fetchStats() // 📚 同时刷新统计数据
                message.success('数据已刷新')
              }}
            >
              刷新
            </Button>,
          ],
        }}
        
        // 📚 工具栏配置
        toolBarRender={() => [
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => {
              actionRef.current?.reload()
              fetchStats() // 📚 同时刷新统计数据
              message.success('数据已刷新')
            }}
          >
            刷新数据
          </Button>,
        ]}
        
        // 📚 表格选项配置
        options={{
          reload: true,
          density: true,
          fullScreen: true,
          setting: true,
        }}
        
        // 📚 其他配置
        rowKey="id" // 📚 指定行的唯一标识
        // dateFormatter="string" // 📚 日期格式化方式 (移除此行，让render函数接收原始日期字符串)
        headerTitle="项目数据列表" // 📚 表格标题
        
        // 📚 样式配置
        scroll={{ x: 800 }} // 📚 横向滚动
        size="middle" // 📚 表格大小
        
        // 📚 响应式配置
        // responsive={true} // 📚 启用响应式 (移除此行)
        
        // 📚 移动端优化
        cardBordered={true} // 📚 卡片模式边框
        
        // 📚 加载配置
        loading={false} // 📚 ProTable会自动管理loading状态
        
        // 📚 空数据配置
        locale={{
          emptyText: (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <SearchOutlined style={{ fontSize: '48px', color: '#ccc' }} />
              <div style={{ marginTop: '16px', color: '#666' }}>
                暂无数据，请先上传Excel文件
              </div>
            </div>
          ),
        }}
      />
    </div>
  )
}

export default ProjectTable