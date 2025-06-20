import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  UserAddOutlined,
  FileAddOutlined,
  WalletOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // 从本地存储获取用户信息
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Sider width={200} className="site-layout-background">
      <div className="sidebar-logo">工资查询系统</div>
      <Menu
        mode="inline"
        selectedKeys={[path]}
        defaultOpenKeys={['employees', 'salaries']}
        style={{ height: '100%', borderRight: 0 }}
        theme="dark"
      >
        {user && user.role === 'admin' && (
          <>
            <Menu.Item key="/" icon={<DashboardOutlined />}>
              <Link to="/">仪表盘</Link>
            </Menu.Item>
            <Menu.SubMenu key="employees" icon={<TeamOutlined />} title="员工管理">
              <Menu.Item key="/employees" icon={<TeamOutlined />}>
                <Link to="/employees">员工列表</Link>
              </Menu.Item>
              <Menu.Item key="/employees/add" icon={<UserAddOutlined />}>
                <Link to="/employees/add">添加员工</Link>
              </Menu.Item>
            </Menu.SubMenu>
            <Menu.SubMenu key="salaries" icon={<DollarOutlined />} title="工资管理">
              <Menu.Item key="/salaries" icon={<DollarOutlined />}>
                <Link to="/salaries">工资列表</Link>
              </Menu.Item>
              <Menu.Item key="/salaries/add" icon={<FileAddOutlined />}>
                <Link to="/salaries/add">添加工资记录</Link>
              </Menu.Item>
              <Menu.Item key="/my-salary" icon={<WalletOutlined />}>
                <Link to="/my-salary">我的工资查询</Link>
              </Menu.Item>
            </Menu.SubMenu>
          </>
        )}
        
        {user && user.role === 'employee' && (
          <>
            <Menu.Item key="/dashboard" icon={<DashboardOutlined />}>
              <Link to="/dashboard">我的收入概览</Link>
            </Menu.Item>
            <Menu.Item key="/my-salary" icon={<WalletOutlined />}>
              <Link to="/my-salary">我的工资查询</Link>
            </Menu.Item>
          </>
        )}
      </Menu>
    </Sider>
  );
};

export default Sidebar;