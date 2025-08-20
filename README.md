# 市政业绩管理系统

这是一个基于现代Web技术栈的市政业绩数据管理平台。

## 技术栈

- **前端**: React.js + TypeScript + Ant Design Pro Components
- **后端**: Hono.js + TypeScript
- **数据库**: PostgreSQL + Prisma
- **缓存**: Redis
- **部署**: 云服务 + 自定义域名 + SSL

## 功能特性

- ✅ Excel文件上传和解析
- ✅ 数据查询和搜索
- ✅ 分页展示
- ✅ Redis缓存优化
- ✅ 防重复数据
- ✅ 美观的用户界面

## 项目结构

```
├── frontend/          # React前端
├── backend/           # Hono.js后端
├── docker-compose.yml # 本地开发环境
└── README.md         # 项目说明
```

## 快速开始

### 1. 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 2. 启动开发环境
```bash
# 启动数据库和Redis (Docker)
docker-compose up -d

# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

## 开发进度

- [ ] 项目初始化
- [ ] 数据库设置
- [ ] 后端API开发
- [ ] 前端界面开发
- [ ] 测试和优化
- [ ] 部署上线