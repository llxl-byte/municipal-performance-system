// Redis缓存服务单元测试

// 模拟Redis客户端
const mockRedis = {
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
};

// 模拟redis模块
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedis),
}));

// 模拟CacheService
jest.mock('../../lib/redis', () => ({
  CacheService: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
  },
  redis: mockRedis,
}));

import { CacheService } from '../../lib/redis';

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('应该成功设置缓存', async () => {
      const testData = { name: '测试项目', id: 1 };
      mockRedis.setEx.mockResolvedValue('OK');

      await CacheService.set('test:key', testData, 120);

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'test:key',
        120,
        JSON.stringify(testData)
      );
    });

    it('应该使用默认TTL', async () => {
      const testData = { name: '测试项目' };
      mockRedis.setEx.mockResolvedValue('OK');

      await CacheService.set('test:key', testData);

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'test:key',
        60, // 默认TTL
        JSON.stringify(testData)
      );
    });

    it('应该处理设置缓存时的错误', async () => {
      const testData = { name: '测试项目' };
      mockRedis.setEx.mockRejectedValue(new Error('Redis连接失败'));

      // 不应该抛出错误，而是静默处理
      await expect(CacheService.set('test:key', testData)).resolves.toBeUndefined();
    });
  });

  describe('get', () => {
    it('应该成功获取缓存数据', async () => {
      const testData = { name: '测试项目', id: 1 };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await CacheService.get('test:key');

      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test:key');
    });

    it('应该返回null当缓存不存在时', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await CacheService.get('nonexistent:key');

      expect(result).toBeNull();
    });

    it('应该处理JSON解析错误', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const result = await CacheService.get('test:key');

      expect(result).toBeNull();
    });

    it('应该处理Redis获取错误', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis连接失败'));

      const result = await CacheService.get('test:key');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('应该成功删除缓存', async () => {
      mockRedis.del.mockResolvedValue(1);

      await CacheService.delete('test:key');

      expect(mockRedis.del).toHaveBeenCalledWith('test:key');
    });

    it('应该处理删除缓存时的错误', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis连接失败'));

      // 不应该抛出错误，而是静默处理
      await expect(CacheService.delete('test:key')).resolves.toBeUndefined();
    });
  });

  describe('deletePattern', () => {
    it('应该成功删除匹配模式的缓存', async () => {
      const matchingKeys = ['projects:1', 'projects:2', 'projects:3'];
      mockRedis.keys.mockResolvedValue(matchingKeys);
      mockRedis.del.mockResolvedValue(3);

      await CacheService.deletePattern('projects:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('projects:*');
      expect(mockRedis.del).toHaveBeenCalledWith(matchingKeys);
    });

    it('应该处理没有匹配键的情况', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await CacheService.deletePattern('nonexistent:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('nonexistent:*');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('应该处理批量删除时的错误', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis连接失败'));

      // 不应该抛出错误，而是静默处理
      await expect(CacheService.deletePattern('test:*')).resolves.toBeUndefined();
    });
  });

  describe('exists', () => {
    it('应该返回true当缓存存在时', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await CacheService.exists('test:key');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('test:key');
    });

    it('应该返回false当缓存不存在时', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await CacheService.exists('nonexistent:key');

      expect(result).toBe(false);
    });

    it('应该处理检查存在性时的错误', async () => {
      mockRedis.exists.mockRejectedValue(new Error('Redis连接失败'));

      const result = await CacheService.exists('test:key');

      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('应该返回正确的TTL值', async () => {
      mockRedis.ttl.mockResolvedValue(120);

      const result = await CacheService.ttl('test:key');

      expect(result).toBe(120);
      expect(mockRedis.ttl).toHaveBeenCalledWith('test:key');
    });

    it('应该返回-1当缓存永不过期时', async () => {
      mockRedis.ttl.mockResolvedValue(-1);

      const result = await CacheService.ttl('persistent:key');

      expect(result).toBe(-1);
    });

    it('应该返回-2当缓存不存在时', async () => {
      mockRedis.ttl.mockResolvedValue(-2);

      const result = await CacheService.ttl('nonexistent:key');

      expect(result).toBe(-2);
    });

    it('应该处理获取TTL时的错误', async () => {
      mockRedis.ttl.mockRejectedValue(new Error('Redis连接失败'));

      const result = await CacheService.ttl('test:key');

      expect(result).toBe(-2);
    });
  });
});