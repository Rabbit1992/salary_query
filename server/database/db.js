// 工资管理系统数据库模块
// 负责SQLite数据库的连接、表结构创建和初始数据插入

const sqlite3 = require('sqlite3').verbose(); // SQLite3数据库驱动，verbose模式提供详细错误信息
const path = require('path'); // Node.js路径处理模块

// ==================== 数据库配置 ====================
// 数据库文件路径，存储在当前目录下的salary.db文件
const dbPath = path.resolve(__dirname, 'salary.db');

// ==================== 数据库连接 ====================
// 创建SQLite数据库连接实例
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到SQLite数据库');
  }
});

// ==================== 数据库初始化函数 ====================
// 初始化数据库表结构和基础数据
const initDatabase = () => {
  // 使用serialize确保SQL语句按顺序执行
  db.serialize(() => {
    // ==================== 创建员工表 ====================
    // 员工基本信息表，包含登录凭证、个人信息和角色权限
    db.run(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,        -- 自增主键
      employee_id TEXT NOT NULL UNIQUE,            -- 员工工号，唯一标识
      username TEXT NOT NULL UNIQUE,               -- 登录用户名，唯一
      password TEXT NOT NULL,                      -- 登录密码
      name TEXT NOT NULL,                          -- 员工姓名
      department TEXT NOT NULL,                    -- 所属部门
      position TEXT NOT NULL,                      -- 职位
      join_date TEXT NOT NULL,                     -- 入职日期
      role TEXT DEFAULT 'employee' CHECK(role IN ('admin', 'employee'))  -- 角色：管理员或普通员工
    )`);

    // ==================== 创建工资表 ====================
    // 员工工资记录表，存储每月的详细工资信息
    db.run(`CREATE TABLE IF NOT EXISTS salaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,        -- 自增主键
      employee_id TEXT NOT NULL,                   -- 员工工号，外键关联employees表
      year INTEGER NOT NULL,                       -- 工资年份
      month INTEGER NOT NULL,                      -- 工资月份
      base_salary REAL NOT NULL,                   -- 基础工资
      position_salary REAL DEFAULT 0,              -- 岗位工资
      performance_salary REAL DEFAULT 0,           -- 绩效工资
      work_time_type TEXT DEFAULT '',              -- 工作时间类型（全职/兼职等）
      attendance_status TEXT DEFAULT '',           -- 考勤情况
      full_time REAL DEFAULT 0,                    -- 全勤奖
      other REAL DEFAULT 0,                         -- 其他津贴
      weekday_overtime_hours REAL DEFAULT 0,       -- 平日加班小时数
      weekend_overtime_hours REAL DEFAULT 0,       -- 周末加班小时数
      holiday_overtime_hours REAL DEFAULT 0,       -- 法定节假日加班小时数
      overtime_pay REAL DEFAULT 0,                 -- 加班费
      bonus REAL DEFAULT 0,                        -- 奖金
      allowance REAL DEFAULT 0,                    -- 津贴
      deduction REAL DEFAULT 0,                    -- 扣除金额
      total_salary REAL NOT NULL,                  -- 实发工资总额
      payment_date TEXT NOT NULL,                  -- 发放日期
      remarks TEXT DEFAULT '',                     -- 备注信息
      FOREIGN KEY (employee_id) REFERENCES employees (employee_id),  -- 外键约束
      UNIQUE(employee_id, year, month)             -- 确保每个员工每月只有一条工资记录
    )`);

    // ==================== 初始化测试数据 ====================
    // 预设员工数据，包含一个管理员账户和几个普通员工账户
    const employees = [
      { employee_id: 'EMP001', username: 'admin', password: 'admin', name: '管理员', department: '管理部', position: '系统管理员', join_date: '2020-01-01', role: 'admin' },     // 系统管理员账户
      { employee_id: 'EMP002', username: 'zhangsan', password: '123456', name: '张三', department: '技术部', position: '高级工程师', join_date: '2020-01-15', role: 'employee' }, // 技术部员工
      { employee_id: 'EMP003', username: 'lisi', password: '123456', name: '李四', department: '市场部', position: '市场经理', join_date: '2019-05-20', role: 'employee' },     // 市场部员工
      { employee_id: 'EMP004', username: 'wangwu', password: '123456', name: '王五', department: '财务部', position: '会计', join_date: '2021-03-10', role: 'employee' }       // 财务部员工
    ];

    // 预设工资数据，为每个员工提供2023年5月和6月的工资记录作为示例
    const salaries = [
      // 管理员工资记录（高级管理层薪资水平）
      { employee_id: 'EMP001', year: 2023, month: 5, base_salary: 15000, position_salary: 8000, performance_salary: 3000, overtime_pay: 0, bonus: 5000, allowance: 2000, deduction: 1000, total_salary: 32000, payment_date: '2023-05-10' },
      { employee_id: 'EMP001', year: 2023, month: 6, base_salary: 15000, position_salary: 8000, performance_salary: 3000, overtime_pay: 0, bonus: 5000, allowance: 2000, deduction: 1000, total_salary: 32000, payment_date: '2023-06-10' },
      // 张三工资记录（高级工程师薪资水平）
      { employee_id: 'EMP002', year: 2023, month: 5, base_salary: 8000, position_salary: 5000, performance_salary: 2000, overtime_pay: 1000, bonus: 2000, allowance: 1000, deduction: 500, total_salary: 18500, payment_date: '2023-05-10' },
      { employee_id: 'EMP002', year: 2023, month: 6, base_salary: 8000, position_salary: 5000, performance_salary: 2500, overtime_pay: 1500, bonus: 3000, allowance: 1000, deduction: 500, total_salary: 20500, payment_date: '2023-06-10' },
      // 李四工资记录（市场经理薪资水平）
      { employee_id: 'EMP003', year: 2023, month: 5, base_salary: 6000, position_salary: 4000, performance_salary: 1500, overtime_pay: 800, bonus: 1500, allowance: 800, deduction: 400, total_salary: 14200, payment_date: '2023-05-10' },
      { employee_id: 'EMP003', year: 2023, month: 6, base_salary: 6000, position_salary: 4000, performance_salary: 1800, overtime_pay: 1000, bonus: 1800, allowance: 800, deduction: 400, total_salary: 15000, payment_date: '2023-06-10' },
      // 王五工资记录（会计薪资水平）
      { employee_id: 'EMP004', year: 2023, month: 5, base_salary: 5000, position_salary: 3000, performance_salary: 1200, overtime_pay: 500, bonus: 1000, allowance: 500, deduction: 300, total_salary: 10900, payment_date: '2023-05-10' },
      { employee_id: 'EMP004', year: 2023, month: 6, base_salary: 5000, position_salary: 3000, performance_salary: 1500, overtime_pay: 600, bonus: 1200, allowance: 500, deduction: 300, total_salary: 11500, payment_date: '2023-06-10' }
    ];

    // ==================== 数据插入操作 ====================
    // 批量插入员工数据，使用OR IGNORE避免重复插入
    const insertEmployee = db.prepare('INSERT OR IGNORE INTO employees (employee_id, username, password, name, department, position, join_date, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    employees.forEach(emp => {
      insertEmployee.run(emp.employee_id, emp.username, emp.password, emp.name, emp.department, emp.position, emp.join_date, emp.role || 'employee');
    });
    insertEmployee.finalize(); // 释放预编译语句资源

    // 批量插入工资数据，使用OR IGNORE避免重复插入
    const insertSalary = db.prepare('INSERT OR IGNORE INTO salaries (employee_id, year, month, base_salary, position_salary, performance_salary, overtime_pay, bonus, allowance, deduction, full_time, other, total_salary, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    salaries.forEach(salary => {
      insertSalary.run(
        salary.employee_id,     // 员工工号
        salary.year,            // 工资年份
        salary.month,           // 工资月份
        salary.base_salary,     // 基础工资
        salary.position_salary, // 岗位工资
        salary.performance_salary, // 绩效工资
        salary.overtime_pay,    // 加班费
        salary.bonus,           // 奖金
        salary.allowance,       // 津贴
        salary.deduction,       // 扣除
        salary.full_time || 0,  // 全勤
        salary.other || 0,      // 其他
        salary.total_salary,    // 总工资
        salary.payment_date     // 发放日期
      );
    });
    insertSalary.finalize(); // 释放预编译语句资源
  });
};

// ==================== 模块导出 ====================
// 导出数据库连接实例和初始化函数供其他模块使用
module.exports = {
  db,           // SQLite数据库连接实例
  initDatabase  // 数据库初始化函数
};