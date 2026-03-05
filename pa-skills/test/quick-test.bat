@echo off
REM 快速测试脚本 - Mock 环境完整流程

echo =========================================
echo   Mock 环境完整流程测试
echo =========================================
echo.

REM 检查 Mock 服务器
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
    echo    ✅ 环境变量已设置
) else (
    echo    ⚠️  环境变量未设置或设置不正确
    echo    当前值: %PINGANCODER_API_URL%
    echo.
    echo    请运行: set PINGANCODER_API_URL=http://localhost:3000
    echo.
    set /p CONTINUE=是否继续测试？ (Y/n):
    if /i not "%CONTINUE%"=="Y" (
        exit /b 1
    )
)

REM 测试登录接口
echo.
echo 3. 测试登录接口...
echo    用户名: admin
echo    密码: admin123
echo.
curl -s -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" ^
  > nul
if %errorlevel% == 0 (
    echo    ✅ 登录接口正常
) else (
    echo    ❌ 登录接口失败
)

REM 测试 CLI 登录
echo.
echo 4. 测试 CLI 登录功能...
echo    (将打开交互界面)
echo.
pause
pa-skills auth login

REM 测试搜索功能
echo.
echo 5. 测试搜索功能...
echo.
pa-skills find react

echo.
echo =========================================
echo   测试完成
echo =========================================
echo.
echo 提示：
echo - 如果登录失败，请检查用户名和密码
echo - 用户名: admin, 密码: admin123
echo - 其他测试账号: test/test123, mock/mock123
echo.
pause
