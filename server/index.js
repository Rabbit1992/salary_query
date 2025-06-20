// 工资管理系统后端服务器主入口文件
// 负责启动Express服务器，配置中间件，设置路由和数据库初始化

const express = require('express'); // Express框架，用于创建Web服务器
const cors = require('cors'); // 跨域资源共享中间件，允许前端访问后端API
const path = require('path'); // Node.js路径处理模块
const db = require('./database/db'); // 数据库连接和初始化模块
const salaryRoutes = require('./routes/salary'); // 工资相关的路由处理模块

// 创建Express应用实例
const app = express();
// 设置服务器端口，优先使用环境变量，默认为5000
const PORT = process.env.PORT || 5000;

// ==================== 中间件配置 ====================
// 启用CORS，允许前端跨域访问后端API
app.use(cors());
// 解析JSON格式的请求体
app.use(express.json());

// ==================== 路由配置 ====================
// 注册工资管理相关的API路由，所有路由都以/api/salary开头
app.use('/api/salary', salaryRoutes);

// ==================== 数据库初始化 ====================
// 初始化SQLite数据库，创建必要的表结构
db.initDatabase();

// ==================== 生产环境静态文件服务 ====================
// 在生产环境下，Express服务器同时提供前端静态文件服务
if (process.env.NODE_ENV === 'production') {
  // 设置静态文件目录为前端构建后的文件夹
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // 处理所有未匹配的路由，返回前端的index.html（用于SPA路由）
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// ==================== 启动服务器 ====================
// 启动HTTP服务器，监听指定端口
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});