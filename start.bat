@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动 TrendPublish...
echo 控制面板: http://localhost:8000
echo.
deno task start
pause
