@echo off
REM CLI 测试脚本 - Mock 环境验证 (Windows)

echo =========================================
echo   CLI 功能测试 (Mock 环境)
echo =========================================
echo.

REM 检查 Mock 服务器是否运行
echo 1. 检查 Mock 服务器...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% == 0 (
    echo    ✅ Mock 服务器运行中
) else (
    echo    ❌ Mock 服务器未运行
    echo    请先运行: pnpm mock-server
    pause
    exit /b 1
)

REM 检查环境变量
echo.
echo 2. 检查环境变量...
if "%PINGANCODER_API_URL%"=="http://localhost:3000" (
    echo    ✅ 环境变量已设置: %PINGANCODER_API_URL%
) else (
    echo    ⚠️  环境变量未设置或设置不正确
    echo    当前值: %PINGANCODER_API_URL%
    echo    请运行: set PINGANCODER_API_URL=http://localhost:3000
)

REM 测试搜索功能
echo.
echo 3. 测试搜索功能...
echo    命令: pa-skills find react
echo.
pa-skills find react

REM 测试添加功能
echo.
echo 4. 测试添加功能...
echo    命令: pa-skills add 1
echo    (这将进入交互模式，你可以 Ctrl+C 取消)
echo.
pause
pa-skills add 1

echo.
echo =========================================
echo   测试完成
echo =========================================
pause
