# 系统健康检查脚本
# 📚 知识点：生产环境监控和健康检查

param(
    [string]$BaseUrl = "http://localhost:8000",
    [int]$TimeoutSeconds = 30
)

Write-Host "🔍 开始系统健康检查..." -ForegroundColor Green

# 检查后端API健康状态
Write-Host "📡 检查后端API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -TimeoutSec $TimeoutSeconds -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "✅ 后端API正常运行" -ForegroundColor Green
        Write-Host "   - 服务: $($healthData.service)" -ForegroundColor Cyan
        Write-Host "   - 版本: $($healthData.version)" -ForegroundColor Cyan
        Write-Host "   - 运行时间: $([math]::Round($healthData.uptime, 2))秒" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ 后端API健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 检查数据库连接
Write-Host "🗄️ 检查数据库连接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/projects/stats/summary" -TimeoutSec $TimeoutSeconds -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 数据库连接正常" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ 数据库连接检查失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 检查Redis缓存
Write-Host "🔄 检查Redis缓存..." -ForegroundColor Yellow
try {
    # 通过API间接检查Redis
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/projects?page=1&pageSize=1" -TimeoutSec $TimeoutSeconds -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Redis缓存连接正常" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Redis缓存检查失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 检查前端服务
Write-Host "🌐 检查前端服务..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec $TimeoutSeconds -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 前端服务正常运行" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ 前端服务检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 检查文件上传功能
Write-Host "📤 检查文件上传功能..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/upload/stats" -TimeoutSec $TimeoutSeconds -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 文件上传功能正常" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ 文件上传功能检查失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "🎉 健康检查完成！" -ForegroundColor Green