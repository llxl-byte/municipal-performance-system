// 项目数据服务
import { prisma } from '../lib/database.js'
import { CacheService } from '../lib/redis.js'
import { CacheKeys, CACHE_CONFIG } from '../lib/cache-keys.js'

// 项目数据接口
export interface ProjectData {
  name: string
}

// 批量导入结果接口
export interface ImportResult {
  totalRows: number      // 总行数
  insertedRows: number   // 新插入行数
  duplicateRows: number  // 重复行数
  insertedProjects: Array<{ id: number; name: string }> // 新插入的项目
  duplicateProjects: string[] // 重复的项目名称
}

export class ProjectService {
  /**
   * 批量导入项目数据（带去重）
   * @param projectsData 项目数据数组
   * @returns 导入结果统计
   */
  static async batchImport(projectsData: ProjectData[]): Promise<ImportResult> {
    console.log(`📊 开始批量导入 ${projectsData.length} 条项目数据`)

    const result: ImportResult = {
      totalRows: projectsData.length,
      insertedRows: 0,
      duplicateRows: 0,
      insertedProjects: [],
      duplicateProjects: []
    }

    // 去除空白和重复的项目名称
    const uniqueNames = [...new Set(
      projectsData
        .map(p => p.name.trim())
        .filter(name => name.length > 0)
    )]

    console.log(`🔍 去重后有效项目名称: ${uniqueNames.length} 个`)

    if (uniqueNames.length === 0) {
      console.log('⚠️ 没有有效的项目数据')
      return result
    }

    try {
      // 使用事务确保数据一致性
      await prisma.$transaction(async (tx) => {
        // 1. 查询已存在的项目
        const existingProjects = await tx.project.findMany({
          where: {
            name: {
              in: uniqueNames
            }
          },
          select: {
            name: true
          }
        })

        const existingNames = new Set(existingProjects.map(p => p.name))
        console.log(`📋 数据库中已存在 ${existingNames.size} 个项目`)

        // 2. 分离新项目和重复项目
        const newNames: string[] = []
        const duplicateNames: string[] = []

        uniqueNames.forEach(name => {
          if (existingNames.has(name)) {
            duplicateNames.push(name)
          } else {
            newNames.push(name)
          }
        })

        result.duplicateRows = duplicateNames.length
        result.duplicateProjects = duplicateNames

        console.log(`✨ 需要插入的新项目: ${newNames.length} 个`)
        console.log(`🔄 重复的项目: ${duplicateNames.length} 个`)

        // 3. 批量插入新项目
        if (newNames.length > 0) {
          const insertData = newNames.map(name => ({ name }))
          
          // 使用createMany进行批量插入
          const createResult = await tx.project.createMany({
            data: insertData,
            skipDuplicates: true // 跳过重复数据（双重保险）
          })

          result.insertedRows = createResult.count

          // 获取刚插入的项目详情（用于返回给前端）
          const insertedProjects = await tx.project.findMany({
            where: {
              name: {
                in: newNames
              }
            },
            select: {
              id: true,
              name: true
            },
            orderBy: {
              id: 'desc'
            },
            take: newNames.length
          })

          result.insertedProjects = insertedProjects
          console.log(`✅ 成功插入 ${result.insertedRows} 个新项目`)
        }
      })

      // 4. 清除相关缓存
      await this.clearProjectCaches()

      console.log(`🎉 批量导入完成: 总计${result.totalRows}, 新增${result.insertedRows}, 重复${result.duplicateRows}`)
      return result

    } catch (error) {
      console.error('❌ 批量导入失败:', error)
      throw new Error('数据导入失败，请稍后重试')
    }
  }

  /**
   * 创建单个项目
   * @param projectData 项目数据
   * @returns 创建的项目
   */
  static async createProject(projectData: ProjectData) {
    try {
      const project = await prisma.project.create({
        data: {
          name: projectData.name.trim()
        }
      })

      // 清除相关缓存
      await this.clearProjectCaches()

      console.log(`✅ 创建项目成功: ${project.name}`)
      return project
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('项目名称已存在')
      }
      console.error('❌ 创建项目失败:', error)
      throw new Error('创建项目失败')
    }
  }

  /**
   * 获取项目列表（带分页和搜索）
   * @param page 页码
   * @param pageSize 每页大小
   * @param search 搜索关键词
   * @returns 项目列表和统计信息
   */
  static async getProjects(page: number = 1, pageSize: number = 10, search: string = '') {
    const cacheKey = CacheKeys.projectList(page, pageSize, search)
    
    try {
      // 尝试从缓存获取
      const cachedData = await CacheService.get(cacheKey)
      if (cachedData) {
        console.log(`🎯 从缓存获取项目列表: 第${page}页`)
        return cachedData
      }

      // 构建查询条件
      const where = search ? {
        name: {
          contains: search,
          mode: 'insensitive' as const
        }
      } : {}

      // 并行查询总数和数据
      const [total, projects] = await Promise.all([
        prisma.project.count({ where }),
        prisma.project.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: {
            createdAt: 'desc'
          }
        })
      ])

      const result = {
        projects,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }

      // 存入缓存
      await CacheService.set(cacheKey, result, CACHE_CONFIG.PROJECT_LIST_TTL)
      console.log(`📦 项目列表已缓存: 第${page}页, 共${total}条`)

      return result
    } catch (error) {
      console.error('❌ 获取项目列表失败:', error)
      throw new Error('获取项目列表失败')
    }
  }

  /**
   * 根据ID获取单个项目
   * @param id 项目ID
   * @returns 项目详情或null
   */
  static async getProjectById(id: number) {
    try {
      const project = await prisma.project.findUnique({
        where: { id }
      })

      if (project) {
        console.log(`✅ 找到项目: ${project.name}`)
      } else {
        console.log(`⚠️ 项目不存在: ID=${id}`)
      }

      return project
    } catch (error) {
      console.error('❌ 获取项目详情失败:', error)
      throw new Error('获取项目详情失败')
    }
  }

  /**
   * 获取项目统计信息
   * @returns 统计信息
   */
  static async getProjectStats() {
    const cacheKey = CacheKeys.projectStats()
    
    try {
      // 尝试从缓存获取
      const cachedStats = await CacheService.get(cacheKey)
      if (cachedStats) {
        console.log('🎯 从缓存获取项目统计')
        return cachedStats
      }

      const total = await prisma.project.count()
      const stats = {
        total,
        lastUpdated: new Date().toISOString()
      }

      // 存入缓存
      await CacheService.set(cacheKey, stats, CACHE_CONFIG.STATS_TTL)
      console.log(`📊 项目统计已缓存: 总计${total}个项目`)

      return stats
    } catch (error) {
      console.error('❌ 获取项目统计失败:', error)
      throw new Error('获取项目统计失败')
    }
  }

  /**
   * 删除项目
   * @param id 项目ID
   */
  static async deleteProject(id: number) {
    try {
      const project = await prisma.project.delete({
        where: { id }
      })

      // 清除相关缓存
      await this.clearProjectCaches()

      console.log(`🗑️ 删除项目成功: ${project.name}`)
      return project
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('项目不存在')
      }
      console.error('❌ 删除项目失败:', error)
      throw new Error('删除项目失败')
    }
  }

  /**
   * 清除所有项目相关缓存
   */
  private static async clearProjectCaches() {
    try {
      await CacheService.deletePattern(CacheKeys.allProjectsPattern())
      console.log('🧹 项目相关缓存已清除')
    } catch (error) {
      console.error('❌ 清除缓存失败:', error)
    }
  }
}