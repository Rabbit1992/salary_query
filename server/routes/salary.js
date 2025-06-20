// ==================== 工资管理路由模块 ====================
// 该模块负责处理所有与工资相关的API请求，包括用户登录、员工管理、工资查询、Excel导入导出等功能

const express = require('express');     // Express框架，用于创建路由
const router = express.Router();        // 创建路由实例
const { db } = require('../database/db'); // 导入数据库连接实例
const multer = require('multer');       // 文件上传中间件
const xlsx = require('xlsx');           // Excel文件处理库
const path = require('path');           // 路径处理工具

// ==================== 文件上传配置 ====================
// 配置multer中间件用于处理Excel文件上传
const storage = multer.diskStorage({
  // 设置文件存储目录
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads')); // 文件保存到uploads目录
  },
  // 设置文件名格式：时间戳-原文件名，避免文件名冲突
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// 创建multer实例，配置存储和文件过滤规则
const upload = multer({ 
  storage: storage,
  // 文件类型过滤器，只允许上传Excel文件
  fileFilter: function (req, file, cb) {
    // 检查文件MIME类型是否为Excel格式
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);  // 允许上传
    } else {
      cb(new Error('只能上传Excel文件!'), false); // 拒绝上传
    }
  }
});

// ==================== 用户认证API ====================
// 用户登录接口
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // 验证必填字段
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码是必填的' });
  }
  
  // 查询数据库验证用户凭据
  db.get('SELECT * FROM employees WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 检查用户是否存在
    if (!row) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 从返回数据中移除密码字段，确保安全性
    const { password, ...userInfo } = row;
    
    // 返回登录成功信息和用户数据
    res.json({
      message: '登录成功',
      user: userInfo
    });
  });
});

// ==================== 员工信息查询API ====================
// 获取所有员工信息列表
router.get('/employees', (req, res) => {
  // 查询所有员工信息，按姓名排序
  db.all('SELECT * FROM employees ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // 返回员工列表
  });
});

// 根据员工ID获取特定员工信息
router.get('/employees/:id', (req, res) => {
  const { id } = req.params; // 从URL参数中获取员工ID
  
  // 根据员工ID查询员工信息
  db.get('SELECT * FROM employees WHERE employee_id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 检查员工是否存在
    if (!row) {
      return res.status(404).json({ error: '未找到该员工' });
    }
    
    res.json(row); // 返回员工信息
  });
});

// ==================== 工资记录查询API ====================
// 获取指定员工的工资记录（支持按年月筛选）
router.get('/employees/:id/salaries', (req, res) => {
  const { id } = req.params;        // 从URL参数获取员工ID
  const { year, month } = req.query; // 从查询参数获取年份和月份（可选）
  
  // 构建基础查询语句
  let query = 'SELECT * FROM salaries WHERE employee_id = ?';
  let params = [id];
  
  // 如果指定了年份，添加年份筛选条件
  if (year) {
    query += ' AND year = ?';
    params.push(year);
  }
  
  // 如果指定了月份，添加月份筛选条件
  if (month) {
    query += ' AND month = ?';
    params.push(month);
  }
  
  // 按年份和月份降序排列，最新的记录在前
  query += ' ORDER BY year DESC, month DESC';
  
  // 执行查询
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // 返回工资记录列表
  });
});

// 获取所有员工的工资记录（支持按年月、部门筛选）
router.get('/salaries', (req, res) => {
  const { year, month, department } = req.query; // 从查询参数获取筛选条件
  
  // 构建联表查询语句，获取工资记录和对应的员工信息
  let query = `
    SELECT s.*, e.name, e.department, e.position 
    FROM salaries s
    JOIN employees e ON s.employee_id = e.employee_id
    WHERE 1=1
  `;
  let params = [];
  
  // 如果指定了年份，添加年份筛选条件
  if (year) {
    query += ' AND s.year = ?';
    params.push(year);
  }
  
  // 如果指定了月份，添加月份筛选条件
  if (month) {
    query += ' AND s.month = ?';
    params.push(month);
  }
  
  // 如果指定了部门，添加部门筛选条件
  if (department) {
    query += ' AND e.department = ?';
    params.push(department);
  }
  
  // 按部门和姓名排序，便于查看和管理
  query += ' ORDER BY e.department, e.name';
  
  // 执行查询
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // 返回工资记录列表（包含员工信息）
  });
});

// ==================== 员工管理API ====================
// 添加新员工
router.post('/employees', (req, res) => {
  const { employee_id, username, password, name, department, position, join_date } = req.body;
  
  // 验证所有必填字段
  if (!employee_id || !username || !password || !name || !department || !position || !join_date) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }
  
  // 检查用户名是否已存在，确保用户名唯一性
  db.get('SELECT * FROM employees WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 如果用户名已存在，返回错误
    if (row) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    // 插入新员工记录
    const sql = 'INSERT INTO employees (employee_id, username, password, name, department, position, join_date) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.run(sql, [employee_id, username, password, name, department, position, join_date], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 返回新创建的员工信息（不包含密码）
      res.status(201).json({
        id: this.lastID,    // 数据库自动生成的ID
        employee_id,        // 员工工号
        username,           // 用户名
        name,              // 姓名
        department,        // 部门
        position,          // 职位
        join_date          // 入职日期
      });
    });
  });
});

// ==================== 工资记录管理API ====================
// 添加新的工资记录
router.post('/salaries', (req, res) => {
  // 从请求体中提取工资相关的所有字段
  const {
    employee_id,              // 员工工号
    year,                     // 工资年份
    month,                    // 工资月份
    base_salary,              // 基础工资
    position_salary,          // 岗位工资
    performance_salary,       // 绩效工资
    work_time_type,           // 工作时间类型
    attendance_status,        // 出勤状态
    full_time,                // 全勤奖
    other,                    // 其他津贴
    weekday_overtime_hours,   // 工作日加班小时
    weekend_overtime_hours,   // 周末加班小时
    holiday_overtime_hours,   // 节假日加班小时
    overtime_pay,             // 加班费
    bonus,                    // 奖金
    allowance,                // 津贴
    deduction,                // 扣除
    payment_date,             // 发放日期
    remarks                   // 备注
  } = req.body;
  
  // 验证必填字段
  if (!employee_id || !year || !month || !base_salary || !payment_date) {
    return res.status(400).json({ error: '员工ID、年份、月份、基本工资和发放日期是必填的' });
  }
  
  // 自动计算总工资：所有收入项相加减去扣除项
  const total_salary = parseFloat(base_salary) + 
                       (parseFloat(position_salary) || 0) + 
                       (parseFloat(performance_salary) || 0) + 
                       (parseFloat(full_time) || 0) + 
                       (parseFloat(other) || 0) + 
                       (parseFloat(overtime_pay) || 0) + 
                       (parseFloat(bonus) || 0) + 
                       (parseFloat(allowance) || 0) - 
                       (parseFloat(deduction) || 0);
  
  // 构建插入工资记录的SQL语句
  const sql = `
    INSERT INTO salaries 
    (employee_id, year, month, base_salary, position_salary, performance_salary, 
    work_time_type, attendance_status, full_time, other, 
    weekday_overtime_hours, weekend_overtime_hours, holiday_overtime_hours, 
    overtime_pay, bonus, allowance, deduction, total_salary, payment_date, remarks) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  // 执行插入操作，为空值设置默认值
  db.run(
    sql, 
    [
      employee_id,                          // 员工工号
      year,                                 // 工资年份
      month,                                // 工资月份
      base_salary,                          // 基础工资
      position_salary || 0,                 // 岗位工资（默认0）
      performance_salary || 0,              // 绩效工资（默认0）
      work_time_type || '',                 // 工作时间类型（默认空字符串）
      attendance_status || '',              // 出勤状态（默认空字符串）
      full_time || 0,                      // 全勤奖（默认0）
      other || 0,                          // 其他津贴（默认0）
      weekday_overtime_hours || 0,          // 工作日加班小时（默认0）
      weekend_overtime_hours || 0,          // 周末加班小时（默认0）
      holiday_overtime_hours || 0,          // 节假日加班小时（默认0）
      overtime_pay || 0,                    // 加班费（默认0）
      bonus || 0,                           // 奖金（默认0）
      allowance || 0,                       // 津贴（默认0）
      deduction || 0,                       // 扣除（默认0）
      total_salary,                         // 计算得出的总工资
      payment_date,                         // 发放日期
      remarks || ''                         // 备注（默认空字符串）
    ], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 返回新创建的工资记录信息
      res.status(201).json({
        id: this.lastID,                                    // 数据库自动生成的ID
        employee_id,                                        // 员工工号
        year,                                               // 工资年份
        month,                                              // 工资月份
        base_salary,                                        // 基础工资
        position_salary: position_salary || 0,             // 岗位工资
        performance_salary: performance_salary || 0,       // 绩效工资
        work_time_type: work_time_type || '',               // 工作时间类型
        attendance_status: attendance_status || '',         // 出勤状态
        full_time: full_time || 0,                      // 全勤奖
        other: other || 0,                              // 其他津贴
        weekday_overtime_hours: weekday_overtime_hours || 0, // 工作日加班小时
        weekend_overtime_hours: weekend_overtime_hours || 0, // 周末加班小时
        holiday_overtime_hours: holiday_overtime_hours || 0, // 节假日加班小时
        overtime_pay: overtime_pay || 0,                   // 加班费
        bonus: bonus || 0,                                 // 奖金
        allowance: allowance || 0,                         // 津贴
        deduction: deduction || 0,                         // 扣除
        total_salary,
        payment_date,
        remarks: remarks || ''
      });
    }
  );
});

// 更新员工信息
router.put('/employees/:id', (req, res) => {
  const { id } = req.params; // 从URL参数获取员工ID
  const { username, password, name, department, position, join_date } = req.body;
  
  // 验证必填字段
  if (!name || !department || !position || !join_date) {
    return res.status(400).json({ error: '姓名、部门、职位和入职日期是必填的' });
  }
  
  // 如果提供了新用户名，检查是否与其他员工冲突（排除当前员工）
  if (username) {
    db.get('SELECT * FROM employees WHERE username = ? AND employee_id != ?', [username, id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 如果用户名已被其他员工使用，返回错误
      if (row) {
        return res.status(400).json({ error: '用户名已被其他员工使用' });
      }
      
      updateEmployee(); // 用户名可用，执行更新
    });
  } else {
    updateEmployee(); // 没有提供用户名，直接执行更新
  }
  
  // 内部函数：执行员工信息更新操作
  function updateEmployee() {
    let sql, params;
    
    // 根据提供的字段动态构建SQL语句
    if (username && password) {
      // 同时更新用户名和密码
      sql = 'UPDATE employees SET username = ?, password = ?, name = ?, department = ?, position = ?, join_date = ? WHERE employee_id = ?';
      params = [username, password, name, department, position, join_date, id];
    } else if (username) {
      // 只更新用户名
      sql = 'UPDATE employees SET username = ?, name = ?, department = ?, position = ?, join_date = ? WHERE employee_id = ?';
      params = [username, name, department, position, join_date, id];
    } else if (password) {
      // 只更新密码
      sql = 'UPDATE employees SET password = ?, name = ?, department = ?, position = ?, join_date = ? WHERE employee_id = ?';
      params = [password, name, department, position, join_date, id];
    } else {
      // 不更新用户名和密码，只更新其他信息
      sql = 'UPDATE employees SET name = ?, department = ?, position = ?, join_date = ? WHERE employee_id = ?';
      params = [name, department, position, join_date, id];
    }
    
    // 执行更新操作
    db.run(sql, params, function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 检查是否有记录被更新
      if (this.changes === 0) {
        return res.status(404).json({ error: '未找到该员工' });
      }
      
      // 返回更新后的员工信息
      res.json({
        employee_id: id,
        username,
        name,
        department,
        position,
        join_date
      });
    });
  }
});

// 更新工资记录
router.put('/salaries/:id', (req, res) => {
  const id = req.params.id;
  const {
    employee_id,
    year,
    month,
    base_salary,
    position_salary,
    performance_salary,
    work_time_type,
    attendance_status,
    full_time,
    other,
    weekday_overtime_hours,
    weekend_overtime_hours,
    holiday_overtime_hours,
    overtime_pay,
    bonus,
    allowance,
    deduction,
    payment_date,
    remarks
  } = req.body;
  
  if (!employee_id || !year || !month || !base_salary || !payment_date) {
    return res.status(400).json({ error: '员工ID、年份、月份、基本工资和发放日期是必填的' });
  }
  
  // 计算总工资
  const total_salary = parseFloat(base_salary) + 
                       (parseFloat(position_salary) || 0) + 
                       (parseFloat(performance_salary) || 0) + 
                       (parseFloat(full_time) || 0) + 
                       (parseFloat(other) || 0) + 
                       (parseFloat(overtime_pay) || 0) + 
                       (parseFloat(bonus) || 0) + 
                       (parseFloat(allowance) || 0) - 
                       (parseFloat(deduction) || 0);
  
  const sql = `
    UPDATE salaries 
    SET employee_id = ?, 
        year = ?, 
        month = ?, 
        base_salary = ?, 
        position_salary = ?, 
        performance_salary = ?, 
        work_time_type = ?, 
        attendance_status = ?, 
        full_time = ?, 
        other = ?, 
        weekday_overtime_hours = ?, 
        weekend_overtime_hours = ?, 
        holiday_overtime_hours = ?, 
        overtime_pay = ?, 
        bonus = ?, 
        allowance = ?, 
        deduction = ?, 
        total_salary = ?, 
        payment_date = ?, 
        remarks = ? 
    WHERE id = ?
  `;
  
  db.run(
    sql, 
    [
      employee_id,
      year,
      month,
      base_salary,
      position_salary || 0,
      performance_salary || 0,
      work_time_type || '',
      attendance_status || '',
      full_time || 0,
      other || 0,
      weekday_overtime_hours || 0,
      weekend_overtime_hours || 0,
      holiday_overtime_hours || 0,
      overtime_pay || 0,
      bonus || 0,
      allowance || 0,
      deduction || 0,
      total_salary,
      payment_date,
      remarks || '',
      id
    ], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '未找到工资记录' });
      }
      
      res.json({
        id,
        employee_id,
        year,
        month,
        base_salary,
        position_salary: position_salary || 0,
        performance_salary: performance_salary || 0,
        work_time_type: work_time_type || '',
        attendance_status: attendance_status || '',
        full_time: full_time || 0,
        other: other || 0,
        weekday_overtime_hours: weekday_overtime_hours || 0,
        weekend_overtime_hours: weekend_overtime_hours || 0,
        holiday_overtime_hours: holiday_overtime_hours || 0,
        overtime_pay: overtime_pay || 0,
        bonus: bonus || 0,
        allowance: allowance || 0,
        deduction: deduction || 0,
        total_salary,
        payment_date,
        remarks: remarks || ''
      });
    }
  );
});

// 删除员工（同时删除其工资记录）
router.delete('/employees/:id', (req, res) => {
  const { id } = req.params;
  
  db.serialize(() => {
    // 先删除工资记录
    db.run('DELETE FROM salaries WHERE employee_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 再删除员工记录
      db.run('DELETE FROM employees WHERE employee_id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: '未找到该员工' });
        }
        
        res.json({ message: '员工及其工资记录已成功删除' });
      });
    });
  });
});

// 删除工资记录
router.delete('/salaries/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM salaries WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '未找到该工资记录' });
    }
    
    res.json({ message: '工资记录已成功删除' });
  });
});

// 导入Excel工资数据
router.post('/import-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    // 读取Excel文件
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel文件中没有数据' });
    }

    // 获取所有员工信息，用于匹配员工姓名
    const employees = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM employees', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const results = {
      success: 0,
      errors: []
    };

    // 处理每一行数据
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel行号从2开始（1是表头）

      try {
        // 查找员工ID
        const employee = employees.find(emp => emp.name === row['姓名']);
        if (!employee) {
          results.errors.push({ row: rowNum, message: `未找到员工: ${row['姓名']}` });
          continue;
        }

        // 提取年月信息
        const yearMonth = row['年月'] || '';
        let year, month;
        
        if (yearMonth) {
          const match = yearMonth.match(/(\d{4})年(\d{1,2})月/);
          if (match) {
            year = parseInt(match[1]);
            month = parseInt(match[2]);
          } else {
            results.errors.push({ row: rowNum, message: '年月格式不正确，应为：YYYY年MM月' });
            continue;
          }
        } else {
          // 如果没有年月字段，尝试分别获取年和月
          year = row['年份'] || new Date().getFullYear();
          month = row['月份'] || new Date().getMonth() + 1;
        }

        // 提取工资数据
        const salaryData = {
          employee_id: employee.employee_id,
          year,
          month,
          base_salary: parseFloat(row['基础工资'] || 0),
          position_salary: parseFloat(row['岗位工资'] || 0),
          performance_salary: parseFloat(row['绩效工资'] || 0),
          work_time_type: row['工作时间类型'] || '',
          attendance_status: row['考勤情况'] || '',
          full_time: parseFloat(row['全勤'] || 0),
          other: parseFloat(row['其他'] || 0),
          weekday_overtime_hours: parseFloat(row['平日累计时间'] || 0),
          weekend_overtime_hours: parseFloat(row['双休日累计时间'] || 0),
          holiday_overtime_hours: parseFloat(row['法定节日累计时间'] || 0),
          overtime_pay: parseFloat(row['加班费'] || 0),
          bonus: parseFloat(row['奖金'] || 0),
          allowance: parseFloat(row['津贴'] || 0),
          deduction: parseFloat(row['扣除'] || 0),
          payment_date: row['发放日期'] || new Date().toISOString().split('T')[0],
          remarks: row['备注'] || ''
        };

        // 计算总工资
        const total_salary = salaryData.base_salary + 
                           salaryData.position_salary + 
                           salaryData.performance_salary + 
                           salaryData.full_time + 
                           salaryData.other + 
                           salaryData.overtime_pay + 
                           salaryData.bonus + 
                           salaryData.allowance - 
                           salaryData.deduction;

        salaryData.total_salary = total_salary;

        // 检查是否已存在该员工该月的工资记录
        const existingSalary = await new Promise((resolve, reject) => {
          db.get(
            'SELECT id FROM salaries WHERE employee_id = ? AND year = ? AND month = ?',
            [salaryData.employee_id, salaryData.year, salaryData.month],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (existingSalary) {
          // 更新现有记录
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE salaries 
              SET base_salary = ?, position_salary = ?, performance_salary = ?, 
                  work_time_type = ?, attendance_status = ?, full_time = ?, 
                  other = ?, weekday_overtime_hours = ?, weekend_overtime_hours = ?, 
                  holiday_overtime_hours = ?, overtime_pay = ?, bonus = ?, allowance = ?, 
                  deduction = ?, total_salary = ?, payment_date = ?, remarks = ? 
              WHERE id = ?`,
              [
                salaryData.base_salary,
                salaryData.position_salary,
                salaryData.performance_salary,
                salaryData.work_time_type,
                salaryData.attendance_status,
                salaryData.full_time,
                salaryData.other,
                salaryData.weekday_overtime_hours,
                salaryData.weekend_overtime_hours,
                salaryData.holiday_overtime_hours,
                salaryData.overtime_pay,
                salaryData.bonus,
                salaryData.allowance,
                salaryData.deduction,
                salaryData.total_salary,
                salaryData.payment_date,
                salaryData.remarks,
                existingSalary.id
              ],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        } else {
          // 插入新记录
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO salaries 
              (employee_id, year, month, base_salary, position_salary, performance_salary, 
               work_time_type, attendance_status, full_time, other, 
               weekday_overtime_hours, weekend_overtime_hours, holiday_overtime_hours, 
               overtime_pay, bonus, allowance, deduction, total_salary, payment_date, remarks) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                salaryData.employee_id,
                salaryData.year,
                salaryData.month,
                salaryData.base_salary,
                salaryData.position_salary,
                salaryData.performance_salary,
                salaryData.work_time_type,
                salaryData.attendance_status,
                salaryData.full_time,
                salaryData.other,
                salaryData.weekday_overtime_hours,
                salaryData.weekend_overtime_hours,
                salaryData.holiday_overtime_hours,
                salaryData.overtime_pay,
                salaryData.bonus,
                salaryData.allowance,
                salaryData.deduction,
                salaryData.total_salary,
                salaryData.payment_date,
                salaryData.remarks
              ],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }

        results.success++;
      } catch (error) {
        console.error(`处理第${rowNum}行时出错:`, error);
        results.errors.push({ row: rowNum, message: error.message || '处理数据时出错' });
      }
    }

    // 删除上传的文件
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json(results);
  } catch (error) {
    console.error('导入Excel出错:', error);
    res.status(500).json({ error: error.message || '导入Excel出错' });
  }
});

// 下载Excel模板
router.get('/download-template', (req, res) => {
  try {
    // 创建一个新的工作簿
    const workbook = xlsx.utils.book_new();
    
    // 定义模板表头
    const headers = [
      '姓名',
      '年月',
      '工作时间类型',
      '考勤情况',
      '基础工资',
      '岗位工资',
      '绩效工资',
      '全勤',
      '其他',
      '平日累计时间',
      '双休日累计时间',
      '法定节日累计时间',
      '加班费',
      '奖金',
      '津贴',
      '扣除',
      '发放日期',
      '备注'
    ];
    
    // 创建示例数据
    const sampleData = [
      {
        '姓名': '张三',
        '年月': '2024年01月',
        '工作时间类型': '全职',
        '考勤情况': '正常',
        '基础工资': 5000,
        '岗位工资': 2000,
        '绩效工资': 1500,
        '全勤': 200,
        '其他': 0,
        '平日累计时间': 10,
        '双休日累计时间': 8,
        '法定节日累计时间': 0,
        '加班费': 500,
        '奖金': 1000,
        '津贴': 300,
        '扣除': 200,
        '发放日期': '2024-01-31',
        '备注': '示例数据'
      }
    ];
    
    // 创建工作表并设置列宽
    const worksheet = xlsx.utils.json_to_sheet(sampleData);
    const colWidths = [
      { wch: 10 }, // 姓名
      { wch: 12 }, // 年月
      { wch: 12 }, // 工作时间类型
      { wch: 10 }, // 考勤情况
      { wch: 10 }, // 基础工资
      { wch: 10 }, // 岗位工资
      { wch: 10 }, // 绩效工资
      { wch: 8 },  // 全勤
      { wch: 8 },  // 其他
      { wch: 12 }, // 平日累计时间
      { wch: 14 }, // 双休日累计时间
      { wch: 14 }, // 法定节日累计时间
      { wch: 10 }, // 加班费
      { wch: 8 },  // 奖金
      { wch: 8 },  // 津贴
      { wch: 8 },  // 扣除
      { wch: 12 }, // 发放日期
      { wch: 10 }  // 备注
    ];
    worksheet['!cols'] = colWidths;
    
    // 将工作表添加到工作簿
    xlsx.utils.book_append_sheet(workbook, worksheet, '工资数据模板');
    
    // 生成Excel文件并发送
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="salary_template.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('生成模板失败:', error);
    res.status(500).json({ error: '生成模板失败' });
  }
});

module.exports = router;