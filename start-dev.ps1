# PowerShell启动脚本
# 📚 知识点：自动化开发环境启动流程

Write-Host "🚀 启动市政业绩管理系统开发环境..." -ForegroundColor Green

# 检查Docker是否安装
try {
    docker --version | Out-Null
    Write-Host "✅ Docker已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker未安装，请先安装Docker Desktop" -ForegroundColor Red
    Write-Host "下载地址: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# 检查Docker是否运行
try {
    docker ps | Out-Null
    Write-Host "✅ Docker正在运行" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker未运行，请启动Docker Desktop" -ForegroundColor Red
    exit 1
}

# 启动数据库服务
Write-Host "📦 启动数据库服务..." -ForegroundColor Blue
docker-compose up -d postgres redis

# 等待数据库启动
Write-Host "⏳ 等待数据库启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 检查数据库连接
Write-Host "🔍 检查数据库连接..." -ForegroundColor Blue
$maxRetries = 30
$retryCount = 0

do {
    try {
        docker exec municipal_postgres pg_isready -U admin -d municipal_performance | Out-Null
        Write-Host "✅ PostgreSQL连接成功" -ForegroundColor Green
        break
    } catch {
        $retryCount++
        if ($retryCount -ge $maxRetries) {
            Write-Host "❌ PostgreSQL连接超时" -ForegroundColor Red
            exit 1
        }
        Write-Host "⏳ 等待PostgreSQL启动... ($retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
} while ($true)

# 检查Redis连接
try {
    docker exec municipal_redis redis-cli ping | Out-Null
    Write-Host "✅ Redis连接成功" -ForegroundColor Green
} catch {
    Write-Host "❌ Redis连接失败" -ForegroundColor Red
    exit 1
}

# 初始化数据库
Write-Host "🗄️ 初始化数据库..." -ForegroundColor Blue
Set-Location backend
npm run db:generate
npm run db:push

# 运行系统测试
Write-Host "🧪 运行系统测试..." -ForegroundColor Blue
npx tsx src/simple-test.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 系统测试通过" -ForegroundColor Green
} else {
    Write-Host "❌ 系统测试失败" -ForegroundColor Red
    exit 1
}

# 启动后端服务
Write-Host "🖥️ 启动后端服务..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

# 等待后端启动
Start-Sleep -Seconds 5

# 启动前端服务
Write-Host "🌐 启动前端服务..." -ForegroundColor Blue
Set-Location ../frontend
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 开发环境启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 服务地址:" -ForegroundColor Cyan
Write-Host "  前端: http://localhost:3000" -ForegroundColor White
Write-Host "  后端: http://localhost:8000" -ForegroundColor White
Write-Host "  数据库: localhost:5432" -ForegroundColor White
Write-Host "  Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "🛠️ 管理工具 (可选):" -ForegroundColor Cyan
Write-Host "  启动PgAdmin: docker-compose --profile tools up -d pgadmin" -ForegroundColor White
Write-Host "  PgAdmin地址: http://localhost:8080 (admin@example.com / admin)" -ForegroundColor White
Write-Host "  启动Redis UI: docker-compose --profile tools up -d redis-commander" -ForegroundColor White
Write-Host "  Redis UI地址: http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "⏹️ 停止服务: docker-compose down" -ForegroundColor Yellow