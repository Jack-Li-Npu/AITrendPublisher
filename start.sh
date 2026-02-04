#!/bin/bash
# TrendPublish 一键启动脚本 (macOS / Linux)

cd "$(dirname "$0")"
echo "正在启动 TrendPublish..."
echo "控制面板: http://localhost:8000"
echo ""
deno task start
