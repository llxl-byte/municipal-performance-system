// React错误边界组件
// 📚 知识点：错误边界是React组件，用于捕获子组件树中的JavaScript错误

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result, Button, Typography, Collapse, Alert } from 'antd'
import { BugOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

/**
 * 📚 知识点：React错误边界
 * 
 * 错误边界是React组件，它可以：
 * 1. 捕获子组件树中任何地方的JavaScript错误
 * 2. 记录这些错误
 * 3. 显示备用UI而不是崩溃的组件树
 * 
 * 错误边界无法捕获以下错误：
 * - 事件处理器中的错误
 * - 异步代码中的错误（如setTimeout回调）
 * - 服务端渲染期间的错误
 * - 错误边界组件本身抛出的错误
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  /**
   * 📚 知识点：getDerivedStateFromError
   * 
   * 这个生命周期方法在后代组件抛出错误后被调用
   * 它接收抛出的错误作为参数，并返回一个值来更新state
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    // 生成错误ID，用于错误追踪
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  /**
   * 📚 知识点：componentDidCatch
   * 
   * 这个生命周期方法在后代组件抛出错误后被调用
   * 用于记录错误信息，发送错误报告等
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 React错误边界捕获到错误:', error)
    console.error('📍 错误组件栈:', errorInfo.componentStack)
    
    this.setState({
      errorInfo
    })

    // 调用外部错误处理函数
    this.props.onError?.(error, errorInfo)

    // 📚 知识点：错误上报
    // 在实际项目中，这里可以将错误信息发送到错误监控服务
    this.reportError(error, errorInfo)
  }

  /**
   * 📚 知识点：错误上报
   * 
   * 将错误信息发送到监控服务，用于错误追踪和分析
   */
  private reportError(error: Error, errorInfo: ErrorInfo) {
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'anonymous', // 实际项目中可以获取用户ID
    }

    // 📚 这里可以发送到错误监控服务，如Sentry、Bugsnag等
    console.log('📊 错误报告:', errorReport)
    
    // 示例：发送到监控服务
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // }).catch(console.error)
  }

  /**
   * 📚 知识点：错误恢复
   * 
   * 提供重试机制，让用户可以尝试恢复应用
   */
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  /**
   * 📚 知识点：页面刷新
   * 
   * 当重试无效时，提供页面刷新选项
   */
  private handleRefresh = () => {
    window.location.reload()
  }

  /**
   * 📚 知识点：返回首页
   * 
   * 提供返回首页的选项
   */
  private handleGoHome = () => {
    window.location.href = '/'
  }

  /**
   * 📚 知识点：复制错误信息
   * 
   * 方便用户复制错误信息进行反馈
   */
  private handleCopyError = () => {
    const errorText = `
错误ID: ${this.state.errorId}
错误信息: ${this.state.error?.message}
发生时间: ${new Date().toLocaleString()}
页面地址: ${window.location.href}
浏览器: ${navigator.userAgent}

错误堆栈:
${this.state.error?.stack}

组件堆栈:
${this.state.errorInfo?.componentStack}
    `.trim()

    navigator.clipboard.writeText(errorText).then(() => {
      console.log('✅ 错误信息已复制到剪贴板')
    }).catch(console.error)
  }

  render() {
    if (this.state.hasError) {
      // 📚 如果提供了自定义fallback，使用自定义UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 📚 默认错误UI
      return (
        <div style={{ padding: '50px 20px', maxWidth: '800px', margin: '0 auto' }}>
          <Result
            status="error"
            icon={<BugOutlined style={{ color: '#ff4d4f' }} />}
            title="页面出现错误"
            subTitle={`错误ID: ${this.state.errorId}`}
            extra={[
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
                key="retry"
              >
                重试
              </Button>,
              <Button 
                icon={<ReloadOutlined />}
                onClick={this.handleRefresh}
                key="refresh"
              >
                刷新页面
              </Button>,
              <Button 
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
                key="home"
              >
                返回首页
              </Button>
            ]}
          >
            <div style={{ textAlign: 'left' }}>
              <Alert
                message="发生了意外错误"
                description="我们已经记录了这个错误，开发团队会尽快修复。您可以尝试刷新页面或返回首页。"
                type="error"
                showIcon
                style={{ marginBottom: '20px' }}
              />

              <Paragraph>
                <Text strong>错误信息：</Text>
                <Text code>{this.state.error?.message}</Text>
              </Paragraph>

              <Paragraph>
                <Text strong>发生时间：</Text>
                <Text>{new Date().toLocaleString()}</Text>
              </Paragraph>

              {/* 📚 开发环境下显示详细错误信息 */}
              {process.env.NODE_ENV === 'development' && (
                <Collapse ghost>
                  <Panel header="详细错误信息（开发模式）" key="1">
                    <div style={{ marginBottom: '16px' }}>
                      <Button 
                        size="small" 
                        onClick={this.handleCopyError}
                      >
                        复制错误信息
                      </Button>
                    </div>
                    
                    <Paragraph>
                      <Text strong>错误堆栈：</Text>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '10px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        overflow: 'auto'
                      }}>
                        {this.state.error?.stack}
                      </pre>
                    </Paragraph>

                    {this.state.errorInfo && (
                      <Paragraph>
                        <Text strong>组件堆栈：</Text>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '10px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          overflow: 'auto'
                        }}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </Paragraph>
                    )}
                  </Panel>
                </Collapse>
              )}
            </div>
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

/**
 * 📚 知识点：高阶组件包装器
 * 
 * 提供一个高阶组件，方便包装其他组件
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * 📚 知识点：React Hook版本的错误处理
 * 
 * 虽然错误边界只能用类组件实现，但我们可以提供Hook来处理异步错误
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error('🚨 异步错误:', error)
    setError(error)
    
    // 可以在这里发送错误报告
  }, [])

  // 如果有错误，抛出它让错误边界捕获
  if (error) {
    throw error
  }

  return { handleError, resetError }
}