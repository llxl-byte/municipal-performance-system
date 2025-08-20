# PowerShell部署脚本
# 📚 知识点：自动化部署流程

param(
    [string]$Environment = "production",
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false
)

Write-Host "🚀 开始部署市政业绩管理系统到 $Environment 环境" -ForegroundColor Green

# 检查必要的工具
Write-Host "📋 检查部署环境..." -ForegroundColor Yellow
$tools = @("docker", "docker-compose", "node", "npm")
foreach ($tool in $tools) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "❌ 缺少必要工具: $tool"
        exit 1
    }
}
Write-Host "✅ 环境检查通过" -ForegroundColor Green

# 运行测试
if (!$SkipTests) {
    Write-Host "🧪 运行测试..." -ForegroundColor Yellow
    
    # 后端测试
    Push-Location backend
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ 后端测试失败"
        Pop-Location
        exit 1
    }
    Pop-Location
    
    # 前端测试
    Push-Location frontend
    npm test -- --run
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ 前端测试失败"
        Pop-Location
        exit 1
    }
    Pop-Location
    
    Write-Host "✅ 所有测试通过" -ForegroundColor Green
}

# 构建应用
if (!$SkipBuild) {
    Write-Host "🔨 构建应用..." -ForegroundColor Yellow
    
    # 构建前端
    Push-Location frontend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ 前端构建失败"
        Pop-Location
        exit 1
    }
    Pop-Location
    
    # 构建后端
    Push-Location backend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ 后端构建失败"
        Pop-Location
        exit 1
    }
    Pop-Location
    
    Write-Host "✅ 构建完成" -ForegroundColor Green
}

# 构建Docker镜像
Write-Host "🐳 构建Docker镜像..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Docker镜像构建失败"
    exit 1
}
Write-Host "✅ Docker镜像构建完成" -ForegroundColor Green

# 部署到生产环境
Write-Host "🚀 部署到生产环境..." -ForegroundColor Yellow

# 停止旧服务
docker-compose -f docker-compose.prod.yml down

# 启动新服务
docker-compose -f docker-compose.prod.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ 服务启动失败"
    exit 1
}

# 等待服务启动
Write-Host "⏳ 等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 健康检查
Write-Host "🔍 执行健康检查..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0

do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ 后端服务健康检查通过" -ForegroundColor Green
            break
        }
    }
    catch {
        $retryCount++
        if ($retryCount -ge $maxRetries) {
            Write-Error "❌ 后端服务健康检查失败"
            exit 1
        }
        Write-Host "⏳ 等待后端服务启动... ($retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
} while ($retryCount -lt $maxRetries)

# 检查前端服务
try {
    $response = Invoke-WebRequest -Uri "http://localhost/" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 前端服务健康检查通过" -ForegroundColor Green
    }
}
catch {
    Write-Error "❌ 前端服务健康检查失败"
    exit 1
}

Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "📱 前端地址: http://localhost/" -ForegroundColor Cyan
Write-Host "🔧 后端API: http://localhost:8000/api" -ForegroundColor Cyan
Write-Host "📊 健康检查: http://localhost:8000/api/health" -ForegroundColor Cyan

# 显示服务状态
Write-Host "📋 服务状态:" -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps