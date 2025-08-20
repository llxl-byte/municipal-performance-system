/**
 * 📚 知识点：前后端集成测试组件
 * 
 * 这个组件用于测试前后端功能的完整集成
 * 包括上传、查询、搜索、分页等核心功能
 */

import React, { useState } from 'react'
import { 
  Card, 
  Button, 
  Space, 
  Alert, 
  Steps, 
  Typography, 
  Divider,
  message,
  Spin,
  Tag,
  List
} from 'antd'
import { 
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SearchOutlined,
  FileExcelOutlined
} from '@ant-design/icons'
import { projectApi, uploadApi, healthApi } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message: string
  details?: any
  duration?: number
}

const IntegrationTest: React.FC = () => {
  const [testing, setTesting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  // 📚 测试步骤定义
  const testSteps = [
    { title: '健康检查', description: '检查后端API服务状态' },
    { title: '数据查询', description: '测试项目数据获取功能' },
    { title: '搜索功能', description: '测试项目名称搜索' },
    { title: '分页功能', description: '测试数据分页加载' },
    { title: '上传功能', description: '测试模拟文件上传' },
    { title: '缓存测试', description: '测试Redis缓存功能' }
  ]

  // 📚 更新测试结果
  const updateTestResult = (index: number, result: Partial<TestResult>) => {
    setTestResults(prev => {
      const newResults = [...prev]
      newResults[index] = { ...newResults[index], ...result }
      return newResults
    })
  }

  // 📚 执行单个测试
  const runSingleTest = async (testIndex: number, testFn: () => Promise<any>) => {
    const startTime = Date.now()
    
    updateTestResult(testIndex, { status: 'running' })
    setCurrentStep(testIndex)

    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      
      updateTestResult(testIndex, {
        status: 'success',
        message: '测试通过',
        details: result,
        duration
      })
      
      return result
    } catch (error: any) {
      const duration = Date.now() - startTime
      
      updateTestResult(testIndex, {
        status: 'error',
        message: error.message || '测试失败',
        details: error,
        duration
      })
      
      throw error
    }
  }

  // 📚 测试1：健康检查
  const testHealthCheck = async () => {
    console.log('🏥 开始健康检查测试...')
    
    const basicHealth = await healthApi.checkHealth()
    const detailedHealth = await healthApi.checkDetailedHealth()
    
    if (!basicHealth.success) {
      throw new Error('基础健康检查失败')
    }
    
    return {
      basic: basicHealth,
      detailed: detailedHealth
    }
  }

  // 📚 测试2：数据查询
  const testDataQuery = async () => {
    console.log('📊 开始数据查询测试...')
    
    const response = await projectApi.getProjects(1, 10, '')
    
    if (!response.success) {
      throw new Error('数据查询失败')
    }
    
    return {
      total: response.data?.total || 0,
      items: response.data?.items?.length || 0,
      response: response.data
    }
  }

  // 📚 测试3：搜索功能
  const testSearchFunction = async () => {
    console.log('🔍 开始搜索功能测试...')
    
    // 先获取所有数据
    const allData = await projectApi.getProjects(1, 10, '')
    
    if (!allData.success || !allData.data?.items?.length) {
      throw new Error('没有数据可供搜索测试')
    }
    
    // 使用第一个项目的名称进行搜索
    const firstProject = allData.data.items[0]
    const searchKeyword = firstProject.name.substring(0, 3) // 取前3个字符
    
    const searchResult = await projectApi.getProjects(1, 10, searchKeyword)
    
    if (!searchResult.success) {
      throw new Error('搜索功能失败')
    }
    
    return {
      keyword: searchKeyword,
      totalResults: searchResult.data?.total || 0,
      foundItems: searchResult.data?.items?.length || 0
    }
  }

  // 📚 测试4：分页功能
  const testPagination = async () => {
    console.log('📄 开始分页功能测试...')
    
    // 测试第一页
    const page1 = await projectApi.getProjects(1, 5, '')
    if (!page1.success) {
      throw new Error('第一页数据获取失败')
    }
    
    // 如果有足够数据，测试第二页
    let page2Result = null
    if (page1.data && page1.data.total > 5) {
      const page2 = await projectApi.getProjects(2, 5, '')
      if (!page2.success) {
        throw new Error('第二页数据获取失败')
      }
      page2Result = page2.data
    }
    
    return {
      page1: {
        total: page1.data?.total || 0,
        items: page1.data?.items?.length || 0
      },
      page2: page2Result ? {
        total: page2Result.total || 0,
        items: page2Result.items?.length || 0
      } : null
    }
  }

  // 📚 测试5：上传功能
  const testUploadFunction = async () => {
    console.log('📤 开始上传功能测试...')
    
    try {
      // 创建一个模拟的Excel文件用于测试
      const createMockExcelFile = () => {
        // 创建一个简单的CSV内容（模拟Excel文件）
        const csvContent = '项目名称\n测试项目1\n测试项目2\n测试项目3'
        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' })
        return new File([blob], 'test-upload.xlsx', { type: 'application/vnd.ms-excel' })
      }
      
      // 使用真实的文件上传API
      const mockFile = createMockExcelFile()
      const response = await uploadApi.uploadFile(mockFile)
      
      if (!response.success) {
        throw new Error(response.message || '文件上传失败')
      }
      
      return {
        importResult: response.data?.import,
        summary: response.data?.summary
      }
    } catch (error: any) {
      console.error('文件上传测试失败:', error)
      throw new Error(error.message || '文件上传测试失败')
    }
  }

  // 📚 测试6：缓存功能
  const testCacheFunction = async () => {
    console.log('💾 开始缓存功能测试...')
    
    // 第一次请求（应该从数据库获取）
    const startTime1 = Date.now()
    const response1 = await projectApi.getProjects(1, 10, '')
    const duration1 = Date.now() - startTime1
    
    // 第二次相同请求（应该从缓存获取）
    const startTime2 = Date.now()
    const response2 = await projectApi.getProjects(1, 10, '')
    const duration2 = Date.now() - startTime2
    
    if (!response1.success || !response2.success) {
      throw new Error('缓存测试请求失败')
    }
    
    return {
      firstRequest: {
        duration: duration1,
        cached: response1.cached || false
      },
      secondRequest: {
        duration: duration2,
        cached: response2.cached || false
      },
      cacheImprovement: duration1 > duration2
    }
  }

  // 📚 运行完整测试套件
  const runFullTest = async () => {
    setTesting(true)
    setCurrentStep(0)
    
    // 初始化测试结果
    const initialResults: TestResult[] = testSteps.map(step => ({
      name: step.title,
      status: 'pending',
      message: '等待执行'
    }))
    setTestResults(initialResults)

    try {
      // 执行所有测试
      await runSingleTest(0, testHealthCheck)
      await runSingleTest(1, testDataQuery)
      await runSingleTest(2, testSearchFunction)
      await runSingleTest(3, testPagination)
      await runSingleTest(4, testUploadFunction)
      await runSingleTest(5, testCacheFunction)
      
      message.success('🎉 所有集成测试通过！')
      setCurrentStep(testSteps.length)
      
    } catch (error) {
      message.error('❌ 集成测试失败，请查看详细信息')
      console.error('集成测试失败:', error)
    } finally {
      setTesting(false)
    }
  }

  // 📚 获取测试状态图标
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} />
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      default:
        return null
    }
  }

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={3}>
            <ApiOutlined /> 前后端集成测试
          </Title>
          <Paragraph>
            测试上传、查询、搜索、分页等核心功能的完整集成
          </Paragraph>
          
          <Button
            type="primary"
            size="large"
            icon={testing ? <LoadingOutlined /> : <PlayCircleOutlined />}
            onClick={runFullTest}
            disabled={testing}
            loading={testing}
          >
            {testing ? '测试进行中...' : '开始集成测试'}
          </Button>
        </div>

        {testResults.length > 0 && (
          <>
            <Divider />
            
            {/* 测试进度 */}
            <Steps current={currentStep} size="small" style={{ marginBottom: '24px' }}>
              {testSteps.map((step, index) => (
                <Step
                  key={index}
                  title={step.title}
                  description={step.description}
                  status={
                    testResults[index]?.status === 'error' ? 'error' :
                    testResults[index]?.status === 'success' ? 'finish' :
                    testResults[index]?.status === 'running' ? 'process' :
                    'wait'
                  }
                />
              ))}
            </Steps>

            {/* 测试结果列表 */}
            <List
              dataSource={testResults}
              renderItem={(result, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getStatusIcon(result.status)}
                    title={
                      <Space>
                        <Text strong>{result.name}</Text>
                        <Tag color={
                          result.status === 'success' ? 'green' :
                          result.status === 'error' ? 'red' :
                          result.status === 'running' ? 'blue' : 'default'
                        }>
                          {result.status === 'pending' ? '等待' :
                           result.status === 'running' ? '运行中' :
                           result.status === 'success' ? '成功' : '失败'}
                        </Tag>
                        {result.duration && (
                          <Text type="secondary">({result.duration}ms)</Text>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Text>{result.message}</Text>
                        {result.details && result.status === 'success' && (
                          <div style={{ marginTop: '8px' }}>
                            <Text code style={{ fontSize: '12px' }}>
                              {JSON.stringify(result.details, null, 2)}
                            </Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}

        {/* 测试说明 */}
        <Divider />
        <Alert
          message="测试说明"
          description={
            <div>
              <p>• <strong>健康检查</strong>：验证后端API服务是否正常运行</p>
              <p>• <strong>数据查询</strong>：测试基础的项目数据获取功能</p>
              <p>• <strong>搜索功能</strong>：验证项目名称搜索是否正常工作</p>
              <p>• <strong>分页功能</strong>：测试数据分页加载和切换</p>
              <p>• <strong>上传功能</strong>：验证文件上传和数据导入流程</p>
              <p>• <strong>缓存测试</strong>：检查Redis缓存是否提升响应速度</p>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>
    </div>
  )
}

export default IntegrationTest