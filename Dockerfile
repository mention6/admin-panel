# 使用 Node.js 18 作为构建环境
FROM node:18-alpine as build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖，使用国内镜像源加速
RUN npm install --registry=https://registry.npmmirror.com

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 使用 Nginx 作为静态文件服务器
FROM nginx:alpine

# 复制构建产物到 Nginx 静态目录
COPY --from=build /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
