# 🚀 市政业绩管理系统部署指南

## 📋 部署概述

本文档详细介绍了如何将市政业绩管理系统部署到生产环境。系统采用现代化的容器化部署方案，支持多种部署方式。

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Frontend      │    │   Backend       │
│   (反向代理)     │────│   (React SPA)   │────│   (Hono.js API) │
│   Port: 80/443  │    │   Port: 3000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis         │    │   PostgreSQL    │
                       │   (缓存)        │    │   (数据库)      │
                       │   Port: 6379    │    │   Port: 5432    │
                       └─────────────────┘    └─────────────────┘
```

## 🔧 部署前准备

### 1. 系统要求

**最低配置**：
- CPU: 2核心
- 内存: 4GB RAM
- 存储: 20GB SSD
- 操作系统: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

**推荐配置**：
- CPU: 4核心
- 内存: 8GB RAM
- 存储: 50GB SSD
- 操作系统: Ubuntu 22.04 LTS

### 2. 必需软件

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18.0+ (开发环境)
- **Git**: 2.30+

### 3. 端口要求

确保以下端口可用：
- `80`: HTTP访问
- `443`: HTTPS访问
- `8000`: 后端API
- `5432`: PostgreSQL数据库
- `6379`: Redis缓存

## 🚀 部署方式

### 方式一：Docker Compose部署（推荐）

#### 1. 克隆项目
```bash
git clone <repository-url>
cd municipal-performance-system
```

#### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.template .env.production

# 编辑生产环境配置
nano .env.production
```

**重要配置项**：
```env
# 数据库配置（使用云数据库）
DATABASE_URL="postgresql://username:password@your-db-host:5432/municipal_performance"

# Redis配置（使用云Redis）
REDIS_URL="redis://your-redis-host:6379"

# 安全配置
JWT_SECRET="your-super-secret-jwt-key"
CORS_ORIGIN="https://your-domain.com"

# 生产环境标识
NODE_ENV=production
```

#### 3. 构建和部署
```bash
# 运行部署脚本
./scripts/deploy.ps1

# 或手动执行
docker-compose -f docker-compose.prod.yml up -d
```

#### 4. 验证部署
```bash
# 执行健康检查
./scripts/health-check.ps1

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

### 方式二：云服务部署

#### 1. 数据库部署

**PostgreSQL云数据库**：
- 阿里云RDS PostgreSQL
- 腾讯云PostgreSQL
- AWS RDS PostgreSQL

**配置要求**：
- 版本: PostgreSQL 13+
- 规格: 2核4GB起
- 存储: 100GB SSD

#### 2. 缓存部署

**Redis云缓存**：
- 阿里云Redis
- 腾讯云Redis
- AWS ElastiCache

**配置要求**：
- 版本: Redis 6.0+
- 规格: 1GB内存起
- 网络: VPC内网访问

#### 3. 应用部署

**容器服务**：
- 阿里云容器服务ACK
- 腾讯云容器服务TKE
- AWS EKS

**虚拟机部署**：
- 阿里云ECS
- 腾讯云CVM
- AWS EC2

## 🔒 安全配置

### 1. HTTPS配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
}
```

### 2. 防火墙配置

```bash
# Ubuntu/Debian
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

### 3. 数据库安全

- 使用强密码
- 启用SSL连接
- 限制访问IP
- 定期备份数据

## 📊 监控和日志

### 1. 应用监控

**Prometheus + Grafana**：
```bash
# 启动监控服务
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

**监控指标**：
- API响应时间
- 错误率
- 内存使用率
- CPU使用率
- 数据库连接数

### 2. 日志管理

**日志收集**：
```bash
# 启动日志服务
docker-compose -f docker-compose.prod.yml --profile logging up -d
```

**日志类型**：
- 应用日志
- 访问日志
- 错误日志
- 性能日志

### 3. 告警配置

**告警规则**：
- API响应时间 > 2秒
- 错误率 > 5%
- 内存使用率 > 80%
- 磁盘使用率 > 85%

## 🔄 维护和更新

### 1. 数据备份

```bash
# 自动备份脚本
./scripts/backup.ps1

# 手动备份
docker exec municipal_postgres_prod pg_dump -U admin municipal_performance > backup.sql
```

### 2. 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
./scripts/deploy.ps1
```

### 3. 数据库迁移

```bash
# 运行数据库迁移
cd backend
npm run db:migrate:prod
```

## 🚨 故障排除

### 1. 常见问题

**服务无法启动**：
```bash
# 检查日志
docker-compose -f docker-compose.prod.yml logs

# 检查端口占用
netstat -tulpn | grep :8000
```

**数据库连接失败**：
```bash
# 测试数据库连接
psql -h your-db-host -U username -d municipal_performance

# 检查网络连通性
telnet your-db-host 5432
```

**Redis连接失败**：
```bash
# 测试Redis连接
redis-cli -h your-redis-host -p 6379 ping

# 检查Redis状态
redis-cli -h your-redis-host -p 6379 info
```

### 2. 性能优化

**数据库优化**：
- 创建适当的索引
- 优化查询语句
- 调整连接池大小

**缓存优化**：
- 调整缓存TTL
- 监控缓存命中率
- 优化缓存键设计

**应用优化**：
- 启用Gzip压缩
- 优化静态资源
- 使用CDN加速

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查系统日志和错误信息
3. 确认环境配置是否正确
4. 联系技术支持团队

## 📈 性能基准

**预期性能指标**：
- API响应时间: < 200ms
- 文件上传速度: > 10MB/s
- 并发用户数: 100+
- 数据库查询: < 50ms
- 缓存命中率: > 90%

## 🎯 部署检查清单

- [ ] 环境变量配置完成
- [ ] 数据库连接测试通过
- [ ] Redis缓存连接测试通过
- [ ] 应用构建成功
- [ ] 容器启动正常
- [ ] 健康检查通过
- [ ] HTTPS证书配置
- [ ] 防火墙规则设置
- [ ] 监控系统部署
- [ ] 备份策略配置
- [ ] 性能测试完成

完成以上检查清单后，系统即可投入生产使用！