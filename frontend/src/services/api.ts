// API服务层 - 增强版本，支持重试和错误处理
import { retryRequest, withTimeout, requestDeduplicator, isOnline } from '../utils/retry'

const API_BASE_URL = '/api'

// 通用API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  code?: string
  timestamp?: string
  cached?: boolean
}

// 错误类型定义
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 分页响应接口
export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 项目接口
export interface Project {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

// 导入结果接口
export interface ImportResult {
  totalRows: number
  insertedRows: number
  duplicateRows: number
  insertedProjects: Project[]
  duplicateProjects: string[]
}

// HTTP请求工具类 - 增强版本
class ApiClient {
  private defaultTimeout = 30000 // 30秒超时
  private maxRetries = 3

  /**
   * 📚 知识点：增强的请求方法
   * 
   * 新增功能：
   * 1. 请求超时控制
   * 2. 自动重试机制
   * 3. 请求去重
   * 4. 网络状态检测
   * 5. 详细错误处理
   */
  private async request<T>(
    url: string, 
    options: RequestInit = {},
    retryOptions?: { maxRetries?: number; timeout?: number }
  ): Promise<ApiResponse<T>> {
    const { maxRetries = this.maxRetries, timeout = this.defaultTimeout } = retryOptions || {}
    
    // 检查网络状态
    if (!isOnline()) {
      throw new ApiError('网络连接不可用，请检查网络设置', 0, 'NETWORK_OFFLINE')
    }

    // 生成请求去重键
    const dedupeKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`
    
    return requestDeduplicator.deduplicate(dedupeKey, () => {
      return retryRequest(async () => {
        try {
          console.log(`🌐 发送请求: ${options.method || 'GET'} ${url}`)
          
          // 添加超时控制
          const requestPromise = fetch(`${API_BASE_URL}${url}`, {
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
            ...options,
          })

          const response = await withTimeout(requestPromise, timeout, '请求超时，请稍后重试')
          
          // 检查响应状态
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new ApiError(
              errorData.message || `请求失败 (${response.status})`,
              response.status,
              errorData.code,
              errorData
            )
          }

          const data = await response.json()
          console.log(`✅ 请求成功: ${options.method || 'GET'} ${url}`)
          
          return data
        } catch (error) {
          console.error(`❌ 请求失败: ${options.method || 'GET'} ${url}`, error)
          
          // 转换为统一的错误格式
          if (error instanceof ApiError) {
            throw error
          }
          
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new ApiError('网络连接失败，请检查网络设置', 0, 'NETWORK_ERROR')
          }
          
          if (error.message.includes('超时')) {
            throw new ApiError('请求超时，请稍后重试', 0, 'TIMEOUT')
          }
          
          throw new ApiError(error.message || '未知错误', 0, 'UNKNOWN_ERROR')
        }
      }, {
        maxRetries,
        retryCondition: (error) => {
          // 重试条件：网络错误、超时、或5xx服务器错误
          return (
            error.code === 'NETWORK_ERROR' ||
            error.code === 'TIMEOUT' ||
            (error.status && error.status >= 500)
          )
        }
      })
    })
  }

  // GET请求
  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' })
  }

  // POST请求
  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT请求
  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE请求
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' })
  }
}

// 创建API客户端实例
const apiClient = new ApiClient()

// 项目相关API
export const projectApi = {
  // 获取项目列表
  getProjects: (page: number = 1, pageSize: number = 10, search: string = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      search,
    })
    return apiClient.get<PaginatedResponse<Project>>(`/projects?${params}`)
  },

  // 获取项目详情
  getProject: (id: number) => {
    return apiClient.get<Project>(`/projects/${id}`)
  },

  // 创建项目
  createProject: (data: { name: string }) => {
    return apiClient.post<Project>('/projects', data)
  },

  // 删除项目
  deleteProject: (id: number) => {
    return apiClient.delete<Project>(`/projects/${id}`)
  },

  // 获取项目统计
  getStats: () => {
    return apiClient.get<{ total: number; lastUpdated: string }>('/projects/stats/summary')
  },

  // 搜索项目
  searchProjects: (keyword: string, page: number = 1, pageSize: number = 20) => {
    return apiClient.get<PaginatedResponse<Project>>(`/projects/search/${encodeURIComponent(keyword)}?page=${page}&pageSize=${pageSize}`)
  },
}

// 上传相关API
export const uploadApi = {
  // 上传文件
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    }).then(response => response.json())
  },

  // 模拟上传（当前使用）
  mockUpload: () => {
    return apiClient.post<{
      importResult: ImportResult
      summary: {
        message: string
        details: {
          newProjects: string[]
          duplicateProjects: string[]
        }
      }
    }>('/upload')
  },

  // 获取上传历史
  getUploadHistory: () => {
    return apiClient.get('/upload/history')
  },
}

// 健康检查API
export const healthApi = {
  // 基础健康检查
  checkHealth: () => {
    return apiClient.get('/health')
  },

  // 详细健康检查
  checkDetailedHealth: () => {
    return apiClient.get('/health/detailed')
  },
}

export default apiClient