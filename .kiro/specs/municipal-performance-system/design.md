# 市政业绩管理系统设计文档

## 概述

本系统是一个基于现代Web技术栈的市政业绩数据管理平台，采用前后端分离架构，支持Excel文件上传、数据查询、缓存优化等功能。

## 技术架构

### 整体架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │───▶│  后端 (Hono.js)  │───▶│ 数据库(PostgreSQL)│
│  + TypeScript   │    │  + TypeScript   │    │   + Prisma      │
│  + Ant Design   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  缓存 (Redis)    │
                       │   60秒TTL      │
                       └─────────────────┘
```

### 技术栈选择说明

#### 前端：React.js + TypeScript
- **React.js**: 现代化的前端框架，组件化开发，生态丰富
- **TypeScript**: 提供类型安全，减少运行时错误，提高代码质量
- **Ant Design Pro Components**: 企业级UI组件库，ProTable提供强大的表格功能

#### 后端：Hono.js + TypeScript  
- **Hono.js**: 轻量级、高性能的Web框架，类似Express但更现代
- **TypeScript**: 与前端保持技术栈一致，类型安全
- **特点**: 支持多种运行时(Node.js, Bun, Deno)，API简洁

#### 数据库：PostgreSQL + Prisma
- **PostgreSQL**: 功能强大的关系型数据库，支持复杂查询
- **Prisma**: 现代化的ORM工具，类型安全的数据库操作
- **优势**: 自动生成类型定义，迁移管理，查询构建器

#### 缓存：Redis
- **Redis**: 内存数据库，高性能键值存储
- **用途**: 缓存查询结果，减少数据库压力，提升响应速度

## 组件和接口设计

### 数据模型

#### Project 表结构
```typescript
model Project {
  id          Int      @id @default(autoincrement())
  name        String   @unique  // 项目名称，唯一约束防重复
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### API接口设计

#### 1. 文件上传接口
```typescript
POST /api/upload
Content-Type: multipart/form-data

Request:
- file: Excel文件

Response:
{
  success: boolean;
  message: string;
  data: {
    totalRows: number;      // 总行数
    insertedRows: number;   // 新插入行数
    duplicateRows: number;  // 重复行数
  }
}
```

#### 2. 数据查询接口
```typescript
GET /api/projects?page=1&pageSize=10&search=关键词

Response:
{
  success: boolean;
  data: {
    projects: Project[];
    total: number;
    page: number;
    pageSize: number;
  }
}
```

### 前端组件设计

#### 1. 上传组件 (UploadComponent)
```typescript
interface UploadComponentProps {
  onUploadSuccess: (result: UploadResult) => void;
}
```

#### 2. 数据表格组件 (ProjectTable)
```typescript
interface ProjectTableProps {
  searchValue?: string;
  onSearch: (value: string) => void;
}
```

## 错误处理

### 后端错误处理
1. **文件格式错误**: 返回400状态码，提示支持的文件格式
2. **文件解析错误**: 返回400状态码，提示文件内容格式问题  
3. **数据库连接错误**: 返回500状态码，记录错误日志
4. **Redis连接错误**: 降级处理，直接查询数据库

### 前端错误处理
1. **网络错误**: 显示友好的错误提示，支持重试
2. **文件上传失败**: 显示具体错误信息
3. **数据加载失败**: 显示加载失败状态，支持刷新

## 缓存策略

### Redis缓存设计
```typescript
// 缓存键格式
const cacheKey = `projects:page:${page}:size:${pageSize}:search:${search}`;

// 缓存逻辑
1. 查询时先检查Redis缓存
2. 缓存命中：直接返回数据
3. 缓存未命中：查询数据库 → 存入Redis(TTL=60s) → 返回数据
4. 数据更新时：清除相关缓存
```

## 测试策略

### 单元测试
1. **后端API测试**: 使用Jest测试各个接口
2. **数据库操作测试**: 测试Prisma模型操作
3. **前端组件测试**: 使用React Testing Library

### 集成测试  
1. **文件上传流程**: 端到端测试上传功能
2. **数据查询流程**: 测试搜索和分页功能
3. **缓存功能**: 测试Redis缓存逻辑

### 性能测试
1. **并发上传测试**: 测试多用户同时上传
2. **大数据量查询**: 测试分页性能
3. **缓存效果**: 对比有无缓存的响应时间

## 部署架构

### 开发环境
```
本地开发:
- 前端: npm run dev (Vite开发服务器)
- 后端: npm run dev (Hono.js开发服务器) 
- 数据库: Docker PostgreSQL
- 缓存: Docker Redis
```

### 生产环境 (加分项)
```
云服务部署:
- 前端: Vercel/Netlify 静态部署
- 后端: Railway/Render Node.js部署
- 数据库: Supabase PostgreSQL
- 缓存: Redis Cloud
- 域名: 自定义域名 + SSL证书
```

## 项目结构

### 前端项目结构
```
frontend/
├── src/
│   ├── components/          # 组件
│   │   ├── UploadComponent.tsx
│   │   └── ProjectTable.tsx
│   ├── services/           # API服务
│   │   └── api.ts
│   ├── types/              # 类型定义
│   │   └── index.ts
│   └── App.tsx
├── package.json
└── tsconfig.json
```

### 后端项目结构  
```
backend/
├── src/
│   ├── routes/             # 路由
│   │   ├── upload.ts
│   │   └── projects.ts
│   ├── services/           # 业务逻辑
│   │   ├── excelService.ts
│   │   └── cacheService.ts
│   ├── prisma/             # 数据库
│   │   └── schema.prisma
│   └── index.ts
├── package.json
└── tsconfig.json
```