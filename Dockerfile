# 使用官方 Node.js 镜像作为基础镜像
FROM denoland/deno

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 复制所有源代码（包括 .env 文件）
COPY . .


# 启动应用
CMD ["deno", "task", "start"] 