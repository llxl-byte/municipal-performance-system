// Jest测试环境设置文件
// 这个文件在每个测试文件运行前都会被执行

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // 使用数据库1进行测试

// 模拟Redis客户端，避免测试时需要真实的Redis服务
jest.mock('../lib/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushDb: jest.fn(),
    quit: jest.fn(),
    isReady: true,
  },
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
}));

// 全局测试超时设置
jest.setTimeout(10000);

// 测试完成后的清理工作
afterAll(async () => {
  // 这里可以添加测试完成后的清理逻辑
});