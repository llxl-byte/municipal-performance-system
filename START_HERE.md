# 🚀 快速启动指南

## 方法1：自动启动（推荐）

### 1. 启动数据库服务
```bash
# 在项目根目录运行
docker-compose up -d postgres redis
```

### 2. 等待服务启动（约10-15秒）
```bash
# 检查服务状态
docker-compose ps
```

### 3. 初始化数据库
```bash
cd backend
npm run db:generate
npm run db:push
```

### 4. 测试系统
```bash
# 在backend目录运行
npx tsx src/simple-test.ts
```

### 5. 启动后端服务
```bash
# 在backend目录运行
npm run dev
```

### 6. 启动前端服务
```bash
# 新开一个终端，在frontend目录运行
cd frontend
npm run dev
```

## 方法2：手动启动

如果没有Docker，请按照以下步骤：

### 1. 安装PostgreSQL
- 下载：https://www.postgresql.org/download/
- 创建数据库：`municipal_performance`
- 创建用户：`admin` / `password`

### 2. 安装Redis
- Windows: https://github.com/microsoftarchive/redis/releases
- 启动Redis服务

### 3. 配置环境变量
确保 `backend/.env` 文件配置正确：
```env
DATABASE_URL="postgresql://admin:password@localhost:5432/municipal_performance?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=8000
NODE_ENV=development
```

### 4. 初始化数据库
```bash
cd backend
npm run db:generate
npm run db:push
```

### 5. 启动服务
```bash
# 后端
cd backend
npm run dev

# 前端（新终端）
cd frontend
npm run dev
```

## 🔍 验证系统

访问以下地址验证系统是否正常：

- **前端**: http://localhost:3000
- **后端API**: http://localhost:8000
- **健康检查**: http://localhost:8000/api/health

## 📁 测试文件上传

1. 准备一个Excel文件，第一列包含项目名称
2. 访问前端上传页面
3. 拖拽或点击上传Excel文件
4. 查看上传结果和数据展示

## 🛠️ 故障排除

如果遇到问题，请查看 `TROUBLESHOOTING_GUIDE.md` 文件。

常见问题：
- **数据库连接失败**: 检查PostgreSQL是否运行
- **Redis连接失败**: 检查Redis是否运行
- **端口被占用**: 修改.env中的PORT配置
- **文件上传失败**: 检查文件格式和大小

## 🎯 下一步

系统启动成功后，您可以：

1. 上传市政业绩.xlsx文件
2. 查看数据解析和导入结果
3. 使用搜索和分页功能
4. 查看缓存效果（60秒TTL）
5. 测试错误处理和重试机制