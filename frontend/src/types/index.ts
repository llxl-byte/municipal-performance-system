/**
 * 📚 知识点：类型定义统一导出
 * 
 * 这个文件作为类型定义的统一入口
 * 方便其他文件导入所需的类型
 */

// 导出上传相关类型
export * from './upload'

// 导出API相关类型（从services/api.ts中提取）
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  code?: string
  timestamp?: string
  cached?: boolean
}

export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Project {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

// 导出常用的工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 导出状态相关类型
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface AsyncState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
}

// 导出表单相关类型
export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'upload'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: any }>
}

export interface FormConfig {
  fields: FormField[]
  submitText?: string
  resetText?: string
}

// 导出通用组件Props类型
export interface BaseComponentProps {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export interface LoadingProps extends BaseComponentProps {
  loading?: boolean
  size?: 'small' | 'default' | 'large'
  tip?: string
}

export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: React.ComponentType<{ error: Error }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}