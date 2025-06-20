import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, DatePicker, Select, Typography, Space } from 'antd';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import moment from 'moment';
import { employeeAPI } from '../../services/api';

const { Option } = Select;
const { Title } = Typography;

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  
  const isEditMode = !!id;

  // 部门选项
  const departments = ['技术部', '市场部', '财务部', '人力资源部', '行政部', '销售部'];

  useEffect(() => {
    if (isEditMode) {
      const fetchEmployee = async () => {
        try {
          const response = await employeeAPI.getEmployee(id);
          const employee = response.data;
          
          setInitialValues({
            ...employee,
            join_date: moment(employee.join_date)
          });
          
          form.setFieldsValue({
            ...employee,
            join_date: moment(employee.join_date)
          });
        } catch (error) {
          console.error('获取员工信息失败:', error);
          message.error('获取员工信息失败');
        }
      };
      
      fetchEmployee();
    }
  }, [id, form, isEditMode]);

  const onFinish = async (values) => {
    // 格式化日期
    const formattedValues = {
      ...values,
      join_date: values.join_date.format('YYYY-MM-DD')
    };
    
    setLoading(true);
    
    try {
      if (isEditMode) {
        // 更新员工
        await employeeAPI.updateEmployee(id, formattedValues);
        message.success('员工信息更新成功');
      } else {
        // 添加员工
        await employeeAPI.addEmployee(formattedValues);
        message.success('员工添加成功');
        form.resetFields();
      }
      
      // 返回员工列表
      if (isEditMode) {
        navigate(`/employees/${id}`);
      } else {
        navigate('/employees');
      }
    } catch (error) {
      console.error('保存员工信息失败:', error);
      message.error('保存员工信息失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Link to={isEditMode ? `/employees/${id}` : '/employees'}>
            <Button icon={<ArrowLeftOutlined />}>
              {isEditMode ? '返回员工详情' : '返回员工列表'}
            </Button>
          </Link>
        </Space>
      </div>
      
      <Card className="form-container">
        <Title level={2}>{isEditMode ? '编辑员工' : '添加员工'}</Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={initialValues || {
            department: '技术部',
            join_date: moment()
          }}
        >
          {!isEditMode && (
            <Form.Item
              name="employee_id"
              label="员工ID"
              rules={[
                { required: true, message: '请输入员工ID' },
                { pattern: /^[A-Za-z0-9]+$/, message: '员工ID只能包含字母和数字' }
              ]}
            >
              <Input placeholder="请输入员工ID，如EMP001" />
            </Form.Item>
          )}
          
          {!isEditMode && (
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { pattern: /^[A-Za-z0-9._-]+$/, message: '用户名只能包含字母、数字、点、下划线和横线' }
              ]}
            >
              <Input placeholder="请输入登录用户名" />
            </Form.Item>
          )}
          
          {!isEditMode && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' }
              ]}
            >
              <Input.Password placeholder="请输入登录密码" />
            </Form.Item>
          )}
          
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入员工姓名' }]}
          >
            <Input placeholder="请输入员工姓名" />
          </Form.Item>
          
          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select placeholder="请选择部门">
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="position"
            label="职位"
            rules={[{ required: true, message: '请输入职位' }]}
          >
            <Input placeholder="请输入职位" />
          </Form.Item>
          
          <Form.Item
            name="join_date"
            label="入职日期"
            rules={[{ required: true, message: '请选择入职日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item className="form-actions">
            <Button type="default" onClick={() => navigate('/employees')}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EmployeeForm;