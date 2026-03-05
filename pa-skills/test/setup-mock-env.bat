@echo off
REM Mock 服务器启动脚本 (Windows)

echo =========================================
echo   启动 Mock API 服务器
echo =========================================
echo.

REM 检查端口是否被占用
netstat -ano | findstr :3000 >nul
if %errorlevel% == 0 (
    echo ⚠️  端口 3000 已被占用
    echo 请先关闭占用端口的进程
    pause
    exit /b 1
)

REM 启动 Mock 服务器
pnpm mock-server
