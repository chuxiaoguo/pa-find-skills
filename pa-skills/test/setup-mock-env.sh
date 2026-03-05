#!/bin/bash
# Mock 服务器启动脚本

echo "========================================="
echo "  启动 Mock API 服务器"
echo "========================================="
echo ""

# 检查端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "⚠️  端口 3000 已被占用"
  echo "请先关闭占用端口的进程"
  exit 1
fi

# 启动 Mock 服务器
pnpm mock-server
