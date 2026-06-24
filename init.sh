#!/bin/bash
set -e

echo "=== 今晚吃什么 - 初始化脚本 ==="

if [ ! -f .env ]; then
  cp .env.example .env
  echo "已创建 .env 文件，请填写 DEEPSEEK_API_KEY"
  echo "编辑 .env 文件后重新运行此脚本"
  exit 0
fi

echo "安装依赖..."
npm install

echo "初始化数据库..."
npx prisma db push

echo "=== 初始化完成 ==="
echo "运行 npm run dev 启动开发服务器"
echo "访问 http://localhost:3000"
echo "管理后台 http://localhost:3000/admin (密码: 见 .env 中 ADMIN_SECRET)"
