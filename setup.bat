@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: TrendPublish 一键配置脚本 (Windows)
:: 用法: 双击运行或在命令行执行 setup.bat

echo ========================================
echo    TrendPublish 环境配置脚本
echo ========================================
echo.

:: 1. 检测/安装 Deno
echo [1/3] 检查 Deno 环境...

where deno >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('deno --version 2^>nul ^| findstr deno') do set DENO_VERSION=%%i
    echo [√] Deno 已安装: !DENO_VERSION!
) else (
    echo [!] 未检测到 Deno，正在安装...

    :: 使用 PowerShell 安装 Deno
    powershell -Command "irm https://deno.land/install.ps1 | iex"

    :: 刷新环境变量
    set "PATH=%USERPROFILE%\.deno\bin;%PATH%"

    where deno >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [√] Deno 安装成功
    ) else (
        echo [×] Deno 安装失败
        echo 请手动安装: https://deno.land
        echo 或使用 PowerShell 运行: irm https://deno.land/install.ps1 ^| iex
        pause
        exit /b 1
    )
)

:: 2. 安装项目依赖
echo.
echo [2/3] 安装项目依赖...

if exist "deno.json" (
    deno install --allow-scripts
    echo [√] 依赖安装完成
) else (
    echo [×] 未找到 deno.json，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

:: 3. 配置环境变量
echo.
echo [3/3] 检查配置文件...

if exist ".env" (
    echo [√] 配置文件 .env 已存在
) else (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [√] 已从模板创建 .env 配置文件
        echo [!] API 密钥可在启动后通过前端控制面板配置
    ) else (
        echo [!] 未找到配置模板，请手动创建 .env 文件
    )
)

:: 完成
echo.
echo ========================================
echo [√] 环境配置完成!
echo ========================================
echo.
echo 启动应用:
echo   deno task start
echo.
echo 或双击 start.bat 启动
echo.
echo 应用将在 http://localhost:8000 启动
echo.
pause
