@echo off
chcp 65001 >nul
echo ============================================
echo   正在为北信科旧物交换平台添加防火墙规则
echo ============================================
echo.
 
:: 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] 需要管理员权限，正在自动提权...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: 添加 3000 端口入站规则
echo [1/2] 添加入站规则（允许外部访问 3000 端口）...
netsh advfirewall firewall delete rule name="Node.js Backend 3000" >nul 2>&1
netsh advfirewall firewall add rule name="Node.js Backend 3000" dir=in action=allow protocol=TCP localport=3000
if %errorlevel% equ 0 (
    echo     [√] 入站规则添加成功
) else (
    echo     [×] 入站规则添加失败
)

:: 允许 node.exe 程序通过防火墙
echo [2/2] 允许 Node.js 程序通过防火墙...
for %%P in (
    "C:\Program Files\nodejs\node.exe"
    "%ProgramFiles%\nodejs\node.exe"
    "%LOCALAPPDATA%\nodejs\node.exe"
) do (
    if exist %%P (
        netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program=%%P >nul 2>&1
    )
)

echo.
echo ============================================
echo   完成！现在同一局域网的同学可以访问了
echo ============================================
echo.
echo   访问地址: http://10.153.69.141:3000
echo   (请用实际的局域网 IP，可在启动服务时查看)
echo.
pause
