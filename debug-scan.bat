@echo off
REM 启用详细日志的调试脚本

echo 启动 Tauri 调试模式（启用详细日志）...
echo.

set RUST_LOG=debug
set RUST_BACKTRACE=1

npm run tauri dev

