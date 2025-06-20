import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Typography, Spin, Empty, message } from 'antd';
import { salaryAPI } from '../../services/api';

const { Option } = Select;
const { Title, Text } = Typography;

const MySalary = () => {
  const [loading, setLoading] = useState(false);
  const [salaries, setSalaries] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  
  // 从本地存储获取用户信息
  const user = JSON.parse(localStorage.getItem('user'));
  
  useEffect(() => {
    // 设置可选年份（当前年份及前两年）
    const currentYear = new Date().getFullYear();
    setYears([currentYear - 2, currentYear - 1, currentYear]);
    
    // 初始加载数据
    fetchSalaryData();
  }, []);
  
  // 当年份或月份变化时重新获取数据
  useEffect(() => {
    fetchSalaryData();
  }, [selectedYear, selectedMonth]);
  
  const fetchSalaryData = async () => {
    if (!user || !user.employee_id) {
      message.error('用户信息不完整，请重新登录');
      return;
    }
    
    try {
      setLoading(true);
      const response = await salaryAPI.getEmployeeSalaries(user.employee_id, {
        year: selectedYear,
        month: selectedMonth
      });
      
      setSalaries(response.data);
    } catch (error) {
      console.error('获取工资数据失败:', error);
      message.error('获取工资数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  const columns = [
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      sorter: (a, b) => a.year - b.year,
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      sorter: (a, b) => a.month - b.month,
    },
    {
      title: '工作时间类型',
      dataIndex: 'work_time_type',
      key: 'work_time_type',
    },
    {
      title: '考勤情况',
      dataIndex: 'attendance_status',
      key: 'attendance_status',
    },
    {
      title: '基础工资',
      dataIndex: 'base_salary',
      key: 'base_salary',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
      sorter: (a, b) => a.base_salary - b.base_salary,
    },
    {
      title: '岗位工资',
      dataIndex: 'position_salary',
      key: 'position_salary',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '绩效工资',
      dataIndex: 'performance_salary',
      key: 'performance_salary',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '全勤',
      dataIndex: 'full_time',
      key: 'full_time',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '其他',
      dataIndex: 'other',
      key: 'other',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '加班费',
      dataIndex: 'overtime_pay',
      key: 'overtime_pay',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
    },
    {
      title: '合计',
      dataIndex: 'total_salary',
      key: 'total_salary',
      render: (text) => text !== undefined && text !== null ? `¥${text.toFixed(2)}` : '¥0.00',
      sorter: (a, b) => a.total_salary - b.total_salary,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
    },
    {
      title: '发放日期',
      dataIndex: 'payment_date',
      key: 'payment_date',
    },
  ];
  
  return (
    <div>
      <Card>
        <Title level={2}>我的工资查询</Title>
        <div style={{ marginBottom: 20 }}>
          <Text strong>员工信息：</Text>
          <Text>{user ? `${user.name} (${user.employee_id})` : '未知'}</Text>
          <Text strong style={{ marginLeft: 20 }}>部门：</Text>
          <Text>{user ? user.department : '未知'}</Text>
          <Text strong style={{ marginLeft: 20 }}>职位：</Text>
          <Text>{user ? user.position : '未知'}</Text>
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <span style={{ marginRight: 8 }}>选择年份：</span>
          <Select 
            value={selectedYear} 
            onChange={setSelectedYear} 
            style={{ width: 120, marginRight: 16 }}
          >
            {years.map(year => (
              <Option key={year} value={year}>{year}年</Option>
            ))}
          </Select>
          
          <span style={{ marginRight: 8 }}>选择月份：</span>
          <Select 
            value={selectedMonth} 
            onChange={setSelectedMonth} 
            style={{ width: 120 }}
          >
            {months.map(month => (
              <Option key={month} value={month}>{month}月</Option>
            ))}
          </Select>
        </div>
        
        <Spin spinning={loading}>
          {salaries.length > 0 ? (
            <Table 
              columns={columns} 
              dataSource={salaries.map(item => ({ ...item, key: item.id || `${item.year}-${item.month}` }))} 
              pagination={false}
              bordered
              summary={pageData => {
                if (pageData.length > 0) {
                  const salary = pageData[0];
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={9} align="right">
                        <Text strong>实发工资：</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong style={{ color: '#1890ff' }}>
                          ¥{parseFloat(salary.total_salary).toFixed(2)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }
                return null;
              }}
            />
          ) : (
            <Empty description="暂无工资记录" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default MySalary;