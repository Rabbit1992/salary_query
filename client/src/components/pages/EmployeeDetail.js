import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Table, Button, Space, Spin, Typography, Row, Col, Statistic, Select } from 'antd';
import { EditOutlined, ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';
import { employeeAPI, salaryAPI } from '../../services/api';
import ReactECharts from 'echarts-for-react';

const { Title } = Typography;
const { Option } = Select;

const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取员工信息
        const employeeRes = await employeeAPI.getEmployee(id);
        setEmployee(employeeRes.data);

        // 获取员工工资记录
        const salaryRes = await salaryAPI.getEmployeeSalaries(id, { year: selectedYear });
        setSalaries(salaryRes.data);

        setLoading(false);
      } catch (error) {
        console.error('获取员工详情失败:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, selectedYear]);

  // 计算工资统计数据
  const calculateStats = () => {
    if (salaries.length === 0) return { avg: 0, max: 0, min: 0, total: 0 };

    const total = salaries.reduce((sum, salary) => sum + salary.total_salary, 0);
    const avg = total / salaries.length;
    const max = Math.max(...salaries.map(salary => salary.total_salary));
    const min = Math.min(...salaries.map(salary => salary.total_salary));

    return { avg, max, min, total };
  };

  const stats = calculateStats();

  // 工资表格列定义
  const columns = [
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: '基本工资',
      dataIndex: 'base_salary',
      key: 'base_salary',
      render: (text) => `¥${text.toFixed(2)}`,
    },
    {
      title: '奖金',
      dataIndex: 'bonus',
      key: 'bonus',
      render: (text) => `¥${text.toFixed(2)}`,
    },
    {
      title: '津贴',
      dataIndex: 'allowance',
      key: 'allowance',
      render: (text) => `¥${text.toFixed(2)}`,
    },
    {
      title: '扣除',
      dataIndex: 'deduction',
      key: 'deduction',
      render: (text) => `¥${text.toFixed(2)}`,
    },
    {
      title: '总工资',
      dataIndex: 'total_salary',
      key: 'total_salary',
      render: (text) => `¥${text.toFixed(2)}`,
      sorter: (a, b) => a.total_salary - b.total_salary,
    },
    {
      title: '发放日期',
      dataIndex: 'payment_date',
      key: 'payment_date',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Link to={`/salaries/edit/${record.id}`}>
          <Button type="default" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
        </Link>
      ),
    },
  ];

  // 工资趋势图表选项
  const getChartOption = () => {
    const months = Array(12).fill(0).map((_, index) => `${index + 1}月`);
    const salaryData = Array(12).fill(null);

    salaries.forEach(salary => {
      salaryData[salary.month - 1] = salary.total_salary;
    });

    return {
      title: {
        text: `${selectedYear}年工资趋势`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: ¥{c}'
      },
      xAxis: {
        type: 'category',
        data: months
      },
      yAxis: {
        type: 'value',
        name: '工资 (元)'
      },
      series: [
        {
          name: '工资',
          type: 'line',
          data: salaryData,
          markPoint: {
            data: [
              { type: 'max', name: '最高值' },
              { type: 'min', name: '最低值' }
            ]
          },
          connectNulls: true
        }
      ]
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return <div>未找到员工信息</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Link to="/employees">
            <Button icon={<ArrowLeftOutlined />}>返回员工列表</Button>
          </Link>
          <Link to={`/employees/edit/${id}`}>
            <Button type="primary" icon={<EditOutlined />}>编辑员工信息</Button>
          </Link>
        </Space>
      </div>

      <Card className="detail-card">
        <Title level={2}>{employee.name} - 员工详情</Title>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="员工ID">{employee.employee_id}</Descriptions.Item>
          <Descriptions.Item label="姓名">{employee.name}</Descriptions.Item>
          <Descriptions.Item label="部门">{employee.department}</Descriptions.Item>
          <Descriptions.Item label="职位">{employee.position}</Descriptions.Item>
          <Descriptions.Item label="入职日期">{employee.join_date}</Descriptions.Item>
        </Descriptions>
      </Card>

      <div style={{ marginTop: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>工资记录</Title>
        <Space>
          <Select 
            defaultValue={selectedYear} 
            style={{ width: 120 }} 
            onChange={value => setSelectedYear(value)}
          >
            {[2021, 2022, 2023, 2024].map(year => (
              <Option key={year} value={year}>{year}年</Option>
            ))}
          </Select>
          <Link to={`/salaries/add?employee_id=${id}`}>
            <Button type="primary" icon={<DollarOutlined />}>添加工资记录</Button>
          </Link>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均工资"
              value={stats.avg}
              precision={2}
              prefix="¥"
              suffix="/月"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最高工资"
              value={stats.max}
              precision={2}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最低工资"
              value={stats.min}
              precision={2}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="年度总工资"
              value={stats.total}
              precision={2}
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      <Card className="detail-card">
        <ReactECharts option={getChartOption()} style={{ height: 300 }} />
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={salaries}
          rowKey="id"
          pagination={{ pageSize: 12 }}
        />
      </Card>
    </div>
  );
};

export default EmployeeDetail;