import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import './App.css';

// 导入组件
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import EmployeeDashboard from './components/pages/EmployeeDashboard';
import EmployeeList from './components/pages/EmployeeList';
import EmployeeDetail from './components/pages/EmployeeDetail';
import SalaryList from './components/pages/SalaryList';
import SalaryForm from './components/pages/SalaryForm';
import EmployeeForm from './components/pages/EmployeeForm';
import Login from './components/pages/Login';
import MySalary from './components/pages/MySalary';

const { Content } = Layout;

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// 根据用户角色重定向到不同的默认页面
const RoleBasedRedirect = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (user && user.role === 'admin') {
    return <Navigate to="/" replace />;
  } else if (user && user.role === 'employee') {
    return <Navigate to="/my-salary" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 从本地存储获取用户信息
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);
  
  // 如果正在加载用户信息，显示加载中
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout style={{ minHeight: '100vh' }}>
              <Navbar user={user} />
              <Layout>
                <Sidebar />
                <Layout style={{ padding: '0 24px 24px' }}>
                  <Content
                    className="site-layout-background"
                    style={{
                      padding: 24,
                      margin: '16px 0',
                      minHeight: 280,
                    }}
                  >
                    <Routes>
                      <Route path="/" element={
                        user && user.role === 'admin' ? <Dashboard /> : <Navigate to="/my-salary" replace />
                      } />
                      <Route path="/employees" element={
                        user && user.role === 'admin' ? <EmployeeList /> : <Navigate to="/my-salary" replace />
                      } />
                      <Route path="/employees/add" element={
                        user && user.role === 'admin' ? <EmployeeForm /> : <Navigate to="/my-salary" replace />
                      } />
                      <Route path="/employees/edit/:id" element={
                        user && user.role === 'admin' ? <EmployeeForm /> : <Navigate to="/my-salary" replace />
                      } />
                      <Route path="/employees/:id" element={
                        user && user.role === 'admin' ? <EmployeeDetail /> : <Navigate to="/my-salary" replace />
                      } />
                      <Route path="/salaries" element={
                        user && user.role === 'admin' ? <SalaryList /> : <Navigate to="/my-salary" replace />
                      } />
                      <Route path="/salaries/add" element={
                        user && user.role === 'admin' ? <SalaryForm /> : <Navigate to="/my-salary" replace />
                      } />
                      <Route path="/salaries/edit/:id" element={
                        user && user.role === 'admin' ? <SalaryForm /> : <Navigate to="/my-salary" replace />
                      } />
                      <Route path="/my-salary" element={<MySalary />} />
                      <Route path="/dashboard" element={<EmployeeDashboard />} />
                    </Routes>
                  </Content>
                </Layout>
              </Layout>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App;
