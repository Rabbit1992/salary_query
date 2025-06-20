import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Login.css';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await authAPI.login(values);
      
      if (response.data && response.data.user) {
        message.success('登录成功');
        // 存储用户信息到本地存储
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // 跳转到首页
        navigate('/');
      } else {
        message.error(response.data.error || '登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>工资查询系统</Title>
          <Title level={4}>用户登录</Title>
          <Button 
            type="link" 
            size="small" 
            onClick={() => {
              localStorage.clear();
              message.success('缓存已清理，请重新登录');
            }}
            style={{ fontSize: '12px', padding: 0 }}
          >
            清理缓存
          </Button>
        </div>
        
        <Form
          name="login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined className="site-form-item-icon" />} 
              placeholder="用户名" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="login-form-button" 
              loading={loading}
              size="large"
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;