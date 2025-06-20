import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Input, Typography, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { employeeAPI } from '../../services/api';

const { Title } = Typography;
const { confirm } = Modal;

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // 获取员工列表
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeAPI.getAllEmployees();
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取员工列表失败:', error);
      message.error('获取员工列表失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 删除员工
  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '删除员工将同时删除其所有工资记录，确定要删除吗？',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await employeeAPI.deleteEmployee(id);
          message.success('员工删除成功');
          fetchEmployees();
        } catch (error) {
          console.error('删除员工失败:', error);
          message.error('删除员工失败');
        }
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '员工ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      sorter: (a, b) => a.employee_id.localeCompare(b.employee_id),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <Link to={`/employees/${record.employee_id}`}>{text}</Link>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      filters: [...new Set(employees.map(emp => emp.department))].map(dept => ({
        text: dept,
        value: dept,
      })),
      onFilter: (value, record) => record.department === value,
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '入职日期',
      dataIndex: 'join_date',
      key: 'join_date',
      sorter: (a, b) => new Date(a.join_date) - new Date(b.join_date),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/employees/${record.employee_id}`}>
            <Button type="primary" size="small">
              查看
            </Button>
          </Link>
          <Link to={`/employees/edit/${record.employee_id}`}>
            <Button type="default" size="small" icon={<EditOutlined />}>
              编辑
            </Button>
          </Link>
          <Button 
            type="default" 
            danger 
            size="small" 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.employee_id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 过滤员工数据
  const filteredEmployees = employees.filter(emp => {
    return (
      emp.employee_id.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  return (
    <div>
      <Card>
        <div className="table-actions">
          <Title level={2}>员工管理</Title>
          <Space>
            <Input
              placeholder="搜索员工"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Link to="/employees/add">
              <Button type="primary" icon={<PlusOutlined />}>
                添加员工
              </Button>
            </Link>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredEmployees}
          rowKey="employee_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default EmployeeList;