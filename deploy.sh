#!/bin/bash

# 工资查询系统 Vercel 部署准备脚本

echo "🚀 开始准备 Vercel 部署环境..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 请先安装 npm"
    exit 1
fi

echo "✅ Node.js 和 npm 已安装"

# 安装根目录依赖
echo "📦 安装根目录依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 根目录依赖安装失败"
    exit 1
fi

# 安装客户端依赖
echo "📦 安装客户端依赖..."
cd client
npm install

if [ $? -ne 0 ]; then
    echo "❌ 客户端依赖安装失败"
    exit 1
fi

# 安装服务器端依赖
echo "📦 安装服务器端依赖..."
cd ../server
npm install

if [ $? -ne 0 ]; then
    echo "❌ 服务器端依赖安装失败"
    exit 1
fi

# 返回根目录
cd ..

# 测试构建
echo "🔨 测试前端构建..."
cd client
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

cd ..

echo "✅ 所有依赖安装完成，构建测试通过"
echo "📋 部署清单:"
echo "   ✅ vercel.json 配置文件已创建"
echo "   ✅ 客户端 vercel-build 脚本已添加"
echo "   ✅ 所有依赖已安装"
echo "   ✅ 前端构建测试通过"
echo ""
echo "🎯 下一步操作:"
echo "   1. 确保代码已推送到 GitHub 仓库"
echo "   2. 访问 https://vercel.com 创建新项目"
echo "   3. 连接您的 GitHub 仓库"
echo "   4. 按照 DEPLOYMENT.md 中的说明完成部署"
echo ""
echo "🔗 GitHub 仓库: https://github.com/Rabbit1992/salary_query.git"
echo "📖 详细部署指南: 查看 DEPLOYMENT.md 文件"

echo "🎉 部署准备完成！"