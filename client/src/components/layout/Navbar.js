import React from 'react';
import { Layout, Typography, Button, Dropdown, Space } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Title } = Typography;

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // 清除本地存储中的用户信息
    localStorage.removeItem('user');
    // 跳转到登录页面
    navigate('/login');
  };

  const items = [
    {
      key: 'logout',
      label: (
        <a onClick={handleLogout}>
          <LogoutOutlined /> 退出登录
        </a>
      ),
    },
  ];

  return (
    <Header className="navbar">
      <div className="navbar-logo">
        <Title level={4} style={{ color: 'white', margin: 0 }}>
          工资查询系统
        </Title>
      </div>
      <div>
        <Dropdown menu={{ items }} placement="bottomRight">
          <Space style={{ color: 'white', cursor: 'pointer' }}>
            <UserOutlined style={{ marginRight: 8 }} />
            <span>{user ? (user.name || user.employee_name || user.username) : '未登录'}</span>
            {/* 调试信息：显示完整用户对象 */}
            {user && console.log('当前用户信息:', user)}
          </Space>
        </Dropdown>
      </div>
    </Header>
  );
};

export default Navbar;