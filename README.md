# 工资查询系统

一个基于React前端和Node.js后端的工资查询系统，使用SQLite数据库存储数据。

## 功能特点

- 员工管理：添加、编辑、删除和查看员工信息
- 工资管理：添加、编辑、删除和查看工资记录
- 数据可视化：通过图表展示工资趋势和部门分布
- 数据筛选：按年份、月份、部门等条件筛选工资数据
- 响应式设计：适配不同设备屏幕

## 技术栈

- 前端：React、React Router、Ant Design、ECharts
- 后端：Node.js、Express
- 数据库：SQLite

## 项目结构

```
├── client/                 # 前端React应用
│   ├── public/             # 静态资源
│   └── src/                # 源代码
│       ├── components/     # React组件
│       │   ├── layout/     # 布局组件
│       │   └── pages/      # 页面组件
│       ├── services/       # API服务
│       ├── App.js          # 主应用组件
│       └── index.js        # 入口文件
├── server/                 # 后端Node.js应用
│   ├── database/           # 数据库相关
│   │   ├── db.js           # 数据库连接和初始化
│   │   └── salary.db       # SQLite数据库文件
│   ├── routes/             # API路由
│   │   └── salary.js       # 工资相关API
│   └── index.js            # 服务器入口文件
└── package.json            # 项目配置文件
```

## 安装和运行

### 前提条件

- Node.js (v14+)
- npm (v6+)

### 安装步骤

1. 克隆或下载项目到本地

2. 安装依赖

```bash
npm install
```

3. 初始化前端和后端依赖

```bash
npm run init
```

4. 启动开发服务器

```bash
npm run dev
```

这将同时启动前端和后端服务器：
- 前端: http://localhost:3000
- 后端: http://localhost:5000

### 单独启动服务

- 仅启动后端

```bash
npm run server
```

- 仅启动前端

```bash
npm run client
```

## API接口

### 员工API

- `GET /api/salary/employees` - 获取所有员工
- `GET /api/salary/employees/:id` - 获取特定员工
- `POST /api/salary/employees` - 添加员工
- `PUT /api/salary/employees/:id` - 更新员工
- `DELETE /api/salary/employees/:id` - 删除员工

### 工资API

- `GET /api/salary/salaries` - 获取工资记录
- `GET /api/salary/employees/:id/salaries` - 获取特定员工的工资记录
- `POST /api/salary/salaries` - 添加工资记录
- `PUT /api/salary/salaries/:id` - 更新工资记录
- `DELETE /api/salary/salaries/:id` - 删除工资记录

## 部署到 Vercel

### 快速部署

1. **运行部署准备脚本**:
   ```bash
   # Windows 用户
   deploy.bat
   
   # Linux/Mac 用户
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **推送代码到 GitHub**:
   ```bash
   git add .
   git commit -m "准备 Vercel 部署"
   git push origin main
   ```

3. **在 Vercel 上部署**:
   - 访问 [Vercel](https://vercel.com)
   - 使用 GitHub 账户登录
   - 导入您的 GitHub 仓库
   - 按照配置完成部署

### 详细部署指南

查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取完整的部署说明，包括:
- 详细的部署步骤
- 环境变量配置
- 故障排除指南
- 性能优化建议

### 部署架构

- **前端**: React 静态文件部署到 Vercel CDN
- **后端**: Node.js API 作为 Serverless 函数运行
- **数据库**: SQLite（注意：生产环境建议使用云数据库）

## 许可证

ISC