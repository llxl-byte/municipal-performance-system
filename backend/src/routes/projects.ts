// 项目查询路由
import { Hono } from 'hono'
import { ProjectService } from '../services/projectService.js'
import { ResponseHelper } from '../lib/response.js'
import { validateRequest, ValidationSchemas } from '../middleware/validation.js'
import { cacheMiddleware } from '../middleware/cache.js'
import { CacheKeys, CACHE_CONFIG } from '../lib/cache-keys.js'

const projectRoutes = new Hono()

// 获取项目列表（支持分页和搜索）
projectRoutes.get(
  '/projects',
  // 参数验证中间件
  validateRequest({
    query: ValidationSchemas.pagination
  }),
  // 缓存中间件
  cacheMiddleware(
    (c) => {
      const { page, pageSize, search } = c.get('validatedQuery')
      return CacheKeys.projectList(page, pageSize, search)
    },
    CACHE_CONFIG.PROJECT_LIST_TTL
  ),
  async (c) => {
    try {
      const { page, pageSize, search } = c.get('validatedQuery')
      
      console.log(`🔍 查询项目列表: 第${page}页, 每页${pageSize}条, 搜索:"${search}"`)

      const result = await ProjectService.getProjects(page, pageSize, search)

      return ResponseHelper.paginated(
        c,
        result.projects,
        result.total,
        result.page,
        result.pageSize,
        search ? `搜索"${search}"找到${result.total}个项目` : `获取项目列表成功`
      )

    } catch (error: any) {
      console.error('❌ 获取项目列表失败:', error)
      return ResponseHelper.error(c, error.message || '获取项目列表失败', 500)
    }
  }
)

// 获取单个项目详情
projectRoutes.get(
  '/projects/:id',
  validateRequest({
    params: ValidationSchemas.idParam
  }),
  async (c) => {
    try {
      const { id } = c.get('validatedParams')
      
      console.log(`🔍 查询项目详情: ID=${id}`)

      const project = await ProjectService.getProjectById(id)
      
      if (!project) {
        return ResponseHelper.error(c, '项目不存在', 404, 'PROJECT_NOT_FOUND')
      }

      return ResponseHelper.success(c, project, '获取项目详情成功')

    } catch (error: any) {
      console.error('❌ 获取项目详情失败:', error)
      return ResponseHelper.error(c, error.message || '获取项目详情失败', 500)
    }
  }
)

// 获取项目统计信息
projectRoutes.get('/projects/stats/summary', async (c) => {
  try {
    console.log('📊 查询项目统计信息')

    const stats = await ProjectService.getProjectStats()

    return ResponseHelper.success(c, stats, '获取统计信息成功')

  } catch (error: any) {
    console.error('❌ 获取统计信息失败:', error)
    return ResponseHelper.error(c, error.message || '获取统计信息失败', 500)
  }
})

// 创建单个项目
projectRoutes.post(
  '/projects',
  validateRequest({
    body: ValidationSchemas.createProject
  }),
  async (c) => {
    try {
      const projectData = c.get('validatedBody')
      
      console.log(`➕ 创建新项目: ${projectData.name}`)

      const project = await ProjectService.createProject(projectData)

      return ResponseHelper.success(c, project, '创建项目成功', 201)

    } catch (error: any) {
      console.error('❌ 创建项目失败:', error)
      const statusCode = error.message.includes('已存在') ? 409 : 500
      return ResponseHelper.error(c, error.message || '创建项目失败', statusCode)
    }
  }
)

// 删除项目
projectRoutes.delete(
  '/projects/:id',
  validateRequest({
    params: ValidationSchemas.idParam
  }),
  async (c) => {
    try {
      const { id } = c.get('validatedParams')
      
      console.log(`🗑️ 删除项目: ID=${id}`)

      const project = await ProjectService.deleteProject(id)

      return ResponseHelper.success(c, project, '删除项目成功')

    } catch (error: any) {
      console.error('❌ 删除项目失败:', error)
      const statusCode = error.message.includes('不存在') ? 404 : 500
      return ResponseHelper.error(c, error.message || '删除项目失败', statusCode)
    }
  }
)

// 搜索项目（专门的搜索接口）
projectRoutes.get(
  '/projects/search/:keyword',
  validateRequest({
    params: ValidationSchemas.keywordParam,
    query: ValidationSchemas.pagination
  }),
  async (c) => {
    try {
      const { keyword } = c.get('validatedParams')
      const { page, pageSize } = c.get('validatedQuery')
      
      console.log(`🔍 搜索项目: "${keyword}", 第${page}页`)

      const result = await ProjectService.getProjects(page, pageSize, keyword)

      return ResponseHelper.paginated(
        c,
        result.projects,
        result.total,
        result.page,
        result.pageSize,
        `搜索"${keyword}"找到${result.total}个匹配项目`
      )

    } catch (error: any) {
      console.error('❌ 搜索项目失败:', error)
      return ResponseHelper.error(c, error.message || '搜索项目失败', 500)
    }
  }
)

export { projectRoutes }