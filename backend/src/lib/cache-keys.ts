// 缓存键生成工具
// 统一管理所有缓存键的格式，避免键名冲突

export class CacheKeys {
  /**
   * 生成项目列表缓存键
   * @param page 页码
   * @param pageSize 每页大小
   * @param search 搜索关键词
   * @returns 缓存键
   */
  static projectList(page: number, pageSize: number, search: string = ''): string {
    return `projects:page:${page}:size:${pageSize}:search:${search}`
  }

  /**
   * 生成单个项目缓存键
   * @param id 项目ID
   * @returns 缓存键
   */
  static project(id: number): string {
    return `project:${id}`
  }

  /**
   * 生成项目统计缓存键
   * @returns 缓存键
   */
  static projectStats(): string {
    return 'projects:stats'
  }

  /**
   * 获取所有项目相关缓存的匹配模式
   * @returns 匹配模式
   */
  static projectsPattern(): string {
    return 'projects:*'
  }

  /**
   * 获取所有项目相关缓存的匹配模式（包括单个项目）
   * @returns 匹配模式
   */
  static allProjectsPattern(): string {
    return 'project*'
  }
}

// 缓存配置常量
export const CACHE_CONFIG = {
  // 项目列表缓存时间（60秒）
  PROJECT_LIST_TTL: 60,
  
  // 单个项目缓存时间（5分钟）
  PROJECT_TTL: 300,
  
  // 统计数据缓存时间（10分钟）
  STATS_TTL: 600,
} as const