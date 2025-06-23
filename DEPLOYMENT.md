# 工资查询系统部署指南

本指南将帮助您将工资查询系统部署到 Vercel 平台。

## 前提条件

1. GitHub 账户
2. Vercel 账户（可以使用 GitHub 账户登录）
3. 项目代码已上传到 GitHub 仓库：`https://github.com/Rabbit1992/salary_query.git`

## 部署步骤

### 1. 准备 GitHub 仓库

确保您的代码已经推送到 GitHub 仓库，包含以下重要文件：
- `vercel.json` - Vercel 部署配置文件
- `package.json` - 项目依赖配置
- `client/package.json` - 前端依赖配置（包含 vercel-build 脚本）
- `server/` - 后端代码
- `client/` - 前端代码

### 2. 连接 Vercel 与 GitHub

1. 访问 [Vercel 官网](https://vercel.com/)
2. 使用 GitHub 账户登录
3. 点击 "New Project" 创建新项目
4. 选择您的 GitHub 仓库 `salary_query`
5. 点击 "Import" 导入项目

### 3. 配置部署设置

在 Vercel 项目配置页面：

1. **Framework Preset**: 选择 "Other"
2. **Root Directory**: 保持默认（根目录）
3. **Build and Output Settings**:
   - Build Command: `npm run vercel-build`
   - Output Directory: `client/build`
   - Install Command: `npm install`

### 4. 环境变量配置

在 Vercel 项目设置中添加环境变量：

1. 进入项目 Dashboard
2. 点击 "Settings" 标签
3. 选择 "Environment Variables"
4. 添加以下变量：
   - `NODE_ENV`: `production`
   - `PORT`: `5000`（可选）

### 5. 部署项目

1. 点击 "Deploy" 按钮开始部署
2. 等待构建完成（通常需要 2-5 分钟）
3. 部署成功后，Vercel 会提供一个访问链接

## 项目架构说明

### 前后端分离架构

- **前端**: React 应用，构建后的静态文件部署到 Vercel
- **后端**: Node.js Express API，作为 Serverless 函数运行
- **数据库**: SQLite，数据存储在服务器内存中（注意：Vercel 的无服务器环境中数据不会持久化）

### 路由配置

`vercel.json` 文件配置了以下路由规则：
- `/api/*` - 所有 API 请求转发到后端服务器
- `/*` - 其他请求返回前端静态文件

## 重要注意事项

### 数据库限制

⚠️ **重要**: 由于 Vercel 使用无服务器架构，SQLite 数据库的数据不会在部署之间持久化。每次函数冷启动时，数据库都会重新初始化。

**生产环境建议**:
1. 使用云数据库服务（如 PlanetScale、Supabase、MongoDB Atlas）
2. 或者使用 Vercel 的 Postgres 数据库服务

### 性能优化

1. **冷启动**: 第一次访问可能较慢，后续访问会更快
2. **缓存**: Vercel 会自动缓存静态资源
3. **CDN**: 全球 CDN 加速访问

## 自定义域名（可选）

1. 在 Vercel 项目设置中选择 "Domains"
2. 添加您的自定义域名
3. 按照提示配置 DNS 记录

## 监控和日志

1. **实时日志**: 在 Vercel Dashboard 的 "Functions" 标签查看
2. **分析**: 查看访问统计和性能指标
3. **错误监控**: 自动捕获和报告错误

## 故障排除

### 常见问题

1. **构建失败 - "npm run vercel-build" 错误**:
   - 确保根目录 `package.json` 包含 `vercel-build` 脚本
   - 检查 `vercel.json` 配置是否正确
   - 确认客户端目录下的依赖能正常安装
   - 尝试在本地运行 `npm run vercel-build` 测试

2. **ESLint 版本过时警告**:
   如果遇到 "eslint@8.57.1: This version is no longer supported" 警告：
   - 删除客户端的 package-lock.json
   - 确认客户端 `package.json` 中包含更新的 ESLint 配置
   - 重新安装依赖

3. **依赖安装失败**:
   - 检查 `package.json` 中的依赖是否正确
   - 确保所有必要文件都已提交到 GitHub
   - 删除 `node_modules` 和 `package-lock.json` 后重新安装

4. **API 请求失败**:
   - 检查 API 路径是否以 `/api/` 开头
   - 查看 Vercel 函数日志
   - 确认服务器端代码没有语法错误

5. **数据库问题**:
   - 确认数据库初始化代码正常运行
   - 考虑使用外部数据库服务

### 调试步骤

1. 查看 Vercel 部署日志
2. 检查浏览器开发者工具的网络请求
3. 查看 Vercel 函数日志
4. 本地测试 API 端点

## 更新部署

每次向 GitHub 仓库推送代码时，Vercel 会自动重新部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

## 成本说明

Vercel 提供免费套餐，包括：
- 每月 100GB 带宽
- 无限静态部署
- Serverless 函数执行时间限制

超出免费额度后需要升级到付费计划。

## 技术支持

如果遇到部署问题，可以：
1. 查看 [Vercel 官方文档](https://vercel.com/docs)
2. 访问 [Vercel 社区论坛](https://github.com/vercel/vercel/discussions)
3. 检查项目的 GitHub Issues

---

部署完成后，您的工资查询系统将可以通过 Vercel 提供的 URL 访问，支持全球用户快速访问。