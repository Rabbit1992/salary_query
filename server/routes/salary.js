// ==================== 工资管理路由模块 ====================
// 该模块负责处理所有与工资相关的API请求，包括用户登录、员工管理、工资查询等功能

const express = require('express');     // Express框架，用于创建路由
const router = express.Router();        // 创建路由实例
const { db } = require('../database/db'); // 导入数据库连接实例

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



module.exports = router;