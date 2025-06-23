import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 认证相关API
export const authAPI = {
  // 用户登录
  login: (credentials) => api.post('/salary/login', credentials),
};

// 员工相关API
export const employeeAPI = {
  // 获取所有员工
  getAllEmployees: () => api.get('/salary/employees'),
  
  // 获取单个员工
  getEmployee: (id) => api.get(`/salary/employees/${id}`),
  
  // 添加员工
  addEmployee: (employeeData) => api.post('/salary/employees', employeeData),
  
  // 更新员工
  updateEmployee: (id, employeeData) => api.put(`/salary/employees/${id}`, employeeData),
  
  // 删除员工
  deleteEmployee: (id) => api.delete(`/salary/employees/${id}`)
};

// 工资相关API
export const salaryAPI = {
  // 获取所有工资记录
  getAllSalaries: (params) => api.get('/salary/salaries', { params }),
  
  // 获取员工工资记录
  getEmployeeSalaries: (id, params) => api.get(`/salary/employees/${id}/salaries`, { params }),
  
  // 添加工资记录
  addSalary: (salaryData) => api.post('/salary/salaries', salaryData),
  
  // 更新工资记录
  updateSalary: (id, salaryData) => api.put(`/salary/salaries/${id}`, salaryData),
  
  // 删除工资记录
  deleteSalary: (id) => api.delete(`/salary/salaries/${id}`)
};

export default {
  authAPI,
  employeeAPI,
  salaryAPI
};