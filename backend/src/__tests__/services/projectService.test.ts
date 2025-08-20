// 项目服务单元测试

// 模拟Prisma客户端
const mockPrisma = {
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

// 模拟缓存服务
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  deletePattern: jest.fn(),
};

// 模拟缓存键
const mockCacheKeys = {
  projectList: jest.fn(() => 'projects:list:1:10:'),
  projectStats: jest.fn(() => 'projects:stats'),
  allProjectsPattern: jest.fn(() => 'projects:*'),
};

const mockCacheConfig = {
  PROJECT_LIST_TTL: 60,
  STATS_TTL: 300,
};

// 设置模拟
jest.mock('../../lib/database', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../lib/redis', () => ({
  CacheService: mockCacheService,
}));

jest.mock('../../lib/cache-keys', () => ({
  CacheKeys: mockCacheKeys,
  CACHE_CONFIG: mockCacheConfig,
}));

import { ProjectService, ProjectData } from '../../services/projectService';

// 类型断言已在上面的mock定义中处理

describe('ProjectService', () => {
  beforeEach(() => {
    // 清除所有mock的调用记录
    jest.clearAllMocks();
  });

  describe('batchImport', () => {
    it('应该成功导入新项目并跳过重复项目', async () => {
      const projectsData: ProjectData[] = [
        { name: '新项目1' },
        { name: '新项目2' },
        { name: '已存在项目' },
        { name: '新项目1' }, // 重复项目
      ];

      // 模拟事务执行
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          project: {
            findMany: jest.fn().mockResolvedValue([
              { name: '已存在项目' }
            ]),
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
            findMany: jest.fn().mockResolvedValue([
              { id: 1, name: '新项目1' },
              { id: 2, name: '新项目2' }
            ]),
          }
        });
      });

      mockCacheService.deletePattern.mockResolvedValue(undefined);

      const result = await ProjectService.batchImport(projectsData);

      expect(result.totalRows).toBe(4);
      expect(result.insertedRows).toBe(2);
      expect(result.duplicateRows).toBe(1);
      expect(result.duplicateProjects).toEqual(['已存在项目']);
      expect(mockCacheService.deletePattern).toHaveBeenCalled();
    });

    it('应该处理空的项目数据', async () => {
      const projectsData: ProjectData[] = [];

      const result = await ProjectService.batchImport(projectsData);

      expect(result.totalRows).toBe(0);
      expect(result.insertedRows).toBe(0);
      expect(result.duplicateRows).toBe(0);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('应该处理数据库错误', async () => {
      const projectsData: ProjectData[] = [{ name: '测试项目' }];

      mockPrisma.$transaction.mockRejectedValue(new Error('数据库连接失败'));

      await expect(ProjectService.batchImport(projectsData))
        .rejects.toThrow('数据导入失败，请稍后重试');
    });
  });

  describe('createProject', () => {
    it('应该成功创建新项目', async () => {
      const projectData: ProjectData = { name: '新项目' };
      const mockProject = { id: 1, name: '新项目', createdAt: new Date() };

      mockPrisma.project.create.mockResolvedValue(mockProject);
      mockCacheService.deletePattern.mockResolvedValue(undefined);

      const result = await ProjectService.createProject(projectData);

      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: { name: '新项目' }
      });
      expect(mockCacheService.deletePattern).toHaveBeenCalled();
    });

    it('应该处理重复项目名称错误', async () => {
      const projectData: ProjectData = { name: '重复项目' };

      mockPrisma.project.create.mockRejectedValue({ code: 'P2002' });

      await expect(ProjectService.createProject(projectData))
        .rejects.toThrow('项目名称已存在');
    });

    it('应该处理其他数据库错误', async () => {
      const projectData: ProjectData = { name: '测试项目' };

      mockPrisma.project.create.mockRejectedValue(new Error('数据库错误'));

      await expect(ProjectService.createProject(projectData))
        .rejects.toThrow('创建项目失败');
    });
  });

  describe('getProjects', () => {
    it('应该从缓存返回项目列表', async () => {
      const cachedData = {
        projects: [{ id: 1, name: '项目1' }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };

      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await ProjectService.getProjects(1, 10, '');

      expect(result).toEqual(cachedData);
      expect(mockPrisma.project.count).not.toHaveBeenCalled();
      expect(mockPrisma.project.findMany).not.toHaveBeenCalled();
    });

    it('应该从数据库查询并缓存结果', async () => {
      const mockProjects = [
        { id: 1, name: '项目1', createdAt: new Date() },
        { id: 2, name: '项目2', createdAt: new Date() }
      ];

      mockCacheService.get.mockResolvedValue(null);
      mockPrisma.project.count.mockResolvedValue(2);
      mockPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await ProjectService.getProjects(1, 10, '');

      expect(result.projects).toEqual(mockProjects);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('应该支持搜索功能', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrisma.project.count.mockResolvedValue(1);
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 1, name: '道路项目', createdAt: new Date() }
      ]);
      mockCacheService.set.mockResolvedValue(undefined);

      await ProjectService.getProjects(1, 10, '道路');

      expect(mockPrisma.project.count).toHaveBeenCalledWith({
        where: {
          name: {
            contains: '道路',
            mode: 'insensitive'
          }
        }
      });
    });

    it('应该处理数据库查询错误', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrisma.project.count.mockRejectedValue(new Error('数据库错误'));

      await expect(ProjectService.getProjects(1, 10, ''))
        .rejects.toThrow('获取项目列表失败');
    });
  });

  describe('getProjectById', () => {
    it('应该返回存在的项目', async () => {
      const mockProject = { id: 1, name: '测试项目', createdAt: new Date() };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await ProjectService.getProjectById(1);

      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('应该返回null当项目不存在时', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const result = await ProjectService.getProjectById(999);

      expect(result).toBeNull();
    });

    it('应该处理数据库错误', async () => {
      mockPrisma.project.findUnique.mockRejectedValue(new Error('数据库错误'));

      await expect(ProjectService.getProjectById(1))
        .rejects.toThrow('获取项目详情失败');
    });
  });

  describe('getProjectStats', () => {
    it('应该从缓存返回统计信息', async () => {
      const cachedStats = { total: 100, lastUpdated: '2023-01-01T00:00:00.000Z' };

      mockCacheService.get.mockResolvedValue(cachedStats);

      const result = await ProjectService.getProjectStats();

      expect(result).toEqual(cachedStats);
      expect(mockPrisma.project.count).not.toHaveBeenCalled();
    });

    it('应该从数据库查询并缓存统计信息', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrisma.project.count.mockResolvedValue(50);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await ProjectService.getProjectStats();

      expect(result.total).toBe(50);
      expect(result.lastUpdated).toBeDefined();
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    it('应该成功删除项目', async () => {
      const mockProject = { id: 1, name: '要删除的项目', createdAt: new Date() };

      mockPrisma.project.delete.mockResolvedValue(mockProject);
      mockCacheService.deletePattern.mockResolvedValue(undefined);

      const result = await ProjectService.deleteProject(1);

      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockCacheService.deletePattern).toHaveBeenCalled();
    });

    it('应该处理项目不存在的情况', async () => {
      mockPrisma.project.delete.mockRejectedValue({ code: 'P2025' });

      await expect(ProjectService.deleteProject(999))
        .rejects.toThrow('项目不存在');
    });

    it('应该处理其他删除错误', async () => {
      mockPrisma.project.delete.mockRejectedValue(new Error('数据库错误'));

      await expect(ProjectService.deleteProject(1))
        .rejects.toThrow('删除项目失败');
    });
  });
});