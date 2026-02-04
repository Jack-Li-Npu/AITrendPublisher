# TrendPublish 一键配置脚本 (Windows PowerShell)
# 用法: 右键以 PowerShell 运行，或在 PowerShell 中执行: .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TrendPublish 环境配置脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检测/安装 Deno
Write-Host "[1/3] 检查 Deno 环境..." -ForegroundColor Yellow

$denoPath = Get-Command deno -ErrorAction SilentlyContinue
if ($denoPath) {
    $denoVersion = deno --version | Select-Object -First 1
    Write-Host "[√] Deno 已安装: $denoVersion" -ForegroundColor Green
} else {
    Write-Host "[!] 未检测到 Deno，正在安装..." -ForegroundColor Yellow

    try {
        irm https://deno.land/install.ps1 | iex

        # 刷新 PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "User") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "Machine")
        $env:DENO_INSTALL = "$env:USERPROFILE\.deno"
        $env:Path = "$env:DENO_INSTALL\bin;$env:Path"

        Write-Host "[√] Deno 安装成功" -ForegroundColor Green
        Write-Host "[!] 请重启终端以使 Deno 命令生效" -ForegroundColor Yellow
    } catch {
        Write-Host "[×] Deno 安装失败: $_" -ForegroundColor Red
        Write-Host "请手动安装: https://deno.land" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
}

# 2. 安装项目依赖
Write-Host ""
Write-Host "[2/3] 安装项目依赖..." -ForegroundColor Yellow

if (Test-Path "deno.json") {
    deno install --allow-scripts
    Write-Host "[√] 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "[×] 未找到 deno.json，请确保在项目根目录运行此脚本" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 3. 配置环境变量
Write-Host ""
Write-Host "[3/3] 检查配置文件..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "[√] 配置文件 .env 已存在" -ForegroundColor Green
} else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[√] 已从模板创建 .env 配置文件" -ForegroundColor Green
        Write-Host "[!] API 密钥可在启动后通过前端控制面板配置" -ForegroundColor Yellow
    } else {
        Write-Host "[!] 未找到配置模板，请手动创建 .env 文件" -ForegroundColor Yellow
    }
}

# 完成
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[√] 环境配置完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "启动应用:" -ForegroundColor White
Write-Host "  deno task start" -ForegroundColor Cyan
Write-Host ""
Write-Host "或双击 start.bat 启动" -ForegroundColor White
Write-Host ""
Write-Host "应用将在 http://localhost:8000 启动" -ForegroundColor Cyan
Write-Host ""
Read-Host "按回车键退出"
