/**
 * 📚 知识点：React组件测试
 * 
 * 这个文件展示了如何为UploadComponent编写测试用例
 * 使用React Testing Library进行组件测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { message } from 'antd'
import UploadComponent from '../UploadComponent'
import { uploadApi } from '../../services/api'

// 📚 知识点：Mock外部依赖
// 在测试中，我们需要模拟外部API调用
jest.mock('../../services/api')
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

const mockUploadApi = uploadApi as jest.Mocked<typeof uploadApi>

describe('UploadComponent', () => {
  // 📚 知识点：测试前的清理工作
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * 📚 知识点：基础渲染测试
   * 测试组件是否能正常渲染
   */
  test('应该正确渲染上传组件', () => {
    render(<UploadComponent />)
    
    // 检查关键元素是否存在
    expect(screen.getByText('点击或拖拽Excel文件到此区域上传')).toBeInTheDocument()
    expect(screen.getByText('支持.xlsx和.xls格式，文件大小不超过10MB')).toBeInTheDocument()
  })

  /**
   * 📚 知识点：Props测试
   * 测试组件是否正确处理传入的props
   */
  test('应该根据maxFileSize prop显示正确的提示信息', () => {
    render(<UploadComponent maxFileSize={5} />)
    
    expect(screen.getByText('支持.xlsx和.xls格式，文件大小不超过5MB')).toBeInTheDocument()
  })

  /**
   * 📚 知识点：禁用状态测试
   */
  test('当disabled为true时应该禁用上传功能', () => {
    render(<UploadComponent disabled={true} />)
    
    const uploadArea = screen.getByRole('button')
    expect(uploadArea).toHaveClass('ant-upload-disabled')
  })

  /**
   * 📚 知识点：文件验证测试
   * 测试文件格式验证功能
   */
  test('应该拒绝非Excel文件', async () => {
    const onUploadError = jest.fn()
    render(<UploadComponent onUploadError={onUploadError} />)
    
    // 创建一个非Excel文件
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    
    // 模拟文件选择
    const input = screen.getByRole('button').querySelector('input[type="file"]')
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }
    
    // 验证错误消息
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('只能上传Excel文件(.xlsx, .xls)！')
    })
  })

  /**
   * 📚 知识点：文件大小验证测试
   */
  test('应该拒绝超大文件', async () => {
    const onUploadError = jest.fn()
    render(<UploadComponent maxFileSize={1} onUploadError={onUploadError} />)
    
    // 创建一个超大的Excel文件（2MB）
    const largeContent = 'x'.repeat(2 * 1024 * 1024)
    const file = new File([largeContent], 'large.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const input = screen.getByRole('button').querySelector('input[type="file"]')
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }
    
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('文件大小不能超过1MB！')
    })
  })

  /**
   * 📚 知识点：成功上传测试
   */
  test('应该处理成功的文件上传', async () => {
    const mockResult = {
      success: true,
      data: {
        file: {
          name: 'test.xlsx',
          size: 1024,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        parsing: {
          totalRows: 10,
          validRows: 8,
          extractedProjects: 8,
          errors: []
        },
        import: {
          totalRows: 8,
          insertedRows: 5,
          duplicateRows: 3,
          insertedProjects: [
            { id: 1, name: '项目1' },
            { id: 2, name: '项目2' }
          ],
          duplicateProjects: ['重复项目1']
        },
        summary: {
          message: '上传成功',
          details: {
            newProjects: ['项目1', '项目2'],
            duplicateProjects: ['重复项目1'],
            parseErrors: []
          }
        }
      }
    }

    mockUploadApi.uploadFile.mockResolvedValue(mockResult)
    
    const onUploadSuccess = jest.fn()
    render(<UploadComponent onUploadSuccess={onUploadSuccess} />)
    
    // 创建有效的Excel文件
    const file = new File(['test'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const input = screen.getByRole('button').querySelector('input[type="file"]')
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }
    
    // 等待上传完成
    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledWith(mockResult.data)
      expect(message.success).toHaveBeenCalledWith('文件上传成功！')
    })
  })

  /**
   * 📚 知识点：失败上传测试
   */
  test('应该处理上传失败', async () => {
    const errorMessage = '网络错误'
    mockUploadApi.uploadFile.mockRejectedValue(new Error(errorMessage))
    
    const onUploadError = jest.fn()
    render(<UploadComponent onUploadError={onUploadError} />)
    
    const file = new File(['test'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const input = screen.getByRole('button').querySelector('input[type="file"]')
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }
    
    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith(errorMessage)
      expect(message.error).toHaveBeenCalledWith(`上传失败：${errorMessage}`)
    })
  })

  /**
   * 📚 知识点：进度显示测试
   */
  test('应该在上传时显示进度条', async () => {
    // 模拟一个延迟的上传
    mockUploadApi.uploadFile.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: {} as any
      }), 1000))
    )
    
    render(<UploadComponent />)
    
    const file = new File(['test'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const input = screen.getByRole('button').querySelector('input[type="file"]')
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }
    
    // 检查进度条是否出现
    await waitFor(() => {
      expect(screen.getByText('正在上传和处理文件，请稍候...')).toBeInTheDocument()
    })
  })

  /**
   * 📚 知识点：结果显示测试
   */
  test('当showResult为false时不应该显示结果', async () => {
    const mockResult = {
      success: true,
      data: {
        file: { name: 'test.xlsx', size: 1024, type: 'xlsx' },
        parsing: { totalRows: 5, validRows: 5, extractedProjects: 5, errors: [] },
        import: { 
          totalRows: 5, 
          insertedRows: 5, 
          duplicateRows: 0, 
          insertedProjects: [], 
          duplicateProjects: [] 
        },
        summary: { 
          message: '成功', 
          details: { newProjects: [], duplicateProjects: [], parseErrors: [] } 
        }
      }
    }

    mockUploadApi.uploadFile.mockResolvedValue(mockResult)
    
    render(<UploadComponent showResult={false} />)
    
    const file = new File(['test'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const input = screen.getByRole('button').querySelector('input[type="file"]')
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }
    
    await waitFor(() => {
      expect(message.success).toHaveBeenCalled()
    })
    
    // 确认结果区域没有显示
    expect(screen.queryByText('文件大小')).not.toBeInTheDocument()
  })
})

/**
 * 📚 知识点：集成测试
 * 测试组件与其他组件的集成
 */
describe('UploadComponent Integration', () => {
  test('应该与父组件正确交互', async () => {
    const ParentComponent: React.FC = () => {
      const [result, setResult] = React.useState<any>(null)
      
      return (
        <div>
          <UploadComponent 
            onUploadSuccess={setResult}
            showResult={false}
          />
          {result && <div data-testid="parent-result">上传完成</div>}
        </div>
      )
    }
    
    const mockResult = {
      success: true,
      data: {
        file: { name: 'test.xlsx', size: 1024, type: 'xlsx' },
        parsing: { totalRows: 1, validRows: 1, extractedProjects: 1, errors: [] },
        import: { 
          totalRows: 1, 
          insertedRows: 1, 
          duplicateRows: 0, 
          insertedProjects: [], 
          duplicateProjects: [] 
        },
        summary: { 
          message: '成功', 
          details: { newProjects: [], duplicateProjects: [], parseErrors: [] } 
        }
      }
    }

    mockUploadApi.uploadFile.mockResolvedValue(mockResult)
    
    render(<ParentComponent />)
    
    const file = new File(['test'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const input = screen.getByRole('button').querySelector('input[type="file"]')
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }
    
    await waitFor(() => {
      expect(screen.getByTestId('parent-result')).toBeInTheDocument()
    })
  })
})

/**
 * 📚 知识点：性能测试
 * 测试组件的性能表现
 */
describe('UploadComponent Performance', () => {
  test('应该正确处理多次快速点击', async () => {
    const onUploadSuccess = jest.fn()
    render(<UploadComponent onUploadSuccess={onUploadSuccess} />)
    
    const file = new File(['test'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const input = screen.getByRole('button').querySelector('input[type="file"]')
    
    // 快速多次触发上传
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
      fireEvent.change(input, { target: { files: [file] } })
      fireEvent.change(input, { target: { files: [file] } })
    }
    
    // 应该只处理最后一次上传
    await waitFor(() => {
      expect(mockUploadApi.uploadFile).toHaveBeenCalledTimes(1)
    })
  })
})