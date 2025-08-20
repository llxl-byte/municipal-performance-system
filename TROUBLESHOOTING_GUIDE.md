# 🔧 故障排除指南

## 问题诊断和解决方案

### 1. 数据库连接问题

#### 问题现象
```
Can't reach database server at `localhost:5432`
```

#### 解决步骤

**方案A：使用Docker启动PostgreSQL（推荐）**

1. 创建Docker Compose文件：
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: municipal_performance
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

2. 启动服务：
```bash
docker-compose up -d
```

**方案B：本地安装PostgreSQL**

1. 下载并安装PostgreSQL：https://www.postgresql.org/download/
2. 创建数据库：
```sql
CREATE DATABASE municipal_performance;
CREATE USER admin WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE municipal_performance TO admin;
```

**方案C：使用在线数据库服务**

1. 注册免费的PostgreSQL服务（如Supabase、Railway、Neon）
2. 获取连接字符串
3. 更新.env文件中的DATABASE_URL

### 2. 数据库表未创建

#### 解决步骤
```bash
# 进入backend目录
cd backend

# 生成Prisma客户端
npm run db:generate

# 推送数据库结构
npm run db:push

# 或者使用迁移
npm run db:migrate
```

### 3. Redis连接问题

#### 解决步骤

**使用Docker启动Redis：**
```bash
docker run -d -p 6379:6379 redis:7
```

**或者本地安装Redis：**
- Windows: https://github.com/microsoftarchive/redis/releases
- 启动Redis服务

### 4. 环境变量配置

确保backend/.env文件包含正确的配置：
```env
DATABASE_URL="postgresql://admin:password@localhost:5432/municipal_performance?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=8000
NODE_ENV=development
MAX_FILE_SIZE=10485760
```

### 5. 依赖安装问题

```bash
# 重新安装依赖
cd backend && npm install
cd ../frontend && npm install
```

### 6. 端口冲突

如果8000端口被占用，修改backend/.env中的PORT值：
```env
PORT=8001
```

同时更新frontend中的API_BASE_URL（如果有硬编码）。

## 🚀 快速启动指南

### 使用Docker（推荐）

1. 确保安装了Docker和Docker Compose
2. 在项目根目录创建docker-compose.yml
3. 启动服务：
```bash
docker-compose up -d
```
4. 初始化数据库：
```bash
cd backend
npm run db:push
```
5. 启动后端：
```bash
npm run dev
```
6. 启动前端：
```bash
cd ../frontend
npm run dev
```

### 不使用Docker

1. 安装PostgreSQL和Redis
2. 创建数据库和用户
3. 配置.env文件
4. 初始化数据库结构
5. 启动服务

## 🧪 测试验证

运行测试脚本验证系统：
```bash
cd backend
npx tsx src/simple-test.ts
```

如果看到"🎉 所有测试通过！"，说明系统配置正确。

## 📞 常见错误代码

- **P1001**: 数据库连接失败
- **P2002**: 唯一约束违反（数据重复）
- **ECONNREFUSED**: Redis连接被拒绝
- **EADDRINUSE**: 端口被占用

## 🔍 调试技巧

1. 检查服务状态：
```bash
# 检查PostgreSQL
docker ps | grep postgres
# 或
pg_isready -h localhost -p 5432

# 检查Redis
docker ps | grep redis
# 或
redis-cli ping
```

2. 查看日志：
```bash
# Docker日志
docker-compose logs postgres
docker-compose logs redis

# 应用日志
npm run dev  # 查看控制台输出
```

3. 数据库连接测试：
```bash
# 使用psql连接
psql -h localhost -p 5432 -U admin -d municipal_performance

# 使用Redis CLI
redis-cli -h localhost -p 6379
```