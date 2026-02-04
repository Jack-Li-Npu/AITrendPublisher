#!/bin/bash
# TrendPublish 一键配置脚本 (macOS / Linux)
# 用法: curl -fsSL https://xxx/setup.sh | bash
# 或本地: chmod +x setup.sh && ./setup.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   TrendPublish 环境配置脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检测操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=macOS;;
    *)          PLATFORM="UNKNOWN:${OS}"
esac
echo -e "${GREEN}[✓]${NC} 检测到操作系统: ${PLATFORM}"

# 1. 检测/安装 Deno
echo ""
echo -e "${YELLOW}[1/3]${NC} 检查 Deno 环境..."

if command -v deno &> /dev/null; then
    DENO_VERSION=$(deno --version | head -n 1)
    echo -e "${GREEN}[✓]${NC} Deno 已安装: ${DENO_VERSION}"
else
    echo -e "${YELLOW}[!]${NC} 未检测到 Deno，正在安装..."

    if command -v curl &> /dev/null; then
        curl -fsSL https://deno.land/install.sh | sh
    elif command -v wget &> /dev/null; then
        wget -qO- https://deno.land/install.sh | sh
    else
        echo -e "${RED}[✗]${NC} 请先安装 curl 或 wget"
        exit 1
    fi

    # 添加 Deno 到 PATH
    export DENO_INSTALL="$HOME/.deno"
    export PATH="$DENO_INSTALL/bin:$PATH"

    # 提示用户添加到 shell 配置
    echo ""
    echo -e "${YELLOW}[!]${NC} 请将以下内容添加到你的 shell 配置文件 (~/.bashrc, ~/.zshrc 等):"
    echo -e "${BLUE}export DENO_INSTALL=\"\$HOME/.deno\"${NC}"
    echo -e "${BLUE}export PATH=\"\$DENO_INSTALL/bin:\$PATH\"${NC}"
    echo ""

    if command -v deno &> /dev/null; then
        echo -e "${GREEN}[✓]${NC} Deno 安装成功"
    else
        echo -e "${RED}[✗]${NC} Deno 安装失败，请手动安装: https://deno.land"
        exit 1
    fi
fi

# 2. 安装项目依赖
echo ""
echo -e "${YELLOW}[2/3]${NC} 安装项目依赖..."

if [ -f "deno.json" ]; then
    deno install --allow-scripts
    echo -e "${GREEN}[✓]${NC} 依赖安装完成"
else
    echo -e "${RED}[✗]${NC} 未找到 deno.json，请确保在项目根目录运行此脚本"
    exit 1
fi

# 3. 配置环境变量
echo ""
echo -e "${YELLOW}[3/3]${NC} 检查配置文件..."

if [ -f ".env" ]; then
    echo -e "${GREEN}[✓]${NC} 配置文件 .env 已存在"
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}[✓]${NC} 已从模板创建 .env 配置文件"
        echo -e "${YELLOW}[!]${NC} API 密钥可在启动后通过前端控制面板配置"
    else
        echo -e "${YELLOW}[!]${NC} 未找到配置模板，请手动创建 .env 文件"
    fi
fi

# 完成
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}[✓] 环境配置完成!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "启动应用:"
echo -e "  ${BLUE}deno task start${NC}"
echo ""
echo -e "应用将在 ${BLUE}http://localhost:8000${NC} 启动"
echo ""
