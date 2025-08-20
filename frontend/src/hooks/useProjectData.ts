/**
 * 📚 知识点：自定义Hook
 * 
 * 这个Hook封装了项目数据的获取和管理逻辑
 * 提供统一的数据状态管理和错误处理
 */

import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { projectApi, Project, PaginatedResponse } from '../services/api'

interface UseProjectDataOptions {
  autoFetch?: boolean
  defaultPageSize?: number
  onError?: (error: string) => void
  onSuccess?: (data: PaginatedResponse<Project>) => void
}

interface UseProjectDataReturn {
  // 数据状态
  projects: Project[]
  total: number
  loading: boolean
  error: string | null
  
  // 分页状态
  currentPage: number
  pageSize: number
  
  // 搜索状态
  searchKeyword: string
  
  // 操作方法
  fetchProjects: (page?: number, size?: number, search?: string) => Promise<void>
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearch: (keyword: string) => void
  refresh: () => Promise<void>
  reset: () => void
}

export const useProjectData = (options: UseProjectDataOptions = {}): UseProjectDataReturn => {
  const {
    autoFetch = true,
    defaultPageSize = 10,
    onError,
    onSuccess
  } = options

  // 📚 数据状态
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 📚 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // 📚 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('')

  /**
   * 📚 知识点：useCallback优化
   * 使用useCallback避免不必要的函数重新创建
   */
  const fetchProjects = useCallback(async (
    page: number = currentPage,
    size: number = pageSize,
    search: string = searchKeyword
  ) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 获取项目数据:', { page, size, search })

      const response = await projectApi.getProjects(page, size, search)

      if (response.success && response.data) {
        setProjects(response.data.items || [])
        setTotal(response.data.total || 0)
        setCurrentPage(page)
        setPageSize(size)
        setSearchKeyword(search)

        onSuccess?.(response.data)
        console.log('✅ 项目数据获取成功')
      } else {
        throw new Error(response.message || '获取数据失败')
      }
    } catch (err: any) {
      const errorMessage = err.message || '获取项目数据失败'
      setError(errorMessage)
      onError?.(errorMessage)
      message.error(errorMessage)
      console.error('❌ 获取项目数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchKeyword, onError, onSuccess])

  // 📚 页码设置
  const setPage = useCallback((page: number) => {
    fetchProjects(page, pageSize, searchKeyword)
  }, [fetchProjects, pageSize, searchKeyword])

  // 📚 页面大小设置
  const setPageSizeHandler = useCallback((size: number) => {
    fetchProjects(1, size, searchKeyword) // 改变页面大小时重置到第一页
  }, [fetchProjects, searchKeyword])

  // 📚 搜索设置
  const setSearch = useCallback((keyword: string) => {
    fetchProjects(1, pageSize, keyword) // 搜索时重置到第一页
  }, [fetchProjects, pageSize])

  // 📚 刷新数据
  const refresh = useCallback(() => {
    return fetchProjects(currentPage, pageSize, searchKeyword)
  }, [fetchProjects, currentPage, pageSize, searchKeyword])

  // 📚 重置状态
  const reset = useCallback(() => {
    setProjects([])
    setTotal(0)
    setError(null)
    setCurrentPage(1)
    setPageSize(defaultPageSize)
    setSearchKeyword('')
  }, [defaultPageSize])

  // 📚 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetchProjects()
    }
  }, []) // 只在组件挂载时执行一次

  return {
    // 数据状态
    projects,
    total,
    loading,
    error,
    
    // 分页状态
    currentPage,
    pageSize,
    
    // 搜索状态
    searchKeyword,
    
    // 操作方法
    fetchProjects,
    setPage,
    setPageSize: setPageSizeHandler,
    setSearch,
    refresh,
    reset
  }
}