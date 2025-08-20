# 数据库备份脚本
# 📚 知识点：生产环境数据备份策略

param(
    [string]$BackupPath = "./backups",
    [switch]$Compress = $true
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "municipal_performance_backup_$timestamp.sql"

Write-Host "📦 开始数据库备份..." -ForegroundColor Green

# 创建备份目录
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
}

# 执行数据库备份
Write-Host "💾 导出数据库..." -ForegroundColor Yellow
docker exec municipal_postgres_prod pg_dump -U admin -d municipal_performance > "$BackupPath\$backupFile"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 数据库备份完成: $backupFile" -ForegroundColor Green
    
    # 压缩备份文件
    if ($Compress) {
        Write-Host "🗜️ 压缩备份文件..." -ForegroundColor Yellow
        Compress-Archive -Path "$BackupPath\$backupFile" -DestinationPath "$BackupPath\$backupFile.zip"
        Remove-Item "$BackupPath\$backupFile"
        Write-Host "✅ 备份文件已压缩: $backupFile.zip" -ForegroundColor Green
    }
    
    # 清理旧备份（保留最近7天）
    Write-Host "🧹 清理旧备份文件..." -ForegroundColor Yellow
    $cutoffDate = (Get-Date).AddDays(-7)
    Get-ChildItem $BackupPath -Filter "municipal_performance_backup_*" | 
        Where-Object { $_.CreationTime -lt $cutoffDate } | 
        Remove-Item -Force
    
    Write-Host "🎉 备份任务完成！" -ForegroundColor Green
} else {
    Write-Error "❌ 数据库备份失败"
    exit 1
}